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

// Zoom < 14: threshold bazlı cluster; zoom >= 14: cluster yok
function getThreshold(zoom: number): number {
  return 0.002 / Math.pow(2, zoom - 11);
}

function coordKey(c: [number, number], threshold: number): string {
  return `${Math.round(c[0] / threshold)},${Math.round(c[1] / threshold)}`;
}

// Deterministik dağıtma: aynı noktaya düşen portföyleri haritada ayır
// Geocode sonrasında da uygulanır (asıl bug fix)
function jitterCoord(base: [number, number], id: number): [number, number] {
  const amount = 0.00038; // ~42m yayılım — zoom 13'te ayrışmak için yeterli
  const angle = (id * 137.508) % 360;
  const r = 0.5 + ((id * 7919) % 1000) / 2000;
  const rad = (angle * Math.PI) / 180;
  return [base[0] + Math.cos(rad) * amount * r, base[1] + Math.sin(rad) * amount * r];
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M ₺`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K ₺`;
  return `${price} ₺`;
}

function makePriceBadge(p: Property): L.DivIcon {
  const fill = STATUS_COLOR[p.status] ?? "#94a3b8";
  const label = p.price ? formatPrice(p.price) : (p.type ?? "Portföy");
  return L.divIcon({
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.28))">
      <div style="background:${fill};color:white;font-weight:700;font-size:11px;padding:3px 9px;border-radius:99px;white-space:nowrap;border:2px solid rgba(255,255,255,0.55);letter-spacing:-0.2px">${label}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${fill};margin-top:-1px"></div>
    </div>`,
    iconSize: [100, 32],
    iconAnchor: [50, 32],
    className: "",
  });
}

function makeDotIcon(p: Property): L.DivIcon {
  const fill = STATUS_COLOR[p.status] ?? "#94a3b8";
  return L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${fill};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    className: "",
  });
}

function makeClusterIcon(group: Property[]): L.DivIcon {
  const counts: Record<string, number> = {};
  for (const p of group) counts[p.status] = (counts[p.status] ?? 0) + 1;
  const topStatus = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const fill = STATUS_COLOR[topStatus] ?? "#94a3b8";
  return L.divIcon({
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${fill};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:white;cursor:pointer">${group.length}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    className: "",
  });
}

function MapContent({ properties, coordMap, onSelect }: {
  properties: Property[];
  coordMap: Map<number, [number, number]>;
  onSelect: (p: Property) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handler = () => setZoom(map.getZoom());
    map.on("zoomend", handler);
    return () => { map.off("zoomend", handler); };
  }, [map]);

  useEffect(() => {
    map.eachLayer(layer => {
      if ((layer as L.Layer & { _isCustomMarker?: boolean })._isCustomMarker) {
        map.removeLayer(layer);
      }
    });

    const showBadge = zoom >= 13; // fiyat badge'i bu zoom'dan itibaren
    const noCluster = zoom >= 14; // bu zoom'dan itibaren cluster yok

    const addSingle = (p: Property, coord: [number, number]) => {
      const icon = showBadge ? makePriceBadge(p) : makeDotIcon(p);
      const marker = L.marker(coord, { icon }) as L.Marker & { _isCustomMarker?: boolean };
      marker._isCustomMarker = true;
      marker.on("click", () => onSelect(p));
      marker.bindTooltip(
        `<div style="font-weight:600;font-size:12px">${p.title}</div>` +
        `<div style="font-size:11px;color:#64748b">${[p.neighborhood, p.district].filter(Boolean).join(", ")}</div>` +
        (p.price ? `<div style="font-weight:700;color:#d97706">${p.price.toLocaleString("tr-TR")} ₺</div>` : ""),
        { direction: "top", offset: [0, -10] }
      );
      marker.addTo(map);
    };

    // Zoom >= 14: her portföy ayrı işaretçi olarak gösterilir
    if (noCluster) {
      for (const p of properties) {
        const coord = coordMap.get(p.id);
        if (coord) addSingle(p, coord);
      }
      return;
    }

    // Zoom < 14: threshold bazlı cluster
    const threshold = getThreshold(zoom);
    const clusters = new Map<string, Property[]>();
    for (const p of properties) {
      const c = coordMap.get(p.id);
      if (!c) continue;
      const key = coordKey(c, threshold);
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(p);
    }

    clusters.forEach((group) => {
      const firstCoord = coordMap.get(group[0].id)!;

      if (group.length === 1) {
        addSingle(group[0], firstCoord);
        return;
      }

      // Cluster balonu
      const icon = makeClusterIcon(group);
      const marker = L.marker(firstCoord, { icon }) as L.Marker & { _isCustomMarker?: boolean };
      marker._isCustomMarker = true;
      marker.on("click", () => {
        const listHtml = group.map((p, i) =>
          `<div data-idx="${i}" style="padding:6px 8px;cursor:pointer;border-radius:6px;border-bottom:${i < group.length - 1 ? "1px solid #f1f5f9" : "none"}" class="cluster-item">
            <div style="font-weight:600;font-size:12px;color:#1e293b">${p.title}</div>
            <div style="font-size:11px;color:#64748b">${[p.neighborhood, p.district].filter(Boolean).join(", ")}</div>
            ${p.price ? `<div style="font-weight:700;font-size:12px;color:#d97706">${p.price.toLocaleString("tr-TR")} ₺</div>` : ""}
            <div style="display:inline-block;font-size:10px;padding:1px 6px;border-radius:99px;background:${STATUS_COLOR[p.status]}22;color:${STATUS_COLOR[p.status]};font-weight:600">${STATUS_LABEL[p.status] ?? p.status}</div>
          </div>`
        ).join("");

        const popup = L.popup({ minWidth: 220, maxWidth: 280, maxHeight: 320 })
          .setLatLng(firstCoord)
          .setContent(`
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;padding:0 4px">${group.length} Portföy — Yakın Konum</div>
            <div style="overflow-y:auto;max-height:260px">${listHtml}</div>
          `)
          .openOn(map);

        setTimeout(() => {
          const container = popup.getElement();
          if (!container) return;
          container.querySelectorAll(".cluster-item").forEach((el, i) => {
            (el as HTMLElement).addEventListener("click", () => { map.closePopup(popup); onSelect(group[i]); });
            (el as HTMLElement).addEventListener("mouseenter", () => { (el as HTMLElement).style.background = "#f8fafc"; });
            (el as HTMLElement).addEventListener("mouseleave", () => { (el as HTMLElement).style.background = ""; });
          });
        }, 50);
      });
      marker.addTo(map);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coordMap, properties, zoom]);

  return null;
}

export default function AllPropertiesMap({ properties, onSelect }: Props) {
  const [coordMap, setCoordMap] = useState<Map<number, [number, number]>>(() => {
    const m = new Map<number, [number, number]>();
    for (const p of properties) {
      m.set(p.id, jitterCoord(getInitialCoords(p), p.id));
    }
    return m;
  });

  useEffect(() => {
    if (properties.length === 0) return;
    let cancelled = false;

    (async () => {
      for (const p of properties) {
        if (cancelled) break;
        const c = await geocodeProperty(p);
        if (c && !cancelled) {
          setCoordMap(prev => {
            const next = new Map(prev);
            // Geocode sonrasında da jitter uygula — aynı mahalledeki portföyler
            // aynı koordinata düşerse hiçbir zoom'da ayrışmazdı (asıl hata buydu)
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
