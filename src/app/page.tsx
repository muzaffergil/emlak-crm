"use client";
import { useEffect, useMemo, useState } from "react";
import { Trash2, Home, TrendingUp, MapPin, Ruler, DoorOpen, Upload, X, SlidersHorizontal } from "lucide-react";
import { propertyStore, type Property } from "@/lib/storage";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  musait: { label: "Müsait", color: "bg-green-100 text-green-800" },
  satildi: { label: "Satıldı", color: "bg-red-100 text-red-800" },
  kiralik: { label: "Kiralık", color: "bg-blue-100 text-blue-800" },
  rezerve: { label: "Rezerve", color: "bg-yellow-100 text-yellow-800" },
};

interface Filters {
  search: string;
  types: string[];
  districts: string[];
  rooms: string[];
  priceType: string;
  status: string;
  priceMin: string;
  priceMax: string;
  sizeMin: string;
  sizeMax: string;
}

const EMPTY: Filters = {
  search: "", types: [], districts: [], rooms: [],
  priceType: "", status: "", priceMin: "", priceMax: "", sizeMin: "", sizeMax: "",
};

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
      {label}
      <button onClick={onRemove}><X size={10} /></button>
    </span>
  );
}

function FilterSelect({ label, options, values, onChange }: {
  label: string; options: string[]; values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button key={o} onClick={() => onChange(active ? values.filter(v => v !== o) : [...values, o])}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange }: {
  label: string; options: { value: string; label: string }[]; value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button key={o.value} onClick={() => onChange(value === o.value ? "" : o.value)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${value === o.value ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY });
  const [showFilters, setShowFilters] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => { setProperties(propertyStore.getAll()); }, []);

  // Dinamik seçenekler
  const options = useMemo(() => {
    const types = [...new Set(properties.map(p => p.type).filter(Boolean))].sort();
    const districts = [...new Set(properties.map(p => p.district).filter(Boolean))].sort() as string[];
    const rooms = [...new Set(properties.map(p => p.rooms).filter(Boolean))].sort() as string[];
    return { types, districts, rooms };
  }, [properties]);

  function set<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters(f => ({ ...f, [key]: val }));
  }

  const activeCount = [
    filters.search, filters.priceType, filters.status,
    filters.priceMin, filters.priceMax, filters.sizeMin, filters.sizeMax,
    ...filters.types, ...filters.districts, ...filters.rooms,
  ].filter(Boolean).length;

  const filtered = useMemo(() => properties.filter(p => {
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const hay = [p.title, p.type, p.city, p.district, p.neighborhood, p.rooms,
        p.description, p.status, p.price ? String(p.price) : "",
        p.size ? String(p.size) : "", ...p.features,
        p.price_type === "kira" ? "kiralık" : "satılık",
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.types.length && !filters.types.includes(p.type)) return false;
    if (filters.districts.length && !filters.districts.includes(p.district || "")) return false;
    if (filters.rooms.length && !filters.rooms.includes(p.rooms || "")) return false;
    if (filters.priceType && p.price_type !== filters.priceType) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.priceMin && p.price && p.price < Number(filters.priceMin)) return false;
    if (filters.priceMax && p.price && p.price > Number(filters.priceMax)) return false;
    if (filters.sizeMin && p.size && p.size < Number(filters.sizeMin)) return false;
    if (filters.sizeMax && p.size && p.size > Number(filters.sizeMax)) return false;
    return true;
  }), [properties, filters]);

  async function importJson(file: string, label: string) {
    if (!confirm(`${label} portföye eklenecek. Devam edilsin mi?`)) return;
    setImporting(true);
    setImportMsg("");
    try {
      const base = window.location.pathname.includes("/emlak-crm") ? "/emlak-crm" : "";
      const res = await fetch(`${base}/${file}`);
      const data = await res.json();
      let added = 0;
      for (const p of data) { propertyStore.add(p); added++; }
      setProperties(propertyStore.getAll());
      setImportMsg(`${added} kayıt eklendi!`);
    } catch {
      setImportMsg("Yükleme hatası.");
    } finally {
      setImporting(false);
    }
  }

  function deleteProperty(id: number) {
    if (!confirm("Bu portföyü silmek istediğinizden emin misiniz?")) return;
    propertyStore.delete(id);
    setProperties(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div>
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Home size={24} className="text-amber-500" /> Portföy
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} / {properties.length} gayrimenkul
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {importMsg && <span className="text-sm text-green-600 font-medium">{importMsg}</span>}
          <button onClick={() => importJson("portfolio-data.json", "Yücesoy Güncel (77 gayrimenkul)")} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <Upload size={14} /> {importing ? "..." : "Yücesoy Güncel"}
          </button>
          <button onClick={() => importJson("portfolio2-data.json", "Portföy Takip (95 kayıt)")} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            <Upload size={14} /> {importing ? "..." : "Portföy Takip"}
          </button>
          <a href="add-property" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Portföy Ekle
          </a>
        </div>
      </div>

      {/* Arama + Filtre Aç */}
      <div className="flex gap-2 mb-3">
        <input type="text" placeholder="Kelime ara..." value={filters.search}
          onChange={e => set("search", e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-300" />
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters || activeCount > 1 ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          <SlidersHorizontal size={15} />
          Filtrele
          {activeCount > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${showFilters || activeCount > 1 ? "bg-white text-amber-600" : "bg-amber-500 text-white"}`}>{activeCount}</span>}
        </button>
        {activeCount > 0 && (
          <button onClick={() => setFilters({ ...EMPTY })}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filtre Paneli */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FilterSelect label="Gayrimenkul Tipi" options={options.types} values={filters.types} onChange={v => set("types", v)} />
            <RadioGroup label="Satış / Kiralık" value={filters.priceType}
              options={[{ value: "satis", label: "Satılık" }, { value: "kira", label: "Kiralık" }]}
              onChange={v => set("priceType", v)} />
          </div>

          <RadioGroup label="Durum"
            value={filters.status}
            options={[
              { value: "musait", label: "Müsait" },
              { value: "satildi", label: "Satıldı" },
              { value: "rezerve", label: "Rezerve" },
              { value: "kiralik", label: "Kiralık" },
            ]}
            onChange={v => set("status", v)} />

          {options.rooms.length > 0 && (
            <FilterSelect label="Oda Sayısı" options={options.rooms} values={filters.rooms} onChange={v => set("rooms", v)} />
          )}

          {options.districts.length > 0 && (
            <FilterSelect label="İlçe / Bölge" options={options.districts} values={filters.districts} onChange={v => set("districts", v)} />
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["priceMin", "Min Fiyat (₺)"],
              ["priceMax", "Max Fiyat (₺)"],
              ["sizeMin", "Min m²"],
              ["sizeMax", "Max m²"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
                <input type="number" value={filters[key as keyof Filters] as string}
                  onChange={e => set(key as keyof Filters, e.target.value as never)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aktif filtre chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => set("search", "")} />}
          {filters.priceType && <Chip label={filters.priceType === "kira" ? "Kiralık" : "Satılık"} onRemove={() => set("priceType", "")} />}
          {filters.status && <Chip label={STATUS_LABELS[filters.status]?.label || filters.status} onRemove={() => set("status", "")} />}
          {filters.types.map(t => <Chip key={t} label={t} onRemove={() => set("types", filters.types.filter(x => x !== t))} />)}
          {filters.districts.map(d => <Chip key={d} label={d} onRemove={() => set("districts", filters.districts.filter(x => x !== d))} />)}
          {filters.rooms.map(r => <Chip key={r} label={r} onRemove={() => set("rooms", filters.rooms.filter(x => x !== r))} />)}
          {filters.priceMin && <Chip label={`min ${Number(filters.priceMin).toLocaleString("tr-TR")} ₺`} onRemove={() => set("priceMin", "")} />}
          {filters.priceMax && <Chip label={`max ${Number(filters.priceMax).toLocaleString("tr-TR")} ₺`} onRemove={() => set("priceMax", "")} />}
          {filters.sizeMin && <Chip label={`min ${filters.sizeMin} m²`} onRemove={() => set("sizeMin", "")} />}
          {filters.sizeMax && <Chip label={`max ${filters.sizeMax} m²`} onRemove={() => set("sizeMax", "")} />}
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Home size={48} className="mx-auto mb-3 opacity-30" />
          <p>{properties.length === 0 ? "Portföyde henüz gayrimenkul yok." : "Filtreye uyan kayıt bulunamadı."}</p>
          {properties.length === 0 && (
            <a href="add-property" className="text-amber-500 hover:underline text-sm mt-2 inline-block">Hemen ekleyin</a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const st = STATUS_LABELS[p.status] || { label: p.status, color: "bg-slate-100 text-slate-700" };
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm leading-tight">{p.title}</h3>
                  <button onClick={() => deleteProperty(p.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-2 flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{p.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    {p.price_type === "kira" ? "Kiralık" : "Satılık"}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />
                    {[p.neighborhood, p.district, p.city].filter(Boolean).join(", ")}
                  </div>
                  {p.price && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-slate-400" />
                      <span className="font-semibold text-slate-800">{p.price.toLocaleString("tr-TR")} ₺</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {p.size && <span className="flex items-center gap-1"><Ruler size={12} className="text-slate-400" /> {p.size} m²</span>}
                    {p.rooms && <span className="flex items-center gap-1"><DoorOpen size={12} className="text-slate-400" /> {p.rooms}</span>}
                    {p.floor != null && <span>{p.floor}{p.total_floors ? `/${p.total_floors}` : ""}. kat</span>}
                  </div>
                </div>
                {p.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.features.slice(0, 4).map(f => (
                      <span key={f} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                    {p.features.length > 4 && <span className="text-xs text-slate-400">+{p.features.length - 4}</span>}
                  </div>
                )}
                {p.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
