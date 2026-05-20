import * as XLSX from "xlsx";
import type { Property } from "./storage";

// Özelleştirilebilir seçenek grupları
export interface ExcelOptions {
  types:     string[];
  rooms:     string[];
  cities:    string[];
  districts: string[];
}

export const DEFAULT_OPTIONS: ExcelOptions = {
  types:     ["daire", "villa", "müstakil ev", "arsa", "dükkan", "ofis", "bina", "depo", "tarla"],
  rooms:     ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "5+2", "6+1"],
  cities:    ["Gaziantep"],
  districts: ["Şahinbey", "Şehitkamil", "Nizip", "Islahiye", "Nurdağı", "Araban", "Yavuzeli", "Oğuzeli", "Karkamış", "Halfeti"],
};

// Sütun sırası (A→P)
const COLUMNS = [
  { header: "Başlık *",       field: "title",        hint: "Örn: Güzel 3+1 Daire" },
  { header: "Tip *",          field: "type",         hint: "daire / villa / arsa ..." },
  { header: "Şehir",          field: "city",         hint: "Gaziantep" },
  { header: "İlçe",           field: "district",     hint: "Şahinbey" },
  { header: "Mahalle",        field: "neighborhood", hint: "İncilipınar" },
  { header: "Fiyat",          field: "price",        hint: "1500000" },
  { header: "Fiyat Türü *",  field: "price_type",   hint: "satis veya kira" },
  { header: "Alan (m²)",      field: "size",         hint: "120" },
  { header: "Oda Sayısı",     field: "rooms",        hint: "3+1" },
  { header: "Kat",            field: "floor",        hint: "3" },
  { header: "Toplam Kat",     field: "total_floors", hint: "8" },
  { header: "Durum *",        field: "status",       hint: "musait / kiralik / rezerve / satildi" },
  { header: "Özellikler",     field: "features",     hint: "Balkon, Asansör (virgülle ayır)" },
  { header: "Açıklama",       field: "description",  hint: "Serbest metin" },
  { header: "Sahip Adı",      field: "owner_name",   hint: "Ahmet Yılmaz" },
  { header: "Sahip Telefonu", field: "owner_phone",  hint: "05321234567" },
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

// Sütun harfi (0-indexed) → "A", "B", …
function colLetter(idx: number): string {
  return String.fromCharCode(65 + idx);
}

// ── Şablon oluştur ve indir ────────────────────────────────────────────────────
export function downloadPropertyTemplate(opts: ExcelOptions = DEFAULT_OPTIONS): void {
  const wb = XLSX.utils.book_new();

  // ── 1. Gizli doğrulama sayfası (dropdown kaynakları) ──────────────────────
  const maxLen = Math.max(opts.types.length, opts.rooms.length, opts.cities.length, opts.districts.length, 4, 4);
  const validData: (string | undefined)[][] = Array.from({ length: maxLen }, (_, i) => [
    opts.types[i],
    opts.rooms[i],
    opts.cities[i],
    opts.districts[i],
    i < 2 ? (["satis", "kira"][i]) : undefined,
    i < 4 ? (["musait", "kiralik", "rezerve", "satildi"][i]) : undefined,
  ]);
  const validWs = XLSX.utils.aoa_to_sheet(validData);
  XLSX.utils.book_append_sheet(wb, validWs, "_Secenekler");

  // ── 2. Ana portföy sayfası ─────────────────────────────────────────────────
  const headers = COLUMNS.map(c => c.header);
  const hints   = COLUMNS.map(c => c.hint);
  const example = COLUMNS.map(c => EXAMPLE_ROW[c.header] ?? "");

  const ws = XLSX.utils.aoa_to_sheet([headers, hints, example]);

  // Sütun genişlikleri
  ws["!cols"] = COLUMNS.map(() => ({ wch: 18 }));
  ws["!cols"][0] = { wch: 30 }; // Başlık daha geniş
  ws["!cols"][12] = { wch: 28 }; // Özellikler
  ws["!cols"][13] = { wch: 28 }; // Açıklama

  // Satır dondur (başlık sabit kalsın)
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // ── Dropdown doğrulama ─────────────────────────────────────────────────────
  // Veri satırları 3. satırdan başlıyor (0-indexed: row 2), 10000'e kadar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dv: any[] = [
    {
      // Tip — B sütunu
      sqref: `${colLetter(1)}3:${colLetter(1)}10000`,
      type: "list",
      formula1: `_Secenekler!$A$1:$A$${opts.types.length}`,
    },
    {
      // Şehir — C sütunu
      sqref: `${colLetter(2)}3:${colLetter(2)}10000`,
      type: "list",
      formula1: `_Secenekler!$C$1:$C$${opts.cities.length}`,
    },
    {
      // İlçe — D sütunu
      sqref: `${colLetter(3)}3:${colLetter(3)}10000`,
      type: "list",
      formula1: `_Secenekler!$D$1:$D$${opts.districts.length}`,
    },
    {
      // Fiyat Türü — G sütunu
      sqref: `${colLetter(6)}3:${colLetter(6)}10000`,
      type: "list",
      formula1: `_Secenekler!$E$1:$E$2`,
    },
    {
      // Oda Sayısı — I sütunu
      sqref: `${colLetter(8)}3:${colLetter(8)}10000`,
      type: "list",
      formula1: `_Secenekler!$B$1:$B$${opts.rooms.length}`,
    },
    {
      // Durum — L sütunu
      sqref: `${colLetter(11)}3:${colLetter(11)}10000`,
      type: "list",
      formula1: `_Secenekler!$F$1:$F$4`,
    },
  ];
  ws["!dataValidation"] = dv;

  XLSX.utils.book_append_sheet(wb, ws, "Portföy");

  // Açıklamalar sayfası
  const infoWs = XLSX.utils.aoa_to_sheet([
    ["Alan",          "Açıklama / Geçerli Değerler"],
    ["Başlık *",      "Zorunlu. Portföy adı."],
    ["Tip *",         "Zorunlu. Açılır listeden seçin."],
    ["Fiyat Türü *", "satis veya kira"],
    ["Durum *",       "musait / kiralik / rezerve / satildi"],
    ["Fiyat",         "Rakam girin, ₺ işareti koymayın."],
    ["Alan (m²)",     "Rakam girin."],
    ["Özellikler",    "Virgülle ayırın: Balkon, Asansör, Otopark"],
    [],
    ["NOT:", "* işaretli sütunlar zorunludur."],
    ["NOT:", "2. satır açıklama, 3. satır örnek — silebilirsiniz."],
    ["NOT:", "Verilerinizi 4. satırdan itibaren girin."],
  ]);
  infoWs["!cols"] = [{ wch: 16 }, { wch: 55 }];
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
  const raw  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", range: 1 });

  // 1. satır (index 0) hint/açıklama satırı — atla
  const dataRows = raw.slice(1);
  let skippedCount = 0;
  const rows: Omit<Property, "id" | "created_at">[] = [];

  for (const row of dataRows) {
    const title     = str(row["Başlık *"]);
    const type      = str(row["Tip *"]).toLowerCase();
    const priceType = str(row["Fiyat Türü *"]).toLowerCase() || "satis";
    const status    = str(row["Durum *"]).toLowerCase() || "musait";

    if (!title || !type) { skippedCount++; continue; }

    const featuresRaw = str(row["Özellikler"]);
    const features    = featuresRaw
      ? featuresRaw.split(/[,;،]/).map(s => s.trim()).filter(Boolean)
      : [];

    rows.push({
      title,
      type,
      city:         str(row["Şehir"]) || "Gaziantep",
      district:     str(row["İlçe"])  || undefined,
      neighborhood: str(row["Mahalle"]) || undefined,
      price:        num(row["Fiyat"]),
      price_type:   priceType === "kira" ? "kira" : "satis",
      size:         num(row["Alan (m²)"]),
      rooms:        str(row["Oda Sayısı"]) || undefined,
      floor:        num(row["Kat"]),
      total_floors: num(row["Toplam Kat"]),
      status:       ["musait","kiralik","rezerve","satildi"].includes(status) ? status : "musait",
      features,
      description:  str(row["Açıklama"]) || undefined,
      owner_name:   str(row["Sahip Adı"]) || undefined,
      owner_phone:  str(row["Sahip Telefonu"]) || undefined,
      raw_text:     undefined,
    });
  }

  return { rows, skippedCount };
}

// ── Mükerrer tespiti ──────────────────────────────────────────────────────────
export function filterDuplicates(
  incoming: Omit<Property, "id" | "created_at">[],
  existing: Property[]
): { toAdd: Omit<Property, "id" | "created_at">[]; dupCount: number } {
  const key = (t: string, c: string, d?: string, n?: string) =>
    [t, c, d ?? "", n ?? ""].map(s => s.trim().toLowerCase()).join("|");

  const existingKeys = new Set(existing.map(p => key(p.title, p.city, p.district, p.neighborhood)));
  const toAdd: Omit<Property, "id" | "created_at">[] = [];
  let dupCount = 0;

  for (const row of incoming) {
    const k = key(row.title, row.city, row.district, row.neighborhood);
    if (existingKeys.has(k)) { dupCount++; }
    else { toAdd.push(row); existingKeys.add(k); }
  }

  return { toAdd, dupCount };
}

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return isNaN(n) || n === 0 ? undefined : n;
}
