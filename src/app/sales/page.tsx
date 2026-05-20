"use client";
import { useEffect, useState } from "react";
import {
  BadgeCheck, MapPin, TrendingUp, Phone, Trash2, User,
  X, Ruler, DoorOpen, MessageCircle, Building2, Pencil, RotateCcw, Save,
} from "lucide-react";
import { saleStore, propertyStore, type Sale } from "@/lib/storage";
import ConfirmDialog from "@/components/ConfirmDialog";

// ── Düzenleme Modalı ──────────────────────────────────────────────────────────
function EditSaleModal({ sale, onClose, onSaved }: {
  sale: Sale;
  onClose: () => void;
  onSaved: (updated: Sale) => void;
}) {
  const p = sale.property_data;
  const [price, setPrice] = useState(p.price != null ? String(p.price) : "");
  const [buyerName, setBuyerName] = useState(sale.buyer_name);
  const [buyerPhone, setBuyerPhone] = useState(sale.buyer_phone ?? "");
  const [soldAt, setSoldAt] = useState(sale.sold_at.slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!buyerName.trim()) { setError("Alıcı adı boş bırakılamaz."); return; }
    setSaving(true);
    setError("");
    try {
      const updatedProperty = { ...p, price: price ? Number(price) : undefined };
      const payload = {
        property_data: updatedProperty,
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim() || undefined,
        sold_at: soldAt ? new Date(soldAt).toISOString() : sale.sold_at,
      };
      await saleStore.update(sale.id, payload);
      onSaved({ ...sale, ...payload, property_data: updatedProperty });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kayıt güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300";
  const lbl = "text-xs font-semibold text-slate-500 block mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 text-sm">Satış Kaydını Düzenle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className={lbl}>Satış Fiyatı (₺)</label>
            <input className={inp} type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Fiyat giriniz" />
          </div>
          <div>
            <label className={lbl}>Satış Tarihi</label>
            <input className={inp} type="date" value={soldAt} onChange={e => setSoldAt(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Alıcı Adı</label>
            <input className={inp} value={buyerName} onChange={e => setBuyerName(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Alıcı Telefonu</label>
            <input className={inp} value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="05xx xxx xx xx" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg">İptal</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
          >
            <Save size={14} /> {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detay Modalı ──────────────────────────────────────────────────────────────
function SaleModal({ sale, onClose, onDelete, onEdit, onReturn }: {
  sale: Sale;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onReturn: () => void;
}) {
  const p = sale.property_data;
  const date = new Date(sale.sold_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const location = [p.neighborhood, p.district, p.city].filter(Boolean).join(", ");
  const waPhone = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "90");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Başlık */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-3">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mb-1">
              <BadgeCheck size={11} /> Satıldı — {date}
            </span>
            <h2 className="font-bold text-slate-800 text-base leading-tight">{p.title}</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize mt-1 inline-block">{p.type}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={14} className="text-slate-400 flex-shrink-0" />{location}
            </div>
          )}
          {p.price && (
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-400" />
              <span className="font-bold text-slate-800 text-lg">{p.price.toLocaleString("tr-TR")} ₺</span>
            </div>
          )}
          {(p.size || p.rooms || p.floor != null) && (
            <div className="flex items-center gap-4 text-sm text-slate-600">
              {p.size && <span className="flex items-center gap-1"><Ruler size={13} className="text-slate-400" /> {p.size} m²</span>}
              {p.rooms && <span className="flex items-center gap-1"><DoorOpen size={13} className="text-slate-400" /> {p.rooms}</span>}
              {p.floor != null && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-slate-400" />
                  {p.floor}{p.total_floors ? `/${p.total_floors}` : ""}. kat
                </span>
              )}
            </div>
          )}
          {p.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.features.map(f => (
                <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          )}
          {p.description && <p className="text-sm text-slate-500 leading-relaxed">{p.description}</p>}

          {(p.owner_name || p.owner_phone) && (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Portföy Sahibi</p>
              {p.owner_name && <p className="text-sm font-medium text-slate-700">{p.owner_name}</p>}
              {p.owner_phone && (
                <div className="flex items-center gap-2">
                  <a href={`tel:${p.owner_phone}`} className="text-xs text-slate-600 flex items-center gap-1 hover:underline"><Phone size={11} /> {p.owner_phone}</a>
                  <a href={`https://wa.me/${waPhone(p.owner_phone)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full"><MessageCircle size={10} /> WA</a>
                </div>
              )}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-700 uppercase">Alıcı</p>
            <p className="text-sm font-semibold text-slate-800">{sale.buyer_name}</p>
            {sale.buyer_phone && (
              <div className="flex items-center gap-2">
                <a href={`tel:${sale.buyer_phone}`} className="text-xs text-slate-600 flex items-center gap-1 hover:underline"><Phone size={11} /> {sale.buyer_phone}</a>
                <a href={`https://wa.me/${waPhone(sale.buyer_phone)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full"><MessageCircle size={10} /> WA</a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <Pencil size={14} /> Düzenle
            </button>
            <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} /> Kaydı Sil
            </button>
            <button onClick={onClose} className="ml-auto px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Kapat</button>
          </div>
          <button
            onClick={onReturn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 text-sm rounded-xl transition-colors"
          >
            <RotateCcw size={14} /> Satış İptal — Portföye Geri Al
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [editing, setEditing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Sale | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<Sale | null>(null);

  useEffect(() => {
    saleStore.getAll()
      .then(data => { setSales(data); setLoading(false); })
      .catch(() => { setError("Veriler yüklenemedi."); setLoading(false); });
  }, []);

  async function handleDelete(id: number) {
    await saleStore.delete(id);
    setSales(prev => prev.filter(s => s.id !== id));
    setSelected(null);
    setConfirmDelete(null);
  }

  async function handleReturn(sale: Sale) {
    setReturning(true);
    try {
      const { id: _id, created_at: _ca, ...rest } = sale.property_data as Sale["property_data"] & { created_at: string };
      await propertyStore.add({ ...rest, status: "musait" });
      await saleStore.delete(sale.id);
      setSales(prev => prev.filter(s => s.id !== sale.id));
      setSelected(null);
      setConfirmReturn(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "İşlem başarısız.");
    } finally {
      setReturning(false);
    }
  }

  function handleSaved(updated: Sale) {
    setSales(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelected(updated);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BadgeCheck size={24} className="text-green-600" /> Gerçekleşen Satışlar
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? "Yükleniyor..." : `${sales.length} tamamlanmış satış`}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400"><p>Yükleniyor...</p></div>
      ) : sales.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BadgeCheck size={48} className="mx-auto mb-3 opacity-20" />
          <p>Henüz tamamlanmış satış yok.</p>
          <p className="text-sm mt-1">Portföy kartındaki ✓ simgesiyle satış kaydı oluşturun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sales.map(sale => {
            const p = sale.property_data;
            const date = new Date(sale.sold_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
            return (
              <div
                key={sale.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all"
                onClick={() => { setSelected(sale); setEditing(false); }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <BadgeCheck size={11} /> {date}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(sale); }}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="Kaydı sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{p.title}</h3>
                <div className="space-y-1 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-slate-400" />
                    {[p.neighborhood, p.district, p.city].filter(Boolean).join(", ")}
                  </div>
                  {p.price && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">{p.price.toLocaleString("tr-TR")} ₺</span>
                      <span className="capitalize text-slate-400 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{p.type}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Alıcı</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{sale.buyer_name}</p>
                    {sale.buyer_phone && (
                      <a href={`tel:${sale.buyer_phone}`} onClick={e => e.stopPropagation()} className="text-xs text-slate-500 flex items-center gap-1 hover:underline">
                        <Phone size={10} /> {sale.buyer_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && !editing && (
        <SaleModal
          sale={selected}
          onClose={() => setSelected(null)}
          onDelete={() => { setSelected(null); setConfirmDelete(selected); }}
          onEdit={() => setEditing(true)}
          onReturn={() => { setSelected(null); setConfirmReturn(selected); }}
        />
      )}

      {selected && editing && (
        <EditSaleModal
          sale={selected}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`"${confirmDelete.property_data.title}" satış kaydını silmek istediğinizden emin misiniz?`}
          confirmLabel="Evet, Sil"
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmReturn && (
        <ConfirmDialog
          message={`Satış iptal edilecek ve "${confirmReturn.property_data.title}" portföye "Müsait" statüsüyle geri eklenecek. Emin misiniz?`}
          confirmLabel="Evet, Geri Al"
          cancelLabel="Hayır, İptal"
          danger={false}
          onConfirm={() => !returning && handleReturn(confirmReturn)}
          onCancel={() => setConfirmReturn(null)}
        />
      )}
    </div>
  );
}
