"use client";
import { useState } from "react";
import { MessageSquare, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { parsePropertyFromText } from "@/lib/claude";
import { propertyStore, type Property } from "@/lib/storage";

const EXAMPLES = [
  "Kadıköy Moda'da 3+1 satılık daire, 120m², 5. kat, asansörlü, balkonlu, otoparklı, 8.500.000 TL",
  "Beşiktaş'ta kiralık 2+1 daire, 80m², 3/8 kat, 25.000 TL/ay, ebeveyn banyosu var",
  "Çeşme'de deniz manzaralı müstakil villa, 300m², 4+2, özel havuz, bahçe, 15 milyon",
  "Ataşehir'de ofis katı, 250m², asma kat, klimalı, güvenlikli plaza, 120.000 TL/ay",
];

export default function AddPropertyPage() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Property[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    try {
      const parsed = parsePropertyFromText(text);
      const property = propertyStore.add({
        title: parsed.title,
        type: parsed.type,
        city: parsed.city,
        district: parsed.district,
        neighborhood: parsed.neighborhood,
        price: parsed.price,
        price_type: parsed.price_type || "satis",
        size: parsed.size,
        rooms: parsed.rooms,
        floor: parsed.floor,
        total_floors: parsed.total_floors,
        features: parsed.features || [],
        description: parsed.description,
        status: "musait",
        raw_text: text,
      });
      setAdded((prev) => [property, ...prev]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare size={24} className="text-amber-500" /> Portföy Ekle
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gayrimenkulü doğal dilde yazın, yapay zeka otomatik olarak çözümlesin ve listeye eklesin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Örn: Kadıköy'de 3+1, 120m², 5. kat, balkonlu, otoparklı daire, 8.5 milyon TL satılık..."
          rows={4}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle size={16} /> {error}
            {error.includes("API") && <a href="settings" className="underline ml-1">Ayarlar</a>}
          </div>
        )}

        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-slate-400">Otomatik metin çözümleme</p>
          <button type="submit" disabled={!text.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
            <ArrowRight size={16} /> Ekle
          </button>
        </div>
      </form>

      <div className="mb-6">
        <p className="text-xs font-medium text-slate-500 mb-2">Örnek ifadeler:</p>
        <div className="space-y-2">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => setText(ex)}
              className="w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200 hover:border-amber-200 px-3 py-2 rounded-lg transition-colors">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {added.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Bu oturumda eklenenler</h2>
          <div className="space-y-3">
            {added.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{p.title}</p>
                    <p className="text-xs text-slate-400">#{p.id}</p>
                  </div>
                </div>
                <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-1 text-xs text-slate-600">
                  <span><strong>Tip:</strong> {p.type}</span>
                  <span><strong>Şehir:</strong> {p.city}</span>
                  {p.district && <span><strong>İlçe:</strong> {p.district}</span>}
                  {p.price && <span><strong>Fiyat:</strong> {p.price.toLocaleString("tr-TR")} ₺</span>}
                  {p.size && <span><strong>m²:</strong> {p.size}</span>}
                  {p.rooms && <span><strong>Oda:</strong> {p.rooms}</span>}
                </div>
                {p.features.length > 0 && (
                  <div className="ml-6 flex flex-wrap gap-1 mt-2">
                    {p.features.map((f) => <span key={f} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{f}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
