"use client";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Building2, CheckCircle2, Loader2, Camera, X, ImagePlus } from "lucide-react";

const TIPLER = ["Konut", "Ticari", "Arsa", "Villa"];
const ISLEM = ["Satılık", "Kiralık"];
const ODALAR = ["2+1", "3+1", "4+1", "5+1"];

interface PhotoPreview {
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploadedUrl?: string;
  error?: boolean;
}

export default function PortfoyFormPage() {
  const [tip, setTip] = useState("");
  const [islem, setIslem] = useState("");
  const [konum, setKonum] = useState("");
  const [odalar, setOdalar] = useState<string[]>([]);
  const [fiyat, setFiyat] = useState("");
  const [musteri, setMusteri] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function toggleOda(o: string) {
    setOdalar(prev => prev.includes(o) ? prev.filter(x => x !== o) : [...prev, o]);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos: PhotoPreview[] = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);

    for (const photo of newPhotos) {
      try {
        const ext = photo.file.name.split(".").pop() ?? "jpg";
        const path = `portfoy/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("form-uploads")
          .upload(path, photo.file, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("form-uploads").getPublicUrl(path);
        setPhotos(prev => prev.map(p =>
          p.previewUrl === photo.previewUrl
            ? { ...p, uploading: false, uploadedUrl: data.publicUrl }
            : p
        ));
      } catch {
        setPhotos(prev => prev.map(p =>
          p.previewUrl === photo.previewUrl
            ? { ...p, uploading: false, error: true }
            : p
        ));
      }
    }
  }

  function removePhoto(previewUrl: string) {
    setPhotos(prev => {
      const photo = prev.find(p => p.previewUrl === previewUrl);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter(p => p.previewUrl !== previewUrl);
    });
  }

  function reset() {
    photos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setDone(false); setTip(""); setIslem(""); setKonum("");
    setOdalar([]); setFiyat(""); setMusteri(""); setPhotos([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stillUploading = photos.some(p => p.uploading);
    if (stillUploading) { setError("Fotoğraflar yükleniyor, lütfen bekleyin..."); return; }
    setLoading(true);
    setError("");
    try {
      const uploadedUrls = photos.filter(p => p.uploadedUrl).map(p => p.uploadedUrl!).join(", ");
      const { error: err } = await supabase.from("portfolio_submissions").insert([{
        gayrimenkul_tipi: tip,
        islem_turu: islem,
        konum,
        oda_sayisi: odalar.join(", "),
        fiyat,
        musteri_bilgileri: musteri,
        gorsel_urls: uploadedUrls || undefined,
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
        <p className="text-sm text-slate-500 mb-6">Portföy bildirimi alındı.</p>
        <div className="flex gap-2">
          <button onClick={reset}
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
            <Building2 size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Portföy Bildirimi</h1>
            <p className="text-xs text-slate-500">Yeni portföy kaydı ekle</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
          {/* Gayrimenkul Tipi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Gayrimenkul Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPLER.map(t => (
                <button key={t} type="button" onClick={() => setTip(t)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${tip === t ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* İşlem Türü */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">İşlem Türü</label>
            <div className="grid grid-cols-2 gap-2">
              {ISLEM.map(i => (
                <button key={i} type="button" onClick={() => setIslem(i)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${islem === i ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Konum */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Konum Bilgileri</label>
            <input type="text" value={konum} onChange={e => setKonum(e.target.value)}
              placeholder="İlçe, mahalle, cadde..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all" />
          </div>

          {/* Oda Sayısı */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Oda Sayısı</label>
            <div className="grid grid-cols-4 gap-2">
              {ODALAR.map(o => (
                <button key={o} type="button" onClick={() => toggleOda(o)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${odalar.includes(o) ? "bg-amber-500 border-amber-500 text-white" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Fiyat */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Portföy Fiyatı</label>
            <input type="text" value={fiyat} onChange={e => setFiyat(e.target.value)}
              placeholder="örn. 2.500.000 ₺"
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

          {/* Görseller */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Görseller
              {photos.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400">{photos.length} fotoğraf</span>}
            </label>

            {/* Önizlemeler */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map(p => (
                  <div key={p.previewUrl} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    {p.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 size={18} className="text-white animate-spin" />
                      </div>
                    )}
                    {p.error && (
                      <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Hata</span>
                      </div>
                    )}
                    {!p.uploading && (
                      <button type="button" onClick={() => removePhoto(p.previewUrl)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                        <X size={10} className="text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Yükleme butonu */}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-amber-600">
              {photos.length === 0
                ? <><Camera size={16} /> Fotoğraf Ekle</>
                : <><ImagePlus size={16} /> Daha Fazla Ekle</>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
            <p className="text-xs text-slate-400 mt-1.5 text-center">JPG, PNG, WEBP · Maks. 10MB / fotoğraf</p>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading || photos.some(p => p.uploading)}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {photos.some(p => p.uploading) ? "Fotoğraflar yükleniyor..." : "Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}
