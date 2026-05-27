"use client";
import { useEffect, useMemo, useState } from "react";
import { BarChart2, TrendingUp, Building2, Users, BadgeCheck, Banknote, CheckCircle2, Clock, AlertTriangle, MapPin, PieChart } from "lucide-react";
import { propertyStore, clientStore, saleStore, type Property, type Sale, type Client } from "@/lib/storage";

function fmt(n: number) { return n.toLocaleString("tr-TR"); }
function fmtM(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(n); }

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
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-slate-600 truncate text-right flex-shrink-0">{label}</div>
      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-10 text-xs font-semibold text-slate-700 text-right flex-shrink-0">{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([propertyStore.getAll(), saleStore.getAll(), clientStore.getAll()])
      .then(([props, sls, cls]) => { setProperties(props); setSales(sls); setClients(cls); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = properties.filter(p => p.status === "musait");
    const stale = active.filter(p => Math.floor((now - new Date(p.created_at).getTime()) / 86400000) >= 30);
    const totalValue = active.reduce((s, p) => s + (p.price ?? 0), 0);
    const totalCommission = sales.reduce((s, x) => s + (x.buyer_commission ?? 0) + (x.seller_commission ?? 0), 0);
    const collectedCommission = sales.reduce((s, x) => s + x.buyer_commission_paid + x.seller_commission_paid, 0);
    const pendingCommission = totalCommission - collectedCommission;
    const totalSaleValue = sales.reduce((s, x) => s + (x.property_data.price ?? 0), 0);

    // İlçe bazında portföy
    const byDistrict: Record<string, number> = {};
    for (const p of properties) {
      const d = p.district || "Belirtilmemiş";
      byDistrict[d] = (byDistrict[d] ?? 0) + 1;
    }

    // Mülk tipine göre portföy
    const byType: Record<string, number> = {};
    for (const p of properties) {
      byType[p.type] = (byType[p.type] ?? 0) + 1;
    }

    // Duruma göre portföy
    const byStatus = {
      musait:  properties.filter(p => p.status === "musait").length,
      rezerve: properties.filter(p => p.status === "rezerve").length,
      kiralik: properties.filter(p => p.status === "kiralik").length,
      satildi: properties.filter(p => p.status === "satildi").length,
    };

    // Aylık satışlar (son 6 ay)
    const monthSales: Record<string, { count: number; value: number; commission: number }> = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    for (const s of sales) {
      const d = new Date(s.sold_at);
      if (d < sixMonthsAgo) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthSales[key]) monthSales[key] = { count: 0, value: 0, commission: 0 };
      monthSales[key].count++;
      monthSales[key].value += s.property_data.price ?? 0;
      monthSales[key].commission += (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
    }

    const months = Object.entries(monthSales).sort(([a], [b]) => a.localeCompare(b));
    const maxMonthCount = Math.max(1, ...months.map(([, v]) => v.count));

    // Komisyon durumu
    const commFull = sales.filter(s => {
      const total = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
      return total > 0 && s.buyer_commission_paid + s.seller_commission_paid >= total;
    }).length;
    const commPartial = sales.filter(s => {
      const total = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
      const paid = s.buyer_commission_paid + s.seller_commission_paid;
      return total > 0 && paid > 0 && paid < total;
    }).length;
    const commNone = sales.filter(s => {
      const total = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
      return total > 0 && s.buyer_commission_paid + s.seller_commission_paid === 0;
    }).length;

    const activeBuyers = clients.filter(c => c.intent === "aliyor" || c.intent === "kiraciyor").length;
    const pastBuyers = clients.filter(c => c.intent === "satin_aldi").length;

    return {
      active: active.length, stale: stale.length, totalValue, totalCommission, collectedCommission,
      pendingCommission, totalSaleValue, byDistrict, byType, byStatus, months, maxMonthCount,
      commFull, commPartial, commNone, activeBuyers, pastBuyers,
    };
  }, [properties, sales, clients]);

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

  const districtEntries = Object.entries(stats.byDistrict).sort(([, a], [, b]) => b - a).slice(0, 8);
  const typeEntries = Object.entries(stats.byType).sort(([, a], [, b]) => b - a).slice(0, 6);
  const maxDistrict = Math.max(1, ...districtEntries.map(([, v]) => v));
  const maxType = Math.max(1, ...typeEntries.map(([, v]) => v));

  const monthNames: Record<string, string> = {
    "01": "Oca", "02": "Şub", "03": "Mar", "04": "Nis",
    "05": "May", "06": "Haz", "07": "Tem", "08": "Ağu",
    "09": "Eyl", "10": "Eki", "11": "Kas", "12": "Ara",
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200">
            <BarChart2 size={17} className="text-white" />
          </div>
          Raporlar
        </h1>
        <p className="text-slate-500 text-sm mt-1">Portföy, satış ve komisyon istatistikleri</p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Aktif Portföy" value={stats.active}
          sub={`${properties.length} toplam`}
          icon={Building2} gradient="from-amber-400 to-amber-600" />
        <StatCard label="Portföy Değeri"
          value={stats.totalValue > 0 ? `${fmtM(stats.totalValue)} ₺` : "—"}
          sub="müsait portföyler"
          icon={TrendingUp} gradient="from-emerald-400 to-teal-500" />
        <StatCard label="Toplam Satış" value={sales.length}
          sub={stats.totalSaleValue > 0 ? `${fmtM(stats.totalSaleValue)} ₺ ciro` : undefined}
          icon={BadgeCheck} gradient="from-blue-400 to-indigo-500" />
        <StatCard label="Aktif Alıcı" value={stats.activeBuyers}
          sub={`${stats.pastBuyers} geçmiş alıcı`}
          icon={Users} gradient="from-violet-400 to-purple-500" />
      </div>

      {/* Komisyon Özeti */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <Banknote size={14} className="text-blue-600" />
          </div>
          <h2 className="font-semibold text-slate-800 text-sm">Komisyon Durumu</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="px-5 py-4 text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Toplam Hak Edilen</p>
            <p className="text-2xl font-bold text-slate-900">{fmt(stats.totalCommission)} ₺</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase mb-1 flex items-center justify-center gap-1"><CheckCircle2 size={11} /> Tahsil Edilen</p>
            <p className="text-2xl font-bold text-emerald-700">{fmt(stats.collectedCommission)} ₺</p>
            {stats.totalCommission > 0 && (
              <p className="text-xs text-emerald-600 mt-0.5">{Math.round((stats.collectedCommission / stats.totalCommission) * 100)}%</p>
            )}
          </div>
          <div className="px-5 py-4 text-center">
            <p className={`text-xs font-semibold uppercase mb-1 flex items-center justify-center gap-1 ${stats.pendingCommission > 0 ? "text-orange-600" : "text-slate-400"}`}>
              <Clock size={11} /> Bekleyen
            </p>
            <p className={`text-2xl font-bold ${stats.pendingCommission > 0 ? "text-orange-700" : "text-slate-300"}`}>
              {fmt(stats.pendingCommission)} ₺
            </p>
          </div>
        </div>

        {/* Komisyon detay satırları */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">{stats.commFull}</span>
            <span className="text-xs text-emerald-600">tam ödenmiş</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
            <Clock size={14} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{stats.commPartial}</span>
            <span className="text-xs text-amber-600">kısmi ödenmiş</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-sm font-semibold text-red-700">{stats.commNone}</span>
            <span className="text-xs text-red-600">henüz ödenmedi</span>
          </div>
        </div>
      </div>

      {/* Aylık Satışlar */}
      {stats.months.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <BadgeCheck size={14} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">Aylık Satışlar (Son 6 Ay)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40">
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Ay</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Satış Adedi</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Ciro</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Komisyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.months.map(([key, v]) => {
                  const [year, mon] = key.split("-");
                  const label = `${monthNames[mon] ?? mon} ${year}`;
                  return (
                    <tr key={key} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">{label}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(v.count / stats.maxMonthCount) * 100}%` }} />
                          </div>
                          <span className="font-semibold text-slate-800 w-4 text-right">{v.count}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-700">{v.value > 0 ? `${fmtM(v.value)} ₺` : "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold text-blue-700">{v.commission > 0 ? `${fmt(v.commission)} ₺` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portföy Durumu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <PieChart size={14} className="text-amber-600" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">Portföy Durum Dağılımı</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { label: "Müsait",  count: stats.byStatus.musait,  color: "#22c55e" },
              { label: "Rezerve", count: stats.byStatus.rezerve, color: "#f59e0b" },
              { label: "Kiralık", count: stats.byStatus.kiralik, color: "#3b82f6" },
              { label: "Satıldı", count: stats.byStatus.satildi, color: "#ef4444" },
            ].map(({ label, count, color }) => (
              <BarRow key={label} label={label} value={count} max={properties.length || 1} color={color} />
            ))}
          </div>
        </div>

        {/* İlçe Dağılımı */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
              <MapPin size={14} className="text-indigo-600" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">İlçe Bazında Portföy</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {districtEntries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Henüz portföy yok.</p>
            ) : districtEntries.map(([d, count]) => (
              <BarRow key={d} label={d} value={count} max={maxDistrict} color="#6366f1" />
            ))}
          </div>
        </div>

        {/* Mülk Tipi Dağılımı */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-slate-600" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">Mülk Tipi Dağılımı</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {typeEntries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Henüz portföy yok.</p>
            ) : typeEntries.map(([t, count]) => (
              <BarRow key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} value={count} max={maxType} color="#f59e0b" />
            ))}
          </div>
        </div>

        {/* Bekleme süresi */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={14} className="text-orange-600" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">Portföy Sağlığı</h2>
          </div>
          <div className="px-5 py-5 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-xs text-slate-500 mt-1">Müsait portföy</p>
            </div>
            <div className="text-center">
              <p className={`text-3xl font-bold ${stats.stale > 0 ? "text-orange-600" : "text-slate-300"}`}>{stats.stale}</p>
              <p className="text-xs text-slate-500 mt-1">30+ gün bekleyen</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-700">{sales.length}</p>
              <p className="text-xs text-slate-500 mt-1">Toplam satış</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-700">{stats.activeBuyers}</p>
              <p className="text-xs text-slate-500 mt-1">Aktif alıcı</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
