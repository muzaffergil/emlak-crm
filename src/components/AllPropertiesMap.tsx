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

// Zoom seviyesine göre cluster eşiği (derece)
function getThreshold(zoom: number): number {
  return 0.001 / Math.pow(2, zoom - 12);
}

function coordKey(c: [number, number], threshold: number): string {
  return `${Math.round(c[0] / threshold)},${Math.round(c[1] / threshold)}`;
}

// Deterministic jitter: aynı statik koordinata düşen farklı portföyleri haritada ayır
function jitterCoord(base: [number, number], id: number): [number, number] {
  const amount = 0.00028; // ~31m spread
  const angle = (id * 137.508) % 360; // golden angle spiral
  const r = 0.5 + ((id * 7919) % 1000) / 2000;
  const rad = (angle * Math.PI) / 180;
  return [base[0] + Math.cos(rad) * amount * r, base[1] + Math.sin(rad) * amount * r];
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}M₺`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K₺`;
  return `${price}₺`;
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
      const isSingle = group.length === 1;

      if (isSingle) {
        const p = group[0];
        const fill = STATUS_COLOR[p.status] ?? "#94a3b8";
        const priceLabel = p.price ? formatPrice(p.price) : "";

        const icon = L.divIcon({
          html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
            <div style="width:14px;height:14px;border-radius:50%;background:${fill};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
            ${priceLabel ? `<div style="background:white;border-radius:4px;padding:1px 5px;font-size:9px;font-weight:700;color:#1e293b;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.18);margin-top:2px;border:1px solid #e2e8f0">${priceLabel}</div>` : ""}
          </div>`,
          iconSize: [60, priceLabel ? 32 : 18],
          iconAnchor: [30, priceLabel ? 7 : 7],
          className: "",
        });

        const marker = L.marker(firstCoord, { icon }) as L.Marker & { _isCustomMarker?: boolean };
        marker._isCustomMarker = true;
        marker.on("click", () => onSelect(p));
        marker.bindTooltip(
          `<div style="font-weight:600;font-size:12px">${p.title}</div>` +
          `<div style="font-size:11px;color:#64748b">${[p.neighborhood, p.district].filter(Boolean).join(", ")}</div>` +
          (p.price ? `<div style="font-weight:700;color:#d97706">${p.price.toLocaleString("tr-TR")} ₺</div>` : ""),
          { direction: "top", offset: [0, -8] }
        );
        marker.addTo(map);
      } else {
        // Cluster — dominant duruma göre renk
        const dominantStatus = group.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const topStatus = Object.entries(dominantStatus).sort((a, b) => b[1] - a[1])[0][0];
        const fill = STATUS_COLOR[topStatus] ?? "#94a3b8";

        const icon = L.divIcon({
          html: `<div style="
            width:34px;height:34px;border-radius:50%;
            background:${fill};border:3px solid white;
            box-shadow:0 2px 10px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            font-weight:800;font-size:13px;color:white;
            cursor:pointer;
          ">${group.length}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          className: "",
        });

        const marker = L.marker(firstCoord, { icon }) as L.Marker & { _isCustomMarker?: boolean };
        marker._isCustomMarker = true;
        marker.on("click", () => {
          const listHtml = group.map((p, i) =>
            `<div data-idx="${i}" style="
              padding:6px 8px;cursor:pointer;border-radius:6px;
              border-bottom:${i < group.length - 1 ? "1px solid #f1f5f9" : "none"};
            " class="cluster-item">
              <div style="font-weight:600;font-size:12px;color:#1e293b">${p.title}</div>
              <div style="font-size:11px;color:#64748b">${[p.neighborhood, p.district].filter(Boolean).join(", ")}</div>
              ${p.price ? `<div style="font-weight:700;font-size:12px;color:#d97706">${p.price.toLocaleString("tr-TR")} ₺</div>` : ""}
              <div style="display:inline-block;font-size:10px;padding:1px 6px;border-radius:99px;background:${STATUS_COLOR[p.status]}22;color:${STATUS_COLOR[p.status]};font-weight:600">${STATUS_LABEL[p.status] ?? p.status}</div>
            </div>`
          ).join("");

          const popup = L.popup({ minWidth: 220, maxWidth: 280, maxHeight: 320 })
            .setLatLng(firstCoord)
            .setContent(`
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:6px;padding:0 4px">
                ${group.length} Portföy — Yakın Konum
              </div>
              <div style="overflow-y:auto;max-height:260px">${listHtml}</div>
            `)
            .openOn(map);

          setTimeout(() => {
            const container = popup.getElement();
            if (!container) return;
            container.querySelectorAll(".cluster-item").forEach((el, i) => {
              (el as HTMLElement).addEventListener("click", () => {
                map.closePopup(popup);
                onSelect(group[i]);
              });
              (el as HTMLElement).addEventListener("mouseenter", () => { (el as HTMLElement).style.background = "#f8fafc"; });
              (el as HTMLElement).addEventListener("mouseleave", () => { (el as HTMLElement).style.background = ""; });
            });
          }, 50);
        });
        marker.addTo(map);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coordMap, properties, zoom]);

  return null;
}

export default function AllPropertiesMap({ properties, onSelect }: Props) {
  const [coordMap, setCoordMap] = useState<Map<number, [number, number]>>(() => {
    const m = new Map<number, [number, number]>();
    for (const p of properties) {
      const base = getInitialCoords(p);
      m.set(p.id, jitterCoord(base, p.id));
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
            next.set(p.id, c);
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
