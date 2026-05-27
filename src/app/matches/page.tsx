"use client";
import { useEffect, useState } from "react";
import { Zap, RefreshCw, Star, MapPin, TrendingUp, X, Home, Ruler, BedDouble, Building2, Tag, FileText, Phone, MessageCircle, Link, Loader2 } from "lucide-react";
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

  const grouped = matches.reduce<Record<string, RichMatch[]>>((acc, m) => {
    if (!acc[m.client_name]) acc[m.client_name] = [];
    acc[m.client_name].push(m);
    return acc;
  }, {});

  async function createPortalLink(clientMatches: RichMatch[]) {
    const first = clientMatches[0];
    if (!first) return;
    const key = first.client_name;
    setPortalLoading(key);
    try {
      const props = clientMatches.map(m => m.property).filter(Boolean) as Property[];
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
        <div className="space-y-5">
          {Object.entries(grouped).map(([clientName, clientMatches]) => (
            <div key={clientName} className="bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
              <div className="bg-slate-50/60 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-700 font-bold text-sm">{clientName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{clientName}</h3>
                    {clientMatches[0]?.client_phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={10} />{clientMatches[0].client_phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => createPortalLink(clientMatches)}
                    disabled={portalLoading === clientName}
                    title="Müşteri portali oluştur ve linki kopyala"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {portalLoading === clientName ? <Loader2 size={12} className="animate-spin" /> : <Link size={12} />}
                    Portal
                  </button>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{clientMatches.length} eşleşme</span>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {clientMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-amber-50/50 transition-colors text-left group"
                  >
                    <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-bold flex-shrink-0 ${scoreColor(m.score)}`}>
                      <Star size={11} /> {m.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{m.property_title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin size={10} />{[m.property_district, m.property_city].filter(Boolean).join(", ")}</span>
                        {m.price && <span className="flex items-center gap-1 font-medium text-slate-600"><TrendingUp size={10} />{m.price.toLocaleString("tr-TR")} ₺{m.price_type === "kira" ? "/ay" : ""}</span>}
                        {m.size && <span>{m.size} m²</span>}
                        {m.rooms && <span>{m.rooms}</span>}
                      </div>
                      {m.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {m.reasons.map((r, i) => (
                            <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-slate-300 group-hover:text-slate-400 transition-colors self-center flex-shrink-0 text-base">›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
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
