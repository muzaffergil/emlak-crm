"use client";
import { useEffect, useRef, useState } from "react";
import {
  portfolioSubmissionStore, type PortfolioSubmission,
  talepSubmissionStore, type TalepSubmission,
} from "@/lib/storage";
import { ClipboardList, MapPin, Home, BadgeDollarSign, Users, Trash2, ExternalLink, Building2, User, Pencil, X, Loader2, Check } from "lucide-react";

type Tab = "portfoy" | "talep";

const TIPLER_PORTFOY = ["Konut", "Ticari", "Arsa", "Villa"];
const ISLEM_TURLERI = ["Satılık", "Kiralık"];
const ODA_SECENEKLERI = ["2+1", "3+1", "4+1", "5+1"];
const TIPLER_TALEP = ["Satılık", "Kiralık", "Arsa"];
const DANISMANLAR = ["Emre Tatar", "Muzaffer Aydıngüler", "Betül Boyar"];

/* ─── Portföy Edit Modal ─── */
function PortfoyEditModal({ item, onClose, onSave }: {
  item: PortfolioSubmission;
  onClose: () => void;
  onSave: (updated: PortfolioSubmission) => void;
}) {
  const [tip, setTip] = useState(item.gayrimenkul_tipi ?? "");
  const [islem, setIslem] = useState(item.islem_turu ?? "");
  const [konum, setKonum] = useState(item.konum ?? "");
  const [odalar, setOdalar] = useState<string[]>(item.oda_sayisi ? item.oda_sayisi.split(", ").filter(Boolean) : []);
  const [fiyat, setFiyat] = useState(item.fiyat ?? "");
  const [musteri, setMusteri] = useState(item.musteri_bilgileri ?? "");
  const [saving, setSaving] = useState(false);

  function toggleOda(o: string) {
    setOdalar(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = {
        gayrimenkul_tipi: tip || undefined,
        islem_turu: islem || undefined,
        konum: konum || undefined,
        oda_sayisi: odalar.join(", ") || undefined,
        fiyat: fiyat || undefined,
        musteri_bilgileri: musteri || undefined,
      };
      await portfolioSubmissionStore.update(item.id, data);
      onSave({ ...item, ...data });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Portföy Düzenle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Gayrimenkul Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPLER_PORTFOY.map(t => (
                <button key={t} type="button" onClick={() => setTip(t)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${tip === t ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">İşlem Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {ISLEM_TURLERI.map(i => (
                <button key={i} type="button" onClick={() => setIslem(i)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${islem === i ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Konum</label>
            <input className={inputCls} value={konum} onChange={e => setKonum(e.target.value)} placeholder="İlçe, mahalle..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Oda Sayısı</label>
            <div className="grid grid-cols-4 gap-2">
              {ODA_SECENEKLERI.map(o => (
                <button key={o} type="button" onClick={() => toggleOda(o)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${odalar.includes(o) ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fiyat</label>
            <input className={inputCls} value={fiyat} onChange={e => setFiyat(e.target.value)} placeholder="örn. 2.500.000 ₺" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Müşteri Bilgileri</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={musteri} onChange={e => setMusteri(e.target.value)} placeholder="Ad soyad, telefon..." />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Talep Edit Modal ─── */
function TalepEditModal({ item, onClose, onSave }: {
  item: TalepSubmission;
  onClose: () => void;
  onSave: (updated: TalepSubmission) => void;
}) {
  const [tipler, setTipler] = useState<string[]>(item.tipi ? item.tipi.split(", ").filter(Boolean) : []);
  const [odalar, setOdalar] = useState<string[]>(item.oda_sayisi ? item.oda_sayisi.split(", ").filter(Boolean) : []);
  const [butce, setButce] = useState(item.butce ?? "");
  const [musteri, setMusteri] = useState(item.musteri_bilgileri ?? "");
  const [danisman, setDanisman] = useState(item.talep_alan_kisi ?? "");
  const [saving, setSaving] = useState(false);

  function toggle(arr: string[], val: string, set: (v: string[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = {
        tipi: tipler.join(", ") || undefined,
        oda_sayisi: odalar.join(", ") || undefined,
        butce: butce || undefined,
        musteri_bilgileri: musteri || undefined,
        talep_alan_kisi: danisman || undefined,
      };
      await talepSubmissionStore.update(item.id, data);
      onSave({ ...item, ...data });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Talep Düzenle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipi</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPLER_TALEP.map(t => (
                <button key={t} type="button" onClick={() => toggle(tipler, t, setTipler)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${tipler.includes(t) ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Oda Sayısı</label>
            <div className="grid grid-cols-5 gap-1.5">
              {["2+1","3+1","4+1","5+1","Villa"].map(o => (
                <button key={o} type="button" onClick={() => toggle(odalar, o, setOdalar)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${odalar.includes(o) ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bütçe</label>
            <input className={inputCls} value={butce} onChange={e => setButce(e.target.value)} placeholder="örn. 3.000.000 ₺" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Müşteri Bilgileri</label>
            <textarea className={`${inputCls} resize-none`} rows={2} value={musteri} onChange={e => setMusteri(e.target.value)} placeholder="Ad soyad, telefon..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Talep Alan Kişi</label>
            <div className="flex flex-col gap-1.5">
              {DANISMANLAR.map(d => (
                <button key={d} type="button" onClick={() => setDanisman(d)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border text-left transition-all ${danisman === d ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Portföy List ─── */
function PortfoyList() {
  const [items, setItems] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<PortfolioSubmission | null>(null);
  const busyRef = useRef(false);

  async function load() {
    if (busyRef.current) return;
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
    busyRef.current = true;
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) { busyRef.current = false; return; }
    setDeletingId(id);
    try {
      await portfolioSubmissionStore.delete(id);
      setItems(prev => prev.filter(s => s.id !== id));
    } finally { setDeletingId(null); busyRef.current = false; }
  }

  if (loading) return <div className="flex justify-center py-20 text-slate-400">Yükleniyor...</div>;

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Building2 size={40} className="text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">Henüz portföy bildirimi yok</p>
      <a href="/form/portfoy" className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
        <ExternalLink size={14} /> Yeni Portföy Ekle
      </a>
    </div>
  );

  return (
    <>
      {editing && (
        <PortfoyEditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={updated => { setItems(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditing(null); }}
        />
      )}
      <div className="grid gap-3">
        {items.map(s => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(s.gayrimenkul_tipi || s.islem_turu) && (
                  <div className="flex items-center gap-2">
                    <Home size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 font-medium">{[s.gayrimenkul_tipi, s.islem_turu].filter(Boolean).join(" · ")}</span>
                  </div>
                )}
                {s.konum && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{s.konum}</span>
                  </div>
                )}
                {s.oda_sayisi && (
                  <div className="flex items-center gap-2">
                    <Home size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{s.oda_sayisi}</span>
                  </div>
                )}
                {s.fiyat && (
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{s.fiyat}</span>
                  </div>
                )}
                {s.musteri_bilgileri && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <Users size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{s.musteri_bilgileri}</span>
                  </div>
                )}
                {s.gorsel_urls && (
                  <div className="sm:col-span-2">
                    {s.gorsel_urls.startsWith("http") ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {s.gorsel_urls.split(", ").map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Görsel ${i+1}`} className="w-14 h-14 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <a href={s.gorsel_urls} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ExternalLink size={11} /> Görseller
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">
                  {new Date(s.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(s)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Talep List ─── */
function TalepList() {
  const [items, setItems] = useState<TalepSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<TalepSubmission | null>(null);
  const busyRef = useRef(false);

  async function load() {
    if (busyRef.current) return;
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
    busyRef.current = true;
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) { busyRef.current = false; return; }
    setDeletingId(id);
    try {
      await talepSubmissionStore.delete(id);
      setItems(prev => prev.filter(s => s.id !== id));
    } finally { setDeletingId(null); busyRef.current = false; }
  }

  if (loading) return <div className="flex justify-center py-20 text-slate-400">Yükleniyor...</div>;

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ClipboardList size={40} className="text-slate-300 mb-3" />
      <p className="text-slate-500 font-medium">Henüz müşteri talebi yok</p>
      <a href="/form/talep" className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
        <ExternalLink size={14} /> Yeni Talep Ekle
      </a>
    </div>
  );

  return (
    <>
      {editing && (
        <TalepEditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={updated => { setItems(prev => prev.map(s => s.id === updated.id ? updated : s)); setEditing(null); }}
        />
      )}
      <div className="grid gap-3">
        {items.map(s => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.tipi && (
                  <div className="flex items-center gap-2">
                    <Home size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 font-medium">{s.tipi}</span>
                  </div>
                )}
                {s.oda_sayisi && (
                  <div className="flex items-center gap-2">
                    <Home size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{s.oda_sayisi}</span>
                  </div>
                )}
                {s.butce && (
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">{s.butce}</span>
                  </div>
                )}
                {s.musteri_bilgileri && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <Users size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{s.musteri_bilgileri}</span>
                  </div>
                )}
                {s.talep_alan_kisi && (
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-purple-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Talep alan: <span className="font-medium text-slate-800">{s.talep_alan_kisi}</span></span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs text-slate-400">
                  {new Date(s.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(s)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Ana Sayfa ─── */
export default function TaleplerPage() {
  const [tab, setTab] = useState<Tab>("portfoy");
  const formLinks: Record<Tab, string> = { portfoy: "/form/portfoy", talep: "/form/talep" };

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
        <a href={formLinks[tab]} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
          <ExternalLink size={14} /> {tab === "portfoy" ? "Yeni Portföy" : "Yeni Talep"}
        </a>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        <button onClick={() => setTab("portfoy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "portfoy" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <Building2 size={15} /> Portföy
        </button>
        <button onClick={() => setTab("talep")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "talep" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <ClipboardList size={15} /> Müşteri Talebi
        </button>
      </div>

      {tab === "portfoy" ? <PortfoyList /> : <TalepList />}
    </div>
  );
}
