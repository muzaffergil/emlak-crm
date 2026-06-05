"use client";
import { useRef, useState } from "react";
import { MessageSquare, ClipboardList, ArrowRight, Camera, X, AlertCircle, CheckCircle, Zap, Phone, MessageCircle } from "lucide-react";
import { parsePropertyFromText } from "@/lib/claude";
import { propertyStore, type Property, type Client } from "@/lib/storage";
import { runMatchForProperty } from "@/lib/autoMatch";
import { SingleLocationPicker } from "@/components/LocationPicker";
import { applyWatermark, uploadPropertyPhoto } from "@/lib/watermark";
import PhotoManager from "@/components/PhotoManager";

const EXAMPLES = [
  "Şehitkamil'de 3+1 satılık daire, 120m², 5. kat, asansörlü, balkonlu, otoparklı, 8.500.000 TL",
  "Şahinbey'de kiralık 2+1 daire, 80m², 3/8 kat, 25.000 TL/ay, ebeveyn banyosu var",
  "Nizip'te müstakil ev, 180m², 4+1, bahçeli, 4 milyon TL satılık",
  "Gaziantep merkez ofis katı, 200m², asma kat, klimalı, güvenlikli, 80.000 TL/ay",
];

const TYPES = ["daire", "villa", "müstakil ev", "arsa", "dükkan", "ofis", "bina", "depo", "tarla"];
const STATUSES = [
  { value: "musait", label: "Müsait" },
  { value: "rezerve", label: "Rezerve" },
  { value: "satildi", label: "Satıldı" },
  { value: "kiralik", label: "Kiralık" },
];
const ROOMS_OPTS = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "6+1"];

const EMPTY_FORM = {
  title: "", type: "", city: "Gaziantep", district: "",
  neighborhood: "", price: "", price_type: "",
  size: "", rooms: "", floor: "", total_floors: "",
  status: "", description: "", features: "",
  owner_name: "", owner_phone: "", danisan: "", bina_yasi: "",
};

const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400 transition-colors placeholder:text-slate-400";
const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5";

function PillGroup({ label, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={o.value} type="button"
            onClick={() => onChange(value === o.value ? "" : o.value)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${value === o.value
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddedRow({ p, onPhotosChange }: { p: Property; onPhotosChange: (id: number, photos: string[]) => void }) {
  const [photos, setPhotos] = useState<string[]>(p.photos ?? []);
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
        <p className="font-semibold text-slate-800 text-sm">{p.title}</p>
        <span className="text-xs text-slate-400">#{p.id}</span>
      </div>
      <div className="ml-5">
        <PhotoManager propertyId={p.id} photos={photos}
          onChange={newPhotos => { setPhotos(newPhotos); onPhotosChange(p.id, newPhotos); }} />
      </div>
    </div>
  );
}

interface Props {
  onClose: () => void;
  onAdded: (p: Property) => void;
}

export default function AddPropertyModal({ onClose, onAdded }: Props) {
  const [tab, setTab] = useState<"form" | "text">("form");
  const [text, setText] = useState("");
  const [textError, setTextError] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formRooms, setFormRooms] = useState<string[]>([]);
  const [customRooms, setCustomRooms] = useState("");
  const [formError, setFormError] = useState("");
  const [added, setAdded] = useState<Property[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [matchedClients, setMatchedClients] = useState<Client[] | null>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);

  function handlePhotoFiles(files: FileList) {
    const items = Array.from(files).filter(f => f.type.startsWith("image/"))
      .map(file => ({ file, preview: URL.createObjectURL(file) }));
    setPendingFiles(prev => [...prev, ...items]);
  }

  function removePending(i: number) {
    setPendingFiles(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, j) => j !== i); });
  }

  function f(key: keyof typeof EMPTY_FORM, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setTextError(""); setSubmitting(true);
    try {
      const parsed = parsePropertyFromText(text);
      const property = await propertyStore.add({
        title: parsed.title, type: parsed.type, city: parsed.city,
        district: parsed.district, neighborhood: parsed.neighborhood,
        price: parsed.price, price_type: parsed.price_type || "satis",
        size: parsed.size, rooms: parsed.rooms, floor: parsed.floor,
        total_floors: parsed.total_floors, features: parsed.features || [],
        description: parsed.description, status: "musait", raw_text: text,
      });
      setAdded(prev => [property, ...prev]);
      onAdded(property);
      setText("");
      runMatchForProperty(property.id).then(({ clients }) => {
        if (clients.length > 0) setMatchedClients(clients);
      }).catch(() => {});
    } catch (err) {
      setTextError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally { setSubmitting(false); }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim()) { setFormError("Başlık zorunludur."); return; }
    const finalRooms = customRooms.trim() || formRooms.join(", ") || undefined;
    setSubmitting(true);
    try {
      const property = await propertyStore.add({
        title: form.title.trim(),
        type: form.type || "daire",
        city: form.city.trim() || "Gaziantep",
        district: form.district.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        price_type: form.price_type || "satis",
        size: form.size ? Number(form.size) : undefined,
        rooms: finalRooms,
        floor: form.floor !== "" ? Number(form.floor) : undefined,
        total_floors: form.total_floors !== "" ? Number(form.total_floors) : undefined,
        status: form.status || "musait",
        description: form.description.trim() || undefined,
        features: form.features.split(",").map(s => s.trim()).filter(Boolean),
        owner_name: form.owner_name.trim() || undefined,
        owner_phone: form.owner_phone.trim() || undefined,
        danisan: form.danisan.trim() || undefined,
        bina_yasi: form.bina_yasi ? Number(form.bina_yasi) : undefined,
      });

      if (pendingFiles.length > 0) {
        try {
          const photoUrls: string[] = [];
          for (const { file } of pendingFiles) {
            const blob = await applyWatermark(file);
            const url = await uploadPropertyPhoto(property.id, blob);
            photoUrls.push(url);
          }
          await propertyStore.update(property.id, { photos: photoUrls });
          property.photos = photoUrls;
        } catch { /* photos failed but property added */ }
        pendingFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
        setPendingFiles([]);
      }

      setAdded(prev => [property, ...prev]);
      onAdded(property);
      setForm({ ...EMPTY_FORM });
      setFormRooms([]);
      setCustomRooms("");
      runMatchForProperty(property.id).then(({ clients }) => {
        if (clients.length > 0) setMatchedClients(clients);
      }).catch(() => {});
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally { setSubmitting(false); }
  }

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Başlık */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
          <h2 className="font-bold text-slate-900">Portföy Ekle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {/* Sekmeler */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
            <button type="button" onClick={() => setTab("form")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "form" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <ClipboardList size={14} /> Form ile Ekle
            </button>
            <button type="button" onClick={() => setTab("text")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "text" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <MessageSquare size={14} /> Metinden Ekle
            </button>
          </div>

          {/* Form ile Ekle */}
          {tab === "form" && (
            <form id="add-prop-form" onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Başlık *</label>
                <input className={inputCls} value={form.title} onChange={e => f("title", e.target.value)} placeholder="ör. Şehitkamil 3+1 Daire" />
              </div>

              <PillGroup label="Gayrimenkul Tipi"
                options={TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                value={form.type} onChange={v => f("type", v)} />

              <PillGroup label="Satış / Kiralık"
                options={[{ value: "satis", label: "Satılık" }, { value: "kira", label: "Kiralık" }]}
                value={form.price_type} onChange={v => f("price_type", v)} />

              <PillGroup label="Durum" options={STATUSES} value={form.status} onChange={v => f("status", v)} />

              <div>
                <p className={labelCls}>Oda Sayısı</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ROOMS_OPTS.map(r => {
                    const active = formRooms.includes(r);
                    return (
                      <button key={r} type="button"
                        onClick={() => { setFormRooms(active ? formRooms.filter(x => x !== r) : [...formRooms, r]); setCustomRooms(""); }}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
                        {r}
                      </button>
                    );
                  })}
                </div>
                <input className={inputCls} value={customRooms}
                  onChange={e => { setCustomRooms(e.target.value); setFormRooms([]); }}
                  placeholder="Ya da buraya yazın: ör. 3+2, 4+2..." />
              </div>

              <div>
                <p className={labelCls}>Konum (İlçe / Mahalle)</p>
                <SingleLocationPicker district={form.district} neighborhood={form.neighborhood}
                  onDistrictChange={d => f("district", d)} onNeighborhoodChange={n => f("neighborhood", n)} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className={labelCls}>Fiyat (₺)</label><input type="number" className={inputCls} value={form.price} onChange={e => f("price", e.target.value)} placeholder="ör. 3500000" /></div>
                <div><label className={labelCls}>m²</label><input type="number" className={inputCls} value={form.size} onChange={e => f("size", e.target.value)} placeholder="ör. 120" /></div>
                <div><label className={labelCls}>Kat</label><input type="number" className={inputCls} value={form.floor} onChange={e => f("floor", e.target.value)} placeholder="ör. 3" /></div>
                <div><label className={labelCls}>Toplam Kat</label><input type="number" className={inputCls} value={form.total_floors} onChange={e => f("total_floors", e.target.value)} placeholder="ör. 8" /></div>
              </div>

              <div>
                <label className={labelCls}>Özellikler (virgülle ayırın)</label>
                <input className={inputCls} value={form.features} onChange={e => f("features", e.target.value)} placeholder="ör. balkon, otopark, asansör, güvenlik" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={labelCls}>Sahibi / İletişim Adı</label><input className={inputCls} value={form.owner_name} onChange={e => f("owner_name", e.target.value)} placeholder="ör. Ahmet Yılmaz" /></div>
                <div><label className={labelCls}>Sahibi Telefon</label><input className={inputCls} value={form.owner_phone} onChange={e => f("owner_phone", e.target.value)} placeholder="ör. 0532 123 45 67" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={labelCls}>Bina Yaşı</label><input type="number" min="0" max="100" className={inputCls} value={form.bina_yasi} onChange={e => f("bina_yasi", e.target.value)} placeholder="ör. 5" /></div>
                <div><label className={labelCls}>Danışman</label><input className={inputCls} value={form.danisan} onChange={e => f("danisan", e.target.value)} placeholder="ör. Muzaffer Aydıngüler" /></div>
              </div>

              <div>
                <label className={labelCls}>Açıklama</label>
                <textarea rows={2} className={inputCls} value={form.description} onChange={e => f("description", e.target.value)} />
              </div>

              <div>
                <label className={labelCls}>Fotoğraflar (opsiyonel)</label>
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map(({ preview }, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePending(i)}
                        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => photoFileRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-500 transition-colors">
                    <Camera size={16} /><span className="text-xs">Ekle</span>
                  </button>
                </div>
                <input ref={photoFileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => { if (e.target.files?.length) handlePhotoFiles(e.target.files); }} />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
            </form>
          )}

          {/* Metinden Ekle */}
          {tab === "text" && (
            <>
              <form id="add-prop-form" onSubmit={handleTextSubmit} className="space-y-3">
                <textarea value={text} onChange={e => setText(e.target.value)}
                  placeholder="Örn: Şehitkamil'de 3+1, 120m², 5. kat, balkonlu, otoparklı daire, 8.5 milyon TL satılık..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
                {textError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={16} /> {textError}
                  </div>
                )}
              </form>
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Örnek ifadeler:</p>
                <div className="space-y-1.5">
                  {EXAMPLES.map((ex, i) => (
                    <button key={i} type="button" onClick={() => setText(ex)}
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
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Bu oturumda eklenenler ({added.length})</p>
              {added.map(p => (
                <AddedRow key={p.id} p={p}
                  onPhotosChange={(id, photos) => setAdded(prev => prev.map(x => x.id === id ? { ...x, photos } : x))} />
              ))}
            </div>
          )}

          {/* Eşleşen alıcılar paneli */}
          {matchedClients && matchedClients.length > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                  <Zap size={15} /> {matchedClients.length} alıcıyla eşleşti!
                </p>
                <button onClick={() => setMatchedClients(null)} className="text-amber-400 hover:text-amber-600">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {matchedClients.map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                      {c.budget_max && (
                        <p className="text-xs text-slate-400">
                          Bütçe: {c.budget_max.toLocaleString("tr-TR")} ₺&apos;ye kadar
                        </p>
                      )}
                    </div>
                    {c.phone && (
                      <div className="flex gap-1">
                        <a href={`tel:${c.phone}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-100 text-slate-500 hover:text-green-600 transition-colors">
                          <Phone size={13} />
                        </a>
                        <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                          target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-100 text-slate-500 hover:text-green-600 transition-colors">
                          <MessageCircle size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/40 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Kapat</button>
          <button
            form="add-prop-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-60">
            <ArrowRight size={15} /> {submitting ? "Ekleniyor..." : "Portföye Ekle"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
