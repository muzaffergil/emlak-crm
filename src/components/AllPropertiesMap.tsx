"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { GAZIANTEP_CENTER, getInitialCoords, geocodeProperty } from "@/lib/mapUtils";
import type { Property } from "@/lib/storage";

const STATUS_COLOR: Record<string, string> = {
  musait:  "#22c55e",
  rezerve: "#f59e0b",
  kiralik: "#3b82f6",
  satildi: "#ef4444",
};

interface Props {
  properties: Property[];
  onSelect: (p: Property) => void;
}

export default function AllPropertiesMap({ properties, onSelect }: Props) {
  const [coords, setCoords] = useState<Map<number, [number, number]>>(() => {
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
          setCoords(prev => {
            const next = new Map(prev);
            next.set(p.id, c);
            return next;
          });
        }
        // Nominatim: max 1 istek/saniye
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
      {properties.map(p => {
        const c = coords.get(p.id);
        if (!c) return null;
        const fill = STATUS_COLOR[p.status] ?? "#94a3b8";
        return (
          <CircleMarker
            key={p.id}
            center={c}
            radius={11}
            pathOptions={{ color: "white", fillColor: fill, fillOpacity: 0.92, weight: 2.5 }}
            eventHandlers={{ click: () => onSelect(p) }}
          >
            <Popup minWidth={200}>
              <div style={{ padding: "2px 0" }}>
                <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "2px", color: "#1e293b" }}>{p.title}</p>
                <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                  {[p.neighborhood, p.district].filter(Boolean).join(", ")}
                </p>
                {p.price && (
                  <p style={{ fontWeight: 700, fontSize: "14px", color: "#d97706", marginBottom: "6px" }}>
                    {p.price.toLocaleString("tr-TR")} ₺{p.price_type === "kira" ? "/ay" : ""}
                  </p>
                )}
                <button
                  onClick={() => onSelect(p)}
                  style={{
                    width: "100%", background: "#f59e0b", color: "white",
                    border: "none", borderRadius: "6px", padding: "5px 0",
                    cursor: "pointer", fontSize: "12px", fontWeight: 600,
                  }}
                >
                  Detay Gör →
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
