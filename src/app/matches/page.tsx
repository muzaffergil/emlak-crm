"use client";
import { useEffect, useState } from "react";
import { Zap, RefreshCw, MapPin, X, Home, Ruler, BedDouble, Building2, Tag, FileText, Phone, MessageCircle, Link, Loader2, ChevronRight, Users } from "lucide-react";
import { clientStore, propertyStore, matchStore, portalStore, type Match, type Property } from "@/lib/storage";
import { computeMatches } from "@/lib/claude";
import { Toast } from "@/components/Toast";

interface RichMatch extends Match {
  client_name: string;
  client_phone?: string;
  client_budget_min?: number;
  client_budget_max?: number;
  client_size_min?: number;
  client_size_max?: number;
  client_rooms?: string[];
  client_property_types: string[];
  property_title: string;
  property_city: string;
  property_district?: string;
  price?: number;
  price_type?: string;
  size?: number;
  rooms?: string;
  property?: Property;
}

const TYPE_LABELS: Record<string, string> = {
  daire: "Daire", villa: "Villa", arsa: "Arsa", dükkan: "Dükkan",
  ofis: "Ofis", depo: "Depo", bina: "Bina",
};

function buildClientMessage(
  property: Property,
  clientName: string,
  score: number,
  reasons: string[]
): string {
  const loc = [property.neighborhood, property.district, property.city].filter(Boolean).join(", ");
  const priceStr = property.price
    ? `${property.price.toLocaleString("tr-TR")} ₺${property.price_type === "kira" ? "/ay" : ""}`
    : "";
  const sizeStr = [property.size && `${property.size}m²`, property.rooms].filter(Boolean).join(" • ");
  const topReasons = reasons.slice(0, 4).map(r => `✓ ${r}`).join("\n");

  return [
    `Merhaba ${clientName}!`,
    ``,
    `Size uygun bir portföy var 🏠`,
    ``,
    `📍 ${property.title}`,
    loc ? `🗺️ ${loc}` : null,
    priceStr ? `💰 ${priceStr}` : null,
    sizeStr ? `📐 ${sizeStr}` : null,
    `⭐ Uyum Puanı: ${score}/100`,
    ``,
    topReasons,
    ``,
    `Görmek ister misiniz?`,
  ].filter(s => s !== null).join("\n");
}

function PropertyModal({
  property, reasons, clientName, clientPhone, score,
  clientBudgetMin, clientBudgetMax, clientSizeMin, clientSizeMax, clientRooms,
  onClose,
}: {
  property: Property;
  reasons: string[];
  clientName: string;
  clientPhone?: string;
  score: number;
  clientBudgetMin?: number;
  clientBudgetMax?: number;
  clientSizeMin?: number;
  clientSizeMax?: number;
  clientRooms?: string[];
  onClose: () => void;
}) {
  const hasClientPrefs = clientBudgetMin || clientBudgetMax || clientSizeMin || clientSizeMax || (clientRooms?.length ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="font-bold text-slate-800 text-base leading-snug">{property.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{[property.district, property.neighborhood, property.city].filter(Boolean).join(" / ")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Müşteri + Sahip bilgisi */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-800 font-bold text-xs">{clientName.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-amber-600 font-medium">Müşteri</p>
                <p className="font-semibold text-amber-900 text-sm truncate">{clientName}</p>
                {clientPhone && <p className="text-xs text-amber-700 flex items-center gap-1"><Phone size={10} />{clientPhone}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-600 font-bold text-xs">{property.owner_name?.charAt(0) ?? "?"}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">Sahibi</p>
                <p className="font-semibold text-slate-800 text-sm truncate">{property.owner_name || "—"}</p>
                {property.owner_phone && <p className="text-xs text-slate-600 flex items-center gap-1"><Phone size={10} />{property.owner_phone}</p>}
              </div>
            </div>
          </div>

          {/* Müşteri tercihleri özeti */}
          {hasClientPrefs && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Müşteri Tercihleri</p>
              <div className="flex flex-wrap gap-1.5">
                {(clientBudgetMin || clientBudgetMax) && (
                  <span className="bg-white border border-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full">
                    💰 {clientBudgetMin ? `${clientBudgetMin.toLocaleString("tr-TR")} – ` : "max "}{clientBudgetMax?.toLocaleString("tr-TR")} ₺
                  </span>
                )}
                {(clientSizeMin || clientSizeMax) && (
                  <span className="bg-white border border-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full">
                    📐 {clientSizeMin ?? "?"} – {clientSizeMax ?? "?"} m²
                  </span>
                )}
                {clientRooms?.map(r => (
                  <span key={r} className="bg-white border border-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Fiyat + Temel bilgiler */}
          <div className="grid grid-cols-2 gap-3">
            {property.price && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-medium mb-0.5">Fiyat</p>
                <p className="font-bold text-amber-800 text-sm">
                  {property.price.toLocaleString("tr-TR")} ₺{property.price_type === "kira" ? "/ay" : ""}
                </p>
              </div>
            )}
            {property.size && (
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                <Ruler size={15} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Alan</p>
                  <p className="font-semibold text-slate-700 text-sm">{property.size} m²</p>
                </div>
              </div>
            )}
            {property.rooms && (
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                <BedDouble size={15} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Oda</p>
                  <p className="font-semibold text-slate-700 text-sm">{property.rooms}</p>
                </div>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
              <Home size={15} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Tip</p>
                <p className="font-semibold text-slate-700 text-sm">{TYPE_LABELS[property.type] || property.type}</p>
              </div>
            </div>
            {(property.floor || property.total_floors) && (
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                <Building2 size={15} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Kat</p>
                  <p className="font-semibold text-slate-700 text-sm">
                    {property.floor}{property.total_floors ? `/${property.total_floors}` : ""}
                  </p>
                </div>
              </div>
            )}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
              <Tag size={15} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Durum</p>
                <p className="font-semibold text-slate-700 text-sm capitalize">
                  {property.price_type === "kira" ? "Kiralık" : "Satılık"}
                </p>
              </div>
            </div>
          </div>

          {/* Özellikler */}
          {property.features.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Özellikler</p>
              <div className="flex flex-wrap gap-1.5">
                {property.features.map((f) => (
                  <span key={f} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Eşleşme nedenleri */}
          {reasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Eşleşme Nedenleri</p>
              <div className="flex flex-wrap gap-1.5">
                {reasons.map((r, i) => (
                  <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Ham metin / açıklama */}
          {(property.description || property.raw_text) && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1"><FileText size={11} /> Açıklama</p>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                {property.raw_text || property.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer: WhatsApp + Sahibi Ara + Kapat */}
        <div className="flex flex-wrap gap-2 p-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
          {clientPhone && (
            <a
              href={`https://wa.me/${clientPhone.replace(/\D/g, "").replace(/^0/, "90")}?text=${encodeURIComponent(buildClientMessage(property, clientName, score, reasons))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <MessageCircle size={14} /> Müşteriye Yaz
            </a>
          )}
          {property.owner_phone && (
            <a
              href={`tel:${property.owner_phone}`}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-100 active:scale-[0.98] transition-all"
            >
              <Phone size={14} /> Sahibi Ara
            </a>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<RichMatch[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<RichMatch | null>(null);
  const [portalLoading, setPortalLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadMatches() {
    const [rawMatches, clients, properties] = await Promise.all([
      matchStore.getAll(),
      clientStore.getAll(),
      propertyStore.getAll(),
    ]);
    const rich: RichMatch[] = rawMatches.map((m) => {
      const c = clients.find((x) => x.id === m.client_id);
      const p = properties.find((x) => x.id === m.property_id);
      return {
        ...m,
        client_name: c?.name || "Bilinmiyor",
        client_phone: c?.phone,
        client_budget_min: c?.budget_min,
        client_budget_max: c?.budget_max,
        client_size_min: c?.size_min,
        client_size_max: c?.size_max,
        client_rooms: c?.rooms ?? [],
        client_property_types: c?.property_types ?? [],
        property_title: p?.title || "Bilinmiyor",
        property_city: p?.city || "",
        property_district: p?.district,
        price: p?.price,
        price_type: p?.price_type,
        size: p?.size,
        rooms: p?.rooms,
        property: p,
      };
    });
    setMatches(rich.sort((a, b) => b.score - a.score));
  }

  useEffect(() => { runMatch(); }, []);

  async function runMatch() {
    setRunning(true);
    setError("");
    try {
      const [clients, properties] = await Promise.all([
        clientStore.getAll(),
        propertyStore.getAll(),
      ]);
      const availableProps = properties.filter((p) => p.status === "musait");
      if (clients.length === 0 || availableProps.length === 0) {
        setLastRun("Eşleştirilecek müşteri veya portföy yok");
        setRunning(false);
        return;
      }
      let total = 0;
      for (const c of clients) {
        await matchStore.deleteByClient(c.id);
        // Sadece alıcı ve kiracıları eşleştir
        if (c.intent !== "aliyor" && c.intent !== "kiraciyor") continue;
        const clientNameNorm = c.name.trim().toLowerCase();
        // Müşterinin kendi portföylerini çıkar
        const filteredProps = availableProps.filter((p) => {
          if (p.owner_name && p.owner_name.trim().toLowerCase() === clientNameNorm) return false;
          if (p.title.trim().toLowerCase().startsWith(clientNameNorm)) return false;
          return true;
        });
        const results = computeMatches(
          {
            id: c.id,
            intent: c.intent,
            property_types: c.property_types,
            cities: c.cities,
            districts: c.districts,
            neighborhoods: c.neighborhoods ?? [],
            budget_min: c.budget_min,
            budget_max: c.budget_max,
            size_min: c.size_min,
            size_max: c.size_max,
            rooms: c.rooms,
            features_wanted: c.features_wanted,
          },
          filteredProps.map((p) => ({
            id: p.id,
            type: p.type,
            city: p.city,
            district: p.district,
            neighborhood: p.neighborhood,
            price: p.price,
            price_type: p.price_type,
            size: p.size,
            rooms: p.rooms,
            features: p.features,
            title: p.title,
          }))
        );
        const matchesToInsert = results.map(r => ({
          client_id: c.id,
          property_id: r.property_id,
          score: r.score,
          reasons: r.reasons,
        }));
        if (matchesToInsert.length > 0) {
          await matchStore.insertMany(matchesToInsert);
        }
        total += results.length;
      }
      setLastRun(`${total} eşleşme bulundu`);
      await loadMatches();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata oluştu");
    } finally {
      setRunning(false);
    }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-600 bg-green-50" :
    s >= 60 ? "text-amber-600 bg-amber-50" :
    "text-slate-600 bg-slate-100";

  // Portföy odaklı gruplama — en çok müşteri eşleşen mülk en üstte
  const groupedByProperty = (() => {
    const map = new Map<number, { property: Property; matches: RichMatch[] }>();
    matches.forEach(m => {
      if (!m.property) return;
      if (!map.has(m.property_id)) map.set(m.property_id, { property: m.property, matches: [] });
      map.get(m.property_id)!.matches.push(m);
    });
    return [...map.values()].sort((a, b) => b.matches.length - a.matches.length);
  })();

  async function createPortalLink(propMatches: RichMatch[]) {
    const first = propMatches[0];
    if (!first) return;
    const key = `prop-${first.property_id}`;
    setPortalLoading(key);
    try {
      const props = propMatches.map(m => m.property).filter(Boolean) as Property[];
      const id = await portalStore.create(first.client_name, first.client_phone, props);
      const base = window.location.origin + (process.env.NEXT_PUBLIC_BASE_PATH || "");
      const url = `${base}/portal?id=${id}`;
      await navigator.clipboard.writeText(url);
      setToast("Portal linki kopyalandı!");
    } catch {
      setToast("Portal oluşturulamadı.");
    } finally {
      setPortalLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <div className="border-b border-slate-200 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-200">
            <Zap size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Eşleşmeler</h1>
            <p className="text-slate-500 text-sm mt-0.5">{matches.length} toplam eşleşme</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && <span className="text-sm text-emerald-600 font-medium">{lastRun}</span>}
          <button onClick={() => runMatch()} disabled={running}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-amber-200 transition-all flex items-center gap-2 disabled:opacity-50">
            <RefreshCw size={15} className={running ? "animate-spin" : ""} />
            {running ? "Eşleştiriliyor..." : "Eşleştir"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Zap size={36} className="text-violet-400" />
          </div>
          <p className="font-semibold text-slate-600 text-lg mb-1">Henüz eşleşme yok</p>
          <p className="text-sm text-center max-w-xs">Müşteri ve portföy ekledikten sonra &quot;Eşleştir&quot; butonuna tıklayın.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByProperty.map(({ property, matches: propMatches }) => {
            const topScore = Math.max(...propMatches.map(m => m.score));
            const portalKey = `prop-${property.id}`;
            return (
              <div key={property.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Portföy başlığı */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 text-sm leading-snug">{property.title}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                        <MapPin size={10} className="flex-shrink-0" />
                        <span>{[property.district, property.city].filter(Boolean).join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => createPortalLink(propMatches)}
                        disabled={portalLoading === portalKey}
                        title="Müşteri portali oluştur"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {portalLoading === portalKey ? <Loader2 size={11} className="animate-spin" /> : <Link size={11} />}
                        Portal
                      </button>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                        <Users size={11} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">{propMatches.length} alıcı</span>
                      </div>
                    </div>
                  </div>

                  {/* Portföy detayları */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {property.price && (
                      <span className="font-bold text-amber-600 text-sm">
                        {property.price.toLocaleString("tr-TR")} ₺{property.price_type === "kira" ? "/ay" : ""}
                      </span>
                    )}
                    {property.price && (property.type || property.rooms || property.size) && <span className="text-slate-300">·</span>}
                    {property.type && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded capitalize">{property.type}</span>}
                    {property.rooms && <span className="text-xs text-slate-500">{property.rooms}</span>}
                    {property.size && <span className="text-xs text-slate-500">{property.size} m²</span>}
                    <div className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-lg ${scoreColor(topScore)}`}>
                      En yüksek: %{topScore}
                    </div>
                  </div>
                </div>

                {/* Eşleşen müşteriler */}
                <div className="divide-y divide-slate-50">
                  {propMatches.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/40 transition-colors">
                      {/* Skor badge */}
                      <div className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg min-w-[42px] text-center ${scoreColor(m.score)}`}>
                        %{m.score}
                      </div>

                      {/* Müşteri bilgisi */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{m.client_name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                          {m.client_budget_max && (
                            <span>B: {m.client_budget_max.toLocaleString("tr-TR")} ₺</span>
                          )}
                          {m.client_rooms && m.client_rooms.length > 0 && (
                            <span>{m.client_rooms.join(", ")}</span>
                          )}
                          {m.reasons.length > 0 && (
                            <span className="text-emerald-600 truncate max-w-[120px]">{m.reasons[0]}</span>
                          )}
                        </div>
                      </div>

                      {/* Aksiyonlar */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {m.client_phone && (
                          <>
                            <a href={`tel:${m.client_phone}`} onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-100 text-slate-500 hover:text-green-600 transition-colors" title="Ara">
                              <Phone size={13} />
                            </a>
                            <a href={`https://wa.me/${m.client_phone.replace(/\D/g, "").replace(/^0/, "90")}?text=${encodeURIComponent(buildClientMessage(property, m.client_name, m.score, m.reasons))}`}
                              target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-green-100 text-slate-500 hover:text-green-600 transition-colors" title="WhatsApp">
                              <MessageCircle size={13} />
                            </a>
                          </>
                        )}
                        <button onClick={() => setSelected(m)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Detay">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected?.property && (
        <PropertyModal
          property={selected.property}
          reasons={selected.reasons}
          score={selected.score}
          clientName={selected.client_name}
          clientPhone={selected.client_phone}
          clientBudgetMin={selected.client_budget_min}
          clientBudgetMax={selected.client_budget_max}
          clientSizeMin={selected.client_size_min}
          clientSizeMax={selected.client_size_max}
          clientRooms={selected.client_rooms}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
