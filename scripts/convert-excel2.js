const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const wb = XLSX.readFile(path.join(__dirname, "../portfolio2.xlsx"));

function parsePrice(val) {
  if (!val && val !== 0) return undefined;
  const s = String(val)
    .replace(/₺/g, "").replace(/TL|tl/gi, "")
    .replace(/\s/g, "").replace(/,00$/, "")
    .replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(num) || num < 1000 ? undefined : Math.round(num);
}

function isExcelDate(val) {
  return typeof val === "number" && val > 40000 && val < 55000;
}

function cleanText(val) {
  if (!val || isExcelDate(val)) return undefined;
  return String(val).trim() || undefined;
}

function roomsFromCount(count) {
  if (!count) return undefined;
  const n = parseInt(count);
  if (isNaN(n)) return String(count);
  return `${n}+1`;
}

function parseFloor(val) {
  if (!val) return undefined;
  const s = String(val).trim().toUpperCase();
  if (s.includes("GİRİŞ") || s.includes("ZEMİN")) return 0;
  const m = s.match(/^(\d+)/);
  return m ? parseInt(m[1]) : undefined;
}

function detectType(tur) {
  if (!tur) return "daire";
  const t = String(tur).toLowerCase();
  if (t.includes("villa")) return "villa";
  if (t.includes("arsa") || t.includes("arazi")) return "arsa";
  if (t.includes("dükkan") || t.includes("iş yeri") || t.includes("imalat") || t.includes("ofis")) return "dükkan";
  return "daire";
}

const properties = [];

// ── Sayfa51 ──────────────────────────────────────────────────────────
// Sütunlar: Gerçekleşen | Sahip/Yetkili | URL | Tarih | İlçe | Mahalle |
//           Tür | M² | O.Sayısı | Kat | M²(₺) | Fiyat | Durum | Açıklama | Ada/Parsel
const ws51 = wb.Sheets["Sayfa51"];
const d51 = XLSX.utils.sheet_to_json(ws51, { header: 1 });

for (let i = 1; i < d51.length; i++) {
  const r = d51[i];
  if (!r || !r[6] || !r[11]) continue;

  const done = r[0] === true;
  const sahip = cleanText(r[1]);
  const ilce = cleanText(r[4]);
  const mahalle = cleanText(r[5]);
  const tur = cleanText(r[6]);
  const m2 = typeof r[7] === "number" ? Math.round(r[7]) : undefined;
  const odaSayisi = r[8];
  const kat = parseFloor(r[9]);
  const fiyat = parsePrice(r[11]);
  const durum = cleanText(r[12]);
  const aciklama = cleanText(r[13]);

  const type = detectType(tur);
  const rooms = roomsFromCount(odaSayisi);

  const district = mahalle || ilce;
  const titleParts = [rooms, aciklama ? aciklama.split(/[\n\r]/)[0].trim() : null, district].filter(Boolean);
  const title = titleParts.slice(0, 2).join(" - ") || `${tur} ${district || ""}`.trim();

  properties.push({
    title: title.slice(0, 80),
    type,
    city: "Gaziantep",
    district: ilce || undefined,
    neighborhood: mahalle || undefined,
    price: fiyat,
    price_type: durum && durum.toLowerCase().includes("kira") ? "kira" : "satis",
    size: m2,
    rooms,
    floor: kat,
    features: [],
    description: [sahip, aciklama].filter(Boolean).join(" | ").slice(0, 200),
    status: done ? "satildi" : "musait",
  });
}

console.log(`Sayfa51: ${properties.length} gayrimenkul`);

// ── Arsa Porföy ───────────────────────────────────────────────────────
// Sütunlar: URL | İlçe | Mahalle | Ada/Parsel | Durum | m² | İmar | Emsal |
//           Taks | Tapu | Fiyat(₺/m²) | Sahip | Not | Tarih
const wsArsa = wb.Sheets["Arsa Porföy"];
const dArsa = XLSX.utils.sheet_to_json(wsArsa, { header: 1 });
let arsaCount = 0;

for (let i = 1; i < dArsa.length; i++) {
  const r = dArsa[i];
  if (!r || !r[5]) continue;                 // en az m² olsun
  if (!r[10] && !r[11]) continue;            // fiyat veya sahip yoksa atla

  const ilce = cleanText(r[1]);
  const mahalle = cleanText(r[2]);
  const adaParsel = r[3] ? String(r[3]).trim() : undefined;
  const durum = cleanText(r[4]) || "Satılık";
  const m2 = typeof r[5] === "number" ? Math.round(r[5]) : parseFloat(String(r[5]));
  const imar = cleanText(r[6]);
  const emsal = r[7] ? String(r[7]) : undefined;
  const pricePerM2 = typeof r[10] === "number" ? r[10] : undefined;
  const sahip = cleanText(r[11]);
  const not = cleanText(r[12]);

  const totalPrice = pricePerM2 && m2 ? Math.round(pricePerM2 * m2) : undefined;

  const descParts = [
    sahip,
    adaParsel ? `Ada/Parsel: ${adaParsel}` : null,
    imar ? `İmar: ${imar}` : null,
    emsal ? `Emsal: ${emsal}` : null,
    pricePerM2 ? `${pricePerM2.toLocaleString("tr-TR")} ₺/m²` : null,
    not,
  ].filter(Boolean);

  const title = [`${!isNaN(m2) ? m2 : "?"} m²`, mahalle || ilce, "Arsa"].filter(Boolean).join(" ");

  properties.push({
    title: title.slice(0, 80),
    type: "arsa",
    city: "Gaziantep",
    district: ilce || undefined,
    neighborhood: mahalle || undefined,
    price: totalPrice,
    price_type: durum.toLowerCase().includes("kira") ? "kira" : "satis",
    size: !isNaN(m2) ? m2 : undefined,
    rooms: undefined,
    floor: undefined,
    features: [],
    description: descParts.join(" | ").slice(0, 200),
    status: "musait",
  });
  arsaCount++;
}

console.log(`Arsa Porföy: ${arsaCount} arsa`);

const total = properties.length;
const outPath = path.join(__dirname, "../public/portfolio2-data.json");
fs.writeFileSync(outPath, JSON.stringify(properties, null, 2), "utf8");
console.log(`\n✓ Toplam ${total} kayıt → public/portfolio2-data.json`);
properties.slice(0, 4).forEach((p, i) =>
  console.log(`  ${i + 1}. ${p.title} | ${p.district || p.city} | ${p.price ? p.price.toLocaleString("tr-TR") + " TL" : "fiyat yok"}`)
);
