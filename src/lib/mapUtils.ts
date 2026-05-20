import type { Property } from "./storage";

export const GAZIANTEP_CENTER: [number, number] = [37.0662, 37.3833];

const DISTRICT_COORDS: Record<string, [number, number]> = {
  sahinbey:   [37.0654, 37.3706],
  sehitkamil: [37.0706, 37.3491],
  nizip:      [37.0139, 37.7967],
  islahiye:   [37.0167, 36.9250],
  nurdagi:    [37.1700, 36.7317],
  araban:     [37.4267, 37.6750],
  yavuzeli:   [37.2972, 37.5678],
  oguzeli:    [37.0847, 37.5186],
  karkamis:   [36.8333, 38.0000],
  halfeti:    [37.2500, 37.8667],
};

function norm(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[ıİ]/g, "i").replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c");
}

function staticCoords(p: Property): [number, number] | null {
  if (p.district) {
    const nd = norm(p.district);
    for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
      if (nd === key || nd.includes(key) || key.includes(nd)) return coords;
    }
  }
  if (p.city && norm(p.city).includes("gaziantep")) return GAZIANTEP_CENTER;
  return null;
}

// Harita ilk yüklenirken senkron koordinat — en azından şehir merkezini göster
export function getInitialCoords(p: Property): [number, number] {
  const cached = fromCache(cacheKey(p));
  if (cached) return cached;
  return staticCoords(p) ?? GAZIANTEP_CENTER;
}

// Geriye dönük uyumluluk
export function getPropertyCoords(p: Property): [number, number] | null {
  const cached = fromCache(cacheKey(p));
  if (cached) return cached;
  return staticCoords(p);
}

function cacheKey(p: Property): string {
  return `geo:${[p.neighborhood, p.district, p.city].filter(Boolean).join(",")}`;
}

function fromCache(key: string): [number, number] | null {
  try {
    const v = sessionStorage.getItem(key);
    if (!v) return null;
    const parsed = JSON.parse(v) as [number, number];
    return parsed;
  } catch { return null; }
}

function toCache(key: string, coords: [number, number]): void {
  try { sessionStorage.setItem(key, JSON.stringify(coords)); } catch {}
}

export async function geocodeProperty(p: Property): Promise<[number, number] | null> {
  const key = cacheKey(p);

  const cached = fromCache(key);
  if (cached) return cached;

  // Mahalle varsa hassas sonuç için onu da ekle
  const parts = [p.neighborhood, p.district, p.city || "Gaziantep", "Türkiye"].filter(Boolean);
  if (parts.length < 2) {
    const fb = staticCoords(p) ?? GAZIANTEP_CENTER;
    toCache(key, fb);
    return fb;
  }

  try {
    const q = encodeURIComponent(parts.join(", "));
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=tr`,
      { headers: { "Accept-Language": "tr", "User-Agent": "EmlakCRM/1.0 muzaffergil@gmail.com" } }
    );
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (data[0]) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      toCache(key, coords);
      return coords;
    }
  } catch { /* ağ hatası — static fallback */ }

  const fallback = staticCoords(p) ?? GAZIANTEP_CENTER;
  toCache(key, fallback);
  return fallback;
}
