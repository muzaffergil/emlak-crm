"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Building2, MapPin, Ruler, DoorOpen, LogIn } from "lucide-react";
import { propertyStore, favoriteStore, type Property } from "@/lib/storage";
import { useBuyer } from "@/components/BuyerContext";

export default function FavorilerPage() {
  const { user, loading: authLoading } = useBuyer();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      favoriteStore.getAll(),
      propertyStore.getMusait(),
    ]).then(([ids, all]) => {
      const idSet = new Set(ids);
      setFavIds(idSet);
      setProperties(all.filter(p => idSet.has(p.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  async function removeFav(id: number) {
    await favoriteStore.toggle(id).catch(() => {});
    setProperties(prev => prev.filter(p => p.id !== id));
    setFavIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="text-center py-20">
        <Heart size={40} className="mx-auto text-slate-200 mb-3" />
        <p className="text-slate-600 font-medium">Favorileri görmek için giriş yapın</p>
        <Link href="/alici/giris"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors text-sm">
          <LogIn size={15} /> Giriş Yap
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-slate-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-9 h-9 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
          <Heart size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Favorilerim</h1>
          <p className="text-sm text-slate-500">{properties.length} kaydedilmiş portföy</p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Henüz favori eklemediniz</p>
          <p className="text-sm text-slate-400 mt-1">Portföylere ♥ basarak favorilerinize ekleyebilirsiniz.</p>
          <Link href="/alici" className="inline-flex mt-4 text-sm text-amber-600 hover:underline">Portföylere göz at →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map(p => {
            const location = [p.neighborhood, p.district].filter(Boolean).join(", ");
            const photos = p.photos ?? [];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <Link href={`/alici/portfoy?id=${p.id}`}>
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {photos.length > 0
                      ? <img src={photos[0]} alt={p.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center"><Building2 size={28} className="text-slate-300" /></div>
                    }
                    {p.price && (
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 font-bold text-sm px-2.5 py-1 rounded-xl shadow-sm">
                        {p.price >= 1_000_000
                          ? `${(p.price / 1_000_000).toFixed(1)}M ₺`
                          : `${p.price.toLocaleString("tr-TR")} ₺`}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-800 leading-snug line-clamp-2 mb-1.5">{p.title}</p>
                    {location && (
                      <p className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <MapPin size={11} /> {location}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {p.size && <span className="flex items-center gap-0.5"><Ruler size={11} /> {p.size} m²</span>}
                      {p.rooms && <span className="flex items-center gap-0.5"><DoorOpen size={11} /> {p.rooms}</span>}
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => removeFav(p.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-xl transition-colors"
                  >
                    <Heart size={13} className="fill-current" /> Favorilerden çıkar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
