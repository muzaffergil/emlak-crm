"use client";
import { useState } from "react";
import { X, Plus, Download, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { downloadPropertyTemplate, DEFAULT_OPTIONS, type ExcelOptions } from "@/lib/excelImport";

const STORAGE_KEY = "emlak_excel_options";

function loadOptions(): ExcelOptions {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<ExcelOptions>;
      return {
        types:         parsed.types         ?? [...DEFAULT_OPTIONS.types],
        rooms:         parsed.rooms         ?? [...DEFAULT_OPTIONS.rooms],
        cities:        parsed.cities        ?? [...DEFAULT_OPTIONS.cities],
        districts:     parsed.districts     ?? [...DEFAULT_OPTIONS.districts],
        neighborhoods: parsed.neighborhoods ?? JSON.parse(JSON.stringify(DEFAULT_OPTIONS.neighborhoods)),
        maxFloor:      parsed.maxFloor      ?? DEFAULT_OPTIONS.maxFloor,
      };
    }
  } catch {}
  return {
    types:         [...DEFAULT_OPTIONS.types],
    rooms:         [...DEFAULT_OPTIONS.rooms],
    cities:        [...DEFAULT_OPTIONS.cities],
    districts:     [...DEFAULT_OPTIONS.districts],
    neighborhoods: JSON.parse(JSON.stringify(DEFAULT_OPTIONS.neighborhoods)),
    maxFloor:      DEFAULT_OPTIONS.maxFloor,
  };
}

function saveOptions(opts: ExcelOptions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(opts)); } catch {}
}

interface TagListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  fixed?: boolean;
  fixedItems?: string[];
  compact?: boolean;
}

function TagList({ label, items, onChange, fixed, fixedItems, compact }: TagListProps) {
  const [input, setInput] = useState("");

  function add() {
    const v = input.trim();
    if (!v || items.includes(v)) { setInput(""); return; }
    onChange([...items, v]);
    setInput("");
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {(fixedItems ?? items).map(item => (
          <span
            key={item}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              fixedItems ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {item}
            {!fixed && !fixedItems && (
              <button onClick={() => onChange(items.filter(i => i !== item))} className="hover:text-red-500 ml-0.5">
                <X size={10} />
              </button>
            )}
          </span>
        ))}
      </div>
      {!fixed && (
        <div className={`flex gap-2 ${compact ? "mt-1" : ""}`}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Yeni seçenek ekle…"
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            onClick={add}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg"
          >
            <Plus size={13} /> Ekle
          </button>
        </div>
      )}
    </div>
  );
}

function DistrictNeighborhoods({
  district,
  items,
  onChange,
}: {
  district: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span>{district} <span className="text-xs text-slate-400 font-normal">({items.length} mahalle)</span></span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100">
          <TagList label="" items={items} onChange={onChange} compact />
        </div>
      )}
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function ExcelTemplateModal({ onClose }: Props) {
  const [opts, setOpts] = useState<ExcelOptions>(loadOptions);

  function update<K extends keyof ExcelOptions>(key: K, val: ExcelOptions[K]) {
    setOpts(prev => ({ ...prev, [key]: val }));
  }

  function reset() {
    setOpts({
      types:         [...DEFAULT_OPTIONS.types],
      rooms:         [...DEFAULT_OPTIONS.rooms],
      cities:        [...DEFAULT_OPTIONS.cities],
      districts:     [...DEFAULT_OPTIONS.districts],
      neighborhoods: JSON.parse(JSON.stringify(DEFAULT_OPTIONS.neighborhoods)),
      maxFloor:      DEFAULT_OPTIONS.maxFloor,
    });
  }

  async function handleDownload() {
    saveOptions(opts);
    await downloadPropertyTemplate(opts);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">Excel Şablonu</h2>
            <p className="text-xs text-slate-400 mt-0.5">Dropdown seçeneklerini düzenleyip indirebilirsiniz</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {/* İçerik */}
        <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">
          <TagList
            label="Gayrimenkul Tipi"
            items={opts.types}
            onChange={v => update("types", v)}
          />
          <TagList
            label="Oda Sayısı"
            items={opts.rooms}
            onChange={v => update("rooms", v)}
          />
          <TagList
            label="Şehir"
            items={opts.cities}
            onChange={v => update("cities", v)}
          />
          <TagList
            label="İlçe / Bölge"
            items={opts.districts}
            onChange={v => update("districts", v)}
          />

          {/* Mahalleler */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mahalleler (ilçeye göre)</p>
            <div className="space-y-1.5">
              {opts.districts.map(district => (
                <DistrictNeighborhoods
                  key={district}
                  district={district}
                  items={opts.neighborhoods[district] ?? []}
                  onChange={v => update("neighborhoods", { ...opts.neighborhoods, [district]: v })}
                />
              ))}
            </div>
          </div>

          {/* Maksimum Kat */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Maksimum Kat Sayısı</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                value={opts.maxFloor}
                onChange={e => update("maxFloor", Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <span className="text-xs text-slate-400">Kat sütunlarında 1–{opts.maxFloor} arası çıkar</span>
            </div>
          </div>

          {/* Sabit listeler */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs text-slate-400">Aşağıdaki seçenekler sabittir, değiştirilemez:</p>
            <TagList label="Fiyat Türü" items={[]} onChange={() => {}} fixed fixedItems={["satis", "kira"]} />
            <TagList label="Durum" items={[]} onChange={() => {}} fixed fixedItems={["musait", "kiralik", "rezerve", "satildi"]} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RotateCcw size={13} /> Varsayılana Dön
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg ml-auto">
            İptal
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
          >
            <Download size={14} /> Excel İndir
          </button>
        </div>
      </div>
    </div>
  );
}
