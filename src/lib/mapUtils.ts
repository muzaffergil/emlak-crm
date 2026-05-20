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

export function getPropertyCoords(p: Property): [number, number] | null {
  if (p.district) {
    const nd = norm(p.district);
    for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
      if (nd === key || nd.includes(key) || key.includes(nd)) return coords;
    }
  }
  if (p.city && norm(p.city).includes("gaziantep")) return GAZIANTEP_CENTER;
  return null;
}
