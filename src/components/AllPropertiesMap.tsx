"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
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

// İki koordinatın "aynı nokta" sayılması için eşik (derece)
const CLUSTER_THRESHOLD = 0.0008;

function coordKey(c: [number, number]): string {
  return `${Math.round(c[0] / CLUSTER_THRESHOLD)},${Math.round(c[1] / CLUSTER_THRESHOLD)}`;
}

// Harita üzerinde marker'ları yöneten bileşen
function Markers({ coordMap, onSelect }: {
  coordMap: Map<number, [number, number]>;
  onSelect: (p: Property) => void;
  properties: Property[];
}) {
  return null; // markers are handled by MapContent
}

function MapContent({ properties, coordMap, onSelect }: {
  properties: Property[];
  coordMap: Map<number, [number, number]>;
  onSelect: (p: Property) => void;
}) {
  const map = useMap();
  const [openCluster, setOpenCluster] = useState<string | null>(null);

  useEffect(() => {
    // Tüm custom overlay'leri temizle
    map.eachLayer(layer => {
      if ((layer as L.Layer & { _isCustomMarker?: boolean })._isCustomMarker) {
        map.removeLayer(layer);
      }
    });

    // Koordinatları grupla
    const clusters = new Map<string, Property[]>();
    for (const p of properties) {
      const c = coordMap.get(p.id);
      if (!c) continue;
      const key = coordKey(c);
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key)!.push(p);
    }

    // Her cluster için marker oluştur
    clusters.forEach((group, key) => {
      const firstCoord = coordMap.get(group[0].id)!;
      const isSingle = group.length === 1;

      if (isSingle) {
        const p = group[0];
        const fill = STATUS_COLOR[p.status] ?? "#94a3b8";
        const marker = L.circleMarker(firstCoord, {
          radius: 11,
          color: "white",
          fillColor: fill,
          fillOpacity: 0.92,
          weight: 2.5,
        }) as L.CircleMarker & { _isCustomMarker?: boolean };
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
        // Cluster marker — sayı göster
        const dominantStatus = group.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const topStatus = Object.entries(dominantStatus).sort((a, b) => b[1] - a[1])[0][0];
        const fill = STATUS_COLOR[topStatus] ?? "#94a3b8";

        const icon = L.divIcon({
          html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${fill};border:2.5px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            display:flex;align-items:center;justify-content:center;
            font-weight:700;font-size:13px;color:white;
            cursor:pointer;
          ">${group.length}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          className: "",
        });

        const marker = L.marker(firstCoord, { icon }) as L.Marker & { _isCustomMarker?: boolean };
        marker._isCustomMarker = true;
        marker.on("click", () => {
          setOpenCluster(prev => prev === key ? null : key);
          // Popup ile liste göster
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
                ${group.length} Portföy — Aynı Konum
              </div>
              <div style="overflow-y:auto;max-height:260px">${listHtml}</div>
            `)
            .openOn(map);

          // Liste öğelerine tıklama
          setTimeout(() => {
            const container = popup.getElement();
            if (!container) return;
            container.querySelectorAll(".cluster-item").forEach((el, i) => {
              (el as HTMLElement).addEventListener("click", () => {
                map.closePopup(popup);
                onSelect(group[i]);
              });
              (el as HTMLElement).addEventListener("mouseenter", () => {
                (el as HTMLElement).style.background = "#f8fafc";
              });
              (el as HTMLElement).addEventListener("mouseleave", () => {
                (el as HTMLElement).style.background = "";
              });
            });
          }, 50);
        });
        marker.addTo(map);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coordMap, properties]);

  void openCluster; // suppress unused warning
  void Markers;
  return null;
}

export default function AllPropertiesMap({ properties, onSelect }: Props) {
  const [coordMap, setCoordMap] = useState<Map<number, [number, number]>>(() => {
    const m = new Map<number, [number, number]>();
    for (const p of properties) {
      m.set(p.id, getInitialCoords(p));
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
