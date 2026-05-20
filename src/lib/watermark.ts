import { supabase } from "./supabase";

const WATERMARK_TEXT = "EstateIQ";
const MAX_DIM = 1920;

export async function applyWatermark(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          const r = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);

        const fontSize = Math.max(32, Math.min(w, h) / 6);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
        ctx.filter = "blur(1.5px)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(WATERMARK_TEXT, 0, 0);
        ctx.restore();

        URL.revokeObjectURL(objectUrl);
        canvas.toBlob(
          blob => { if (blob) resolve(blob); else reject(new Error("toBlob failed")); },
          "image/jpeg",
          0.88
        );
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Resim yüklenemedi")); };
    img.src = objectUrl;
  });
}

export async function uploadPropertyPhoto(propertyId: number, blob: Blob): Promise<string> {
  const path = `${propertyId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("property-photos")
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("property-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePropertyPhoto(url: string): Promise<void> {
  const marker = "/property-photos/";
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  const { error } = await supabase.storage.from("property-photos").remove([path]);
  if (error) throw error;
}
