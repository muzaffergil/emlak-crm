"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type Mode = "giris" | "kayit" | "reset" | "newpass";

export default function LoginPage() {
  const { signIn, signUp, resetPassword, updatePassword, recoveryMode, clearRecoveryMode } = useAuth();
  const router = useRouter();

  const [mode, setMode]             = useState<Mode>("giris");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCPw, setShowCPw]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [resetSent, setResetSent]   = useState(false);
  const [pwUpdated, setPwUpdated]   = useState(false);

  // Supabase PASSWORD_RECOVERY event'i gelince yeni şifre moduna geç
  useEffect(() => {
    if (recoveryMode) {
      setMode("newpass");
    }
  }, [recoveryMode]);

  function switchMode(m: Mode) { setMode(m); setError(null); setResetSent(false); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "reset") {
      const err = await resetPassword(email.trim());
      setLoading(false);
      if (err) setError(err);
      else setResetSent(true);
      return;
    }

    if (mode === "newpass") {
      if (password !== confirmPw) {
        setError("Şifreler eşleşmiyor.");
        setLoading(false);
        return;
      }
      const err = await updatePassword(password);
      setLoading(false);
      if (err) { setError(err); return; }
      clearRecoveryMode();
      setPwUpdated(true);
      return;
    }

    const fn = mode === "giris" ? signIn : signUp;
    const err = await fn(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
    else router.replace("/");
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f2b45 100%)" }}
    >
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

          {/* ── Yeni şifre belirleme (recovery linkinden gelindiğinde) ── */}
          {mode === "newpass" ? (
            <div className="p-6">
              {pwUpdated ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-emerald-400" />
                  </div>
                  <h2 className="text-white font-bold text-lg mb-2">Şifre Güncellendi</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">Yeni şifrenizle giriş yapabilirsiniz.</p>
                  <button
                    onClick={() => router.replace("/")}
                    className="mt-6 w-full py-2.5 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    Uygulamaya Gir
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-white font-bold text-base mb-1">Yeni Şifre Belirle</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">En az 6 karakterli yeni şifrenizi girin.</p>
                  </div>

                  {/* Yeni şifre */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Yeni Şifre</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="En az 6 karakter"
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-white/[0.07] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Şifre tekrar */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Şifre Tekrar</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type={showCPw ? "text" : "password"}
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Aynı şifreyi tekrar girin"
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-white/[0.07] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                      />
                      <button type="button" onClick={() => setShowCPw(!showCPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2.5">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    Şifremi Güncelle
                  </button>
                </form>
              )}
            </div>

          ) : mode === "reset" ? (
            /* ── Şifre sıfırlama görünümü ── */
            <div className="p-6">
              <button
                onClick={() => switchMode("giris")}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-5"
              >
                <ArrowLeft size={13} /> Girişe dön
              </button>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-emerald-400" />
                  </div>
                  <h2 className="text-white font-bold text-lg mb-2">Mail Gönderildi</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    <span className="text-amber-400 font-medium">{email}</span> adresine şifre sıfırlama bağlantısı gönderildi.
                  </p>
                  <p className="text-slate-500 text-xs mt-3">Gelen kutunuzu ve spam klasörünü kontrol edin.</p>
                  <button
                    onClick={() => switchMode("giris")}
                    className="mt-6 w-full py-2.5 bg-white/[0.08] hover:bg-white/[0.12] text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    Giriş sayfasına dön
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-white font-bold text-base mb-1">Şifremi Unuttum</h2>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Email adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="ornek@mail.com"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/[0.07] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2.5">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={15} className="animate-spin" />}
                    Sıfırlama Maili Gönder
                  </button>
                </form>
              )}
            </div>

          ) : (
            /* ── Giriş / Kayıt görünümü ── */
            <>
              <div className="flex border-b border-white/[0.08]">
                {(["giris", "kayit"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => switchMode(t)}
                    className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                      mode === t
                        ? "text-amber-400 border-b-2 border-amber-400 bg-white/[0.04]"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {t === "giris" ? "Giriş Yap" : "Kayıt Ol"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="ornek@mail.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/[0.07] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Şifre</label>
                    {mode === "giris" && (
                      <button
                        type="button"
                        onClick={() => switchMode("reset")}
                        className="text-[11px] text-amber-400/80 hover:text-amber-400 transition-colors"
                      >
                        Şifremi unuttum
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
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

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {mode === "giris" ? "Giriş Yap" : "Hesap Oluştur"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          EstateIQ · Emlak portföy yönetim sistemi
        </p>
      </div>
    </div>
  );
}
