"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  X, MapPin, TrendingUp, Ruler, DoorOpen, Phone, MessageCircle,
} from "lucide-react";
import { propertyStore, type Property } from "@/lib/storage";

const AllPropertiesMap = dynamic(() => import("@/components/AllPropertiesMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
      Harita yükleniyor…
    </div>
  ),
});

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  musait:  { label: "Müsait",  color: "bg-green-100 text-green-800" },
  satildi: { label: "Satıldı", color: "bg-red-100 text-red-800" },
  kiralik: { label: "Kiralık", color: "bg-blue-100 text-blue-800" },
  rezerve: { label: "Rezerve", color: "bg-yellow-100 text-yellow-800" },
};

const LEGEND = [
  { color: "#22c55e", label: "Müsait" },
  { color: "#f59e0b", label: "Rezerve" },
  { color: "#3b82f6", label: "Kiralık" },
  { color: "#ef4444", label: "Satıldı" },
];

export default function MapPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<Property | null>(null);

  useEffect(() => {
    propertyStore.getAll()
      .then(data => { setProperties(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const st = selected ? (STATUS_LABELS[selected.status] ?? { label: selected.status, color: "bg-slate-100 text-slate-700" }) : null;

  return (
    /* Harita sayfasında navbar dışında tam ekran */
    <div className="-mx-4 -my-6 relative" style={{ height: "calc(100vh - 56px)" }}>

      {/* Harita */}
      {loading ? (
        <div className="h-full bg-slate-100 flex items-center justify-center text-slate-400">Yükleniyor…</div>
      ) : (
        <AllPropertiesMap properties={properties} onSelect={p => setSelected(p)} />
      )}

      {/* Açıklama kutusu (sol alt) */}
      <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-black/[0.06] p-3 flex flex-col gap-1.5">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-2 text-xs text-slate-700">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
        <div className="border-t border-slate-100 mt-1 pt-1 text-xs text-slate-400 font-medium">
          {properties.length} portföy
        </div>
      </div>

      {/* Seçilen portföy kartı (sağ panel) */}
      {selected && st && (
        <div className="absolute top-4 right-4 z-[1000] w-72 bg-white rounded-2xl shadow-2xl ring-1 ring-black/[0.06] flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* Kart başlık */}
          <div className="flex items-start justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold text-slate-800 text-sm leading-tight">{selected.title}</h3>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{selected.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0 transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Konum */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <MapPin size={12} className="text-slate-400 flex-shrink-0" />
              {[selected.neighborhood, selected.district, selected.city].filter(Boolean).join(", ")}
            </div>

            {/* Fiyat */}
            {selected.price && (
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp size={13} className="text-slate-400 flex-shrink-0" />
                <span className="font-bold text-slate-800">{selected.price.toLocaleString("tr-TR")} ₺</span>
                {selected.price_type === "kira" && <span className="text-xs text-slate-400">/ay</span>}
              </div>
            )}

            {/* m² / Oda */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              {selected.size && (
                <span className="flex items-center gap-1"><Ruler size={11} className="text-slate-400" /> {selected.size} m²</span>
              )}
              {selected.rooms && (
                <span className="flex items-center gap-1"><DoorOpen size={11} className="text-slate-400" /> {selected.rooms}</span>
              )}
              {selected.floor != null && (
                <span>{selected.floor}{selected.total_floors ? `/${selected.total_floors}` : ""}. kat</span>
              )}
            </div>

            {/* Özellikler */}
            {selected.features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.features.slice(0, 5).map(f => (
                  <span key={f} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{f}</span>
                ))}
                {selected.features.length > 5 && (
                  <span className="text-xs text-slate-400">+{selected.features.length - 5}</span>
                )}
              </div>
            )}

            {/* Açıklama */}
            {selected.description && (
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{selected.description}</p>
            )}

            {/* Portföy Sahibi */}
            {(selected.owner_name || selected.owner_phone) && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                {selected.owner_name && (
                  <p className="text-xs font-medium text-slate-700">{selected.owner_name}</p>
                )}
                {selected.owner_phone && (
                  <div className="flex items-center gap-2">
                    <a href={`tel:${selected.owner_phone}`}
                      className="text-xs text-slate-600 flex items-center gap-1 hover:text-slate-800 transition-colors">
                      <Phone size={11} /> {selected.owner_phone}
                    </a>
                    <a
                      href={`https://wa.me/${selected.owner_phone.replace(/\D/g, "").replace(/^0/, "90")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 active:scale-[0.97] text-white text-xs font-medium rounded-lg transition-all"
                    >
                      <MessageCircle size={10} /> WA
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
