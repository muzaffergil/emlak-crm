"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { buyerProfileStore } from "@/lib/storage";

export default function AliciGirisPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"giris" | "kayit">("giris");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up extra fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setError("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }
    const profile = await buyerProfileStore.get().catch(() => null);
    if (!profile) {
      await supabase.auth.signOut();
      setError("Bu hesap alıcı hesabı değil. Emlakçı girişi için ana sayfayı kullanın.");
      setLoading(false);
      return;
    }
    router.push("/alici/");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("İsim zorunludur."); return; }
    setError(null);
    setLoading(true);
    const { error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      const msg = signUpErr.message.includes("already registered")
        ? "Bu e-posta zaten kayıtlı."
        : signUpErr.message;
      setError(msg);
      setLoading(false);
      return;
    }
    await buyerProfileStore.upsert({ name: name.trim(), phone: phone.trim() || undefined });
    router.push("/alici/");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <Building2 size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">EstateIQ</h1>
          <p className="text-sm text-slate-500 mt-1">Alıcı Portalı</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-slate-200 p-1 mb-6 bg-slate-50">
          <button
            onClick={() => { setTab("giris"); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "giris" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { setTab("kayit"); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "kayit" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={tab === "giris" ? handleSignIn : handleSignUp} className="space-y-4">
          {tab === "kayit" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon <span className="text-slate-400 font-normal">(isteğe bağlı)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0555 123 45 67"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={tab === "kayit" ? "En az 6 karakter" : "••••••••"}
                minLength={6}
                required
                className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {tab === "giris" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Emlakçı mısınız?{" "}
          <a href="/login" className="text-amber-600 hover:underline">Emlakçı girişi</a>
        </p>
      </div>
    </div>
  );
}
