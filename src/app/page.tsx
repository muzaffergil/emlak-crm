"use client";
import { useEffect, useState } from "react";
import { Trash2, Home, TrendingUp, MapPin, Ruler, DoorOpen, Upload } from "lucide-react";
import { propertyStore, type Property } from "@/lib/storage";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  musait: { label: "Müsait", color: "bg-green-100 text-green-800" },
  satildi: { label: "Satıldı", color: "bg-red-100 text-red-800" },
  kiralik: { label: "Kiralık", color: "bg-blue-100 text-blue-800" },
  rezerve: { label: "Rezerve", color: "bg-yellow-100 text-yellow-800" },
};

export default function PortfolioPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => { setProperties(propertyStore.getAll()); }, []);

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
      setImportMsg("Yükleme hatası, tekrar deneyin.");
    } finally {
      setImporting(false);
    }
  }

  function deleteProperty(id: number) {
    if (!confirm("Bu portföyü silmek istediğinizden emin misiniz?")) return;
    propertyStore.delete(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = properties.filter((p) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    const haystack = [
      p.title,
      p.type,
      p.city,
      p.district,
      p.neighborhood,
      p.rooms,
      p.description,
      p.status,
      p.price ? p.price.toLocaleString("tr-TR") : "",
      p.price ? String(p.price) : "",
      p.size ? String(p.size) : "",
      p.floor ? String(p.floor) : "",
      p.price_type === "kira" ? "kiralık kira" : "satılık satış",
      ...p.features,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Home size={24} className="text-amber-500" /> Portföy
          </h1>
          <p className="text-slate-500 text-sm mt-1">{properties.length} gayrimenkul</p>
        </div>
        <div className="flex items-center gap-2">
          {importMsg && <span className="text-sm text-green-600 font-medium">{importMsg}</span>}
          <button
            onClick={() => importJson("portfolio-data.json", "Yücesoy Güncel (77 gayrimenkul)")}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Upload size={15} />
            {importing ? "Yükleniyor..." : "Yücesoy Güncel"}
          </button>
          <button
            onClick={() => importJson("portfolio2-data.json", "Portföy Takip (95 kayıt: daire, villa, arsa)")}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Upload size={15} />
            {importing ? "Yükleniyor..." : "Portföy Takip"}
          </button>
          <a
            href="add-property"
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Portföy Ekle
          </a>
        </div>
      </div>

      <input
        type="text"
        placeholder="Ara: şehir, ilçe, tip..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full mb-4 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Home size={48} className="mx-auto mb-3 opacity-30" />
          <p>Portföyde henüz gayrimenkul yok.</p>
          <a href="add-property" className="text-amber-500 hover:underline text-sm mt-2 inline-block">
            Hemen ekleyin
          </a>
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
                    {p.features.slice(0, 4).map((f) => (
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
