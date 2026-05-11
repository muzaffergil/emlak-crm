"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export const GAZ_DISTRICTS = [
  "Şahinbey", "Şehitkamil", "Araban", "İslahiye",
  "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Yavuzeli",
];

export const GAZ_NEIGHBORHOODS: Record<string, string[]> = {
  "Şahinbey": [
    "Akkent", "Bağlarbaşı", "Bey", "Bostancık", "Büyük Kayalı", "Çukur",
    "Dülük", "Ertuğrul Gazi", "Esentepe", "Gazikent", "Güvenevler", "Hoşgör",
    "İbrahimli", "Karataş", "Karagöz", "Kozluca", "Küçük Kayalı", "Mücahitler",
    "Narlık", "Suburcu", "Süslü", "Ünaldı", "Yavuzlar",
  ],
  "Şehitkamil": [
    "75. Yıl", "Bahçelievler", "Batıkent", "Beylerbeyi", "Çamlıca", "Çıksorut",
    "Düztepe", "Emek", "Güneykent", "Harapaşa", "Huzurevleri", "İncilipınar",
    "Karşıyaka", "Mehmet Akif", "Mimar Sinan", "Seyrantepe", "Türktepe",
    "Üniversite", "Yamaçtepe", "Yeşilvadi",
  ],
  "Nizip": ["Barak", "Nizip Merkez"],
  "İslahiye": ["İslahiye Merkez"],
  "Araban": ["Araban Merkez"],
  "Karkamış": ["Karkamış Merkez"],
  "Nurdağı": ["Nurdağı Merkez"],
  "Oğuzeli": ["Oğuzeli Merkez"],
  "Yavuzeli": ["Yavuzeli Merkez"],
};

// ── Tek seçimlik (portföy için) ─────────────────────────────────────────────

interface SinglePickerProps {
  district: string;
  neighborhood: string;
  onDistrictChange: (d: string) => void;
  onNeighborhoodChange: (n: string) => void;
}

function SingleDropdown({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors">
        <span className={value ? "text-slate-800" : "text-slate-400"}>{value || label}</span>
        <div className="flex items-center gap-1">
          {value && (
            <span onClick={e => { e.stopPropagation(); onChange(""); }} className="text-slate-300 hover:text-red-400">
              <X size={14} />
            </span>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-200 rounded-lg">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Ara..." className="text-sm flex-1 focus:outline-none text-black" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1.5 flex flex-wrap gap-1.5">
            {filtered.map(o => (
              <button key={o} type="button"
                onClick={() => { onChange(value === o ? "" : o); setOpen(false); setSearch(""); }}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${value === o
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
                {o}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-slate-400 px-2 py-2">Sonuç yok</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function SingleLocationPicker({ district, neighborhood, onDistrictChange, onNeighborhoodChange }: SinglePickerProps) {
  const neighOptions = district ? (GAZ_NEIGHBORHOODS[district] ?? []) : Object.values(GAZ_NEIGHBORHOODS).flat();

  function handleDistrictChange(d: string) {
    onDistrictChange(d);
    onNeighborhoodChange(""); // ilçe değişince mahalle sıfırla
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 block mb-1.5">İlçe</p>
          <SingleDropdown label="İlçe seçin" options={GAZ_DISTRICTS} value={district} onChange={handleDistrictChange} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 block mb-1.5">Mahalle</p>
          <SingleDropdown label="Mahalle seçin" options={neighOptions} value={neighborhood} onChange={onNeighborhoodChange} />
        </div>
      </div>
    </div>
  );
}

// ── Çok seçimlik (müşteri için) ──────────────────────────────────────────────

interface MultiPickerProps {
  districts: string[];
  neighborhoods: string[];
  onDistrictsChange: (d: string[]) => void;
  onNeighborhoodsChange: (n: string[]) => void;
}

function MultiDropdown({
  label, options, selected, onChange,
}: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  function toggle(o: string) {
    onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]);
  }

  const btnLabel = selected.length === 0 ? label
    : selected.length <= 2 ? selected.join(", ")
    : `${selected.length} seçildi`;

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors">
        <span className={selected.length === 0 ? "text-slate-400 truncate" : "text-slate-800 truncate"}>{btnLabel}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <span onClick={e => { e.stopPropagation(); onChange([]); }} className="text-slate-300 hover:text-red-400">
              <X size={14} />
            </span>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-200 rounded-lg">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Ara..." className="text-sm flex-1 focus:outline-none text-black" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1.5 flex flex-wrap gap-1.5">
            {filtered.map(o => (
              <button key={o} type="button" onClick={() => toggle(o)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${selected.includes(o)
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
                {o}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-xs text-slate-400 px-2 py-2">Sonuç yok</p>}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-slate-100 flex flex-wrap gap-1">
              {selected.map(s => (
                <span key={s} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => toggle(s)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MultiLocationPicker({ districts, neighborhoods, onDistrictsChange, onNeighborhoodsChange }: MultiPickerProps) {
  const neighOptions = districts.length > 0
    ? districts.flatMap(d => GAZ_NEIGHBORHOODS[d] ?? [])
    : Object.values(GAZ_NEIGHBORHOODS).flat();

  function handleDistrictsChange(ds: string[]) {
    onDistrictsChange(ds);
    // Seçili mahallelerden ilçesi kalkmışları temizle
    const validNeighs = ds.flatMap(d => GAZ_NEIGHBORHOODS[d] ?? []);
    onNeighborhoodsChange(neighborhoods.filter(n => validNeighs.includes(n)));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İlçe</p>
        <MultiDropdown label="İlçe seçin" options={GAZ_DISTRICTS} selected={districts} onChange={handleDistrictsChange} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">Mahalle</p>
        <MultiDropdown label="Mahalle seçin" options={neighOptions} selected={neighborhoods} onChange={onNeighborhoodsChange} />
      </div>
    </div>
  );
}
