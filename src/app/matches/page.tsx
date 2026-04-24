"use client";
import { useEffect, useState } from "react";
import { Zap, RefreshCw, Star, MapPin, TrendingUp } from "lucide-react";
import { clientStore, propertyStore, matchStore, type Match } from "@/lib/storage";
import { computeMatches } from "@/lib/claude";

interface RichMatch extends Match {
  client_name: string;
  client_phone?: string;
  property_title: string;
  property_city: string;
  property_district?: string;
  price?: number;
  price_type?: string;
  size?: number;
  rooms?: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<RichMatch[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [error, setError] = useState("");

  function loadMatches() {
    const rawMatches = matchStore.getAll();
    const clients = clientStore.getAll();
    const properties = propertyStore.getAll();
    const rich: RichMatch[] = rawMatches.map((m) => {
      const c = clients.find((x) => x.id === m.client_id);
      const p = properties.find((x) => x.id === m.property_id);
      return {
        ...m,
        client_name: c?.name || "Bilinmiyor",
        client_phone: c?.phone,
        property_title: p?.title || "Bilinmiyor",
        property_city: p?.city || "",
        property_district: p?.district,
        price: p?.price,
        price_type: p?.price_type,
        size: p?.size,
        rooms: p?.rooms,
      };
    });
    setMatches(rich.sort((a, b) => b.score - a.score));
  }

  useEffect(() => { loadMatches(); }, []);

  async function runMatch() {
    setRunning(true);
    setError("");
    try {
      const clients = clientStore.getAll();
      const properties = propertyStore.getAll().filter((p) => p.status === "musait");
      if (clients.length === 0 || properties.length === 0) {
        setLastRun("Eşleştirilecek müşteri veya portföy yok");
        return;
      }
      let total = 0;
      for (const c of clients) {
        const results = await computeMatches(
          {
            id: c.id,
            intent: c.intent,
            property_types: c.property_types,
            cities: c.cities,
            districts: c.districts,
            budget_min: c.budget_min,
            budget_max: c.budget_max,
            size_min: c.size_min,
            size_max: c.size_max,
            rooms: c.rooms,
            features_wanted: c.features_wanted,
          },
          properties.map((p) => ({
            id: p.id,
            type: p.type,
            city: p.city,
            district: p.district,
            price: p.price,
            price_type: p.price_type,
            size: p.size,
            rooms: p.rooms,
            features: p.features,
            title: p.title,
          }))
        );
        for (const r of results) {
          matchStore.upsert({ client_id: c.id, property_id: r.property_id, score: r.score, reasons: r.reasons });
          total++;
        }
      }
      setLastRun(`${total} eşleşme bulundu`);
      loadMatches();
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap size={24} className="text-amber-500" /> Eşleşmeler
          </h1>
          <p className="text-slate-500 text-sm mt-1">{matches.length} toplam eşleşme</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && <span className="text-sm text-green-600">{lastRun}</span>}
          <button onClick={runMatch} disabled={running}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw size={16} className={running ? "animate-spin" : ""} />
            {running ? "Eşleştiriliyor..." : "Eşleştir"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error} — <a href="settings" className="underline">API anahtarını kontrol edin</a>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Zap size={48} className="mx-auto mb-3 opacity-30" />
          <p className="mb-2">Henüz eşleşme yok.</p>
          <p className="text-sm">Müşteri ve portföy ekledikten sonra &quot;Eşleştir&quot; butonuna tıklayın.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([clientName, clientMatches]) => (
            <div key={clientName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{clientName}</h3>
                  {clientMatches[0]?.client_phone && <p className="text-xs text-slate-500">{clientMatches[0].client_phone}</p>}
                </div>
                <span className="text-xs text-slate-500">{clientMatches.length} eşleşme</span>
              </div>
              <div className="divide-y divide-slate-100">
                {clientMatches.map((m) => (
                  <div key={m.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold flex-shrink-0 ${scoreColor(m.score)}`}>
                      <Star size={12} /> {m.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{m.property_title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><MapPin size={11} />{[m.property_district, m.property_city].filter(Boolean).join(", ")}</span>
                        {m.price && <span className="flex items-center gap-1"><TrendingUp size={11} />{m.price.toLocaleString("tr-TR")} ₺{m.price_type === "kira" ? "/ay" : ""}</span>}
                        {m.size && <span>{m.size} m²</span>}
                        {m.rooms && <span>{m.rooms}</span>}
                      </div>
                      {m.reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.reasons.map((r, i) => (
                            <span key={i} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
