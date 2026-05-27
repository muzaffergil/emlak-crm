"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, TrendingUp, Ruler, DoorOpen, Building2, Heart, X as XIcon, CalendarDays, CheckCircle2 } from "lucide-react";
import { portalStore, type ClientPortal, type Property, type PortalFeedback } from "@/lib/storage";

const REACTIONS: { key: PortalFeedback["reaction"]; label: string; icon: React.ReactNode; color: string; active: string }[] = [
  { key: "ilgi",     label: "İlgileniyorum",     icon: <Heart size={14} />,         color: "border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50",  active: "border-green-500 bg-green-50 text-green-700" },
  { key: "ilgisiz",  label: "İlgilenmiyorum",     icon: <XIcon size={14} />,         color: "border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50",    active: "border-red-500 bg-red-50 text-red-700" },
  { key: "gosterim", label: "Gösterim İstiyorum", icon: <CalendarDays size={14} />, color: "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50",   active: "border-blue-500 bg-blue-50 text-blue-700" },
];

function PropertyCard({ property, portalId }: { property: Property; portalId: string }) {
  const [reaction, setReaction] = useState<PortalFeedback["reaction"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const location = [property.neighborhood, property.district, property.city].filter(Boolean).join(", ");

  async function react(key: PortalFeedback["reaction"]) {
    if (saving) return;
    setSaving(true);
    await portalStore.addFeedback(portalId, property.id, key);
    setReaction(key);
    setSaved(true);
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {property.photos && property.photos.length > 0 && (
        <img src={property.photos[0]} alt="" className="w-full h-44 object-cover" />
      )}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-slate-900 leading-tight">{property.title}</h3>
          {location && (
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin size={11} /> {location}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          {property.price && (
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <TrendingUp size={12} className="text-amber-500" />
              {property.price.toLocaleString("tr-TR")} ₺{property.price_type === "kira" ? "/ay" : ""}
            </span>
          )}
          {property.size && <span className="flex items-center gap-1"><Ruler size={11} /> {property.size} m²</span>}
          {property.rooms && <span className="flex items-center gap-1"><DoorOpen size={11} /> {property.rooms}</span>}
        </div>

        {property.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.features.slice(0, 4).map(f => (
              <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{f}</span>
            ))}
            {property.features.length > 4 && <span className="text-xs text-slate-400">+{property.features.length - 4}</span>}
          </div>
        )}

        {saved ? (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 px-3 py-2 rounded-xl">
            <CheckCircle2 size={15} /> Geri bildiriminiz alındı!
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-slate-400 font-medium">Tepkiniz nedir?</p>
            <div className="flex gap-1.5">
              {REACTIONS.map(r => (
                <button
                  key={r.key}
                  onClick={() => react(r.key)}
                  disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all ${reaction === r.key ? r.active : r.color}`}
                >
                  {r.icon} <span className="hidden sm:inline">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PortalContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    portalStore.get(id).then(p => { setPortal(p); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 size={22} className="text-white" />
          </div>
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-600 font-medium">Portal bulunamadı veya link geçersiz.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
          <Building2 size={14} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm">Estate<span className="text-amber-400">IQ</span></span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Hoşgeldin */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Merhaba {portal.client_name}!</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sizin için <span className="font-semibold text-amber-600">{portal.matched_properties.length} portföy</span> seçildi.
            Her biri için tepkinizi paylaşın.
          </p>
        </div>

        <div className="space-y-4">
          {portal.matched_properties.map(p => (
            <PropertyCard key={p.id} property={p} portalId={portal.id} />
          ))}
        </div>

        <div className="text-center mt-8 pb-8">
          <p className="text-xs text-slate-400">EstateIQ ile oluşturuldu</p>
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Building2 size={32} className="text-amber-500 animate-pulse" />
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
