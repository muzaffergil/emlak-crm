"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { propertyStore, type Property } from "@/lib/storage";

const STATUS_LABELS: Record<string, string> = {
  musait: "Müsait", satildi: "Satıldı", kiralik: "Kiralık", rezerve: "Rezerve",
};

function CompareContent() {
  const params = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").map(Number).filter(Boolean);
  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertyStore.getAll()
      .then(all => { setProps(all.filter(p => ids.includes(p.id))); setLoading(false); })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Yükleniyor…</div>;

  if (props.length < 2) return (
    <div className="text-center py-20 space-y-3">
      <p className="text-slate-500">Karşılaştırmak için en az 2 portföy seçin.</p>
      <Link href="/" className="text-sm text-amber-600 hover:underline">← Portföylere dön</Link>
    </div>
  );

  const allFeatures = [...new Set(props.flatMap(p => p.features))].sort();
  const cols = props.length;
  const gridStyle = { gridTemplateColumns: `140px repeat(${cols}, 1fr)` };

  function Row({ label, render }: { label: string; render: (p: Property) => string }) {
    const values = props.map(p => render(p));
    const numericValues = values.map(v => parseFloat(v.replace(/[^\d.]/g, "")));
    const maxVal = Math.max(...numericValues.filter(n => !isNaN(n)));

    return (
      <div className="grid gap-2 items-center" style={gridStyle}>
        <div className="text-xs font-semibold text-slate-400 uppercase">{label}</div>
        {props.map((p, i) => {
          const val = values[i];
          const numVal = numericValues[i];
          const isBest = !isNaN(numVal) && numVal === maxVal && numericValues.filter(v => v === maxVal).length < cols;
          return (
            <div key={p.id} className={`bg-white rounded-xl border p-3 text-sm text-center font-medium transition-colors ${isBest ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-slate-100 text-slate-700"}`}>
              {val}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Portföy Karşılaştırma</h1>
        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{cols} portföy</span>
      </div>

      {/* Portföy başlıkları */}
      <div className="grid gap-2" style={gridStyle}>
        <div />
        {props.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {p.photos?.[0] ? (
              <img src={p.photos[0]} alt="" className="w-full h-28 object-cover" />
            ) : (
              <div className="w-full h-28 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-2xl capitalize">{p.type[0]}</span>
              </div>
            )}
            <div className="p-3">
              <p className="font-semibold text-slate-800 text-xs leading-snug line-clamp-2">{p.title}</p>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-0.5">
                <MapPin size={9} /> {[p.neighborhood, p.district].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Temel bilgiler */}
      <div className="space-y-2">
        <Row label="Fiyat"   render={p => p.price ? p.price.toLocaleString("tr-TR") + " ₺" : "—"} />
        <Row label="Tip"     render={p => p.type} />
        <Row label="Alan"    render={p => p.size ? p.size + " m²" : "—"} />
        <Row label="Oda"     render={p => p.rooms ?? "—"} />
        <Row label="Kat"     render={p => p.floor != null ? `${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}` : "—"} />
        <Row label="Durum"   render={p => STATUS_LABELS[p.status] ?? p.status} />
      </div>

      {/* Özellik karşılaştırma */}
      {allFeatures.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase pb-1">Özellikler</p>
          {allFeatures.map(feat => (
            <div key={feat} className="grid gap-2 items-center" style={gridStyle}>
              <div className="text-xs text-slate-600">{feat}</div>
              {props.map(p => (
                <div key={p.id} className="flex justify-center py-1">
                  {p.features.includes(feat)
                    ? <CheckCircle2 size={16} className="text-green-500" />
                    : <XCircle size={16} className="text-slate-200" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="pb-4">
        <Link href="/" className="text-sm text-amber-600 hover:text-amber-700 font-medium">← Portföylere dön</Link>
      </div>
    </div>
  );
}

export default function KarsilastirPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Yükleniyor…</div>}>
      <CompareContent />
    </Suspense>
  );
}
