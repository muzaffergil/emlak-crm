"use client";
import { useEffect, useState } from "react";
import {
  BadgeCheck, MapPin, TrendingUp, Phone, Trash2, User,
  X, Ruler, DoorOpen, MessageCircle, Building2,
} from "lucide-react";
import { saleStore, type Sale } from "@/lib/storage";

function SaleModal({ sale, onClose, onDelete }: { sale: Sale; onClose: () => void; onDelete: () => void }) {
  const p = sale.property_data;
  const date = new Date(sale.sold_at).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const location = [p.neighborhood, p.district, p.city].filter(Boolean).join(", ");
  const waPhone = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "90");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <BadgeCheck size={11} /> Satıldı — {date}
              </span>
            </div>
            <h2 className="font-bold text-slate-800 text-base leading-tight">{p.title}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{p.type}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Konum */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={14} className="text-slate-400 flex-shrink-0" />
              {location}
            </div>
          )}

          {/* Fiyat */}
          {p.price && (
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-slate-400 flex-shrink-0" />
              <span className="font-bold text-slate-800 text-lg">{p.price.toLocaleString("tr-TR")} ₺</span>
            </div>
          )}

          {/* m² / Oda / Kat */}
          {(p.size || p.rooms || p.floor != null) && (
            <div className="flex items-center gap-4 text-sm text-slate-600">
              {p.size && (
                <span className="flex items-center gap-1"><Ruler size={13} className="text-slate-400" /> {p.size} m²</span>
              )}
              {p.rooms && (
                <span className="flex items-center gap-1"><DoorOpen size={13} className="text-slate-400" /> {p.rooms}</span>
              )}
              {p.floor != null && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-slate-400" />
                  {p.floor}{p.total_floors ? `/${p.total_floors}` : ""}. kat
                </span>
              )}
            </div>
          )}

          {/* Özellikler */}
          {p.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.features.map(f => (
                <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          )}

          {/* Açıklama */}
          {p.description && (
            <p className="text-sm text-slate-500 leading-relaxed">{p.description}</p>
          )}

          {/* Portföy sahibi */}
          {(p.owner_name || p.owner_phone) && (
            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Portföy Sahibi</p>
              {p.owner_name && <p className="text-sm font-medium text-slate-700">{p.owner_name}</p>}
              {p.owner_phone && (
                <div className="flex items-center gap-2">
                  <a href={`tel:${p.owner_phone}`} className="text-xs text-slate-600 flex items-center gap-1 hover:underline">
                    <Phone size={11} /> {p.owner_phone}
                  </a>
                  <a
                    href={`https://wa.me/${waPhone(p.owner_phone)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full"
                  >
                    <MessageCircle size={10} /> WA
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Alıcı */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-700 uppercase">Alıcı</p>
            <p className="text-sm font-semibold text-slate-800">{sale.buyer_name}</p>
            {sale.buyer_phone && (
              <div className="flex items-center gap-2">
                <a href={`tel:${sale.buyer_phone}`} className="text-xs text-slate-600 flex items-center gap-1 hover:underline">
                  <Phone size={11} /> {sale.buyer_phone}
                </a>
                <a
                  href={`https://wa.me/${waPhone(sale.buyer_phone)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full"
                >
                  <MessageCircle size={10} /> WA
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> Kaydı Sil
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);

  useEffect(() => {
    saleStore.getAll()
      .then(data => { setSales(data); setLoading(false); })
      .catch(() => { setError("Veriler yüklenemedi."); setLoading(false); });
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Bu satış kaydını silmek istediğinizden emin misiniz?")) return;
    await saleStore.delete(id);
    setSales(prev => prev.filter(s => s.id !== id));
    setSelected(null);
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <p>Yükleniyor...</p>
        </div>
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
            const date = new Date(sale.sold_at).toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric",
            });
            return (
              <div
                key={sale.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all"
                onClick={() => setSelected(sale)}
              >
                {/* Satış tarihi */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <BadgeCheck size={11} /> {date}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(sale.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                    title="Kaydı sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Gayrimenkul bilgisi */}
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

                {/* Alıcı bilgisi */}
                <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-medium">Alıcı</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{sale.buyer_name}</p>
                    {sale.buyer_phone && (
                      <a
                        href={`tel:${sale.buyer_phone}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-slate-500 flex items-center gap-1 hover:underline"
                      >
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

      {selected && (
        <SaleModal
          sale={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}
    </div>
  );
}
