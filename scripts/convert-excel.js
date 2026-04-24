const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const wb = XLSX.readFile(path.join(__dirname, "../portfolio.xlsx"));
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

function parsePrice(val) {
  if (!val) return undefined;
  const s = String(val).replace(/\s/g, "").replace(/TL|tl|₺/gi, "").replace(/,TL|\.TL/gi, "");
  const cleaned = s.replace(/[.,]/g, (m, i, str) => {
    const after = str.slice(i + 1);
    return /\d{3}($|\D)/.test(after) ? "" : ".";
  });
  const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  return isNaN(num) || num < 1000 ? undefined : Math.round(num);
}

function parseFloor(val) {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim().toUpperCase();
  if (s === "ZEMİN" || s === "ZEMİN KAT") return 0;
  const m = s.match(/^(\d+)/);
  return m ? parseInt(m[1]) : undefined;
}

function normalizeRooms(val) {
  if (!val) return undefined;
  return String(val).trim().replace(",", ".");
}

function detectType(rooms) {
  if (!rooms) return "daire";
  const r = String(rooms).toUpperCase();
  if (r.includes("VİLLA") || r.includes("VILLA")) return "villa";
  if (r.includes("DÜKKAN") || r.includes("DUKKAN")) return "dükkan";
  if (r.includes("OFİS") || r.includes("OFIS")) return "ofis";
  return "daire";
}

const properties = [];
let isSection2 = false;

for (let i = 0; i < data.length; i++) {
  const r = data[i];
  if (!r || !r.some((x) => x)) continue;

  // Section 2 başlangıcı: col[2] kat bilgisi içeriyorsa (ZEMİN KAT, 1.KAT vs.)
  const col2 = String(r[2] || "").trim().toUpperCase();
  if (col2.includes("KAT") || col2 === "ZEMİN KAT") {
    isSection2 = true;
  }

  const col0 = r[0];
  const hasId = typeof col0 === "number" || (typeof col0 === "string" && /^\d+$/.test(String(col0).trim()));

  if (!isSection2) {
    // Format 1: [sıra, bölge, ada/parsel, müteahhit, site, konum, oda, blok, kat, no, m2, şehir, fiyat]
    const hasData = r[1] && r[12]; // en az bölge ve fiyat
    if (!hasData) continue;

    const bölge = String(r[1] || "").trim();
    const müteahhit = String(r[3] || "").trim();
    const site = String(r[4] || "").trim();
    const konum = String(r[5] || "").trim();
    const oda = normalizeRooms(r[6]);
    const blok = r[7] ? String(r[7]).trim() : undefined;
    const kat = parseFloor(r[8]);
    const daireNo = r[9] !== null && r[9] !== undefined ? String(r[9]).trim() : undefined;
    const m2 = typeof r[10] === "number" ? r[10] : (r[10] ? parseFloat(String(r[10])) : undefined);
    const şehir = String(r[11] || "Gaziantep").trim() || "Gaziantep";
    const fiyat = parsePrice(r[12]);

    const type = detectType(oda);
    const siteName = site || müteahhit;
    const title = [oda, siteName || bölge].filter(Boolean).join(" ").replace(/\b\w/g, l => l.toUpperCase());

    const descParts = [müteahhit, site, blok ? `Blok:${blok}` : null, daireNo ? `No:${daireNo}` : null, konum].filter(Boolean);

    properties.push({
      title: title || `${type} - ${bölge}`,
      type,
      city: şehir,
      district: bölge,
      neighborhood: konum || undefined,
      price: fiyat,
      price_type: "satis",
      size: m2 && !isNaN(m2) ? Math.round(m2) : undefined,
      rooms: oda,
      floor: kat,
      features: [],
      description: descParts.join(" | "),
      status: "musait",
    });

  } else {
    // Format 2 (Vista İfe): [sıra, daireNo, kat, proje, oda, yön, netM2, brütM2, mülk, ?, ?, şehir, fiyat]
    if (!hasId && !r[4]) continue;

    const daireNo = String(r[1] || "").trim();
    const katStr = String(r[2] || "").trim();
    const proje = String(r[3] || "VİSTA İFE").trim();
    const oda = normalizeRooms(r[4]);
    const yön = r[5] ? String(r[5]).trim() : undefined;
    const netM2 = typeof r[6] === "number" ? r[6] : (r[6] ? parseFloat(String(r[6]).replace(",", ".").replace(/[^0-9.]/g, "")) : undefined);
    const şehir = String(r[11] || "Gaziantep").trim() || "Gaziantep";
    const fiyat = parsePrice(r[12]);
    const kat = parseFloor(katStr);

    const title = [oda, proje, daireNo].filter(Boolean).join(" ");

    properties.push({
      title,
      type: "daire",
      city: şehir,
      district: "FISTIKLIK BÖLGESİ",
      neighborhood: proje,
      price: fiyat,
      price_type: "satis",
      size: netM2 && !isNaN(netM2) ? Math.round(netM2) : undefined,
      rooms: oda,
      floor: kat,
      features: [],
      description: [proje, daireNo, katStr, yön ? `Yön:${yön}` : null].filter(Boolean).join(" | "),
      status: "musait",
    });
  }
}

const outPath = path.join(__dirname, "../public/portfolio-data.json");
fs.writeFileSync(outPath, JSON.stringify(properties, null, 2), "utf8");
console.log(`✓ ${properties.length} gayrimenkul yazıldı → public/portfolio-data.json`);
properties.slice(0, 3).forEach((p, i) => console.log(`  ${i+1}. ${p.title} | ${p.district} | ${p.price?.toLocaleString("tr-TR")} TL`));
