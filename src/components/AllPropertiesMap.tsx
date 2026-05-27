"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { GAZIANTEP_CENTER, getInitialCoords, geocodeProperty } from "@/lib/mapUtils";
import type { Property } from "@/lib/storage";

const STATUS_COLOR: Record<string, string> = {
  musait:  "#22c55e",
  rezerve: "#f59e0b",
  kiralik: "#3b82f6",
  satildi: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  musait: "Müsait", rezerve: "Rezerve", kiralik: "Kiralık", satildi: "Satıldı",
};

interface Props {
  properties: Property[];
  onSelect: (p: Property) => void;
}

// Spiral dağıtma — her portföy sabit ama farklı bir noktaya yerleşir
// 0.0012 derece ≈ 133m; zoom 13'te ~7px, zoom 15'te ~27px ayrık görünür
function jitterCoord(base: [number, number], id: number): [number, number] {
  const amount = 0.0012;
  const angle  = (id * 137.508) % 360;
  const r      = 0.4 + ((id * 7919) % 1000) / 1666;
  const rad    = (angle * Math.PI) / 180;
  return [base[0] + Math.cos(rad) * amount * r, base[1] + Math.sin(rad) * amount * r];
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M ₺`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K ₺`;
  return `${n.toLocaleString("tr-TR")} ₺`;
}

// ── Icon oluşturucular ────────────────────────────────────────────────────────

function priceBadgeIcon(p: Property): L.DivIcon {
  const fill  = STATUS_COLOR[p.status] ?? "#94a3b8";
  const label = p.price ? formatPrice(p.price) : (p.type ?? "Portföy");
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
      <div style="background:${fill};color:#fff;font-weight:700;font-size:11px;
        padding:3px 10px;border-radius:99px;white-space:nowrap;letter-spacing:-0.3px;
        box-shadow:0 2px 8px rgba(0,0,0,0.28);border:2px solid rgba(255,255,255,0.6)">
        ${label}
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;
        border-right:5px solid transparent;border-top:6px solid ${fill};margin-top:-1px"></div>
    </div>`,
    iconSize: [110, 32],
    iconAnchor: [55, 32],
    className: "",
  });
}

function dotIcon(p: Property): L.DivIcon {
  const fill = STATUS_COLOR[p.status] ?? "#94a3b8";
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${fill};
      border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    className: "",
  });
}

function clusterIcon(group: Property[]): L.DivIcon {
  const counts: Record<string, number> = {};
  for (const p of group) counts[p.status] = (counts[p.status] ?? 0) + 1;
  const top  = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const fill = STATUS_COLOR[top] ?? "#94a3b8";
  const sz   = group.length >= 10 ? 44 : 36;
  return L.divIcon({
    html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${fill};
      border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:${sz === 44 ? 15 : 14}px;color:white;cursor:pointer">
      ${group.length}
    </div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
    className: "",
  });
}

// ── Harita içeriği ────────────────────────────────────────────────────────────

function MapContent({ properties, coordMap, onSelect }: {
  properties: Property[];
  coordMap: Map<number, [number, number]>;
  onSelect: (p: Property) => void;
}) {
  const map  = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const h = () => setZoom(map.getZoom());
    map.on("zoomend", h);
    return () => { map.off("zoomend", h); };
  }, [map]);

  useEffect(() => {
    // Önceki custom marker'ları temizle
    map.eachLayer(layer => {
      if ((layer as L.Marker & { _cm?: boolean })._cm) map.removeLayer(layer);
    });

    // Tek portföy işaretçisi
    const addSingle = (p: Property, coord: [number, number], badge: boolean) => {
      const m = L.marker(coord, { icon: badge ? priceBadgeIcon(p) : dotIcon(p) }) as
        L.Marker & { _cm?: boolean };
      m._cm = true;
      m.on("click", () => onSelect(p));
      m.bindTooltip(
        `<b style="font-size:12px">${p.title}</b><br/>` +
        `<span style="color:#64748b;font-size:11px">${[p.neighborhood, p.district].filter(Boolean).join(", ")}</span>` +
        (p.price ? `<br/><b style="color:#d97706">${p.price.toLocaleString("tr-TR")} ₺</b>` : ""),
        { direction: "top", offset: [0, -10] }
      );
      m.addTo(map);
    };

    // Cluster işaretçisi — popup ile liste
    const addCluster = (group: Property[], coord: [number, number]) => {
      const m = L.marker(coord, { icon: clusterIcon(group) }) as L.Marker & { _cm?: boolean };
      m._cm = true;
      m.on("click", () => {
        const rows = group.map((p, i) =>
          `<div data-i="${i}" class="ci" style="padding:7px 8px;cursor:pointer;border-radius:6px;
            border-bottom:${i < group.length - 1 ? "1px solid #f1f5f9" : "none"}">
            <div style="font-weight:600;font-size:12px;color:#1e293b">${p.title}</div>
            <div style="font-size:11px;color:#64748b">${[p.neighborhood, p.district].filter(Boolean).join(", ")}</div>
            ${p.price ? `<div style="font-weight:700;font-size:12px;color:#d97706">${p.price.toLocaleString("tr-TR")} ₺</div>` : ""}
            <span style="display:inline-block;font-size:10px;padding:1px 6px;border-radius:99px;
              background:${STATUS_COLOR[p.status]}22;color:${STATUS_COLOR[p.status]};font-weight:600">
              ${STATUS_LABEL[p.status] ?? p.status}
            </span>
          </div>`
        ).join("");

        const popup = L.popup({ minWidth: 230, maxWidth: 290, maxHeight: 340 })
          .setLatLng(coord)
          .setContent(`
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;
              margin-bottom:6px;padding:0 4px">${group.length} Portföy</div>
            <div style="overflow-y:auto;max-height:270px">${rows}</div>
          `)
          .openOn(map);

        setTimeout(() => {
          popup.getElement()?.querySelectorAll<HTMLElement>(".ci").forEach((el, i) => {
            el.addEventListener("click", () => { map.closePopup(popup); onSelect(group[i]); });
            el.addEventListener("mouseenter", () => { el.style.background = "#f8fafc"; });
            el.addEventListener("mouseleave", () => { el.style.background = ""; });
          });
        }, 50);
      });
      m.addTo(map);
    };

    // ── ZOOM ≥ 13 → cluster yok, her portföy fiyat badge'i ───────────────────
    if (zoom >= 13) {
      for (const p of properties) {
        const c = coordMap.get(p.id);
        if (c) addSingle(p, c, true);
      }
      return;
    }

    // ── ZOOM < 13 → ilçe bazlı cluster ───────────────────────────────────────
    // Koordinat tabanlı kümeleme güvenilmez (geocode aynı noktayı döndürünce
    // ayrışmaz); ilçe+şehir string'i üzerinden gruplama her zaman doğru çalışır.
    const groups = new Map<string, Property[]>();
    for (const p of properties) {
      const key = `${p.district ?? ""}|${p.city ?? ""}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    groups.forEach((grp) => {
      const coord = coordMap.get(grp[0].id);
      if (!coord) return;
      if (grp.length === 1) addSingle(grp[0], coord, zoom >= 12);
      else addCluster(grp, coord);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coordMap, properties, zoom]);

  return null;
}

// ── AllPropertiesMap ──────────────────────────────────────────────────────────

export default function AllPropertiesMap({ properties, onSelect }: Props) {
  const [coordMap, setCoordMap] = useState<Map<number, [number, number]>>(() => {
    const m = new Map<number, [number, number]>();
    for (const p of properties) m.set(p.id, jitterCoord(getInitialCoords(p), p.id));
    return m;
  });

  useEffect(() => {
    if (!properties.length) return;
    let cancelled = false;
    (async () => {
      for (const p of properties) {
        if (cancelled) break;
        const c = await geocodeProperty(p);
        if (c && !cancelled) {
          setCoordMap(prev => {
            const next = new Map(prev);
            // Geocode sonrasında da jitter: aynı mahalle merkezi döndüğünde
            // portföyler farklı konumlara dağılmış olur
            next.set(p.id, jitterCoord(c, p.id));
            return next;
          });
        }
        if (!cancelled) await new Promise(r => setTimeout(r, 1150));
      }
    })();
    return () => { cancelled = true; };
  }, [properties]);

  return (
    <MapContainer
      center={GAZIANTEP_CENTER}
      zoom={11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapContent properties={properties} coordMap={coordMap} onSelect={onSelect} />
    </MapContainer>
  );
}
