"use client";
import { useEffect, useState } from "react";
import { Settings, Eye, EyeOff, CheckCircle, Key, UserCircle, Copy, Check } from "lucide-react";
import { settingsStore, agentContactStore } from "@/lib/storage";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentTitle, setAgentTitle] = useState("Emlak Danışmanı");
  const [agentAbout, setAgentAbout] = useState("");
  const [agentSaved, setAgentSaved] = useState(false);
  const [agentSaving, setAgentSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => { setApiKey(settingsStore.getApiKey()); }, []);

  useEffect(() => {
    agentContactStore.get().then(c => {
      if (c) {
        setAgentName(c.name ?? "");
        setAgentPhone(c.phone ?? "");
        setAgentTitle(c.title);
        setAgentAbout(c.about ?? "");
      }
    }).catch(() => {});
  }, []);

  function saveApiKey(e: React.FormEvent) {
    e.preventDefault();
    settingsStore.setApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveAgentContact(e: React.FormEvent) {
    e.preventDefault();
    setAgentSaving(true);
    await agentContactStore.upsert({
      name: agentName.trim() || undefined,
      phone: agentPhone.trim() || undefined,
      title: agentTitle.trim() || "Emlak Danışmanı",
      about: agentAbout.trim() || undefined,
    }).catch(() => {});
    setAgentSaving(false);
    setAgentSaved(true);
    setTimeout(() => setAgentSaved(false), 2500);
  }

  function copyPortalLink() {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const url = `${window.location.origin}${base}/alici`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings size={24} className="text-amber-500" /> Ayarlar
      </h1>

      {/* API Key */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-amber-500" />
          <h2 className="font-semibold text-slate-800">Anthropic API Anahtarı</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Doğal dil ile portföy ekleme ve otomatik eşleştirme için Claude AI kullanılıyor.
          API anahtarınızı <strong>console.anthropic.com</strong> adresinden alabilirsiniz.
          Anahtar yalnızca tarayıcınızda saklanır.
        </p>
        <form onSubmit={saveApiKey}>
          <div className="relative mb-4">
            <input
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            {saved ? <><CheckCircle size={16} /> Kaydedildi!</> : "Kaydet"}
          </button>
        </form>
      </div>

      {/* Agent Contact (Buyer Portal) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <UserCircle size={18} className="text-violet-500" />
          <h2 className="font-semibold text-slate-800">Alıcı Portalı — Danışman Bilgileri</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Alıcıların portföy detay sayfasında göreceği danışman kartı bilgileri.
        </p>

        {/* Portal link */}
        <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 mb-5">
          <span className="text-xs text-violet-700 font-mono flex-1 truncate">
            {typeof window !== "undefined" ? `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/alici` : "/alici"}
          </span>
          <button
            onClick={copyPortalLink}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium flex-shrink-0"
          >
            {linkCopied ? <Check size={13} /> : <Copy size={13} />}
            {linkCopied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>

        <form onSubmit={saveAgentContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adınız</label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                placeholder="Muzaffer Gil"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={agentPhone}
                onChange={e => setAgentPhone(e.target.value)}
                placeholder="0555 123 45 67"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unvan</label>
            <input
              type="text"
              value={agentTitle}
              onChange={e => setAgentTitle(e.target.value)}
              placeholder="Emlak Danışmanı"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hakkında <span className="text-slate-400 font-normal">(isteğe bağlı)</span></label>
            <textarea
              value={agentAbout}
              onChange={e => setAgentAbout(e.target.value)}
              placeholder="Kısa bir tanıtım metni..."
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={agentSaving}
            className="bg-violet-500 hover:bg-violet-600 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {agentSaved ? <><CheckCircle size={16} /> Kaydedildi!</> : agentSaving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
