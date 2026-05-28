"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, Ruler, DoorOpen, Building2, Phone, MessageCircle, Heart, ChevronLeft, ChevronRight, X, CalendarCheck, Loader2, CheckCircle2 } from "lucide-react";
import { propertyStore, agentContactStore, favoriteStore, showingRequestStore, type Property, type AgentContact } from "@/lib/storage";
import { useBuyer } from "@/components/BuyerContext";

function PortfoyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = Number(searchParams.get("id") ?? "0");
  const { user, buyerProfile } = useBuyer();

  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<AgentContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    Promise.all([
      propertyStore.getByIdPublic(id),
      agentContactStore.getFirst(),
    ]).then(([p, a]) => {
      setProperty(p);
      setAgent(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    favoriteStore.getAll().then(ids => setIsFav(ids.includes(id))).catch(() => {});
  }, [user, id]);

  async function toggleFav() {
    if (!user) { router.push("/alici/giris"); return; }
    const nowFav = await favoriteStore.toggle(id).catch(() => isFav);
    setIsFav(nowFav);
  }

  async function sendRequest() {
    if (!user || !buyerProfile) { router.push("/alici/giris"); return; }
    setSending(true);
    await showingRequestStore.create(id, message || undefined).catch(() => {});
    setSending(false);
    setSent(true);
    setTimeout(() => { setSent(false); setShowModal(false); setMessage(""); }, 2500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <Building2 size={40} className="mx-auto text-slate-200 mb-3" />
        <p className="text-slate-500 font-medium">Portföy bulunamadı.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-amber-600 hover:underline">← Geri dön</button>
      </div>
    );
  }

  const photos = property.photos ?? [];
  const location = [property.neighborhood, property.district, property.city].filter(Boolean).join(", ");

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={16} /> Geri
      </button>

      {/* Photo gallery */}
      {photos.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-100" style={{ aspectRatio: "4/3" }}>
          <img src={photos[photoIdx]} alt="" className="w-full h-full object-cover" />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                disabled={photoIdx === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
                disabled={photoIdx === photos.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center disabled:opacity-0 transition-opacity"
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? "bg-white scale-125" : "bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
          <button
            onClick={toggleFav}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
          >
            <Heart size={16} className={isFav ? "text-red-400 fill-red-400" : "text-white/80"} />
          </button>
        </div>
      )}

      {/* Title & location */}
      <div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full capitalize">{property.type}</span>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Müsait</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight mb-2">{property.title}</h1>
        {location && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin size={13} className="text-slate-400" /> {location}
          </p>
        )}
      </div>

      {/* Price */}
      {property.price && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-0.5">Fiyat</p>
          <p className="text-2xl font-bold text-slate-900">
            {property.price.toLocaleString("tr-TR")} ₺
            {property.price_type === "kira" && <span className="text-base font-normal text-slate-400">/ay</span>}
          </p>
        </div>
      )}

      {/* Stats */}
      {(property.size || property.rooms || property.floor != null) && (
        <div className="grid grid-cols-3 gap-3">
          {property.size && (
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <Ruler size={16} className="mx-auto text-slate-400 mb-1" />
              <p className="font-semibold text-slate-800 text-sm">{property.size} m²</p>
              <p className="text-xs text-slate-400">Alan</p>
            </div>
          )}
          {property.rooms && (
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <DoorOpen size={16} className="mx-auto text-slate-400 mb-1" />
              <p className="font-semibold text-slate-800 text-sm">{property.rooms}</p>
              <p className="text-xs text-slate-400">Oda</p>
            </div>
          )}
          {property.floor != null && (
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <Building2 size={16} className="mx-auto text-slate-400 mb-1" />
              <p className="font-semibold text-slate-800 text-sm">{property.floor}{property.total_floors ? `/${property.total_floors}` : ""}</p>
              <p className="text-xs text-slate-400">Kat</p>
            </div>
          )}
        </div>
      )}

      {/* Features */}
      {property.features.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Özellikler</p>
          <div className="flex flex-wrap gap-1.5">
            {property.features.map(f => (
              <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Açıklama</p>
          <p className="text-sm text-slate-600 leading-relaxed">{property.description}</p>
        </div>
      )}

      {/* Agent contact card */}
      {agent && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Danışman</p>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow flex-shrink-0">
              <span className="text-white font-bold text-lg">{(agent.name ?? "E")[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">{agent.name ?? "Emlak Danışmanı"}</p>
              <p className="text-xs text-slate-500">{agent.title}</p>
              {agent.about && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{agent.about}</p>}
            </div>
          </div>
          {agent.phone && (
            <div className="flex gap-2">
              <a href={`tel:${agent.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Phone size={15} /> Ara
              </a>
              <a href={`https://wa.me/${agent.phone.replace(/\D/g, "").replace(/^0/, "90")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 hover:bg-green-600 rounded-xl text-sm text-white font-medium transition-colors">
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      {/* Request showing button */}
      <button
        onClick={() => {
          if (!user || !buyerProfile) { router.push("/alici/giris"); return; }
          setShowModal(true);
        }}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
      >
        <CalendarCheck size={18} /> Gösterim Talep Et
      </button>

      {!user && (
        <p className="text-xs text-slate-400 text-center -mt-2">Gösterim talep etmek için giriş yapmanız gerekir.</p>
      )}

      {/* Showing request modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
                <p className="font-semibold text-slate-800">Talebiniz gönderildi!</p>
                <p className="text-sm text-slate-500 mt-1">Danışman kısa sürede size dönecek.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Gösterim Talep Et</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">{property.title}</p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Mesajınız (isteğe bağlı): ne zaman uygunsunuz, özel sorularınız..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                />
                <button
                  onClick={sendRequest}
                  disabled={sending}
                  className="mt-3 w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
                  Gönder
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortfoyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="text-amber-500 animate-spin" />
      </div>
    }>
      <PortfoyContent />
    </Suspense>
  );
}
