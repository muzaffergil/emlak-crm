"use client";
import { useEffect, useState } from "react";
import { Building2, Users, BadgeCheck, Zap, TrendingUp, Clock, AlertTriangle, MapPin, Phone } from "lucide-react";
import { propertyStore, clientStore, matchStore, saleStore, type Property, type Sale } from "@/lib/storage";

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [buyers, setBuyers] = useState(0);
  const [matches, setMatches] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      propertyStore.getAll(),
      clientStore.getAll(),
      matchStore.getAll(),
      saleStore.getAll(),
    ]).then(([props, clients, mts, sls]) => {
      setProperties(props);
      setBuyers(clients.filter(c => c.intent === "aliyor" || c.intent === "kiraciyor").length);
      setMatches(mts.length);
      setSales(sls);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const active = properties.filter(p => p.status === "musait");
  const totalValue = active.reduce((sum, p) => sum + (p.price ?? 0), 0);
  const sellers = new Set(properties.map(p => p.owner_name).filter(Boolean)).size;
  const now = Date.now();
  const stale = active.filter(p => Math.floor((now - new Date(p.created_at).getTime()) / 86400000) >= 30);
  const totalSaleValue = sales.reduce((sum, s) => sum + (s.property_data.price ?? 0), 0);
  const recentSales = sales.slice(0, 5);

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Genel Bakış</h1>
        <p className="text-slate-500 text-sm mt-0.5">Tüm sistemin özeti</p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Aktif Portföy"
          value={active.length}
          sub={`${properties.length} toplam`}
          icon={Building2}
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          label="Toplam Portföy Değeri"
          value={totalValue > 0 ? `${(totalValue / 1_000_000).toFixed(1)}M ₺` : "—"}
          sub="aktif müsait portföyler"
          icon={TrendingUp}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="Alıcı"
          value={buyers}
          sub={`${sellers} satıcı`}
          icon={Users}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Eşleşme"
          value={matches}
          sub="toplam aktif eşleşme"
          icon={Zap}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          label="Gerçekleşen Satış"
          value={sales.length}
          sub={totalSaleValue > 0 ? `${(totalSaleValue / 1_000_000).toFixed(1)}M ₺ toplam` : undefined}
          icon={BadgeCheck}
          color="bg-slate-100 text-slate-700"
        />
        <StatCard
          label="Bekleyen Portföy (30g+)"
          value={stale.length}
          sub="fiyat güncellemesi gerekebilir"
          icon={AlertTriangle}
          color={stale.length > 0 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son satışlar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <BadgeCheck size={16} className="text-green-600" /> Son Satışlar
            </h2>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Henüz satış yok.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BadgeCheck size={14} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.property_data.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> {[s.property_data.neighborhood, s.property_data.district].filter(Boolean).join(", ")}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-semibold text-green-700">
                        {s.property_data.price ? `${s.property_data.price.toLocaleString("tr-TR")} ₺` : "—"}
                      </span>
                      <span className="text-xs text-slate-400">{s.buyer_name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(s.sold_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 30+ gün bekleyen portföyler */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-orange-500" /> Uzun Süre Bekleyen
            </h2>
            <span className="text-xs text-slate-400">30+ gün</span>
          </div>
          {stale.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Tüm portföyler güncel.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stale.slice(0, 5).map(p => {
                const ageDays = Math.floor((now - new Date(p.created_at).getTime()) / 86400000);
                return (
                  <div key={p.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock size={14} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={10} /> {[p.neighborhood, p.district].filter(Boolean).join(", ")}
                      </p>
                      {p.price && (
                        <span className="text-xs font-semibold text-slate-700">
                          {p.price.toLocaleString("tr-TR")} ₺
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600">{ageDays}g</span>
                      {p.owner_phone && (
                        <a href={`tel:${p.owner_phone}`} onClick={e => e.stopPropagation()}
                          className="block text-xs text-slate-400 hover:text-slate-600 mt-0.5 flex items-center gap-0.5 justify-end">
                          <Phone size={9} /> {p.owner_phone}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {stale.length > 5 && (
                <p className="text-xs text-slate-400 text-center py-2">+{stale.length - 5} daha</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
