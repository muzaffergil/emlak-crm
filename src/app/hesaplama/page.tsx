"use client";
import { useState } from "react";
import { Calculator, Home, TrendingUp } from "lucide-react";

type Tab = "kredi" | "yatirim";

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";
}

const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300/60 focus:border-blue-400 transition-colors";
const labelCls = "text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5";

export default function HesaplamaPage() {
  const [tab, setTab] = useState<Tab>("kredi");

  // Kredi state
  const [fiyat, setFiyat]     = useState("2000000");
  const [pesinat, setPesinat] = useState("30");
  const [faiz, setFaiz]       = useState("40");
  const [vade, setVade]       = useState("120");

  // Yatırım state
  const [sf, setSf]   = useState("2000000");
  const [ak, setAk]   = useState("25000");
  const [go, setGo]   = useState("15");

  // Kredi hesaplama
  const fiyatN    = parseFloat(fiyat)   || 0;
  const pesinatN  = parseFloat(pesinat) || 0;
  const faizN     = parseFloat(faiz)    || 0;
  const vadeN     = parseInt(vade)      || 120;
  const anapara   = fiyatN * (1 - pesinatN / 100);
  const aylikFaiz = faizN / 12 / 100;
  const taksit    = aylikFaiz === 0
    ? anapara / vadeN
    : anapara * aylikFaiz / (1 - Math.pow(1 + aylikFaiz, -vadeN));
  const toplamOdeme = taksit * vadeN;
  const toplamFaiz  = toplamOdeme - anapara;

  // Yatırım hesaplama
  const sfN       = parseFloat(sf) || 0;
  const akN       = parseFloat(ak) || 0;
  const goN       = parseFloat(go) || 0;
  const yillikKira   = akN * 12;
  const brutGetiri   = sfN > 0 ? (yillikKira / sfN) * 100 : 0;
  const yillikGider  = yillikKira * (goN / 100);
  const netGetiri    = sfN > 0 ? ((yillikKira - yillikGider) / sfN) * 100 : 0;
  const geriDonus    = akN > 0 ? sfN / yillikKira : 0;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3 pb-5 border-b border-slate-200">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <Calculator size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hesaplama Araçları</h1>
          <p className="text-sm text-slate-500">Konut kredisi ve yatırım getirisi hesapla</p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {([
          { key: "kredi" as Tab, label: "Konut Kredisi", icon: Home },
          { key: "yatirim" as Tab, label: "Yatırım Getirisi", icon: TrendingUp },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* — KONUT KREDİSİ — */}
      {tab === "kredi" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ev Fiyatı (₺)</label>
              <input type="number" value={fiyat} onChange={e => setFiyat(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Peşinat %</label>
              <input type="number" value={pesinat} onChange={e => setPesinat(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Yıllık Faiz %</label>
              <input type="number" value={faiz} onChange={e => setFaiz(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Vade (Ay)</label>
              <input type="number" value={vade} onChange={e => setVade(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Hızlı seçenekler */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Hızlı peşinat</p>
            <div className="flex gap-2">
              {[20, 30, 40, 50].map(p => (
                <button key={p} onClick={() => setPesinat(String(p))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    pesinat === String(p) ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  %{p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Hızlı vade</p>
            <div className="flex gap-2">
              {[60, 84, 120, 180].map(v => (
                <button key={v} onClick={() => setVade(String(v))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    vade === String(v) ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  {v} ay
                </button>
              ))}
            </div>
          </div>

          {/* Sonuçlar */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 text-center shadow-lg">
              <p className="text-xs opacity-70 mb-1 font-medium uppercase tracking-wide">Aylık Taksit</p>
              <p className="text-4xl font-bold">{fmt(Math.round(taksit))}</p>
              <p className="text-xs opacity-60 mt-2">{vadeN} ay · %{pesinatN} peşinat</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Anapara", value: (anapara / 1_000_000).toFixed(2) + "M ₺", cls: "text-slate-800" },
                { label: "Toplam Faiz", value: (toplamFaiz / 1_000_000).toFixed(2) + "M ₺", cls: "text-orange-600" },
                { label: "Toplam Ödeme", value: (toplamOdeme / 1_000_000).toFixed(2) + "M ₺", cls: "text-slate-800" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className={`text-sm font-bold ${cls}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* — YATIRIM GETİRİSİ — */}
      {tab === "yatirim" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Satın Alma Fiyatı (₺)</label>
              <input type="number" value={sf} onChange={e => setSf(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Aylık Kira (₺)</label>
                <input type="number" value={ak} onChange={e => setAk(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Yıllık Gider %</label>
                <input type="number" value={go} onChange={e => setGo(e.target.value)} className={inputCls} placeholder="15" />
              </div>
            </div>
          </div>

          {/* Hızlı gider oranları */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Hızlı gider oranı (aidat + vergi + bakım)</p>
            <div className="flex gap-2">
              {[10, 15, 20, 25].map(g => (
                <button key={g} onClick={() => setGo(String(g))}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    go === String(g) ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                  %{g}
                </button>
              ))}
            </div>
          </div>

          {/* Sonuçlar */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Brüt Getiri", value: brutGetiri.toFixed(1) + "%", bg: "bg-emerald-50", color: "text-emerald-700" },
                { label: "Net Getiri",  value: netGetiri.toFixed(1)  + "%", bg: "bg-blue-50",    color: "text-blue-700"    },
                { label: "Geri Dönüş", value: geriDonus.toFixed(1)  + " y", bg: "bg-amber-50",   color: "text-amber-700"   },
              ].map(({ label, value, bg, color }) => (
                <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                  <p className={`text-xs font-medium mb-1 ${color} opacity-70`}>{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Yıllık kira geliri</span>
                <span className="font-semibold">{fmt(yillikKira)}</span>
              </div>
              <div className="flex justify-between">
                <span>Yıllık gider ({go}%)</span>
                <span className="font-semibold text-red-500">−{fmt(Math.round(yillikGider))}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="font-medium">Net yıllık gelir</span>
                <span className="font-bold text-emerald-700">{fmt(Math.round(yillikKira - yillikGider))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center pb-4">Hesaplamalar yaklaşık değerlerdir. Banka koşulları farklılık gösterebilir.</p>
    </div>
  );
}
