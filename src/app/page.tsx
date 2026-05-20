"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Trash2, Home, TrendingUp, MapPin, Ruler, DoorOpen, X, SlidersHorizontal, Pencil, Phone, MessageCircle, CheckCircle2, Star, FileSpreadsheet, Upload, Loader2, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { propertyStore, clientStore, matchStore, saleStore, type Property, type Client } from "@/lib/storage";
import { SingleLocationPicker } from "@/components/LocationPicker";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExcelTemplateModal from "@/components/ExcelTemplateModal";
import PhotoManager from "@/components/PhotoManager";
import { parsePropertyExcel, filterDuplicates } from "@/lib/excelImport";

const PropertyLocationMap = dynamic(() => import("@/components/PropertyLocationMap"), {
  ssr: false,
  loading: () => <div className="h-44 bg-slate-100 rounded-lg animate-pulse" />,
});

// ── Düzenleme Modalı ────────────────────────────────────────────────────────
function EditModal({ property, onClose, onSave }: {
  property: Property;
  onClose: () => void;
  onSave: (updated: Property) => void;
}) {
  const [form, setForm] = useState({
    title: property.title,
    type: property.type,
    city: property.city,
    district: property.district || "",
    neighborhood: property.neighborhood || "",
    price: property.price != null ? String(property.price) : "",
    price_type: property.price_type,
    size: property.size != null ? String(property.size) : "",
    rooms: property.rooms || "",
    floor: property.floor != null ? String(property.floor) : "",
    total_floors: property.total_floors != null ? String(property.total_floors) : "",
    status: property.status,
    description: property.description || "",
    features: property.features.join(", "),
    owner_name: property.owner_name || "",
    owner_phone: property.owner_phone || "",
  });
  const [photos, setPhotos] = useState<string[]>(property.photos ?? []);
  const [saving, setSaving] = useState(false);

  function f(key: keyof typeof form, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    const updated: Property = {
      ...property,
      title: form.title.trim() || property.title,
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
      owner_name: form.owner_name.trim() || undefined,
      owner_phone: form.owner_phone.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };
    try {
      await propertyStore.update(property.id, updated);
      onSave(updated);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-300";
  const labelCls = "text-xs font-semibold text-slate-500 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Portföy Düzenle <span className="text-slate-400 font-normal text-sm">#{property.id}</span></h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className={labelCls}>Başlık</label>
              <input className={inputCls} value={form.title} onChange={e => f("title", e.target.value)} />
            </div>

            <div>
              <label className={labelCls}>Tip</label>
              <select className={inputCls} value={form.type} onChange={e => f("type", e.target.value)}>
                {[["daire","Daire"],["villa","Villa"],["müstakil ev","Müstakil Ev"],["arsa","Arsa"],["dükkan","Dükkan"],["ofis","Ofis"],["bina","Bina"],["depo","Depo"],["tarla","Tarla"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Durum</label>
              <select className={inputCls} value={form.status} onChange={e => f("status", e.target.value)}>
                <option value="musait">Müsait</option>
                <option value="satildi">Satıldı</option>
                <option value="rezerve">Rezerve</option>
                <option value="kiralik">Kiralık</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Konum (İlçe / Mahalle)</label>
              <SingleLocationPicker
                district={form.district}
                neighborhood={form.neighborhood}
                onDistrictChange={d => f("district", d)}
                onNeighborhoodChange={n => f("neighborhood", n)}
              />
            </div>

            <div>
              <label className={labelCls}>Fiyat (₺)</label>
              <input type="number" className={inputCls} value={form.price} onChange={e => f("price", e.target.value)} />
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
              <input type="number" className={inputCls} value={form.size} onChange={e => f("size", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Oda Sayısı</label>
              <input className={inputCls} value={form.rooms} onChange={e => f("rooms", e.target.value)} placeholder="ör. 3+1" />
            </div>
            <div>
              <label className={labelCls}>Kat</label>
              <input type="number" className={inputCls} value={form.floor} onChange={e => f("floor", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Toplam Kat</label>
              <input type="number" className={inputCls} value={form.total_floors} onChange={e => f("total_floors", e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Özellikler (virgülle ayırın)</label>
              <input className={inputCls} value={form.features} onChange={e => f("features", e.target.value)} placeholder="balkon, otopark, asansör" />
            </div>

            <div>
              <label className={labelCls}>Sahip Adı</label>
              <input className={inputCls} value={form.owner_name} onChange={e => f("owner_name", e.target.value)} placeholder="Sahip adı soyadı" />
            </div>
            <div>
              <label className={labelCls}>Sahip Telefonu</label>
              <input className={inputCls} value={form.owner_phone} onChange={e => f("owner_phone", e.target.value)} placeholder="05xx xxx xx xx" />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Açıklama</label>
              <textarea rows={3} className={inputCls} value={form.description} onChange={e => f("description", e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Camera size={13} /> Fotoğraflar (EstateIQ filigranı eklenir)</span>
              </label>
              <PhotoManager
                propertyId={property.id}
                photos={photos}
                onChange={setPhotos}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">İptal</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox (portal — Leaflet z-index sorununu aşar) ──────────────────────
function Lightbox({ photos, index, onClose, onNav }: {
  photos: string[]; index: number; onClose: () => void; onNav: (i: number) => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNav(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onNav(index + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, photos.length, onClose, onNav]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Önceki */}
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index - 1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      <img
        src={photos[index]}
        alt=""
        className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain select-none"
        onClick={e => e.stopPropagation()}
      />

      {/* Sonraki */}
      {index < photos.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index + 1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Kapatma */}
      <button
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {/* Sayaç */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>,
    document.body
  );
}

// ── Fotoğraf Galerisi ───────────────────────────────────────────────────────
function PhotoGallery({ photos }: { photos: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox photos={photos} index={lightboxIdx} onClose={() => setLightboxIdx(null)} onNav={setLightboxIdx} />
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            onClick={() => setLightboxIdx(i)}
            className="w-28 h-28 flex-shrink-0 rounded-lg object-cover cursor-pointer border border-slate-200 hover:opacity-90 transition-opacity"
          />
        ))}
      </div>
    </>
  );
}

// ── Detay Modalı ────────────────────────────────────────────────────────────
function DetailModal({ property, onClose, onEdit, onDelete }: {
  property: Property;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const st = STATUS_LABELS[property.status] || { label: property.status, color: "bg-slate-100 text-slate-700" };
  const hasDetails = property.size || property.rooms || property.floor != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Başlık */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-800 text-base leading-tight">{property.title}</h2>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full capitalize">{property.type}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {property.price_type === "kira" ? "Kiralık" : "Satılık"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-3 flex-shrink-0"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* Fotoğraf galerisi */}
          {property.photos && property.photos.length > 0 && (
            <PhotoGallery photos={property.photos} />
          )}

          {/* Konum */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={15} className="text-slate-400 flex-shrink-0" />
            <span>{[property.neighborhood, property.district, property.city].filter(Boolean).join(", ")}</span>
          </div>

          {/* Fiyat */}
          {property.price && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-0.5">Fiyat</p>
              <p className="text-2xl font-bold text-slate-800">{property.price.toLocaleString("tr-TR")} ₺</p>
            </div>
          )}

          {/* m² / Oda / Kat */}
          {hasDetails && (
            <div className="grid grid-cols-3 gap-2">
              {property.size && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Alan</p>
                  <p className="font-semibold text-slate-700">{property.size} m²</p>
                </div>
              )}
              {property.rooms && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Oda</p>
                  <p className="font-semibold text-slate-700">{property.rooms}</p>
                </div>
              )}
              {property.floor != null && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Kat</p>
                  <p className="font-semibold text-slate-700">{property.floor}{property.total_floors ? `/${property.total_floors}` : ""}</p>
                </div>
              )}
            </div>
          )}

          {/* Özellikler */}
          {property.features.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Özellikler</p>
              <div className="flex flex-wrap gap-1.5">
                {property.features.map(f => (
                  <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sahip */}
          {(property.owner_name || property.owner_phone) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Portföy Sahibi</p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                {property.owner_name && <p className="text-sm font-medium text-slate-700">{property.owner_name}</p>}
                {property.owner_phone && (
                  <div className="flex items-center gap-2">
                    <a href={`tel:${property.owner_phone}`} className="text-sm text-slate-600 hover:underline flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" /> {property.owner_phone}
                    </a>
                    <a
                      href={`https://wa.me/${property.owner_phone.replace(/\D/g, "").replace(/^0/, "90")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Konum haritası */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Konum</p>
            <PropertyLocationMap property={property} />
          </div>

          {/* Açıklama */}
          {property.description && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Açıklama</p>
              <p className="text-sm text-slate-600 leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Ham metin */}
          {property.raw_text && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Ham Metin</p>
              <pre className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed">{property.raw_text}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Sil
          </button>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Pencil size={14} /> Düzenle
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Satış Modalı ────────────────────────────────────────────────────────────
function SaleModal({ property, onClose, onConfirm }: {
  property: Property;
  onClose: () => void;
  onConfirm: (propertyId: number) => void;
}) {
  const [buyers, setBuyers] = useState<Client[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [selectedId, setSelectedId] = useState<number | "custom" | null>(null);
  const [customName, setCustomName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleError, setSaleError] = useState("");

  useEffect(() => {
    Promise.all([clientStore.getAll(), matchStore.getAll()]).then(([clients, matches]) => {
      const b = clients.filter(c => c.intent === "aliyor" || c.intent === "kiraciyor");
      setBuyers(b);
      const ids = new Set(matches.filter(m => m.property_id === property.id).map(m => m.client_id));
      setMatchedIds(ids);
      const firstMatch = b.find(c => ids.has(c.id));
      if (firstMatch) setSelectedId(firstMatch.id);
      else if (b.length === 0) setSelectedId("custom");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [property.id]);

  async function handleConfirm() {
    if (!selectedId) return;
    setSaving(true);
    setSaleError("");
    try {
      let buyerName: string;
      let buyerPhone: string | undefined;
      let buyerId: number | undefined;
      if (selectedId === "custom") {
        buyerName = customName.trim();
        buyerPhone = customPhone.trim() || undefined;
      } else {
        const b = buyers.find(x => x.id === selectedId)!;
        buyerName = b.name;
        buyerPhone = b.phone;
        buyerId = b.id;
      }
      if (!buyerName) return;
      await saleStore.add({ property_data: property, buyer_name: buyerName, buyer_phone: buyerPhone, buyer_id: buyerId });
      await matchStore.deleteByProperty(property.id);
      await propertyStore.delete(property.id);
      onConfirm(property.id);
    } catch (err) {
      setSaleError(
        err instanceof Error
          ? err.message
          : "Supabase'de 'sales' tablosu bulunamadı. Dashboard'dan oluşturmanız gerekiyor."
      );
    } finally {
      setSaving(false);
    }
  }

  const matched = buyers.filter(b => matchedIds.has(b.id));
  const others = buyers.filter(b => !matchedIds.has(b.id));
  const canConfirm = selectedId === "custom" ? customName.trim().length > 0 : selectedId !== null;

  const BuyerRow = ({ b, isMatch }: { b: Client; isMatch: boolean }) => (
    <div
      onClick={() => setSelectedId(b.id)}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
        selectedId === b.id
          ? "bg-amber-50 border-amber-400"
          : "bg-white border-slate-200 hover:border-amber-300"
      }`}
    >
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
        selectedId === b.id ? "border-amber-500 bg-amber-500" : "border-slate-300"
      }`}>
        {selectedId === b.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800 text-sm">{b.name}</span>
          {isMatch && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Star size={9} /> Eşleşti
            </span>
          )}
        </div>
        {b.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={10} /> {b.phone}</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Satışı Tamamla</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{property.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-4">Yükleniyor...</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600">Alıcıyı Seçin</p>

              {matched.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-amber-600 uppercase">Eşleşen Alıcılar</p>
                  {matched.map(b => <BuyerRow key={b.id} b={b} isMatch />)}
                </div>
              )}

              {others.length > 0 && (
                <div className="space-y-2">
                  {matched.length > 0 && <p className="text-xs font-semibold text-slate-400 uppercase">Diğer Alıcılar</p>}
                  {others.map(b => <BuyerRow key={b.id} b={b} isMatch={false} />)}
                </div>
              )}

              {buyers.length === 0 && selectedId !== "custom" && (
                <p className="text-xs text-slate-400 text-center py-2">Kayıtlı alıcı bulunamadı.</p>
              )}

              {/* Kayıtsız alıcı seçeneği */}
              <div
                onClick={() => setSelectedId("custom")}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                  selectedId === "custom"
                    ? "bg-amber-50 border-amber-400"
                    : "bg-white border-dashed border-slate-300 hover:border-amber-300"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  selectedId === "custom" ? "border-amber-500 bg-amber-500" : "border-slate-300"
                }`}>
                  {selectedId === "custom" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-sm text-slate-600">Alıcı kayıtlı değil / farklı kişi</span>
              </div>

              {selectedId === "custom" && (
                <div className="space-y-2 pl-1">
                  <input
                    placeholder="Alıcı adı soyadı *"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    placeholder="Telefon (opsiyonel)"
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {saleError && (
          <div className="mx-5 mb-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <strong>Hata:</strong> {saleError}
            {saleError.includes("sales") && (
              <p className="mt-1 text-red-600">Supabase Dashboard → SQL Editor'da <code>sales</code> tablosunu oluşturun.</p>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">İptal</button>
          <button
            onClick={handleConfirm}
            disabled={saving || !canConfirm}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            {saving ? "Kaydediliyor..." : "Satışı Tamamla"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY });
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [viewing, setViewing] = useState<Property | null>(null);
  const [selling, setSelling] = useState<Property | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Property | null>(null);
  const [importResult, setImportResult] = useState<{ added: number; dup: number; skipped: number } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const excelFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    propertyStore.getAll().then(data => {
      setProperties(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Dinamik seçenekler
  const ALL_TYPES = ["bina", "daire", "depo", "dükkan", "müstakil ev", "ofis", "tarla", "villa", "arsa"];
  const options = useMemo(() => {
    const districts = [...new Set(properties.map(p => p.district).filter(Boolean))].sort() as string[];
    const rooms = [...new Set(properties.map(p => p.rooms).filter(Boolean))].sort() as string[];
    return { types: ALL_TYPES, districts, rooms };
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

  async function deleteProperty(id: number) {
    await propertyStore.delete(id);
    setProperties(prev => prev.filter(p => p.id !== id));
    setViewing(null);
    setConfirmDelete(null);
  }

  function handleSaveEdit(updated: Property) {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditing(null);
  }

  async function handleExcelImport(file: File) {
    setImportLoading(true);
    try {
      const { rows, skippedCount } = await parsePropertyExcel(file);
      const { toAdd, dupCount } = filterDuplicates(rows, properties);
      if (toAdd.length > 0) {
        const added = await propertyStore.addMany(toAdd);
        setProperties(prev => [...added, ...prev]);
      }
      setImportResult({ added: toAdd.length, dup: dupCount, skipped: skippedCount });
    } catch {
      alert("Excel dosyası okunamadı. Lütfen şablonu kullanın.");
    } finally {
      setImportLoading(false);
      if (excelFileRef.current) excelFileRef.current.value = "";
    }
  }

  return (
    <div>
      {editing && <EditModal property={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />}
      {selling && (
        <SaleModal
          property={selling}
          onClose={() => setSelling(null)}
          onConfirm={(id) => { setProperties(prev => prev.filter(p => p.id !== id)); setSelling(null); }}
        />
      )}
      {showExcelModal && <ExcelTemplateModal onClose={() => setShowExcelModal(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          message={`"${confirmDelete.title}" portföyünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          onConfirm={() => deleteProperty(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {viewing && (
        <DetailModal
          property={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onDelete={() => { setViewing(null); setConfirmDelete(viewing); }}
        />
      )}
      {/* Başlık */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Home size={24} className="text-amber-500" /> Portföy
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? "Yükleniyor..." : `${filtered.length} / ${properties.length} gayrimenkul`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet size={15} /> Excel Şablonu
          </button>
          <button
            onClick={() => excelFileRef.current?.click()}
            disabled={importLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {importLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Excel'den Aktar
          </button>
          <a href="add-property" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Portföy Ekle
          </a>
        </div>
      </div>

      <input
        ref={excelFileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleExcelImport(e.target.files[0]); }}
      />

      {importResult && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
          <div className="text-sm text-green-800">
            <span className="font-semibold">{importResult.added} portföy eklendi.</span>
            {importResult.dup > 0 && <span className="ml-2 text-slate-500">{importResult.dup} mükerrer atlandı.</span>}
            {importResult.skipped > 0 && <span className="ml-2 text-slate-500">{importResult.skipped} eksik satır atlandı.</span>}
          </div>
          <button onClick={() => setImportResult(null)} className="text-green-600 hover:text-green-800 flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

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
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <p>Veriler yükleniyor...</p>
        </div>
      ) : filtered.length === 0 ? (
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
              <div key={p.id} onClick={() => setViewing(p)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800 text-sm leading-tight">{p.title}</h3>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); setSelling(p); }} title="Satışı tamamla" className="text-slate-300 hover:text-green-600 transition-colors">
                      <CheckCircle2 size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditing(p); }} className="text-slate-300 hover:text-amber-500 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(p); }} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full capitalize">{p.type}</span>
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
