"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"giris" | "kayit">("giris");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = tab === "giris" ? signIn : signUp;
    const err = await fn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace("/");
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f2b45 100%)" }}>
      {/* Dekoratif çemberler */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/40">
              <Building2 size={26} className="text-white" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold tracking-tight text-white">
              Estate<span className="text-amber-400">IQ</span>
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">Emlak portföy ve müşteri yönetimi</p>
        </div>

        {/* Kart */}
        <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl ring-1 ring-white/[0.1] overflow-hidden shadow-2xl">
          {/* Tab başlıkları */}
          <div className="flex border-b border-white/[0.08]">
            {(["giris", "kayit"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                  tab === t
                    ? "text-amber-400 border-b-2 border-amber-400 bg-white/[0.04]"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                {t === "giris" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ornek@mail.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/[0.07] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="En az 6 karakter"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white/[0.07] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Hata mesajı */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            {/* Buton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {tab === "giris" ? "Giriş Yap" : "Hesap Oluştur"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          EstateIQ · Emlak portföy yönetim sistemi
        </p>
      </div>
    </div>
  );
}
