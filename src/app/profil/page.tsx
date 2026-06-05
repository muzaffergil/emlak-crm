"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { User, Mail, Lock, Check, Loader2, AlertCircle } from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-amber-600" />
        </div>
        <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl mt-3 ${type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
      {type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
      {msg}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400 transition-all placeholder:text-slate-400";

export default function ProfilPage() {
  const { user, signOut } = useAuth();

  /* ─ İsim ─ */
  const [isim, setIsim] = useState(user?.user_metadata?.full_name ?? "");
  const [isimLoading, setIsimLoading] = useState(false);
  const [isimMsg, setIsimMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleIsim(e: React.FormEvent) {
    e.preventDefault();
    setIsimLoading(true); setIsimMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: isim.trim() } });
    setIsimLoading(false);
    setIsimMsg(error ? { type: "error", text: error.message } : { type: "success", text: "İsim güncellendi." });
  }

  /* ─ Email ─ */
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || email === user?.email) return;
    setEmailLoading(true); setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setEmailLoading(false);
    setEmailMsg(error
      ? { type: "error", text: error.message }
      : { type: "success", text: "Doğrulama maili gönderildi. Mail adresinizi onaylayın." }
    );
  }

  /* ─ Şifre ─ */
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handlePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { setPwMsg({ type: "error", text: "Şifre en az 6 karakter olmalı." }); return; }
    if (pw !== pw2) { setPwMsg({ type: "error", text: "Şifreler eşleşmiyor." }); return; }
    setPwLoading(true); setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwLoading(false);
    if (error) { setPwMsg({ type: "error", text: error.message }); }
    else { setPwMsg({ type: "success", text: "Şifre güncellendi." }); setPw(""); setPw2(""); }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <User size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Profil & Hesap</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* İsim */}
        <Section title="İsim" icon={User}>
          <form onSubmit={handleIsim} className="flex flex-col gap-3">
            <input className={inputCls} value={isim} onChange={e => setIsim(e.target.value)}
              placeholder="Ad Soyad" />
            <button type="submit" disabled={isimLoading}
              className="self-end flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-60">
              {isimLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Kaydet
            </button>
            {isimMsg && <Alert type={isimMsg.type} msg={isimMsg.text} />}
          </form>
        </Section>

        {/* Email */}
        <Section title="Email Adresi" icon={Mail}>
          <form onSubmit={handleEmail} className="flex flex-col gap-3">
            <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)}
              placeholder="yeni@email.com" />
            <button type="submit" disabled={emailLoading || email === user?.email}
              className="self-end flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-60">
              {emailLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Güncelle
            </button>
            {emailMsg && <Alert type={emailMsg.type} msg={emailMsg.text} />}
          </form>
        </Section>

        {/* Şifre */}
        <Section title="Şifre Değiştir" icon={Lock}>
          <form onSubmit={handlePw} className="flex flex-col gap-3">
            <input type="password" className={inputCls} value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Yeni şifre (en az 6 karakter)" />
            <input type="password" className={inputCls} value={pw2} onChange={e => setPw2(e.target.value)}
              placeholder="Şifreyi tekrar girin" />
            <button type="submit" disabled={pwLoading}
              className="self-end flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-60">
              {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Şifreyi Güncelle
            </button>
            {pwMsg && <Alert type={pwMsg.type} msg={pwMsg.text} />}
          </form>
        </Section>

        {/* Çıkış */}
        <button onClick={() => signOut()}
          className="w-full py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-all">
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
