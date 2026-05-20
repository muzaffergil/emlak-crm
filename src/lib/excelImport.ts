import * as XLSX from "xlsx";
import JSZip from "jszip";
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
  { header: "Tip *",          field: "type",         hint: "Listeden seçin ▼" },
  { header: "Şehir",          field: "city",         hint: "Listeden seçin ▼" },
  { header: "İlçe",           field: "district",     hint: "Listeden seçin ▼" },
  { header: "Mahalle",        field: "neighborhood", hint: "Serbest metin" },
  { header: "Fiyat",          field: "price",        hint: "1500000" },
  { header: "Fiyat Türü *",  field: "price_type",   hint: "Listeden seçin ▼" },
  { header: "Alan (m²)",      field: "size",         hint: "120" },
  { header: "Oda Sayısı",     field: "rooms",        hint: "Listeden seçin ▼" },
  { header: "Kat",            field: "floor",        hint: "3" },
  { header: "Toplam Kat",     field: "total_floors", hint: "8" },
  { header: "Durum *",        field: "status",       hint: "Listeden seçin ▼" },
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

// Excel sütun harfi (0-indexed): 0→A, 1→B …
function col(idx: number): string {
  return String.fromCharCode(65 + idx);
}

// XML için özel karakterleri escape et
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Veri doğrulama XML bloğu oluştur
function buildDataValidationsXml(opts: ExcelOptions): string {
  const rules: { sqref: string; formula1: string }[] = [
    { sqref: `${col(1)}3:${col(1)}10000`,  formula1: opts.types.map(esc).join(",") },      // Tip
    { sqref: `${col(2)}3:${col(2)}10000`,  formula1: opts.cities.map(esc).join(",") },     // Şehir
    { sqref: `${col(3)}3:${col(3)}10000`,  formula1: opts.districts.map(esc).join(",") },  // İlçe
    { sqref: `${col(6)}3:${col(6)}10000`,  formula1: "satis,kira" },                       // Fiyat Türü
    { sqref: `${col(8)}3:${col(8)}10000`,  formula1: opts.rooms.map(esc).join(",") },      // Oda Sayısı
    { sqref: `${col(11)}3:${col(11)}10000`, formula1: "musait,kiralik,rezerve,satildi" },  // Durum
  ];

  const dvItems = rules.map(r =>
    `<dataValidation type="list" showDropDown="0" sqref="${r.sqref}">` +
    `<formula1>&quot;${r.formula1}&quot;</formula1>` +
    `</dataValidation>`
  ).join("");

  return `<dataValidations count="${rules.length}">${dvItems}</dataValidations>`;
}

// ── Şablon oluştur ve indir ────────────────────────────────────────────────────
export async function downloadPropertyTemplate(opts: ExcelOptions = DEFAULT_OPTIONS): Promise<void> {
  const wb = XLSX.utils.book_new();

  const headers = COLUMNS.map(c => c.header);
  const hints   = COLUMNS.map(c => c.hint);
  const example = COLUMNS.map(c => EXAMPLE_ROW[c.header] ?? "");

  const ws = XLSX.utils.aoa_to_sheet([headers, hints, example]);

  ws["!cols"] = COLUMNS.map(() => ({ wch: 18 }));
  ws["!cols"][0] = { wch: 32 };
  ws["!cols"][12] = { wch: 28 };
  ws["!cols"][13] = { wch: 28 };
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // Açıklamalar sayfası
  const infoWs = XLSX.utils.aoa_to_sheet([
    ["Alan",          "Açıklama"],
    ["Başlık *",      "Zorunlu alan."],
    ["Tip *",         "Açılır listeden seçin."],
    ["Fiyat Türü *", "satis veya kira"],
    ["Durum *",       "musait / kiralik / rezerve / satildi"],
    ["Fiyat",         "Rakam girin, ₺ koymayın."],
    ["Özellikler",    "Virgülle ayırın: Balkon, Asansör"],
    [],
    ["NOT:", "* zorunlu alan. 2. satır açıklama, 3. satır örnek — silebilirsiniz. 4. satırdan girin."],
  ]);
  infoWs["!cols"] = [{ wch: 16 }, { wch: 55 }];

  XLSX.utils.book_append_sheet(wb, ws, "Portföy");
  XLSX.utils.book_append_sheet(wb, infoWs, "Açıklamalar");

  // xlsx ile yaz → Uint8Array
  const xlsxBuf: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  // JSZip ile aç, sheet1.xml'e data validation XML enjekte et
  const zip = await JSZip.loadAsync(xlsxBuf);
  const sheetPath = "xl/worksheets/sheet1.xml";
  const sheetXml = await zip.file(sheetPath)!.async("string");

  const dvXml = buildDataValidationsXml(opts);

  // </worksheet> kapanış etiketinden önce ekle
  const patched = sheetXml.replace("</worksheet>", `${dvXml}</worksheet>`);
  zip.file(sheetPath, patched);

  const output = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

  const blob = new Blob([output.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "portfoy-sablonu.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Excel dosyasını oku ve Property listesine dönüştür ────────────────────────
export async function parsePropertyExcel(
  file: File
): Promise<{ rows: Omit<Property, "id" | "created_at">[]; skippedCount: number }> {
  const buf  = await file.arrayBuffer();
  const wb   = XLSX.read(buf, { type: "array" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const raw  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", range: 1 });

  const dataRows = raw.slice(1); // 2. satır hint — atla
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
