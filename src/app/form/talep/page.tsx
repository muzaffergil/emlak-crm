"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardList, CheckCircle2, Loader2 } from "lucide-react";

const TIPLER = ["Satılık", "Kiralık", "Arsa"];
const ODALAR = ["2+1", "3+1", "4+1", "5+1", "Villa"];
const DANISMANLAR = ["Emre Tatar", "Muzaffer Aydıngüler", "Betül Boyar"];

export default function TalepFormPage() {
  const [tipler, setTipler] = useState<string[]>([]);
  const [odalar, setOdalar] = useState<string[]>([]);
  const [butce, setButce] = useState("");
  const [musteri, setMusteri] = useState("");
  const [danisман, setDanisman] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.from("talep_submissions").insert([{
        tipi: tipler.join(", "),
        oda_sayisi: odalar.join(", "),
        butce,
        musteri_bilgileri: musteri,
        talep_alan_kisi: danisман,
      }]);
      if (err) throw err;
      setDone(true);
    } catch {
      setError("Kayıt sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-sm w-full">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Kaydedildi!</h2>
        <p className="text-sm text-slate-500 mb-6">Müşteri talebi alındı.</p>
        <div className="flex gap-2">
          <button onClick={() => { setDone(false); setTipler([]); setOdalar([]); setButce(""); setMusteri(""); setDanisman(""); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors">
            Yeni Ekle
          </button>
          <a href="/talepler" className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white text-center transition-colors">
            Listeye Git
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Müşteri Talebi</h1>
            <p className="text-xs text-slate-500">Yeni müşteri talebi ekle</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
          {/* Tipi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tipi</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPLER.map(t => (
                <button key={t} type="button" onClick={() => toggle(tipler, t, setTipler)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${tipler.includes(t) ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Oda Sayısı */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Oda Sayısı</label>
            <div className="grid grid-cols-5 gap-2">
              {ODALAR.map(o => (
                <button key={o} type="button" onClick={() => toggle(odalar, o, setOdalar)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${odalar.includes(o) ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Bütçe */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Bütçe</label>
            <input type="text" value={butce} onChange={e => setButce(e.target.value)}
              placeholder="örn. 3.000.000 ₺"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all" />
          </div>

          {/* Müşteri Bilgileri */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Müşteri Bilgileri</label>
            <textarea value={musteri} onChange={e => setMusteri(e.target.value)}
              placeholder="Ad soyad, telefon..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all resize-none" />
          </div>

          {/* Talep Alan Kişi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Talep Alan Kişi</label>
            <div className="flex flex-col gap-2">
              {DANISMANLAR.map(d => (
                <button key={d} type="button" onClick={() => setDanisman(d)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium border text-left transition-all ${danisман === d ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}
