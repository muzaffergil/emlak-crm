"use client";
import { useEffect, useState } from "react";
import {
  portfolioSubmissionStore, type PortfolioSubmission,
  talepSubmissionStore, type TalepSubmission,
} from "@/lib/storage";
import { ClipboardList, MapPin, Home, BadgeDollarSign, Users, Trash2, ExternalLink, RefreshCw, Building2, User } from "lucide-react";

type Tab = "portfoy" | "talep";

function PortfoyList() {
  const [items, setItems] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try { setItems(await portfolioSubmissionStore.getAll()); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) return;
    setDeletingId(id);
    try {
      await portfolioSubmissionStore.delete(id);
      setItems(prev => prev.filter(s => s.id !== id));
    } finally { setDeletingId(null); }
  }

  if (loading) return <div className="flex justify-center py-20 text-slate-400">Yükleniyor...</div>;

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Building2 size={40} className="text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">Henüz portföy bildirimi yok</p>
      <p className="text-sm text-slate-400 mt-1">Google Forms'u doldurunca burada görünecek</p>
      <a href="/form/portfoy"
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
        <ExternalLink size={14} /> Yeni Portföy Ekle
      </a>
    </div>
  );

  return (
    <div className="grid gap-4">
      {items.map(s => (
        <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(s.gayrimenkul_tipi || s.islem_turu) && (
                <div className="flex items-center gap-2">
                  <Home size={15} className="text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{[s.gayrimenkul_tipi, s.islem_turu].filter(Boolean).join(" · ")}</span>
                </div>
              )}
              {s.konum && (
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{s.konum}</span>
                </div>
              )}
              {s.oda_sayisi && (
                <div className="flex items-center gap-2">
                  <Home size={15} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{s.oda_sayisi}</span>
                </div>
              )}
              {s.fiyat && (
                <div className="flex items-center gap-2">
                  <BadgeDollarSign size={15} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">{s.fiyat}</span>
                </div>
              )}
              {s.musteri_bilgileri && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Users size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{s.musteri_bilgileri}</span>
                </div>
              )}
              {s.gorsel_urls && (
                <div className="sm:col-span-2">
                  <a href={s.gorsel_urls} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink size={11} /> Görseller (Drive)
                  </a>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400">
                {new Date(s.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TalepList() {
  const [items, setItems] = useState<TalepSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try { setItems(await talepSubmissionStore.getAll()); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) return;
    setDeletingId(id);
    try {
      await talepSubmissionStore.delete(id);
      setItems(prev => prev.filter(s => s.id !== id));
    } finally { setDeletingId(null); }
  }

  if (loading) return <div className="flex justify-center py-20 text-slate-400">Yükleniyor...</div>;

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ClipboardList size={40} className="text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">Henüz müşteri talebi yok</p>
      <p className="text-sm text-slate-400 mt-1">Google Forms'u doldurunca burada görünecek</p>
      <a href="/form/talep"
        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
        <ExternalLink size={14} /> Yeni Talep Ekle
      </a>
    </div>
  );

  return (
    <div className="grid gap-4">
      {items.map(s => (
        <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {s.tipi && (
                <div className="flex items-center gap-2">
                  <Home size={15} className="text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{s.tipi}</span>
                </div>
              )}
              {s.oda_sayisi && (
                <div className="flex items-center gap-2">
                  <Home size={15} className="text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{s.oda_sayisi}</span>
                </div>
              )}
              {s.butce && (
                <div className="flex items-center gap-2">
                  <BadgeDollarSign size={15} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">{s.butce}</span>
                </div>
              )}
              {s.musteri_bilgileri && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Users size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{s.musteri_bilgileri}</span>
                </div>
              )}
              {s.talep_alan_kisi && (
                <div className="flex items-center gap-2">
                  <User size={15} className="text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">Talep alan: <span className="font-medium text-slate-800">{s.talep_alan_kisi}</span></span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400">
                {new Date(s.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TaleplerPage() {
  const [tab, setTab] = useState<Tab>("portfoy");

  const formLinks: Record<Tab, string> = {
    portfoy: "/form/portfoy",
    talep: "/form/talep",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ClipboardList size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Form Bildirimleri</h1>
            <p className="text-sm text-slate-500">Google Forms'dan gelen kayıtlar</p>
          </div>
        </div>
        <a href={formLinks[tab]}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
          <ExternalLink size={14} /> {tab === "portfoy" ? "Yeni Portföy" : "Yeni Talep"}
        </a>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab("portfoy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "portfoy" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building2 size={15} /> Portföy
        </button>
        <button
          onClick={() => setTab("talep")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "talep" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ClipboardList size={15} /> Müşteri Talebi
        </button>
      </div>

      {tab === "portfoy" ? <PortfoyList /> : <TalepList />}
    </div>
  );
}
