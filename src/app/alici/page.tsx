"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Ruler, DoorOpen, Heart, Search, SlidersHorizontal, Building2 } from "lucide-react";
import { propertyStore, favoriteStore, type Property } from "@/lib/storage";
import { useBuyer } from "@/components/BuyerContext";

const TYPE_OPTIONS = ["Daire", "Müstakil", "Villa", "Arsa", "İşyeri", "Depo"];

export default function AliciPortfoyPage() {
  const { user } = useBuyer();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    propertyStore.getMusait()
      .then(p => { setProperties(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    favoriteStore.getAll().then(ids => setFavIds(new Set(ids))).catch(() => {});
  }, [user]);

  async function toggleFav(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { window.location.href = "/alici/giris"; return; }
    const nowFav = await favoriteStore.toggle(id).catch(() => favIds.has(id));
    setFavIds(prev => {
      const next = new Set(prev);
      if (nowFav) next.add(id); else next.delete(id);
      return next;
    });
  }

  const districts = useMemo(() =>
    [...new Set(properties.map(p => p.district).filter(Boolean) as string[])].sort(),
    [properties]
  );

  const filtered = useMemo(() => properties.filter(p => {
    if (typeFilter && p.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (districtFilter && p.district !== districtFilter) return false;
    if (maxPrice && p.price && p.price > Number(maxPrice) * 1_000_000) return false;
    if (search) {
      const q = search.toLowerCase();
      const text = `${p.title} ${p.district} ${p.neighborhood} ${p.city}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  }), [properties, typeFilter, districtFilter, maxPrice, search]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Başlık, ilçe veya mahalle ara..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${showFilters ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
        >
          <SlidersHorizontal size={15} /> Filtre
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tip</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="">Tümü</option>
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">İlçe</label>
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="">Tümü</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Max Fiyat (Milyon ₺)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="örn: 5"
              min={0}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>
      )}

      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{filtered.length}</span> müsait portföy
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">Uygun portföy bulunamadı</p>
          <p className="text-sm text-slate-400 mt-1">Filtreleri değiştirmeyi deneyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const location = [p.neighborhood, p.district].filter(Boolean).join(", ");
            const photos = p.photos ?? [];
            const isFav = favIds.has(p.id);

            return (
              <Link
                key={p.id}
                href={`/alici/portfoy?id=${p.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group"
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  {photos.length > 0 ? (
                    <img src={photos[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={32} className="text-slate-300" />
                    </div>
                  )}
                  {/* Price badge */}
                  {p.price && (
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 font-bold text-sm px-2.5 py-1 rounded-xl shadow-sm">
                      {p.price >= 1_000_000
                        ? `${(p.price / 1_000_000).toFixed(1)}M ₺`
                        : `${p.price.toLocaleString("tr-TR")} ₺`}
                      {p.price_type === "kira" && <span className="font-normal text-xs text-slate-500">/ay</span>}
                    </div>
                  )}
                  {/* Fav button */}
                  <button
                    onClick={e => toggleFav(p.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
                  >
                    <Heart size={14} className={isFav ? "text-red-400 fill-red-400" : "text-white/80"} />
                  </button>
                </div>

                {/* Info */}
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
                    <span className="ml-auto capitalize text-amber-600 font-medium">{p.type}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
