"use client";
import { useEffect, useState } from "react";
import { Settings, Eye, EyeOff, CheckCircle, Key } from "lucide-react";
import { settingsStore } from "@/lib/storage";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setApiKey(settingsStore.getApiKey()); }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    settingsStore.setApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <Settings size={24} className="text-amber-500" /> Ayarlar
      </h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key size={18} className="text-amber-500" />
          <h2 className="font-semibold text-slate-800">Anthropic API Anahtarı</h2>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Doğal dil ile portföy ekleme ve otomatik eşleştirme için Claude AI kullanılıyor.
          API anahtarınızı <strong>console.anthropic.com</strong> adresinden alabilirsiniz.
          Anahtar yalnızca tarayıcınızda saklanır, hiçbir sunucuya gönderilmez.
        </p>

        <form onSubmit={save}>
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

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Tüm veriler tarayıcınızda saklanır.</strong> localStorage kullanıldığı için verileriniz yalnızca bu cihazda ve bu tarayıcıda görünür. Farklı cihazdan erişmek için veriyi dışa aktarma özelliği yakında eklenecek.
      </div>
    </div>
  );
}
