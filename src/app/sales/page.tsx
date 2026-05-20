"use client";
import { useEffect, useState } from "react";
import { BadgeCheck, MapPin, TrendingUp, Phone, Trash2, User } from "lucide-react";
import { saleStore, type Sale } from "@/lib/storage";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    saleStore.getAll()
      .then(data => { setSales(data); setLoading(false); })
      .catch(() => { setError("Veriler yüklenemedi."); setLoading(false); });
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Bu satış kaydını silmek istediğinizden emin misiniz?")) return;
    await saleStore.delete(id);
    setSales(prev => prev.filter(s => s.id !== id));
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
              <div key={sale.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                {/* Satış tarihi */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <BadgeCheck size={11} /> {date}
                  </span>
                  <button
                    onClick={() => handleDelete(sale.id)}
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
                      <a href={`tel:${sale.buyer_phone}`} className="text-xs text-slate-500 flex items-center gap-1 hover:underline">
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
    </div>
  );
}
