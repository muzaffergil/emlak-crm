"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { GAZIANTEP_CENTER, getPropertyCoords } from "@/lib/mapUtils";
import type { Property } from "@/lib/storage";

export default function PropertyLocationMap({ property }: { property: Property }) {
  const coords = getPropertyCoords(property) ?? GAZIANTEP_CENTER;
  const zoom = coords === GAZIANTEP_CENTER ? 11 : 14;
  const label = [property.neighborhood, property.district, property.city].filter(Boolean).join(", ");

  return (
    <MapContainer
      center={coords}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "180px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={coords}
        radius={10}
        pathOptions={{ color: "white", fillColor: "#f59e0b", fillOpacity: 0.9, weight: 2.5 }}
      >
        <Popup>{label || property.title}</Popup>
      </CircleMarker>
    </MapContainer>
  );
}
