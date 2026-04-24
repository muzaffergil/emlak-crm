"use client";
import { useState } from "react";
import { MessageSquare, ClipboardList, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { parsePropertyFromText } from "@/lib/claude";
import { propertyStore, type Property } from "@/lib/storage";

const EXAMPLES = [
  "Kadıköy Moda'da 3+1 satılık daire, 120m², 5. kat, asansörlü, balkonlu, otoparklı, 8.500.000 TL",
  "Beşiktaş'ta kiralık 2+1 daire, 80m², 3/8 kat, 25.000 TL/ay, ebeveyn banyosu var",
  "Çeşme'de deniz manzaralı müstakil villa, 300m², 4+2, özel havuz, bahçe, 15 milyon",
  "Ataşehir'de ofis katı, 250m², asma kat, klimalı, güvenlikli plaza, 120.000 TL/ay",
];

const EMPTY_FORM = {
  title: "", type: "daire", city: "Gaziantep", district: "",
  neighborhood: "", price: "", price_type: "satis", size: "",
  rooms: "", floor: "", total_floors: "", status: "musait",
  description: "", features: "",
};

const inputCls = "w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-300";
const labelCls = "text-xs font-semibold text-slate-500 block mb-1";

function AddedCard({ p }: { p: Property }) {
  return (
    <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4">
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
  );
}

export default function AddPropertyPage() {
  const [tab, setTab] = useState<"text" | "form">("form");
  const [text, setText] = useState("");
  const [textError, setTextError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState("");
  const [added, setAdded] = useState<Property[]>([]);

  function f(key: keyof typeof EMPTY_FORM, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setTextError("");
    try {
      const parsed = parsePropertyFromText(text);
      const property = propertyStore.add({
        title: parsed.title, type: parsed.type, city: parsed.city,
        district: parsed.district, neighborhood: parsed.neighborhood,
        price: parsed.price, price_type: parsed.price_type || "satis",
        size: parsed.size, rooms: parsed.rooms, floor: parsed.floor,
        total_floors: parsed.total_floors, features: parsed.features || [],
        description: parsed.description, status: "musait", raw_text: text,
      });
      setAdded(prev => [property, ...prev]);
      setText("");
    } catch (err) {
      setTextError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) { setFormError("Başlık zorunludur."); return; }
    try {
      const property = propertyStore.add({
        title: form.title.trim(),
        type: form.type,
        city: form.city.trim() || "Gaziantep",
        district: form.district.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        price_type: form.price_type,
        size: form.size ? Number(form.size) : undefined,
        rooms: form.rooms.trim() || undefined,
        floor: form.floor !== "" ? Number(form.floor) : undefined,
        total_floors: form.total_floors !== "" ? Number(form.total_floors) : undefined,
        status: form.status,
        description: form.description.trim() || undefined,
        features: form.features.split(",").map(s => s.trim()).filter(Boolean),
      });
      setAdded(prev => [property, ...prev]);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Bir hata oluştu");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList size={24} className="text-amber-500" /> Portföy Ekle
        </h1>
      </div>

      {/* Tab seçimi */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab("form")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "form" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <ClipboardList size={15} /> Form ile Ekle
        </button>
        <button onClick={() => setTab("text")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "text" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <MessageSquare size={15} /> Metinden Ekle
        </button>
      </div>

      {/* ── Form ile Ekle ── */}
      {tab === "form" && (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Başlık *</label>
              <input className={inputCls} value={form.title} onChange={e => f("title", e.target.value)}
                placeholder="ör. Şehitkamil 3+1 Daire" />
            </div>

            <div>
              <label className={labelCls}>Gayrimenkul Tipi</label>
              <select className={inputCls} value={form.type} onChange={e => f("type", e.target.value)}>
                <option value="daire">Daire</option>
                <option value="villa">Villa</option>
                <option value="arsa">Arsa</option>
                <option value="dükkan">Dükkan / İş Yeri</option>
                <option value="ofis">Ofis</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Durum</label>
              <select className={inputCls} value={form.status} onChange={e => f("status", e.target.value)}>
                <option value="musait">Müsait</option>
                <option value="rezerve">Rezerve</option>
                <option value="satildi">Satıldı</option>
                <option value="kiralik">Kiralık</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Şehir</label>
              <input className={inputCls} value={form.city} onChange={e => f("city", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>İlçe</label>
              <input className={inputCls} value={form.district} onChange={e => f("district", e.target.value)}
                placeholder="ör. Şehitkamil" />
            </div>
            <div>
              <label className={labelCls}>Mahalle</label>
              <input className={inputCls} value={form.neighborhood} onChange={e => f("neighborhood", e.target.value)}
                placeholder="ör. Bağlarbaşı" />
            </div>

            <div>
              <label className={labelCls}>Fiyat (₺)</label>
              <input type="number" className={inputCls} value={form.price} onChange={e => f("price", e.target.value)}
                placeholder="ör. 3500000" />
            </div>
            <div>
              <label className={labelCls}>Satış / Kiralık</label>
              <select className={inputCls} value={form.price_type} onChange={e => f("price_type", e.target.value)}>
                <option value="satis">Satılık</option>
                <option value="kira">Kiralık</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>m²</label>
              <input type="number" className={inputCls} value={form.size} onChange={e => f("size", e.target.value)}
                placeholder="ör. 120" />
            </div>
            <div>
              <label className={labelCls}>Oda Sayısı</label>
              <select className={inputCls} value={form.rooms} onChange={e => f("rooms", e.target.value)}>
                <option value="">Seçin</option>
                {["Stüdyo","1+0","1+1","2+1","3+1","4+1","5+1","6+1","7+1"].map(r =>
                  <option key={r} value={r}>{r}</option>
                )}
                <option value="other">Diğer</option>
              </select>
              {form.rooms === "other" && (
                <input className={`${inputCls} mt-1`} placeholder="ör. 3+2"
                  onChange={e => f("rooms", e.target.value)} />
              )}
            </div>
            <div>
              <label className={labelCls}>Kat</label>
              <input type="number" className={inputCls} value={form.floor} onChange={e => f("floor", e.target.value)}
                placeholder="ör. 3" />
            </div>
            <div>
              <label className={labelCls}>Toplam Kat</label>
              <input type="number" className={inputCls} value={form.total_floors} onChange={e => f("total_floors", e.target.value)}
                placeholder="ör. 8" />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Özellikler (virgülle ayırın)</label>
              <input className={inputCls} value={form.features} onChange={e => f("features", e.target.value)}
                placeholder="ör. balkon, otopark, asansör, güvenlik" />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Açıklama</label>
              <textarea rows={3} className={inputCls} value={form.description}
                onChange={e => f("description", e.target.value)} />
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <ArrowRight size={16} /> Portföye Ekle
            </button>
          </div>
        </form>
      )}

      {/* ── Metinden Ekle ── */}
      {tab === "text" && (
        <>
          <form onSubmit={handleTextSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Örn: Kadıköy'de 3+1, 120m², 5. kat, balkonlu, otoparklı daire, 8.5 milyon TL satılık..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />

            {textError && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2 bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle size={16} /> {textError}
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
        </>
      )}

      {/* Eklenenler */}
      {added.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Bu oturumda eklenenler</h2>
          <div className="space-y-3">
            {added.map(p => <AddedCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
