"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export const GAZ_DISTRICTS = [
  "Şahinbey", "Şehitkamil", "Araban", "İslahiye",
  "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Yavuzeli",
];

export const GAZ_NEIGHBORHOODS: Record<string, string[]> = {
  "Şahinbey": [
    "Akkent", "Aydınlıkevler", "Bağlarbaşı", "Bey", "Bostancık",
    "Büyük Kayalı", "Çukur", "Dülük", "Ertuğrul Gazi", "Esentepe",
    "Gazi", "Gazikent", "Güvenevler", "Hoşgör", "İbrahimli",
    "İnönü", "Kahvelipınar", "Karaağaç", "Karataş", "Karagöz",
    "Kozluca", "Küçük Kayalı", "Mücahitler", "Narlık", "Savcılı",
    "Suburcu", "Süslü", "Şehreküstü", "Tişlaki", "Ünaldı",
    "Vatan", "Yavuzlar",
  ],
  "Şehitkamil": [
    "75. Yıl", "Bahçelievler", "Batıkent", "Beylerbeyi",
    "Çamlıca", "Çıksorut", "Cumhuriyet", "Düztepe", "Emek",
    "Güneykent", "Harapaşa", "Huzurevleri", "İncilipınar",
    "İsmet Paşa", "Karşıyaka", "Kıbrıs Şehitleri", "Köroğlu",
    "Mehmet Akif", "Mimar Sinan", "Sarıgüllük", "Seyrantepe",
    "Türktepe", "Üniversite", "Yamaçtepe", "Yeditepe", "Yeşilvadi",
  ],
  "Nizip": [
    "Barak", "Cumhuriyet", "Fatih", "Gazi", "İnönü",
    "Nizip Merkez", "Yavuz Selim",
  ],
  "İslahiye": [
    "Cumhuriyet", "Fatih", "Gazi", "İslahiye Merkez", "Yeni",
  ],
  "Araban": ["Araban Merkez", "Cumhuriyet", "Fatih"],
  "Karkamış": ["Karkamış Merkez", "Yeni"],
  "Nurdağı": ["Nurdağı Merkez", "Cumhuriyet"],
  "Oğuzeli": ["Oğuzeli Merkez", "Yeni"],
  "Yavuzeli": ["Yavuzeli Merkez", "Cumhuriyet"],
};

// ── Ortak: dikey liste dropdown ──────────────────────────────────────────────

function ListDropdown({
  label, options, selected, onChange, multi,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  multi: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  function toggle(o: string) {
    if (multi) {
      onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]);
    } else {
      onChange(selected[0] === o ? [] : [o]);
      setOpen(false);
      setSearch("");
    }
  }

  const btnLabel = selected.length === 0 ? label
    : selected.length <= 2 ? selected.join(", ")
    : `${selected.length} seçildi`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
      >
        <span className={`truncate ${selected.length === 0 ? "text-slate-400" : "text-slate-800"}`}>{btnLabel}</span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {selected.length > 0 && (
            <span
              onClick={e => { e.stopPropagation(); onChange([]); }}
              className="text-slate-300 hover:text-red-400"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl">
          {/* Arama */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-200 rounded-lg">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ara..."
                className="text-sm flex-1 focus:outline-none text-black bg-transparent"
              />
            </div>
          </div>

          {/* Dikey liste */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Sonuç yok</p>
            )}
            {filtered.map(o => {
              const isSelected = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-amber-50 ${isSelected ? "bg-amber-50 text-amber-800 font-medium" : "text-slate-700"}`}
                >
                  <span>{o}</span>
                  {isSelected && <Check size={15} className="text-amber-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Seçili etiketler (multi) */}
          {multi && selected.length > 0 && (
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

// ── Tek seçimlik — portföy formu ─────────────────────────────────────────────

interface SinglePickerProps {
  district: string;
  neighborhood: string;
  onDistrictChange: (d: string) => void;
  onNeighborhoodChange: (n: string) => void;
}

export function SingleLocationPicker({ district, neighborhood, onDistrictChange, onNeighborhoodChange }: SinglePickerProps) {
  const neighOptions = district ? (GAZ_NEIGHBORHOODS[district] ?? []) : Object.values(GAZ_NEIGHBORHOODS).flat();

  function handleDistrictChange(vals: string[]) {
    const d = vals[0] ?? "";
    onDistrictChange(d);
    onNeighborhoodChange(""); // ilçe değişince mahalleyi sıfırla
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* İl */}
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İl</p>
        <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-amber-50 text-amber-800 font-medium">
          Gaziantep
        </div>
      </div>

      {/* İlçe */}
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İlçe</p>
        <ListDropdown
          label="İlçe seçin"
          options={GAZ_DISTRICTS}
          selected={district ? [district] : []}
          onChange={handleDistrictChange}
          multi={false}
        />
      </div>

      {/* Mahalle */}
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">Mahalle</p>
        <ListDropdown
          label="Mahalle seçin"
          options={neighOptions}
          selected={neighborhood ? [neighborhood] : []}
          onChange={vals => onNeighborhoodChange(vals[0] ?? "")}
          multi={false}
        />
      </div>
    </div>
  );
}

// ── Çok seçimlik — müşteri formu ─────────────────────────────────────────────

interface MultiPickerProps {
  districts: string[];
  neighborhoods: string[];
  onDistrictsChange: (d: string[]) => void;
  onNeighborhoodsChange: (n: string[]) => void;
}

export function MultiLocationPicker({ districts, neighborhoods, onDistrictsChange, onNeighborhoodsChange }: MultiPickerProps) {
  const neighOptions = districts.length > 0
    ? districts.flatMap(d => GAZ_NEIGHBORHOODS[d] ?? [])
    : Object.values(GAZ_NEIGHBORHOODS).flat();

  function handleDistrictsChange(ds: string[]) {
    onDistrictsChange(ds);
    const validNeighs = ds.flatMap(d => GAZ_NEIGHBORHOODS[d] ?? []);
    onNeighborhoodsChange(neighborhoods.filter(n => validNeighs.includes(n)));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* İl */}
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İl</p>
        <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-amber-50 text-amber-800 font-medium">
          Gaziantep
        </div>
      </div>

      {/* İlçe */}
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İlçe</p>
        <ListDropdown
          label="İlçe seçin"
          options={GAZ_DISTRICTS}
          selected={districts}
          onChange={handleDistrictsChange}
          multi={true}
        />
      </div>

      {/* Mahalle */}
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">Mahalle</p>
        <ListDropdown
          label="Mahalle seçin"
          options={neighOptions}
          selected={neighborhoods}
          onChange={onNeighborhoodsChange}
          multi={true}
        />
      </div>
    </div>
  );
}
