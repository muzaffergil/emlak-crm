"use client";
import { useEffect, useState } from "react";
import { Building2, Users, BadgeCheck, Zap, TrendingUp, Clock, AlertTriangle, MapPin, Phone, Banknote, CheckCircle2, ChevronDown } from "lucide-react";
import { propertyStore, clientStore, matchStore, saleStore, type Property, type Sale } from "@/lib/storage";

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
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
  const [openPanel, setOpenPanel] = useState<"collected" | "pending" | null>(null);

  useEffect(() => {
    Promise.all([
      propertyStore.getAll(),
      clientStore.getAll(),
      matchStore.getAll(),
      saleStore.getAll(),
    ]).then(([props, clients, mts, sls]) => {
      setProperties(props);
      setBuyers(clients.filter(c => c.intent === "aliyor" || c.intent === "kiraciyor" ).length);
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
  const totalCommission = sales.reduce((sum, s) => sum + (s.buyer_commission ?? 0) + (s.seller_commission ?? 0), 0);
  const collectedCommission = sales.reduce((sum, s) => sum + s.buyer_commission_paid + s.seller_commission_paid, 0);
  const pendingCommission = totalCommission - collectedCommission;
  const recentSales = sales.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Genel Bakış</h1>
        <p className="text-slate-500 text-sm mt-1">EstateIQ sisteminin özeti</p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Aktif Portföy" value={active.length}
          sub={`${properties.length} toplam portföy`}
          icon={Building2} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard label="Portföy Değeri"
          value={totalValue > 0 ? `${(totalValue / 1_000_000).toFixed(1)}M ₺` : "—"}
          sub="müsait portföylerin toplamı"
          icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Alıcılar" value={buyers}
          sub={`${sellers} portföy sahibi`}
          icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Aktif Eşleşme" value={matches}
          sub="toplam eşleşme sayısı"
          icon={Zap} iconBg="bg-violet-50" iconColor="text-violet-600" />
        <StatCard label="Gerçekleşen Satış" value={sales.length}
          sub={totalSaleValue > 0 ? `${(totalSaleValue / 1_000_000).toFixed(1)}M ₺ ciro` : undefined}
          icon={BadgeCheck} iconBg="bg-slate-100" iconColor="text-slate-600" />
        <StatCard label="30+ Gün Bekleyen" value={stale.length}
          sub="fiyat güncellemesi gerekebilir"
          icon={AlertTriangle}
          iconBg={stale.length > 0 ? "bg-orange-50" : "bg-slate-100"}
          iconColor={stale.length > 0 ? "text-orange-600" : "text-slate-400"} />
      </div>

      {/* Komisyon özeti */}
      {sales.length > 0 && (() => {
        const collectedSales = sales.filter(s => s.buyer_commission_paid + s.seller_commission_paid > 0);
        const pendingSales = sales.filter(s => {
          const total = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
          return total > 0 && total > s.buyer_commission_paid + s.seller_commission_paid;
        });
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Banknote size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">Komisyon Özeti</h2>
                <p className="text-xs text-slate-500">{sales.length} satış üzerinden hesaplanmıştır</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Toplam */}
              <div className="px-6 py-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Toplam Kazanılan</p>
                <p className="text-2xl font-bold text-slate-900">{totalCommission.toLocaleString("tr-TR")} ₺</p>
                <p className="text-xs text-slate-400 mt-1">{sales.length} satıştan</p>
              </div>

              {/* Tahsil Edilen — tıklanabilir */}
              <button
                onClick={() => setOpenPanel(p => p === "collected" ? null : "collected")}
                className={`px-6 py-5 text-left transition-colors w-full ${openPanel === "collected" ? "bg-emerald-50" : "bg-emerald-50/50 hover:bg-emerald-50"}`}
              >
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={11} /> Tahsil Edilen
                  <ChevronDown size={12} className={`ml-auto transition-transform ${openPanel === "collected" ? "rotate-180" : ""}`} />
                </p>
                <p className="text-2xl font-bold text-emerald-700">{collectedCommission.toLocaleString("tr-TR")} ₺</p>
                <p className="text-xs text-emerald-600 mt-1">{collectedSales.length} satış · detay için tıkla</p>
              </button>

              {/* Bekleyen — tıklanabilir */}
              <button
                onClick={() => setOpenPanel(p => p === "pending" ? null : "pending")}
                className={`px-6 py-5 text-left transition-colors w-full ${openPanel === "pending" ? (pendingCommission > 0 ? "bg-orange-100/60" : "bg-slate-50") : (pendingCommission > 0 ? "bg-orange-50/50 hover:bg-orange-100/60" : "hover:bg-slate-50")}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${pendingCommission > 0 ? "text-orange-600" : "text-slate-400"}`}>
                  Bekleyen
                  <ChevronDown size={12} className={`ml-auto transition-transform ${openPanel === "pending" ? "rotate-180" : ""}`} />
                </p>
                <p className={`text-2xl font-bold ${pendingCommission > 0 ? "text-orange-700" : "text-slate-300"}`}>
                  {pendingCommission.toLocaleString("tr-TR")} ₺
                </p>
                <p className={`text-xs mt-1 ${pendingCommission > 0 ? "text-orange-500" : "text-slate-400"}`}>
                  {pendingSales.length} satış{pendingSales.length > 0 ? " · detay için tıkla" : ""}
                </p>
              </button>
            </div>

            {/* Açılır liste — Tahsil Edilen */}
            {openPanel === "collected" && (
              <div className="border-t border-emerald-100">
                {collectedSales.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Henüz tahsilat yok.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {collectedSales.map(s => {
                      const bPaid = s.buyer_commission_paid;
                      const sPaid = s.seller_commission_paid;
                      return (
                        <div key={s.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{s.property_data.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.buyer_name}</p>
                            <div className="flex gap-3 mt-1 text-xs">
                              {bPaid > 0 && <span className="text-emerald-700 font-medium">Alıcıdan: {bPaid.toLocaleString("tr-TR")} ₺</span>}
                              {sPaid > 0 && <span className="text-emerald-700 font-medium">Satıcıdan: {sPaid.toLocaleString("tr-TR")} ₺</span>}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-emerald-700 flex-shrink-0">
                            {(bPaid + sPaid).toLocaleString("tr-TR")} ₺
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Açılır liste — Bekleyen */}
            {openPanel === "pending" && (
              <div className="border-t border-orange-100">
                {pendingSales.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Bekleyen komisyon yok.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {pendingSales.map(s => {
                      const bTotal = s.buyer_commission ?? 0;
                      const sTotal = s.seller_commission ?? 0;
                      const bPending = Math.max(0, bTotal - s.buyer_commission_paid);
                      const sPending = Math.max(0, sTotal - s.seller_commission_paid);
                      return (
                        <div key={s.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock size={13} className="text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800 truncate">{s.property_data.title}</p>
                              {s.buyer_commission_paid + s.seller_commission_paid === 0 && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">Ödenmedi</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{s.buyer_name}</p>
                            <div className="flex gap-3 mt-1 text-xs">
                              {bPending > 0 && <span className="text-orange-600 font-medium">Alıcıdan: {bPending.toLocaleString("tr-TR")} ₺</span>}
                              {sPending > 0 && <span className="text-orange-600 font-medium">Satıcıdan: {sPending.toLocaleString("tr-TR")} ₺</span>}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-orange-600 flex-shrink-0">
                            {(bPending + sPending).toLocaleString("tr-TR")} ₺
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son satışlar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <BadgeCheck size={14} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">Son Satışlar</h2>
          </div>
          {recentSales.length === 0 ? (
            <div className="py-12 text-center">
              <BadgeCheck size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Henüz satış yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentSales.map(s => (
                <div key={s.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BadgeCheck size={14} className="text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.property_data.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />
                      {[s.property_data.neighborhood, s.property_data.district].filter(Boolean).join(", ")}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold text-emerald-700">
                        {s.property_data.price ? `${s.property_data.price.toLocaleString("tr-TR")} ₺` : "—"}
                      </span>
                      <span className="text-xs text-slate-400">{s.buyer_name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 font-medium">
                    {new Date(s.sold_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 30+ gün bekleyen portföyler */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock size={14} className="text-orange-600" />
              </div>
              <h2 className="font-semibold text-slate-800 text-sm">Uzun Süre Bekleyen</h2>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">30+ gün</span>
          </div>
          {stale.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Tüm portföyler güncel.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stale.slice(0, 5).map(p => {
                const ageDays = Math.floor((now - new Date(p.created_at).getTime()) / 86400000);
                return (
                  <div key={p.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock size={14} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />
                        {[p.neighborhood, p.district].filter(Boolean).join(", ")}
                      </p>
                      {p.price && (
                        <p className="text-xs font-bold text-slate-700 mt-0.5">
                          {p.price.toLocaleString("tr-TR")} ₺
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-orange-600">{ageDays}g</span>
                      {p.owner_phone && (
                        <a href={`tel:${p.owner_phone}`} onClick={e => e.stopPropagation()}
                          className="flex items-center gap-0.5 justify-end text-xs text-slate-400 hover:text-slate-600 mt-0.5">
                          <Phone size={9} /> {p.owner_phone}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {stale.length > 5 && (
                <p className="text-xs text-slate-400 text-center py-3 font-medium">+{stale.length - 5} daha</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
