export interface ParsedProperty {
  title: string;
  type: string;
  city: string;
  district?: string;
  neighborhood?: string;
  price?: number;
  price_type?: string;
  size?: number;
  rooms?: string;
  floor?: number;
  total_floors?: number;
  features: string[];
  description?: string;
}

const PROPERTY_TYPES: Record<string, string> = {
  daire: "daire", apartment: "daire",
  villa: "villa", müstakil: "villa",
  arsa: "arsa", tarla: "arsa",
  "dükkan": "dükkan", dükkân: "dükkan", dukkan: "dükkan",
  ofis: "ofis", büro: "ofis",
  depo: "depo", fabrika: "depo",
  bina: "bina", apartman: "bina",
};

const FEATURE_KEYWORDS = [
  "balkon", "teras", "bahçe", "otopark", "garaj", "asansör",
  "güvenlik", "site", "havuz", "spor salonu", "sauna",
  "ebeveyn banyosu", "amerikan mutfak", "açık mutfak", "kapalı mutfak",
  "doğalgaz", "kombi", "klima", "depolu", "bodrum",
  "deniz manzarası", "deniz manzarali", "şehir manzarası",
  "yeni bina", "sıfır", "kiracılı", "boş", "krediye uygun",
];

const CITIES = [
  "istanbul", "ankara", "izmir", "bursa", "antalya", "adana", "konya",
  "gaziantep", "kocaeli", "mersin", "diyarbakır", "eskişehir", "samsun",
  "denizli", "trabzon", "kayseri", "malatya", "balıkesir", "bodrum",
  "çeşme", "alanya", "fethiye", "marmaris",
];

function normalizeText(t: string) {
  return t.toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/İ/g, "i").replace(/Ğ/g, "g").replace(/Ü/g, "u")
    .replace(/Ş/g, "s").replace(/Ö/g, "o").replace(/Ç/g, "c");
}

export function parsePropertyFromText(text: string): ParsedProperty {
  const t = text;
  const tn = normalizeText(t);

  // Property type
  let type = "daire";
  for (const [kw, val] of Object.entries(PROPERTY_TYPES)) {
    if (tn.includes(normalizeText(kw))) { type = val; break; }
  }

  // Price type
  const price_type = (tn.includes("kiralık") || tn.includes("kiralik") || tn.includes("kira ") || tn.includes("/ay")) ? "kira" : "satis";

  // Price — handles "8.500.000", "8,5 milyon", "8.5m", "25.000 tl"
  let price: number | undefined;
  const pricePatterns = [
    /(\d[\d.,]+)\s*milyon/i,
    /(\d[\d.,]*)\s*m\b/i,
    /(\d[\d.]+)\s*(?:tl|₺)/i,
    /(\d[\d.]+)/,
  ];
  for (const pat of pricePatterns) {
    const m = t.replace(/\s/g, "").match(pat);
    if (m) {
      let num = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
      if (pat.toString().includes("milyon") || pat.toString().includes("\\bm\\b")) num *= 1_000_000;
      if (num > 1000) { price = num; break; }
    }
  }

  // Size (m²)
  let size: number | undefined;
  const sizeM = t.match(/(\d+)\s*(?:m²|m2|metrekare)/i);
  if (sizeM) size = parseInt(sizeM[1]);

  // Rooms (e.g. 3+1, 2+1, 4+2)
  let rooms: string | undefined;
  const roomsM = t.match(/(\d+\+\d+)/);
  if (roomsM) rooms = roomsM[1];

  // Floor  (e.g. "5. kat", "3/8 kat")
  let floor: number | undefined;
  let total_floors: number | undefined;
  const floorM = t.match(/(\d+)\/(\d+)\s*kat/i);
  if (floorM) { floor = parseInt(floorM[1]); total_floors = parseInt(floorM[2]); }
  else {
    const floorM2 = t.match(/(\d+)\.\s*kat/i);
    if (floorM2) floor = parseInt(floorM2[1]);
  }

  // City
  let city = "Belirtilmemiş";
  for (const c of CITIES) {
    if (tn.includes(c)) {
      city = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // District/neighborhood — word before city or first proper noun before first comma
  let district: string | undefined;
  const beforeComma = t.split(/[,،]/)[0];
  const properNouns = beforeComma.match(/\b([A-ZÇĞİÖŞÜ][a-zçğıöşü]+)\b/g);
  if (properNouns && properNouns.length > 0) {
    const candidate = properNouns[0];
    if (normalizeText(candidate) !== normalizeText(city)) district = candidate;
  }

  // Features
  const features: string[] = [];
  for (const kw of FEATURE_KEYWORDS) {
    if (tn.includes(normalizeText(kw))) features.push(kw);
  }

  // Title
  const parts = [rooms, type, district || city].filter(Boolean);
  const title = parts.join(" ").replace(/\b\w/g, (l) => l.toUpperCase());

  return { title, type, city, district, price, price_type, size, rooms, floor, total_floors, features, description: text.slice(0, 120) };
}

export function computeMatches(
  clientData: {
    id: number;
    intent: string;
    property_types: string[];
    cities: string[];
    districts: string[];
    budget_min?: number;
    budget_max?: number;
    size_min?: number;
    size_max?: number;
    rooms?: string[];
    features_wanted: string[];
  },
  properties: {
    id: number;
    type: string;
    city: string;
    district?: string;
    price?: number;
    price_type?: string;
    size?: number;
    rooms?: string;
    features: string[];
    title: string;
  }[]
): { property_id: number; score: number; reasons: string[] }[] {
  const results: { property_id: number; score: number; reasons: string[] }[] = [];

  const wantsBuy = ["aliyor", "satiyor"].includes(clientData.intent);
  const expectedPriceType = wantsBuy ? "satis" : "kira";
  const roomsArr = clientData.rooms
    ? (Array.isArray(clientData.rooms) ? clientData.rooms : [clientData.rooms as string]).filter(Boolean)
    : [];

  for (const p of properties) {
    const reasons: string[] = [];

    // ── Zorunlu filtreler (biri uyuşmazsa portföy gösterilmez) ──────────────

    // Satılık / Kiralık
    if (p.price_type !== expectedPriceType) continue;
    reasons.push(wantsBuy ? "Satılık" : "Kiralık");

    // Gayrimenkul tipi
    if (clientData.property_types.length > 0) {
      if (!clientData.property_types.some(pt => normalizeText(pt) === normalizeText(p.type))) continue;
      reasons.push(`${p.type} tipi uyuyor`);
    }

    // Şehir
    if (clientData.cities.length > 0) {
      if (!clientData.cities.some(c => normalizeText(c) === normalizeText(p.city))) continue;
      reasons.push(`${p.city} şehri uyuyor`);
    }

    // İlçe (portföyde ilçe bilgisi varsa kontrol et)
    if (clientData.districts.length > 0 && p.district) {
      if (!clientData.districts.some(d => normalizeText(d) === normalizeText(p.district!))) continue;
      reasons.push(`${p.district} ilçesi uyuyor`);
    }

    // Oda sayısı (portföyde oda bilgisi varsa kontrol et)
    if (roomsArr.length > 0 && p.rooms) {
      if (!roomsArr.some(r => normalizeText(r) === normalizeText(p.rooms!))) continue;
      reasons.push(`${p.rooms} oda sayısı uyuyor`);
    }

    // Maksimum bütçe (fiyat bilgisi varsa)
    if (clientData.budget_max && p.price && p.price > clientData.budget_max) continue;

    // ── Sıralama puanı (filtreden geçenler arasında) ─────────────────────────
    let score = 50;

    if (p.price && clientData.budget_min && clientData.budget_max) {
      if (p.price >= clientData.budget_min) { score += 10; reasons.push("Bütçe aralığında"); }
    }

    if (p.size && (clientData.size_min || clientData.size_max)) {
      const ok = (!clientData.size_min || p.size >= clientData.size_min) &&
                 (!clientData.size_max || p.size <= clientData.size_max);
      if (ok) { score += 10; reasons.push(`${p.size}m² uyuyor`); }
    }

    if (clientData.features_wanted.length > 0 && p.features.length > 0) {
      const matched = clientData.features_wanted.filter(fw =>
        p.features.some(pf => normalizeText(pf).includes(normalizeText(fw)) || normalizeText(fw).includes(normalizeText(pf)))
      );
      if (matched.length > 0) {
        score += Math.min(matched.length * 5, 20);
        reasons.push(`${matched.join(", ")} özelliği var`);
      }
    }

    results.push({ property_id: p.id, score: Math.min(100, score), reasons });
  }

  return results.sort((a, b) => b.score - a.score);
}
