"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { applyWatermark, uploadPropertyPhoto, deletePropertyPhoto } from "@/lib/watermark";
import { propertyStore } from "@/lib/storage";

interface Props {
  propertyId: number;
  photos: string[];
  onChange: (photos: string[]) => void;
}

function Lightbox({ photos, index, onClose, onNav }: {
  photos: string[]; index: number; onClose: () => void; onNav: (i: number) => void;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNav(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onNav(index + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, photos.length, onClose, onNav]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index - 1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      <img
        src={photos[index]}
        alt=""
        className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain select-none"
        onClick={e => e.stopPropagation()}
      />

      {index < photos.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index + 1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
        >
          <ChevronRight size={28} />
        </button>
      )}

      <button
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>,
    document.body
  );
}

export default function PhotoManager({ propertyId, photos, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const newPhotos = [...photos];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await applyWatermark(file);
        const url = await uploadPropertyPhoto(propertyId, blob);
        newPhotos.push(url);
      }
      await propertyStore.update(propertyId, { photos: newPhotos });
      onChange(newPhotos);
    } catch (e) {
      alert("Fotoğraf yüklenemedi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(url: string) {
    setDeleting(url);
    try {
      await deletePropertyPhoto(url);
      const newPhotos = photos.filter(p => p !== url);
      await propertyStore.update(propertyId, { photos: newPhotos });
      onChange(newPhotos);
    } catch (e) {
      alert("Fotoğraf silinemedi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxIdx(i)}
            />
            <button
              onClick={() => handleDelete(url)}
              disabled={deleting === url}
              className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {deleting === url ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-500 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
          <span className="text-xs">{uploading ? "Yükleniyor" : "Fotoğraf Ekle"}</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); }}
      />
    </>
  );
}
