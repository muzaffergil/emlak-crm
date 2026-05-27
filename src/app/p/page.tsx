"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, TrendingUp, Ruler, DoorOpen, Phone, MessageCircle, Building2 } from "lucide-react";
import { shareStore, type Property } from "@/lib/storage";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  musait:  { label: "Müsait",  color: "bg-green-100 text-green-800" },
  satildi: { label: "Satıldı", color: "bg-red-100 text-red-800" },
  kiralik: { label: "Kiralık", color: "bg-blue-100 text-blue-800" },
  rezerve: { label: "Rezerve", color: "bg-yellow-100 text-yellow-800" },
};

function ShareContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    shareStore.get(id).then(p => { setProperty(p); setLoading(false); });
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

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 font-medium">Portföy bulunamadı veya link geçersiz.</p>
        </div>
      </div>
    );
  }

  const st = STATUS_LABELS[property.status] ?? { label: property.status, color: "bg-slate-100 text-slate-700" };
  const photos = property.photos ?? [];
  const location = [property.neighborhood, property.district, property.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
          <Building2 size={14} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm">Estate<span className="text-amber-400">IQ</span></span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Fotoğraflar */}
        {photos.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-200" style={{ aspectRatio: "4/3" }}>
            <img src={photos[photoIdx]} alt="" className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? "bg-white scale-125" : "bg-white/60"}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Başlık ve durum */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full capitalize">{property.type}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{property.title}</h1>
          {location && (
            <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
              <MapPin size={13} className="text-slate-400" /> {location}
            </p>
          )}
        </div>

        {/* Fiyat */}
        {property.price && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-0.5">Fiyat</p>
            <div className="flex items-baseline gap-1.5">
              <TrendingUp size={16} className="text-amber-500" />
              <span className="text-2xl font-bold text-slate-900">{property.price.toLocaleString("tr-TR")} ₺</span>
              {property.price_type === "kira" && <span className="text-sm text-slate-400">/ay</span>}
            </div>
          </div>
        )}

        {/* Detaylar */}
        {(property.size || property.rooms || property.floor != null) && (
          <div className="grid grid-cols-3 gap-3">
            {property.size && (
              <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
                <Ruler size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="font-semibold text-slate-800 text-sm">{property.size} m²</p>
              </div>
            )}
            {property.rooms && (
              <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
                <DoorOpen size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="font-semibold text-slate-800 text-sm">{property.rooms}</p>
              </div>
            )}
            {property.floor != null && (
              <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
                <p className="text-xs text-slate-400 mb-0.5">Kat</p>
                <p className="font-semibold text-slate-800 text-sm">{property.floor}{property.total_floors ? `/${property.total_floors}` : ""}</p>
              </div>
            )}
          </div>
        )}

        {/* Özellikler */}
        {property.features.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2.5">Özellikler</p>
            <div className="flex flex-wrap gap-1.5">
              {property.features.map(f => (
                <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Açıklama */}
        {property.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Açıklama</p>
            <p className="text-sm text-slate-600 leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* İletişim */}
        {(property.owner_name || property.owner_phone) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2.5">İletişim</p>
            {property.owner_name && <p className="font-medium text-slate-800 mb-2">{property.owner_name}</p>}
            {property.owner_phone && (
              <div className="flex gap-2">
                <a href={`tel:${property.owner_phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Phone size={15} /> Ara
                </a>
                <a href={`https://wa.me/${property.owner_phone.replace(/\D/g, "").replace(/^0/, "90")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-sm text-white font-medium transition-colors">
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 pb-6">
          <p className="text-xs text-slate-400">EstateIQ ile oluşturuldu</p>
        </div>
      </div>
    </div>
  );
}

export default function PublicSharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Building2 size={32} className="text-amber-500 animate-pulse" />
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
