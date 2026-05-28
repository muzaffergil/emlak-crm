"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users, BadgeCheck, Zap, TrendingUp, Clock, AlertTriangle, MapPin, Banknote, CheckCircle2, ChevronDown, BarChart2, Phone, LayoutDashboard, CalendarCheck, ThumbsUp, ThumbsDown } from "lucide-react";
import { propertyStore, clientStore, matchStore, saleStore, activityStore, showingRequestStore, type Property, type Sale, type Client, type ShowingRequestWithDetails } from "@/lib/storage";

function StatCard({ label, value, sub, icon: Icon, gradient }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] p-4 flex items-start gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient} shadow-sm`}>
        <Icon size={19} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{sub}</p>}
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
  const [needFollowUp, setNeedFollowUp] = useState<Client[]>([]);
  const [showingRequests, setShowingRequests] = useState<ShowingRequestWithDetails[]>([]);

  useEffect(() => {
    Promise.all([
      propertyStore.getAll(),
      clientStore.getAll(),
      matchStore.getAll(),
      saleStore.getAll(),
      showingRequestStore.getAllWithDetails().catch(() => [] as ShowingRequestWithDetails[]),
    ]).then(([props, cls, mts, sls, reqs]) => {
      setProperties(props);
      const activeClients = cls.filter(c => c.intent === "aliyor" || c.intent === "kiraciyor");
      setBuyers(activeClients.length);
      setMatches(mts.length);
      setSales(sls);
      setShowingRequests(reqs);
      setLoading(false);
      const activeIds = activeClients.map(c => c.id);
      activityStore.getLastByClients(activeIds).then(lastMap => {
        const staleClients = activeClients.filter(c => {
          const last = lastMap[c.id];
          if (!last) return true;
          return (Date.now() - new Date(last).getTime()) > 30 * 86400000;
        });
        setNeedFollowUp(staleClients.slice(0, 5));
      }).catch(() => {});
    }).catch(() => setLoading(false));
  }, []);

  async function updateRequestStatus(id: number, status: "onaylandi" | "reddedildi") {
    await showingRequestStore.updateStatus(id, status).catch(() => {});
    setShowingRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const now = Date.now();
  const active = properties.filter(p => p.status === "musait");
  const totalValue = active.reduce((s, p) => s + (p.price ?? 0), 0);
  const sellers = new Set(properties.map(p => p.owner_name).filter(Boolean)).size;
  const stale = active.filter(p => Math.floor((now - new Date(p.created_at).getTime()) / 86400000) >= 30);
  const totalSaleValue = sales.reduce((s, x) => s + (x.property_data.price ?? 0), 0);
  const totalCommission = sales.reduce((s, x) => s + (x.buyer_commission ?? 0) + (x.seller_commission ?? 0), 0);
  const collectedCommission = sales.reduce((s, x) => s + x.buyer_commission_paid + x.seller_commission_paid, 0);
  const pendingCommission = totalCommission - collectedCommission;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-start gap-3.5 border border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded-full animate-pulse w-2/3" />
                <div className="h-5 bg-slate-100 rounded-full animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const collectedSales = sales.filter(s => s.buyer_commission_paid + s.seller_commission_paid > 0);
  const pendingSales = sales.filter(s => {
    const total = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
    return total > 0 && total > s.buyer_commission_paid + s.seller_commission_paid;
  });
  const recentSales = sales.slice(0, 5);
  const staleTop = stale.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200">
              <LayoutDashboard size={17} className="text-white" />
            </div>
            Genel Bakış
          </h1>
          <p className="text-slate-500 text-sm mt-1">Güncel sistem özeti</p>
        </div>
        <Link href="/reports" className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-semibold bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl transition-colors border border-violet-100">
          <BarChart2 size={14} /> Detaylı Rapor
        </Link>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Aktif Portföy" value={active.length}
          sub={`${properties.length} toplam · ${sellers} sahip`}
          icon={Building2} gradient="from-amber-400 to-amber-600" />
        <StatCard label="Portföy Değeri"
          value={totalValue > 0 ? `${(totalValue / 1_000_000).toFixed(1)}M ₺` : "—"}
          sub="müsait portföylerin toplamı"
          icon={TrendingUp} gradient="from-emerald-400 to-teal-500" />
        <StatCard label="Alıcılar" value={buyers}
          sub="aktif alıcı / kiracı"
          icon={Users} gradient="from-blue-400 to-indigo-500" />
        <StatCard label="Aktif Eşleşme" value={matches}
          sub="toplam eşleşme sayısı"
          icon={Zap} gradient="from-violet-400 to-purple-500" />
        <StatCard label="Gerçekleşen Satış" value={sales.length}
          sub={totalSaleValue > 0 ? `${(totalSaleValue / 1_000_000).toFixed(1)}M ₺ ciro` : undefined}
          icon={BadgeCheck} gradient="from-slate-500 to-slate-600" />
        <StatCard label="30+ Gün Bekleyen" value={stale.length}
          sub="fiyat güncellemesi gerekebilir"
          icon={AlertTriangle}
          gradient={stale.length > 0 ? "from-orange-400 to-red-500" : "from-slate-400 to-slate-500"} />
      </div>

      {/* Komisyon özeti */}
      {sales.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Banknote size={14} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">Komisyon Özeti</h2>
              <p className="text-xs text-slate-500">{sales.length} satış</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="px-4 py-4 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Toplam</p>
              <p className="text-lg font-bold text-slate-900">{totalCommission.toLocaleString("tr-TR")} ₺</p>
            </div>

            <button
              onClick={() => setOpenPanel(p => p === "collected" ? null : "collected")}
              className={`px-4 py-4 text-center transition-colors ${openPanel === "collected" ? "bg-emerald-50" : "hover:bg-emerald-50/50"}`}
            >
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-1 flex items-center justify-center gap-1">
                <CheckCircle2 size={10} /> Tahsil
                <ChevronDown size={11} className={`ml-0.5 transition-transform ${openPanel === "collected" ? "rotate-180" : ""}`} />
              </p>
              <p className="text-lg font-bold text-emerald-700">{collectedCommission.toLocaleString("tr-TR")} ₺</p>
              <p className="text-xs text-emerald-600">{collectedSales.length} satış</p>
            </button>

            <button
              onClick={() => setOpenPanel(p => p === "pending" ? null : "pending")}
              className={`px-4 py-4 text-center transition-colors ${openPanel === "pending" ? (pendingCommission > 0 ? "bg-orange-50" : "bg-slate-50") : (pendingCommission > 0 ? "hover:bg-orange-50/50" : "hover:bg-slate-50")}`}
            >
              <p className={`text-xs font-semibold uppercase mb-1 flex items-center justify-center gap-1 ${pendingCommission > 0 ? "text-orange-600" : "text-slate-400"}`}>
                Bekleyen
                <ChevronDown size={11} className={`ml-0.5 transition-transform ${openPanel === "pending" ? "rotate-180" : ""}`} />
              </p>
              <p className={`text-lg font-bold ${pendingCommission > 0 ? "text-orange-700" : "text-slate-300"}`}>
                {pendingCommission.toLocaleString("tr-TR")} ₺
              </p>
              <p className={`text-xs ${pendingCommission > 0 ? "text-orange-500" : "text-slate-400"}`}>{pendingSales.length} satış</p>
            </button>
          </div>

          {openPanel === "collected" && (
            <div className="border-t border-emerald-100 divide-y divide-slate-50">
              {collectedSales.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Henüz tahsilat yok.</p>
              ) : collectedSales.map(s => {
                const paid = s.buyer_commission_paid + s.seller_commission_paid;
                return (
                  <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50">
                    <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.property_data.title}</p>
                      <p className="text-xs text-slate-400">{s.buyer_name}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 flex-shrink-0">{paid.toLocaleString("tr-TR")} ₺</span>
                  </div>
                );
              })}
            </div>
          )}

          {openPanel === "pending" && (
            <div className="border-t border-orange-100 divide-y divide-slate-50">
              {pendingSales.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Bekleyen komisyon yok.</p>
              ) : pendingSales.map(s => {
                const bPending = Math.max(0, (s.buyer_commission ?? 0) - s.buyer_commission_paid);
                const sPending = Math.max(0, (s.seller_commission ?? 0) - s.seller_commission_paid);
                return (
                  <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50">
                    <Clock size={14} className="text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{s.property_data.title}</p>
                        {s.buyer_commission_paid + s.seller_commission_paid === 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">Ödenmedi</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{s.buyer_name}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-600 flex-shrink-0">{(bPending + sPending).toLocaleString("tr-TR")} ₺</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Son satışlar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <BadgeCheck size={15} className="text-emerald-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Son Satışlar</h2>
            </div>
            <Link href="/sales" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Tümü →</Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">Henüz satış yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentSales.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BadgeCheck size={13} className="text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.property_data.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={9} /> {[s.property_data.neighborhood, s.property_data.district].filter(Boolean).join(", ")}
                      <span className="mx-1">·</span>{s.buyer_name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.property_data.price && <p className="text-xs font-bold text-emerald-700">{(s.property_data.price / 1_000_000).toFixed(1)}M ₺</p>}
                    <p className="text-xs text-slate-400">{new Date(s.sold_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uzun süre bekleyen */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-orange-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Uzun Süre Bekleyen</h2>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">30+ gün</span>
            </div>
            <Link href="/" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Portföy →</Link>
          </div>
          {staleTop.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={28} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Tüm portföyler güncel.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {staleTop.map(p => {
                const ageDays = Math.floor((now - new Date(p.created_at).getTime()) / 86400000);
                return (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50">
                    <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock size={13} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400">{[p.neighborhood, p.district].filter(Boolean).join(", ")} {p.price ? `· ${(p.price / 1_000_000).toFixed(1)}M ₺` : ""}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold text-orange-600">{ageDays}g</span>
                      {p.owner_phone && (
                        <a href={`tel:${p.owner_phone}`} className="flex items-center justify-end gap-0.5 text-xs text-slate-400 hover:text-slate-600 mt-0.5">
                          <Phone size={9} /> ara
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {stale.length > 4 && (
                <p className="text-xs text-slate-400 text-center py-2.5 font-medium">+{stale.length - 4} daha</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gösterim Talepleri */}
      {showingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-violet-50/60">
            <div className="flex items-center gap-2">
              <CalendarCheck size={15} className="text-violet-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Gösterim Talepleri</h2>
              {showingRequests.filter(r => r.status === "bekliyor").length > 0 && (
                <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                  {showingRequests.filter(r => r.status === "bekliyor").length} bekliyor
                </span>
              )}
            </div>
            <Link href="/alici" className="text-xs text-violet-600 hover:text-violet-700 font-medium">Portal →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {showingRequests.slice(0, 8).map(req => (
              <div key={req.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  req.status === "bekliyor" ? "bg-amber-100" : req.status === "onaylandi" ? "bg-green-100" : "bg-slate-100"
                }`}>
                  <CalendarCheck size={13} className={
                    req.status === "bekliyor" ? "text-amber-600" : req.status === "onaylandi" ? "text-green-600" : "text-slate-400"
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{req.property_title}</p>
                  <p className="text-xs text-slate-400">{req.buyer_name} · {new Date(req.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</p>
                </div>
                {req.status === "bekliyor" ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => updateRequestStatus(req.id, "onaylandi")}
                      title="Onayla"
                      className="w-7 h-7 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button
                      onClick={() => updateRequestStatus(req.id, "reddedildi")}
                      title="Reddet"
                      className="w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >
                      <ThumbsDown size={12} />
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    req.status === "onaylandi" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                  }`}>
                    {req.status === "onaylandi" ? "Onaylandı" : "Reddedildi"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Takip gereken alıcılar */}
      {needFollowUp.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-red-50/60">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Takip Gerekiyor</h2>
              <span className="text-xs font-medium text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">30+ gün iletişim yok</span>
            </div>
            <Link href="/clients" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Müşteriler →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {needFollowUp.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50">
                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-xs">{c.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                  {c.phone && <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={9} />{c.phone}</p>}
                </div>
                {c.phone && (
                  <a href={`https://wa.me/${c.phone.replace(/\D/g, "").replace(/^0/, "90")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors flex-shrink-0">
                    <Phone size={10} /> WA
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
