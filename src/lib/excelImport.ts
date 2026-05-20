import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { Property } from "./storage";

// ── Veri tanımları ─────────────────────────────────────────────────────────────

export const DEFAULT_NEIGHBORHOODS: Record<string, string[]> = {
  "Şahinbey": [
    "İncilipınar","Düztepe","Bostancı","Emek","Fatih","Güvenevler","Seferpaşa",
    "Güneykent","Kocatepe","Karşıyaka","Onur","Kozanlı","Sarıgüllük","Seyrantepe",
    "Vatan","Eyüboğlu","Cumhuriyet","Gazikent","Etiler","Üniversite",
  ],
  "Şehitkamil": [
    "İslamiye","Karataş","Mücahitler","Batıkent","Bağlarbaşı","Ünaldı",
    "Gazi","Yaşardoğu","Kıbrıs","Akkent","Beylerbeyi","Harmantepe","Nurtepe","Esenyurt",
  ],
  "Nizip":    ["Merkez","Barak","Doğanköy"],
  "Islahiye": ["Merkez","Fevzipaşa"],
  "Nurdağı":  ["Merkez"],
  "Araban":   ["Merkez"],
  "Yavuzeli": ["Merkez"],
  "Oğuzeli":  ["Merkez"],
  "Karkamış": ["Merkez"],
  "Halfeti":  ["Merkez","Şanlıurfa Yolu"],
};

export interface ExcelOptions {
  types:         string[];
  rooms:         string[];
  cities:        string[];
  districts:     string[];
  neighborhoods: Record<string, string[]>;
  maxFloor:      number;
}

export const DEFAULT_OPTIONS: ExcelOptions = {
  types:     ["daire","villa","müstakil ev","arsa","dükkan","ofis","bina","depo","tarla"],
  rooms:     ["1+0","1+1","2+1","3+1","4+1","5+1","5+2","6+1"],
  cities:    ["Gaziantep"],
  districts: Object.keys(DEFAULT_NEIGHBORHOODS),
  neighborhoods: DEFAULT_NEIGHBORHOODS,
  maxFloor: 20,
};

// ── Yardımcılar ────────────────────────────────────────────────────────────────

const COLUMNS = [
  { header: "Başlık *",       field: "title",        hint: "Örn: Güzel 3+1 Daire" },
  { header: "Tip *",          field: "type",         hint: "Listeden seçin ▼" },
  { header: "Şehir",          field: "city",         hint: "Listeden seçin ▼" },
  { header: "İlçe",           field: "district",     hint: "Listeden seçin ▼" },
  { header: "Mahalle",        field: "neighborhood", hint: "İlçe seçince liste gelir ▼" },
  { header: "Fiyat",          field: "price",        hint: "1500000" },
  { header: "Fiyat Türü *",  field: "price_type",   hint: "Listeden seçin ▼" },
  { header: "Alan (m²)",      field: "size",         hint: "120" },
  { header: "Oda Sayısı",     field: "rooms",        hint: "Listeden seçin ▼" },
  { header: "Kat",            field: "floor",        hint: "Listeden seçin ▼" },
  { header: "Toplam Kat",     field: "total_floors", hint: "Listeden seçin ▼" },
  { header: "Durum *",        field: "status",       hint: "Listeden seçin ▼" },
  { header: "Özellikler",     field: "features",     hint: "Balkon, Asansör (virgülle ayır)" },
  { header: "Açıklama",       field: "description",  hint: "Serbest metin" },
  { header: "Sahip Adı",      field: "owner_name",   hint: "Ahmet Yılmaz" },
  { header: "Sahip Telefonu", field: "owner_phone",  hint: "05321234567" },
] as const;

const EXAMPLE_ROW: Record<string, string | number> = {
  "Başlık *":      "Örnek 3+1 Daire — bu satırı silin",
  "Tip *":         "daire",
  "Şehir":         "Gaziantep",
  "İlçe":          "Şahinbey",
  "Mahalle":       "İncilipınar",
  "Fiyat":         1500000,
  "Fiyat Türü *": "satis",
  "Alan (m²)":     120,
  "Oda Sayısı":    "3+1",
  "Kat":           3,
  "Toplam Kat":    8,
  "Durum *":       "musait",
  "Özellikler":    "Balkon, Asansör, Otopark",
  "Açıklama":      "Güneş gören, bakımlı daire",
  "Sahip Adı":     "Ahmet Yılmaz",
  "Sahip Telefonu":"05321234567",
};

function col(idx: number): string { return String.fromCharCode(65 + idx); }

function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Excel named-range adı için Türkçe normalize
function toRangeName(s: string): string {
  return s
    .replace(/[şŞ]/g, c => c === "ş" ? "s" : "S")
    .replace(/[ğĞ]/g, c => c === "ğ" ? "g" : "G")
    .replace(/[üÜ]/g, c => c === "ü" ? "u" : "U")
    .replace(/[ıİ]/g, c => c === "ı" ? "i" : "I")
    .replace(/[öÖ]/g, c => c === "ö" ? "o" : "O")
    .replace(/[çÇ]/g, c => c === "ç" ? "c" : "C")
    .replace(/\s+/g,"_")
    .replace(/[^A-Za-z0-9_]/g,"");
}

// ── Şablon oluştur ve indir ────────────────────────────────────────────────────
export async function downloadPropertyTemplate(opts: ExcelOptions = DEFAULT_OPTIONS): Promise<void> {
  const wb = XLSX.utils.book_new();

  // ── Ana portföy sayfası ────────────────────────────────────────────────────
  const headers = COLUMNS.map(c => c.header);
  const hints   = COLUMNS.map(c => c.hint);
  const example = COLUMNS.map(c => EXAMPLE_ROW[c.header] ?? "");
  const ws = XLSX.utils.aoa_to_sheet([headers, hints, example]);
  ws["!cols"] = COLUMNS.map(() => ({ wch: 18 }));
  ws["!cols"][0] = { wch: 32 };
  ws["!cols"][12] = { wch: 28 };
  ws["!cols"][13] = { wch: 28 };

  // ── Gizli yardım sayfası: _Mahalleler ─────────────────────────────────────
  // Sütunlar: A-J → her ilçenin mahalleleri (10 ilçe max)
  // Sütun K → kat numaraları (1..maxFloor)
  // Satır (maxNh+2) → ilçe görüntü adları (mapping)
  // Satır (maxNh+3) → normalize edilmiş range adları (mapping)
  const districts = opts.districts.slice(0, 10); // max 10 ilçe (A–J)
  const maxNh = Math.max(...districts.map(d => (opts.neighborhoods[d] || []).length), 1);

  const nhRows: (string | number | undefined)[][] = [];
  // Mahalle verisi
  for (let r = 0; r < maxNh; r++) {
    nhRows.push([
      ...districts.map(d => (opts.neighborhoods[d] || [])[r]),
      r < opts.maxFloor ? r + 1 : undefined, // K sütunu: kat numaraları
    ]);
  }
  // Boş satır
  nhRows.push([]);
  // Mapping: görüntü adları
  nhRows.push([...districts]);
  // Mapping: normalize adlar
  nhRows.push([...districts.map(toRangeName)]);

  const mapDisplayRow = maxNh + 2; // Excel satır numarası (1-indexed)
  const mapNormRow    = maxNh + 3;
  const lastDistCol   = col(districts.length - 1); // son ilçe sütunu

  const nhWs = XLSX.utils.aoa_to_sheet(nhRows);

  // ── Açıklamalar sayfası ────────────────────────────────────────────────────
  const infoWs = XLSX.utils.aoa_to_sheet([
    ["Alan","Açıklama"],
    ["Başlık *","Zorunlu alan."],
    ["Tip *","Açılır listeden seçin."],
    ["Fiyat Türü *","satis veya kira"],
    ["Durum *","musait / kiralik / rezerve / satildi"],
    ["Fiyat","Rakam girin, ₺ koymayın."],
    ["Özellikler","Virgülle ayırın: Balkon, Asansör"],
    [],
    ["NOT:","* zorunlu. 2. satır açıklama, 3. satır örnek (silebilirsiniz). 4. satırdan verin."],
  ]);
  infoWs["!cols"] = [{ wch: 16 },{ wch: 55 }];

  XLSX.utils.book_append_sheet(wb, ws, "Portföy");
  XLSX.utils.book_append_sheet(wb, nhWs, "_Mahalleler");
  XLSX.utils.book_append_sheet(wb, infoWs, "Açıklamalar");

  // ── JSZip ile xlsx'e müdahale ──────────────────────────────────────────────
  const xlsxBuf: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const zip = await JSZip.loadAsync(xlsxBuf);

  // 1. workbook.xml: _Mahalleler'i gizle + named range ekle
  let wbXml = await zip.file("xl/workbook.xml")!.async("string");

  // Gizle
  wbXml = wbXml.replace(
    /(<sheet\s[^>]*name="_Mahalleler"[^>]*?)(\/?>)/,
    '$1 state="hidden"$2'
  );

  // Named ranges: her ilçe → mahalle listesi
  const definedNames = districts.map((d, i) => {
    const nh = opts.neighborhoods[d] || [];
    if (nh.length === 0) return "";
    return `<definedName name="${toRangeName(d)}">'_Mahalleler'!$${col(i)}$1:$${col(i)}$${nh.length}</definedName>`;
  }).filter(Boolean);

  // Named range: kat listesi (K sütunu)
  definedNames.push(
    `<definedName name="Katlar">'_Mahalleler'!$K$1:$K$${opts.maxFloor}</definedName>`
  );

  const dnXml = `<definedNames>${definedNames.join("")}</definedNames>`;
  wbXml = wbXml.includes("<definedNames>")
    ? wbXml.replace("</definedNames>", definedNames.join("") + "</definedNames>")
    : wbXml.replace("</workbook>", dnXml + "</workbook>");

  zip.file("xl/workbook.xml", wbXml);

  // 2. sheet1.xml: data validation ekle
  let sheetXml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");

  // Mahalle için bağımlı INDIRECT formülü
  // İlçe D sütununda (D3), mapping satırları mapDisplayRow ve mapNormRow
  const mahalleFormula =
    `INDIRECT(INDEX('_Mahalleler'!$A$${mapNormRow}:$${lastDistCol}$${mapNormRow},` +
    `MATCH(D3,'_Mahalleler'!$A$${mapDisplayRow}:$${lastDistCol}$${mapDisplayRow},0)))`;

  const dvRules: { sqref: string; formula: string; inline?: boolean }[] = [
    { sqref: `${col(1)}3:${col(1)}10000`,  formula: opts.types.map(esc).join(","), inline: true },   // Tip
    { sqref: `${col(2)}3:${col(2)}10000`,  formula: opts.cities.map(esc).join(","), inline: true },  // Şehir
    { sqref: `${col(3)}3:${col(3)}10000`,  formula: opts.districts.map(esc).join(","), inline: true }, // İlçe
    { sqref: `${col(4)}3:${col(4)}10000`,  formula: mahalleFormula },                               // Mahalle (INDIRECT)
    { sqref: `${col(6)}3:${col(6)}10000`,  formula: "satis,kira", inline: true },                   // Fiyat Türü
    { sqref: `${col(8)}3:${col(8)}10000`,  formula: opts.rooms.map(esc).join(","), inline: true },   // Oda Sayısı
    { sqref: `${col(9)}3:${col(9)}10000`,  formula: "Katlar" },                                     // Kat
    { sqref: `${col(10)}3:${col(10)}10000`, formula: "Katlar" },                                    // Toplam Kat
    { sqref: `${col(11)}3:${col(11)}10000`, formula: "musait,kiralik,rezerve,satildi", inline: true }, // Durum
  ];

  const dvItems = dvRules.map(r => {
    const f1 = r.inline ? `&quot;${r.formula}&quot;` : r.formula;
    return (
      `<dataValidation type="list" showDropDown="0" sqref="${r.sqref}">` +
      `<formula1>${f1}</formula1>` +
      `</dataValidation>`
    );
  }).join("");

  const dvXml = `<dataValidations count="${dvRules.length}">${dvItems}</dataValidations>`;

  sheetXml = sheetXml.includes("</sheetData>")
    ? sheetXml.replace("</sheetData>", `</sheetData>${dvXml}`)
    : sheetXml.replace("</worksheet>", `${dvXml}</worksheet>`);

  zip.file("xl/worksheets/sheet1.xml", sheetXml);

  // 3. İndir
  const output = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const blob = new Blob([output.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "portfoy-sablonu.xlsx"; a.click();
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
    const features = featuresRaw
      ? featuresRaw.split(/[,;،]/).map(s => s.trim()).filter(Boolean)
      : [];

    rows.push({
      title, type,
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
    if (existingKeys.has(k)) { dupCount++; } else { toAdd.push(row); existingKeys.add(k); }
  }
  return { toAdd, dupCount };
}

function str(v: unknown): string { return v === null || v === undefined ? "" : String(v).trim(); }
function num(v: unknown): number | undefined { const n = Number(v); return isNaN(n) || n === 0 ? undefined : n; }
