"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Loader2, CheckCircle2, LogIn } from "lucide-react";
import { buyerProfileStore } from "@/lib/storage";
import { useBuyer } from "@/components/BuyerContext";

const PROP_TYPES = ["Daire", "Müstakil", "Villa", "Arsa", "İşyeri"];
const DISTRICTS = ["Şahinbey", "Şehitkamil", "Oğuzeli", "Nizip", "İslahiye", "Nurdağı", "Araban", "Karkamış", "Yavuzeli"];

export default function ProfilPage() {
  const { user, buyerProfile, loading: authLoading, refreshProfile } = useBuyer();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [prefTypes, setPrefTypes] = useState<string[]>([]);
  const [prefDists, setPrefDists] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (buyerProfile) {
      setName(buyerProfile.name);
      setPhone(buyerProfile.phone ?? "");
      setBudgetMin(buyerProfile.budget_min ? String(buyerProfile.budget_min / 1_000_000) : "");
      setBudgetMax(buyerProfile.budget_max ? String(buyerProfile.budget_max / 1_000_000) : "");
      setPrefTypes(buyerProfile.pref_types);
      setPrefDists(buyerProfile.pref_dists);
    }
  }, [buyerProfile]);

  function toggleType(t: string) {
    setPrefTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function toggleDist(d: string) {
    setPrefDists(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await buyerProfileStore.upsert({
      name: name.trim(),
      phone: phone.trim() || undefined,
      budget_min: budgetMin ? Math.round(Number(budgetMin) * 1_000_000) : undefined,
      budget_max: budgetMax ? Math.round(Number(budgetMax) * 1_000_000) : undefined,
      pref_types: prefTypes,
      pref_dists: prefDists,
    }).catch(() => {});
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="text-center py-20">
        <User size={40} className="mx-auto text-slate-200 mb-3" />
        <p className="text-slate-600 font-medium">Profilinizi görmek için giriş yapın</p>
        <Link href="/alici/giris"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors text-sm">
          <LogIn size={15} /> Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
          <User size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profilim</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wide text-slate-400">Kişisel Bilgiler</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0555 123 45 67"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Bütçe</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min (Milyon ₺)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={e => setBudgetMin(e.target.value)}
                placeholder="örn: 2"
                min={0}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max (Milyon ₺)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={e => setBudgetMax(e.target.value)}
                placeholder="örn: 10"
                min={0}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Tercih Edilen Konut Tipleri</h2>
          <div className="flex flex-wrap gap-2">
            {PROP_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  prefTypes.includes(t)
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-400">Tercih Edilen İlçeler</h2>
          <div className="flex flex-wrap gap-2">
            {DISTRICTS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDist(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  prefDists.includes(d)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : null}
          {saved ? "Kaydedildi!" : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
