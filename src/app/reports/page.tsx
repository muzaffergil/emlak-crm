"use client";
import { useEffect, useMemo, useState } from "react";
import { BarChart2, TrendingUp, Building2, Users, BadgeCheck, Banknote, CheckCircle2, Clock, AlertTriangle, MapPin, PieChart, Filter, X, Phone } from "lucide-react";
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

const MONTH_NAMES: Record<string, string> = {
  "01": "Oca", "02": "Şub", "03": "Mar", "04": "Nis",
  "05": "May", "06": "Haz", "07": "Tem", "08": "Ağu",
  "09": "Eyl", "10": "Eki", "11": "Kas", "12": "Ara",
};

export default function ReportsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [sales, setSales]           = useState<Sale[]>([]);
  const [clients, setClients]       = useState<Client[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([propertyStore.getAll(), saleStore.getAll(), clientStore.getAll()])
      .then(([props, sls, cls]) => { setProperties(props); setSales(sls); setClients(cls); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Satışlardaki yılları bul
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const s of sales) years.add(new Date(s.sold_at).getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [sales]);

  // Seçilen yıla göre satışları filtrele
  const filteredSales = useMemo(() => {
    if (filterYear === "all") return sales;
    return sales.filter(s => new Date(s.sold_at).getFullYear() === parseInt(filterYear));
  }, [sales, filterYear]);

  const stats = useMemo(() => {
    const now = Date.now();
    const active = properties.filter(p => p.status === "musait");
    const stale  = active.filter(p => Math.floor((now - new Date(p.created_at).getTime()) / 86400000) >= 30);
    const totalValue = active.reduce((s, p) => s + (p.price ?? 0), 0);

    // Satış metrikleri → filtrelenmiş
    const totalCommission     = filteredSales.reduce((s, x) => s + (x.buyer_commission ?? 0) + (x.seller_commission ?? 0), 0);
    const collectedCommission = filteredSales.reduce((s, x) => s + x.buyer_commission_paid + x.seller_commission_paid, 0);
    const pendingCommission   = totalCommission - collectedCommission;
    const totalSaleValue      = filteredSales.reduce((s, x) => s + (x.property_data.price ?? 0), 0);

    // İlçe dağılımı — tüm portföy (filtre etkilemez)
    const byDistrict: Record<string, number> = {};
    for (const p of properties) {
      const d = p.district || "Belirtilmemiş";
      byDistrict[d] = (byDistrict[d] ?? 0) + 1;
    }

    // Tip dağılımı — tüm portföy
    const byType: Record<string, number> = {};
    for (const p of properties) byType[p.type] = (byType[p.type] ?? 0) + 1;

    // Durum dağılımı — tüm portföy
    const byStatus = {
      musait:  properties.filter(p => p.status === "musait").length,
      rezerve: properties.filter(p => p.status === "rezerve").length,
      kiralik: properties.filter(p => p.status === "kiralik").length,
      satildi: properties.filter(p => p.status === "satildi").length,
    };

    // Aylık satışlar — filtrelenmiş
    const monthSales: Record<string, { count: number; value: number; commission: number }> = {};
    if (filterYear === "all") {
      // Tüm zamanlar seçiliyse: son 6 ay
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 5);
      cutoff.setDate(1);
      for (const s of filteredSales) {
        const d = new Date(s.sold_at);
        if (d < cutoff) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthSales[key]) monthSales[key] = { count: 0, value: 0, commission: 0 };
        monthSales[key].count++;
        monthSales[key].value += s.property_data.price ?? 0;
        monthSales[key].commission += (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
      }
    } else {
      // Belirli yıl seçiliyse: o yılın tüm ayları
      for (const s of filteredSales) {
        const d   = new Date(s.sold_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthSales[key]) monthSales[key] = { count: 0, value: 0, commission: 0 };
        monthSales[key].count++;
        monthSales[key].value += s.property_data.price ?? 0;
        monthSales[key].commission += (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
      }
    }
    const months = Object.entries(monthSales).sort(([a], [b]) => a.localeCompare(b));
    const maxMonthCount = Math.max(1, ...months.map(([, v]) => v.count));

    // Komisyon durumu — filtrelenmiş
    const commFull    = filteredSales.filter(s => { const t = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0); return t > 0 && s.buyer_commission_paid + s.seller_commission_paid >= t; }).length;
    const commPartial = filteredSales.filter(s => { const t = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0); const p = s.buyer_commission_paid + s.seller_commission_paid; return t > 0 && p > 0 && p < t; }).length;
    const commNone    = filteredSales.filter(s => { const t = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0); return t > 0 && s.buyer_commission_paid + s.seller_commission_paid === 0; }).length;

    const activeBuyers = clients.filter(c => c.intent === "aliyor" || c.intent === "kiraciyor").length;
    const pastBuyers   = clients.filter(c => c.intent === "satin_aldi").length;

    return {
      active: active.length, stale: stale.length, totalValue, totalCommission, collectedCommission,
      pendingCommission, totalSaleValue, byDistrict, byType, byStatus, months, maxMonthCount,
      commFull, commPartial, commNone, activeBuyers, pastBuyers,
    };
  }, [properties, filteredSales, clients, filterYear]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  const districtEntries = Object.entries(stats.byDistrict).sort(([, a], [, b]) => b - a);
  const typeEntries     = Object.entries(stats.byType).sort(([, a], [, b]) => b - a);
  const maxDistrict     = Math.max(1, ...districtEntries.map(([, v]) => v));
  const maxType         = Math.max(1, ...typeEntries.map(([, v]) => v));

  const monthTitle = filterYear === "all" ? "Son 6 Ay" : filterYear;

  return (
    <div className="space-y-6">
      {/* Başlık + Filtre */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200">
                <BarChart2 size={17} className="text-white" />
              </div>
              Raporlar
            </h1>
            <p className="text-slate-500 text-sm mt-1">Portföy, satış ve komisyon istatistikleri</p>
          </div>

          {/* Yıl Filtresi */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="text-sm text-slate-700 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Tüm Zamanlar</option>
              {availableYears.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Aktif filtre etiketi */}
        {filterYear !== "all" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2.5 py-1 rounded-full">
              {filterYear} yılı gösteriliyor
            </span>
            <button
              onClick={() => setFilterYear("all")}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Temizle ✕
            </button>
          </div>
        )}
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
        <StatCard label="Toplam Satış" value={filteredSales.length}
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
          {filterYear !== "all" && <span className="ml-auto text-xs text-slate-400">{filterYear}</span>}
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

      {/* Aylık Satışlar — max yükseklik + scroll */}
      {stats.months.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <BadgeCheck size={14} className="text-emerald-600" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">Aylık Satışlar ({monthTitle})</h2>
          </div>
          {/* max-h + overflow-y: tabloda çok satır olursa scroll */}
          <div className="overflow-auto max-h-72">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Ay</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Satış Adedi</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Ciro</th>
                  <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Komisyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.months.map(([key, v]) => {
                  const [year, mon] = key.split("-");
                  const label = `${MONTH_NAMES[mon] ?? mon} ${year}`;
                  return (
                    <tr key={key} onClick={() => setSelectedMonthKey(key)} className="hover:bg-emerald-50/60 cursor-pointer transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700 flex items-center gap-1.5">{label} <span className="text-[10px] text-slate-400">(detay)</span></td>
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

        {/* İlçe Dağılımı — scroll */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center justify-between gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MapPin size={14} className="text-indigo-600" />
              </div>
              <h2 className="font-semibold text-slate-800 text-sm">İlçe Bazında Portföy</h2>
            </div>
            {districtEntries.length > 5 && (
              <span className="text-xs text-slate-400">{districtEntries.length} ilçe</span>
            )}
          </div>
          {/* max-h-56: 5 satır görünür, fazlası scroll ile */}
          <div className="px-5 py-4 space-y-3 max-h-56 overflow-y-auto">
            {districtEntries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Henüz portföy yok.</p>
            ) : districtEntries.map(([d, count]) => (
              <BarRow key={d} label={d} value={count} max={maxDistrict} color="#6366f1" />
            ))}
          </div>
        </div>

        {/* Mülk Tipi Dağılımı — scroll */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
          <div className="flex items-center justify-between gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                <Building2 size={14} className="text-slate-600" />
              </div>
              <h2 className="font-semibold text-slate-800 text-sm">Mülk Tipi Dağılımı</h2>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3 max-h-56 overflow-y-auto">
            {typeEntries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Henüz portföy yok.</p>
            ) : typeEntries.map(([t, count]) => (
              <BarRow key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} value={count} max={maxType} color="#f59e0b" />
            ))}
          </div>
        </div>

        {/* Portföy Sağlığı */}
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
              <p className="text-3xl font-bold text-blue-700">{filteredSales.length}</p>
              <p className="text-xs text-slate-500 mt-1">{filterYear === "all" ? "Toplam satış" : `${filterYear} satışları`}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-700">{stats.activeBuyers}</p>
              <p className="text-xs text-slate-500 mt-1">Aktif alıcı</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ay Detay Modalı */}
      {selectedMonthKey && (() => {
        const [yr, mn] = selectedMonthKey.split("-");
        const monthLabel = `${MONTH_NAMES[mn] ?? mn} ${yr}`;
        const monthlySales = filteredSales.filter(s => s.sold_at.startsWith(selectedMonthKey));
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={() => setSelectedMonthKey(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <BadgeCheck size={15} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{monthLabel} Satışları</h3>
                    <p className="text-xs text-slate-400">{monthlySales.length} satış</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMonthKey(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Liste */}
              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {monthlySales.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Bu ay satış kaydı yok.</p>
                ) : monthlySales.map(s => {
                  const total = (s.buyer_commission ?? 0) + (s.seller_commission ?? 0);
                  const paid  = s.buyer_commission_paid + s.seller_commission_paid;
                  const payStatus = total === 0 ? null
                    : paid >= total ? "full"
                    : paid > 0     ? "partial"
                    : "none";

                  return (
                    <div key={s.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2.5">
                      {/* Portföy başlığı */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm leading-snug">
                          {s.property_data.title || s.property_data.type}
                        </p>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(s.sold_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>

                      {/* Alıcı */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Users size={11} className="text-slate-400" />
                        <span className="font-medium">{s.buyer_name}</span>
                        {s.buyer_phone && (
                          <>
                            <Phone size={10} className="text-slate-400 ml-1" />
                            <span className="text-slate-500">{s.buyer_phone}</span>
                          </>
                        )}
                      </div>

                      {/* Fiyat + Komisyon */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded-lg px-2.5 py-2 border border-slate-100 text-center">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Satış Fiyatı</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">
                            {s.property_data.price ? `${fmtM(s.property_data.price)} ₺` : "—"}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg px-2.5 py-2 border border-slate-100 text-center">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Alıcı Kom.</p>
                          <p className="text-sm font-bold text-blue-700 mt-0.5">
                            {s.buyer_commission ? `${fmt(s.buyer_commission)} ₺` : "—"}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg px-2.5 py-2 border border-slate-100 text-center">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">Satıcı Kom.</p>
                          <p className="text-sm font-bold text-indigo-700 mt-0.5">
                            {s.seller_commission ? `${fmt(s.seller_commission)} ₺` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Ödeme Durumu */}
                      {payStatus && (
                        <div className="flex items-center gap-2">
                          {payStatus === "full" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={11} /> Komisyon Ödendi
                            </span>
                          )}
                          {payStatus === "partial" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                              <Clock size={11} /> Kısmi Ödeme ({fmt(paid)} / {fmt(total)} ₺)
                            </span>
                          )}
                          {payStatus === "none" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                              <AlertTriangle size={11} /> Henüz Ödenmedi
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
