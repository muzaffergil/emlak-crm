"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, LogIn, Building2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { showingRequestStore, propertyStore, type ShowingRequest, type Property } from "@/lib/storage";
import { useBuyer } from "@/components/BuyerContext";

const STATUS_CONFIG: Record<ShowingRequest["status"], { label: string; color: string; icon: React.ElementType }> = {
  bekliyor: { label: "Bekliyor", color: "bg-amber-100 text-amber-700", icon: Clock },
  onaylandi: { label: "Onaylandı", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  reddedildi: { label: "Reddedildi", color: "bg-red-100 text-red-600", icon: XCircle },
};

interface RequestWithProperty extends ShowingRequest {
  property: Property | null;
}

export default function TaleplerimPage() {
  const { user, loading: authLoading } = useBuyer();
  const [requests, setRequests] = useState<RequestWithProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      showingRequestStore.getByBuyer(),
      propertyStore.getMusait(),
    ]).then(([reqs, props]) => {
      const propMap = new Map(props.map(p => [p.id, p]));
      setRequests(reqs.map(r => ({ ...r, property: propMap.get(r.property_id) ?? null })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="text-center py-20">
        <CalendarCheck size={40} className="mx-auto text-slate-200 mb-3" />
        <p className="text-slate-600 font-medium">Taleplerinizi görmek için giriş yapın</p>
        <Link href="/alici/giris"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors text-sm">
          <LogIn size={15} /> Giriş Yap
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
          <CalendarCheck size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gösterim Taleplerim</h1>
          <p className="text-sm text-slate-500">{requests.length} talep</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Henüz gösterim talebi oluşturmadınız</p>
          <p className="text-sm text-slate-400 mt-1">Portföy sayfasından gösterim talep edebilirsiniz.</p>
          <Link href="/alici" className="inline-flex mt-4 text-sm text-amber-600 hover:underline">Portföylere göz at →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const cfg = STATUS_CONFIG[req.status];
            const StatusIcon = cfg.icon;
            const photos = req.property?.photos ?? [];
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {photos.length > 0
                      ? <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 size={20} className="text-slate-300" /></div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/alici/portfoy?id=${req.property_id}`}>
                      <p className="font-semibold text-slate-800 line-clamp-2 hover:text-amber-600 transition-colors text-sm">
                        {req.property?.title ?? `Portföy #${req.property_id}`}
                      </p>
                    </Link>
                    {req.property && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[req.property.district, req.property.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(req.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>

                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                      <StatusIcon size={11} /> {cfg.label}
                    </span>
                  </div>
                </div>

                {req.message && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 italic">"{req.message}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
