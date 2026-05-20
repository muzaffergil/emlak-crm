import * as XLSX from "xlsx";
import type { Property } from "./storage";

// Sütun tanımları — sol: Excel başlığı, sağ: Property alanı
const COLUMNS = [
  { header: "Başlık *",        field: "title",        hint: "Örn: Güzel 3+1 Daire" },
  { header: "Tip *",           field: "type",         hint: "daire / villa / müstakil ev / arsa / dükkan / ofis / bina / depo / tarla" },
  { header: "Şehir",           field: "city",         hint: "Gaziantep" },
  { header: "İlçe",            field: "district",     hint: "Şahinbey" },
  { header: "Mahalle",         field: "neighborhood",  hint: "İncilipınar" },
  { header: "Fiyat",           field: "price",        hint: "1500000" },
  { header: "Fiyat Türü *",   field: "price_type",   hint: "satis veya kira" },
  { header: "Alan (m²)",       field: "size",         hint: "120" },
  { header: "Oda Sayısı",      field: "rooms",        hint: "3+1" },
  { header: "Kat",             field: "floor",        hint: "3" },
  { header: "Toplam Kat",      field: "total_floors", hint: "8" },
  { header: "Durum *",         field: "status",       hint: "musait / kiralik / rezerve / satildi" },
  { header: "Özellikler",      field: "features",     hint: "Balkon, Asansör, Otopark (virgülle ayır)" },
  { header: "Açıklama",        field: "description",  hint: "Serbest metin" },
  { header: "Sahip Adı",       field: "owner_name",   hint: "Ahmet Yılmaz" },
  { header: "Sahip Telefonu",  field: "owner_phone",  hint: "05321234567" },
] as const;

const EXAMPLE_ROW: Record<string, string | number> = {
  "Başlık *":       "Örnek 3+1 Daire — bu satırı silin",
  "Tip *":          "daire",
  "Şehir":          "Gaziantep",
  "İlçe":           "Şahinbey",
  "Mahalle":        "İncilipınar",
  "Fiyat":          1500000,
  "Fiyat Türü *":  "satis",
  "Alan (m²)":      120,
  "Oda Sayısı":     "3+1",
  "Kat":            3,
  "Toplam Kat":     8,
  "Durum *":        "musait",
  "Özellikler":     "Balkon, Asansör, Otopark",
  "Açıklama":       "Güneş gören, bakımlı daire",
  "Sahip Adı":      "Ahmet Yılmaz",
  "Sahip Telefonu": "05321234567",
};

// ── Şablon oluştur ve indir ────────────────────────────────────────────────────
export function downloadPropertyTemplate(): void {
  const wb = XLSX.utils.book_new();

  const headers = COLUMNS.map(c => c.header);
  const hints   = COLUMNS.map(c => c.hint);
  const example = COLUMNS.map(c => EXAMPLE_ROW[c.header] ?? "");

  const ws = XLSX.utils.aoa_to_sheet([headers, hints, example]);

  // Sütun genişlikleri
  ws["!cols"] = COLUMNS.map(c => ({ wch: Math.max(c.header.length + 4, c.hint.length + 2) }));

  XLSX.utils.book_append_sheet(wb, ws, "Portföy");

  // Geçerli değerler açıklama sayfası
  const infoWs = XLSX.utils.aoa_to_sheet([
    ["Alan",         "Geçerli Değerler"],
    ["Tip *",        "daire, villa, müstakil ev, arsa, dükkan, ofis, bina, depo, tarla"],
    ["Fiyat Türü *", "satis, kira"],
    ["Durum *",      "musait, kiralik, rezerve, satildi"],
    ["Oda Sayısı",   "1+0, 1+1, 2+1, 3+1, 4+1, 5+1, 5+2, 6+1, ve diğerleri"],
    [],
    ["NOT: * işaretli alanlar zorunludur."],
    ["NOT: 2. satır açıklama, 3. satır örnek — silinebilir."],
    ["NOT: 4. satırdan itibaren verilerinizi girin."],
  ]);
  infoWs["!cols"] = [{ wch: 16 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, infoWs, "Açıklamalar");

  XLSX.writeFile(wb, "portfoy-sablonu.xlsx");
}

// ── Excel dosyasını oku ve Property listesine dönüştür ────────────────────────
export async function parsePropertyExcel(
  file: File
): Promise<{ rows: Omit<Property, "id" | "created_at">[]; skippedCount: number }> {
  const buf  = await file.arrayBuffer();
  const wb   = XLSX.read(buf, { type: "array" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const raw  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    // İlk satır başlıklar, 2. satır açıklama (hint) — onu atla
    range: 1,
  });

  // 2. satır (index 0 in raw) açıklama satırı — atla
  // Gerçek veriler 3. satırdan (index 1) başlar
  const dataRows = raw.slice(1);

  let skippedCount = 0;
  const rows: Omit<Property, "id" | "created_at">[] = [];

  for (const row of dataRows) {
    const title     = str(row["Başlık *"]);
    const type      = str(row["Tip *"]).toLowerCase();
    const priceType = str(row["Fiyat Türü *"]).toLowerCase() || "satis";
    const status    = str(row["Durum *"]).toLowerCase() || "musait";

    // Zorunlu alan eksikse atla
    if (!title || !type) { skippedCount++; continue; }

    const featuresRaw = str(row["Özellikler"]);
    const features    = featuresRaw
      ? featuresRaw.split(/[,;،]/).map(s => s.trim()).filter(Boolean)
      : [];

    rows.push({
      title,
      type,
      city:          str(row["Şehir"]) || "Gaziantep",
      district:      str(row["İlçe"]) || undefined,
      neighborhood:  str(row["Mahalle"]) || undefined,
      price:         num(row["Fiyat"]),
      price_type:    priceType === "kira" ? "kira" : "satis",
      size:          num(row["Alan (m²)"]),
      rooms:         str(row["Oda Sayısı"]) || undefined,
      floor:         num(row["Kat"]),
      total_floors:  num(row["Toplam Kat"]),
      status:        ["musait","kiralik","rezerve","satildi"].includes(status) ? status : "musait",
      features,
      description:   str(row["Açıklama"]) || undefined,
      owner_name:    str(row["Sahip Adı"]) || undefined,
      owner_phone:   str(row["Sahip Telefonu"]) || undefined,
      raw_text:      undefined,
    });
  }

  return { rows, skippedCount };
}

// ── Mükerrer tespiti ──────────────────────────────────────────────────────────
export function filterDuplicates(
  incoming: Omit<Property, "id" | "created_at">[],
  existing: Property[]
): {
  toAdd:    Omit<Property, "id" | "created_at">[];
  dupCount: number;
} {
  function key(title: string, city: string, district?: string, neighborhood?: string) {
    return [title, city, district ?? "", neighborhood ?? ""]
      .map(s => s.trim().toLowerCase())
      .join("|");
  }

  const existingKeys = new Set(existing.map(p => key(p.title, p.city, p.district, p.neighborhood)));

  const toAdd:    Omit<Property, "id" | "created_at">[] = [];
  let   dupCount = 0;

  for (const row of incoming) {
    if (existingKeys.has(key(row.title, row.city, row.district, row.neighborhood))) {
      dupCount++;
    } else {
      toAdd.push(row);
      // Aynı excel'de tekrar edenleri de engelle
      existingKeys.add(key(row.title, row.city, row.district, row.neighborhood));
    }
  }

  return { toAdd, dupCount };
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return isNaN(n) || n === 0 ? undefined : n;
}
