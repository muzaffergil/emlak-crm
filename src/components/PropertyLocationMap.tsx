"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { GAZIANTEP_CENTER, getInitialCoords, geocodeProperty } from "@/lib/mapUtils";
import type { Property } from "@/lib/storage";

function Recenter({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(coords, coords[0] === GAZIANTEP_CENTER[0] && coords[1] === GAZIANTEP_CENTER[1] ? 11 : 15); }, [map, coords]);
  return null;
}

export default function PropertyLocationMap({ property }: { property: Property }) {
  const [coords, setCoords] = useState<[number, number]>(() => getInitialCoords(property));

  useEffect(() => {
    geocodeProperty(property).then(c => { if (c) setCoords(c); });
  }, [property]);

  const label = [property.neighborhood, property.district, property.city].filter(Boolean).join(", ");

  return (
    <MapContainer
      center={coords}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "180px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter coords={coords} />
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
