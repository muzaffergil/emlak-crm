"use client";
import { useEffect, useState } from "react";
import { Zap, RefreshCw, MapPin, Phone, MessageCircle, Link, Loader2, ChevronDown, ChevronUp, Users, CheckCircle2 } from "lucide-react";
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

const TYPE_STYLES: Record<string, { header: string; badge: string; icon: string }> = {
  daire:  { header: "border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50/80 to-white",    badge: "bg-blue-100 text-blue-700 border border-blue-200",    icon: "🏢" },
  villa:  { header: "border-l-4 border-l-emerald-400 bg-gradient-to-r from-emerald-50/80 to-white", badge: "bg-emerald-100 text-emerald-700 border border-emerald-200", icon: "🏡" },
  arsa:   { header: "border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/80 to-white",   badge: "bg-amber-100 text-amber-700 border border-amber-200",   icon: "🌿" },
  dükkan: { header: "border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50/80 to-white", badge: "bg-orange-100 text-orange-700 border border-orange-200", icon: "🏪" },
  ofis:   { header: "border-l-4 border-l-violet-400 bg-gradient-to-r from-violet-50/80 to-white",  badge: "bg-violet-100 text-violet-700 border border-violet-200",  icon: "💼" },
  depo:   { header: "border-l-4 border-l-slate-400 bg-gradient-to-r from-slate-50/80 to-white",   badge: "bg-slate-200 text-slate-700 border border-slate-300",   icon: "🏭" },
  bina:   { header: "border-l-4 border-l-indigo-400 bg-gradient-to-r from-indigo-50/80 to-white", badge: "bg-indigo-100 text-indigo-700 border border-indigo-200", icon: "🏗️" },
};
const DEFAULT_STYLE = { header: "border-l-4 border-l-slate-300 bg-gradient-to-r from-slate-50/80 to-white", badge: "bg-slate-100 text-slate-600 border border-slate-200", icon: "🏠" };

function buildClientMessage(property: Property, clientName: string, score: number, reasons: string[]): string {
  const loc = [property.neighborhood, property.district, property.city].filter(Boolean).join(", ");
  const priceStr = property.price
    ? `${property.price.toLocaleString("tr-TR")} ₺${property.price_type === "kira" ? "/ay" : ""}`
    : "";
  const sizeStr = [property.size && `${property.size}m²`, property.rooms].filter(Boolean).join(" • ");
  const topReasons = reasons.slice(0, 4).map(r => `✓ ${r}`).join("\n");
  return [
    `Merhaba ${clientName}!`, ``,
    `Size uygun bir portföy var 🏠`, ``,
    `📍 ${property.title}`,
    loc ? `🗺️ ${loc}` : null,
    priceStr ? `💰 ${priceStr}` : null,
    sizeStr ? `📐 ${sizeStr}` : null,
    `⭐ Uyum Puanı: ${score}/100`, ``,
    topReasons, ``,
    `Görmek ister misiniz?`,
  ].filter(s => s !== null).join("\n");
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<RichMatch[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"matches" | "score" | "price_asc" | "price_desc">("matches");
  const [portalLoading, setPortalLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadMatches() {
    const [rawMatches, clients, properties] = await Promise.all([
      matchStore.getAll(), clientStore.getAll(), propertyStore.getAll(),
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
      const [clients, properties] = await Promise.all([clientStore.getAll(), propertyStore.getAll()]);
      const availableProps = properties.filter((p) => p.status === "musait");
      if (clients.length === 0 || availableProps.length === 0) {
        setLastRun("Eşleştirilecek müşteri veya portföy yok");
        setRunning(false);
        return;
      }
      let total = 0;
      for (const c of clients) {
        await matchStore.deleteByClient(c.id);
        if (c.intent !== "aliyor" && c.intent !== "kiraciyor") continue;
        const clientNameNorm = c.name.trim().toLowerCase();
        const filteredProps = availableProps.filter((p) => {
          if (p.owner_name && p.owner_name.trim().toLowerCase() === clientNameNorm) return false;
          if (p.title.trim().toLowerCase().startsWith(clientNameNorm)) return false;
          return true;
        });
        const results = computeMatches(
          {
            id: c.id, intent: c.intent, property_types: c.property_types,
            cities: c.cities, districts: c.districts, neighborhoods: c.neighborhoods ?? [],
            budget_min: c.budget_min, budget_max: c.budget_max,
            size_min: c.size_min, size_max: c.size_max,
            rooms: c.rooms, features_wanted: c.features_wanted,
          },
          filteredProps.map((p) => ({
            id: p.id, type: p.type, city: p.city, district: p.district,
            neighborhood: p.neighborhood, price: p.price, price_type: p.price_type,
            size: p.size, rooms: p.rooms, features: p.features, title: p.title,
          }))
        );
        if (results.length > 0) {
          await matchStore.insertMany(results.map(r => ({
            client_id: c.id, property_id: r.property_id, score: r.score, reasons: r.reasons,
          })));
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
    s >= 80 ? "text-green-700 bg-green-100 border border-green-200" :
    s >= 60 ? "text-amber-700 bg-amber-100 border border-amber-200" :
    "text-slate-600 bg-slate-100 border border-slate-200";

  const avatarColor = (s: number) =>
    s >= 80 ? "bg-green-100 text-green-700" :
    s >= 60 ? "bg-amber-100 text-amber-700" :
    "bg-slate-100 text-slate-600";

  const TYPE_ORDER = ["daire", "villa", "arsa", "dükkan", "ofis", "depo", "bina"];

  function toggleType(type: string) {
    setCollapsedTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  const groupedByType = (() => {
    // Önce mülke göre grupla
    const propMap = new Map<number, { property: Property; matches: RichMatch[] }>();
    matches.forEach(m => {
      if (!m.property) return;
      if (!propMap.has(m.property_id)) propMap.set(m.property_id, { property: m.property, matches: [] });
      propMap.get(m.property_id)!.matches.push(m);
    });
    const propGroups = [...propMap.values()].sort((a, b) => {
      if (sort === "score") return Math.max(...b.matches.map(m => m.score)) - Math.max(...a.matches.map(m => m.score));
      if (sort === "price_asc") return (a.property.price ?? 0) - (b.property.price ?? 0);
      if (sort === "price_desc") return (b.property.price ?? 0) - (a.property.price ?? 0);
      return b.matches.length - a.matches.length; // "matches" default
    });

    // Sonra tipe göre grupla
    const typeMap = new Map<string, { property: Property; matches: RichMatch[] }[]>();
    propGroups.forEach(g => {
      const type = g.property.type || "diger";
      if (!typeMap.has(type)) typeMap.set(type, []);
      typeMap.get(type)!.push(g);
    });

    // TYPE_ORDER'a göre sırala
    const sorted = new Map<string, { property: Property; matches: RichMatch[] }[]>();
    TYPE_ORDER.forEach(t => { if (typeMap.has(t)) sorted.set(t, typeMap.get(t)!); });
    typeMap.forEach((v, k) => { if (!sorted.has(k)) sorted.set(k, v); });
    return sorted;
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

      {/* Header */}
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Sıralama */}
      {matches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">Sırala:</span>
          {([
            { key: "matches",   label: "En çok alıcı" },
            { key: "score",     label: "En yüksek skor" },
            { key: "price_asc", label: "Fiyat ↑" },
            { key: "price_desc",label: "Fiyat ↓" },
          ] as const).map(opt => (
            <button key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                sort === opt.key
                  ? "bg-violet-100 text-violet-700 border border-violet-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent"
              }`}>
              {opt.label}
            </button>
          ))}
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
        <div className="space-y-6">
          {[...groupedByType.entries()].map(([type, propGroups]) => {
            const typeStyle = TYPE_STYLES[type] ?? DEFAULT_STYLE;
            const isCollapsed = collapsedTypes.has(type);
            const totalMatches = propGroups.reduce((sum, g) => sum + g.matches.length, 0);

            return (
              <div key={type}>
                {/* Tip grubu başlığı */}
                <button
                  onClick={() => toggleType(type)}
                  className="w-full flex items-center gap-2 mb-3 px-1 group"
                >
                  <span className="text-base">{typeStyle.icon}</span>
                  <h2 className="font-bold text-slate-700 text-sm">{TYPE_LABELS[type] ?? type}</h2>
                  <span className="text-xs text-slate-400">
                    {propGroups.length} mülk · {totalMatches} eşleşme
                  </span>
                  <div className={`ml-auto transition-colors ${isCollapsed ? "text-slate-400" : "text-slate-400"} group-hover:text-slate-600`}>
                    {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="space-y-4">
                    {propGroups.map(({ property, matches: propMatches }) => {
            const topScore = Math.max(...propMatches.map(m => m.score));
            const portalKey = `prop-${property.id}`;
            const style = TYPE_STYLES[property.type] ?? DEFAULT_STYLE;

            return (
              <div key={property.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Portföy başlığı */}
                <div className={`px-4 pt-3.5 pb-3 ${style.header}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="text-xl mt-0.5 flex-shrink-0">{style.icon}</span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">{property.title}</h3>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                          <MapPin size={10} className="flex-shrink-0" />
                          <span>{[property.district, property.city].filter(Boolean).join(", ")}</span>
                        </div>
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

                  {/* Fiyat + detaylar */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {property.price && (
                      <span className="font-bold text-amber-600 text-sm">
                        {property.price.toLocaleString("tr-TR")} ₺{property.price_type === "kira" ? "/ay" : ""}
                      </span>
                    )}
                    {property.type && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                        {TYPE_LABELS[property.type] ?? property.type}
                      </span>
                    )}
                    {property.rooms && <span className="text-xs text-slate-500">{property.rooms}</span>}
                    {property.size && <span className="text-xs text-slate-500">{property.size} m²</span>}
                    <div className={`ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full ${scoreColor(topScore)}`}>
                      En yüksek %{topScore}
                    </div>
                  </div>
                </div>

                {/* Eşleşen müşteriler — accordion listesi */}
                <div className="divide-y divide-slate-100">
                  {propMatches.map((m) => {
                    const isOpen = expandedId === m.id;
                    const hasPrefs = m.client_budget_min || m.client_budget_max || m.client_size_min || m.client_size_max || (m.client_rooms?.length ?? 0) > 0;
                    return (
                      <div key={m.id}>
                        {/* Kart satırı — tıklanabilir */}
                        <button
                          onClick={() => setExpandedId(isOpen ? null : m.id)}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${isOpen ? "bg-amber-50/60" : "hover:bg-slate-50"}`}
                        >
                          {/* Skor badge */}
                          <div className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full min-w-[48px] text-center ${scoreColor(m.score)}`}>
                            %{m.score}
                          </div>

                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${avatarColor(m.score)}`}>
                            {m.client_name.charAt(0).toUpperCase()}
                          </div>

                          {/* Müşteri bilgisi */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{m.client_name}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 flex-wrap">
                              {m.client_budget_max && (
                                <span className="text-slate-500">
                                  {m.client_budget_max.toLocaleString("tr-TR")} ₺ bütçe
                                </span>
                              )}
                              {m.client_rooms && m.client_rooms.length > 0 && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span>{m.client_rooms.join(", ")}</span>
                                </>
                              )}
                              {!isOpen && m.reasons.length > 0 && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-emerald-600 truncate max-w-[140px]">{m.reasons[0]}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Chevron */}
                          <div className={`flex-shrink-0 transition-colors ${isOpen ? "text-amber-500" : "text-slate-300"}`}>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {/* Açılır panel */}
                        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? "max-h-[600px]" : "max-h-0"}`}>
                          <div className="px-4 pb-4 bg-gradient-to-b from-amber-50/40 to-white border-t border-amber-100/60 space-y-3">

                            {/* Eşleşme nedenleri */}
                            {m.reasons.length > 0 && (
                              <div className="pt-3">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                  Eşleşme Nedenleri
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {m.reasons.map((r, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs px-2.5 py-1 rounded-full">
                                      <CheckCircle2 size={10} /> {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Müşteri tercihleri */}
                            {hasPrefs && (
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                  Müşteri Tercihleri
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(m.client_budget_min || m.client_budget_max) && (
                                    <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full">
                                      💰 {m.client_budget_min ? `${m.client_budget_min.toLocaleString("tr-TR")} – ` : "max "}
                                      {m.client_budget_max?.toLocaleString("tr-TR")} ₺
                                    </span>
                                  )}
                                  {(m.client_size_min || m.client_size_max) && (
                                    <span className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2.5 py-1 rounded-full">
                                      📐 {m.client_size_min ?? "?"} – {m.client_size_max ?? "?"} m²
                                    </span>
                                  )}
                                  {m.client_rooms?.map(r => (
                                    <span key={r} className="bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-full">
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Aksiyon butonları */}
                            {m.client_phone && (
                              <div className="flex gap-2 pt-1">
                                <a
                                  href={`https://wa.me/${m.client_phone.replace(/\D/g, "").replace(/^0/, "90")}?text=${encodeURIComponent(buildClientMessage(property, m.client_name, m.score, m.reasons))}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl shadow-sm shadow-green-100 transition-all active:scale-[0.98]"
                                >
                                  <MessageCircle size={14} /> WhatsApp
                                </a>
                                <a
                                  href={`tel:${m.client_phone}`}
                                  onClick={e => e.stopPropagation()}
                                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-100 transition-all active:scale-[0.98]"
                                >
                                  <Phone size={14} /> Ara
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
                    })}
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
