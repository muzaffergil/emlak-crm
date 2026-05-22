"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Users, Trash2, Phone, Mail, Plus, X, ChevronDown, Pencil, Home, MessageCircle, MapPin, TrendingUp, Ruler, DoorOpen, ArrowLeft } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { clientStore, propertyStore, type Client, type Property } from "@/lib/storage";
import { MultiLocationPicker } from "@/components/LocationPicker";

const PropertyLocationMap = dynamic(() => import("@/components/PropertyLocationMap"), {
  ssr: false,
  loading: () => <div className="h-36 bg-slate-100 rounded-lg animate-pulse" />,
});

const INTENT_LABELS: Record<string, string> = {
  aliyor: "Alıcı",
  kiraciyor: "Kiracı",
  satiyor: "Satıcı",
  kiraya_veriyor: "Kiraya Veren",
};

const ROOMS_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "5+2", "6+1"];
const PROPERTY_TYPE_OPTIONS = ["Daire", "Villa", "Müstakil Ev", "Arsa", "Dükkan", "Ofis", "Bina", "Depo", "Tarla"];
const FEATURE_OPTIONS = ["Balkon", "Teras", "Bahçe", "Otopark", "Garaj", "Asansör", "Güvenlik", "Site içi", "Havuz", "Spor salonu", "Sauna", "Ebeveyn banyosu", "Amerikan mutfak", "Doğalgaz", "Kombi", "Klima", "Depolu", "Deniz manzarası", "Şehir manzarası", "Yeni bina", "Sıfır", "Krediye uygun"];

function MultiCheckboxDropdown({
  placeholder,
  options,
  selected,
  onChange,
}: {
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option]);
  }

  const label =
    selected.length === 0 ? placeholder :
    selected.length <= 2 ? selected.join(", ") :
    `${selected.length} seçildi`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-300 flex items-center justify-between bg-white"
      >
        <span className={selected.length === 0 ? "text-slate-400" : "text-slate-700 truncate"}>{label}</span>
        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
          {options.length > 6 && (
            <div className="p-2 border-b border-slate-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                autoFocus
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-300"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((option) => (
              <label key={option} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-amber-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => toggle(option)}
                  className="accent-amber-500 w-3.5 h-3.5 flex-shrink-0"
                />
                <span className="text-sm text-slate-700">{option}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Sonuç yok</p>
            )}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-slate-100 flex flex-wrap gap-1">
              {selected.map((s) => (
                <span key={s} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => toggle(s)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function waLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "90")}`;
}

function ClientDetailModal({ client, onClose, onEdit, onDelete }: {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800 text-base">{client.name}</h2>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mt-1.5 inline-block">
              {INTENT_LABELS[client.intent] || client.intent}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-3"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {(client.phone || client.email) && (
            <div className="space-y-2">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <a href={`tel:${client.phone}`} className="text-sm text-slate-600 flex items-center gap-1.5 hover:underline">
                    <Phone size={13} className="text-slate-400" /> {client.phone}
                  </a>
                  <a href={waLink(client.phone)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors">
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                </div>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="text-sm text-slate-600 flex items-center gap-1.5 hover:underline">
                  <Mail size={13} className="text-slate-400" /> {client.email}
                </a>
              )}
            </div>
          )}

          {client.property_types.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1.5">Gayrimenkul Tipi</p>
              <div className="flex flex-wrap gap-1.5">
                {client.property_types.map(t => <span key={t} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">{t}</span>)}
              </div>
            </div>
          )}

          {(client.districts.length > 0 || (client.neighborhoods ?? []).length > 0) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1.5">Konum Tercihi</p>
              <div className="flex flex-wrap gap-1.5">
                {client.districts.map(d => <span key={d} className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full">{d}</span>)}
                {(client.neighborhoods ?? []).map(n => <span key={n} className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-1 rounded-full">{n}</span>)}
              </div>
            </div>
          )}

          {(client.budget_min || client.budget_max || client.size_min || client.size_max) && (
            <div className="grid grid-cols-2 gap-2">
              {(client.budget_min || client.budget_max) && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Bütçe</p>
                  <p className="text-sm font-medium text-slate-700">
                    {client.budget_min && client.budget_max
                      ? `${client.budget_min.toLocaleString("tr-TR")} ₺ – ${client.budget_max.toLocaleString("tr-TR")} ₺`
                      : client.budget_min ? `min ${client.budget_min.toLocaleString("tr-TR")} ₺`
                      : `max ${client.budget_max!.toLocaleString("tr-TR")} ₺`}
                  </p>
                </div>
              )}
              {(client.size_min || client.size_max) && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">Metrekare</p>
                  <p className="text-sm font-medium text-slate-700">
                    {client.size_min && client.size_max
                      ? `${client.size_min} m² – ${client.size_max} m²`
                      : client.size_min ? `min ${client.size_min} m²`
                      : `max ${client.size_max} m²`}
                  </p>
                </div>
              )}
            </div>
          )}

          {client.rooms && (Array.isArray(client.rooms) ? client.rooms : [client.rooms]).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1.5">Oda Sayısı</p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(client.rooms) ? client.rooms : [client.rooms]).map(r => (
                  <span key={r} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">{r}</span>
                ))}
              </div>
            </div>
          )}

          {client.features_wanted.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1.5">İstenen Özellikler</p>
              <div className="flex flex-wrap gap-1.5">
                {client.features_wanted.map(f => <span key={f} className="bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-full">{f}</span>)}
              </div>
            </div>
          )}

          {client.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Notlar</p>
              <p className="text-sm text-slate-600 leading-relaxed">{client.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onDelete} className="flex items-center gap-1.5 px-4 py-2 border border-red-200 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Sil
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Pencil size={14} /> Düzenle
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  musait:  { label: "Müsait",  color: "bg-green-100 text-green-800" },
  satildi: { label: "Satıldı", color: "bg-red-100 text-red-800" },
  kiralik: { label: "Kiralık", color: "bg-blue-100 text-blue-800" },
  rezerve: { label: "Rezerve", color: "bg-yellow-100 text-yellow-800" },
};

function PropertyDetailView({ property, onBack }: { property: Property; onBack: () => void }) {
  const st = STATUS_LABELS[property.status] || { label: property.status, color: "bg-slate-100 text-slate-700" };
  const hasDetails = property.size || property.rooms || property.floor != null;
  return (
    <>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm">
          <ArrowLeft size={15} /> Geri
        </button>
      </div>

      <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
        <div>
          <h3 className="font-semibold text-slate-800 text-base leading-tight">{property.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full capitalize">{property.type}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              {property.price_type === "kira" ? "Kiralık" : "Satılık"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin size={14} className="text-slate-400 flex-shrink-0" />
          {[property.neighborhood, property.district, property.city].filter(Boolean).join(", ")}
        </div>

        {property.price && (
          <p className="text-2xl font-bold text-slate-800">{property.price.toLocaleString("tr-TR")} ₺</p>
        )}

        {hasDetails && (
          <div className="grid grid-cols-3 gap-2">
            {property.size && (
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400 mb-0.5"><Ruler size={10} className="inline" /> Alan</p>
                <p className="text-sm font-semibold text-slate-700">{property.size} m²</p>
              </div>
            )}
            {property.rooms && (
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400 mb-0.5"><DoorOpen size={10} className="inline" /> Oda</p>
                <p className="text-sm font-semibold text-slate-700">{property.rooms}</p>
              </div>
            )}
            {property.floor != null && (
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Kat</p>
                <p className="text-sm font-semibold text-slate-700">{property.floor}{property.total_floors ? `/${property.total_floors}` : ""}</p>
              </div>
            )}
          </div>
        )}

        {property.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {property.features.map(f => (
              <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{f}</span>
            ))}
          </div>
        )}

        {property.photos && property.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {property.photos.map((url, i) => (
              <img key={i} src={url} alt="" className="w-24 h-24 flex-shrink-0 rounded-lg object-cover border border-slate-200" />
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Konum</p>
          <PropertyLocationMap property={property} />
        </div>

        {property.description && (
          <p className="text-sm text-slate-600 leading-relaxed">{property.description}</p>
        )}
      </div>
    </>
  );
}

function DerivedSellerModal({ seller, allProperties, onClose }: {
  seller: { name: string; phone?: string; count: number; types: Set<string> };
  allProperties: Property[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Property | null>(null);

  const sellerProps = allProperties.filter(
    p => p.owner_name?.trim().toLowerCase() === seller.name.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Başlık — her zaman görünür */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">{seller.name}</h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1">
              <Home size={10} /> Portföy Sahibi
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-3"><X size={18} /></button>
        </div>

        {selected ? (
          <PropertyDetailView property={selected} onBack={() => setSelected(null)} />
        ) : (
          <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
            {/* İletişim */}
            {seller.phone && (
              <div className="flex items-center gap-2">
                <a href={`tel:${seller.phone}`} className="text-sm text-slate-600 flex items-center gap-1.5 hover:underline">
                  <Phone size={13} className="text-slate-400" /> {seller.phone}
                </a>
                <a href={waLink(seller.phone)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors">
                  <MessageCircle size={12} /> WhatsApp
                </a>
              </div>
            )}

            {/* Portföy listesi */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Portföyler ({sellerProps.length})</p>
              <div className="space-y-2">
                {sellerProps.map(p => {
                  const st = STATUS_LABELS[p.status] || { label: p.status, color: "bg-slate-100 text-slate-700" };
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-slate-800 text-sm leading-tight">{p.title}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-slate-500">
                        {[p.neighborhood, p.district].filter(Boolean).length > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {[p.neighborhood, p.district].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {p.price && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <TrendingUp size={10} /> {p.price.toLocaleString("tr-TR")} ₺
                          </span>
                        )}
                        {p.size && <span>{p.size} m²</span>}
                        {p.rooms && <span>{p.rooms}</span>}
                      </div>
                    </div>
                  );
                })}
                {sellerProps.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3">Portföy bulunamadı.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-100">
          <button onClick={onClose} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Kapat</button>
        </div>
      </div>
    </div>
  );
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  intent: "aliyor",
  property_types: [] as string[],
  cities: [] as string[],
  districts: [] as string[],
  neighborhoods: [] as string[],
  budget_min: "",
  budget_max: "",
  size_min: "",
  size_max: "",
  rooms: [] as string[],
  features_wanted: [] as string[],
  notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [viewingSeller, setViewingSeller] = useState<{ name: string; phone?: string; count: number; types: Set<string> } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<Client | null>(null);

  useEffect(() => {
    Promise.all([clientStore.getAll(), propertyStore.getAll()])
      .then(([c, p]) => { setClients(c); setProperties(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Portföy sahiplerinden türetilen satıcılar (manuel kayıt yoksa)
  const derivedSellers = useMemo(() => {
    const map = new Map<string, { name: string; phone?: string; count: number; types: Set<string> }>();
    for (const p of properties) {
      if (!p.owner_name) continue;
      const key = p.owner_name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, { name: p.owner_name, phone: p.owner_phone, count: 0, types: new Set() });
      const e = map.get(key)!;
      e.count++;
      e.types.add(p.price_type === "kira" ? "Kiralık" : "Satılık");
    }
    return Array.from(map.values());
  }, [properties]);

  async function deleteClient(id: number) {
    await clientStore.delete(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    setViewingClient(null);
    setConfirmDeleteId(null);
  }

  function startEdit(c: Client) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      intent: c.intent,
      property_types: c.property_types,
      cities: c.cities,
      districts: c.districts,
      neighborhoods: c.neighborhoods ?? [],
      budget_min: c.budget_min != null ? String(c.budget_min) : "",
      budget_max: c.budget_max != null ? String(c.budget_max) : "",
      size_min: c.size_min != null ? String(c.size_min) : "",
      size_max: c.size_max != null ? String(c.size_max) : "",
      rooms: c.rooms ?? [],
      features_wanted: c.features_wanted,
      notes: c.notes || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = {
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      intent: form.intent,
      property_types: form.property_types,
      cities: form.cities,
      districts: form.districts,
      neighborhoods: form.neighborhoods,
      budget_min: form.budget_min ? Number(form.budget_min) : undefined,
      budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      size_min: form.size_min ? Number(form.size_min) : undefined,
      size_max: form.size_max ? Number(form.size_max) : undefined,
      rooms: form.rooms.length > 0 ? form.rooms : undefined,
      features_wanted: form.features_wanted,
      notes: form.notes || undefined,
    };

    try {
      if (editingId != null) {
        await clientStore.update(editingId, data);
        const updated = await clientStore.getAll();
        setClients(updated);
      } else {
        const newClient = await clientStore.add(data);
        setClients((prev) => [newClient, ...prev]);
      }
      cancelForm();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {viewingClient && (
        <ClientDetailModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
          onEdit={() => { startEdit(viewingClient); setViewingClient(null); }}
          onDelete={() => { setViewingClient(null); setConfirmDeleteId(viewingClient); }}
        />
      )}
      {viewingSeller && (
        <DerivedSellerModal seller={viewingSeller} allProperties={properties} onClose={() => setViewingSeller(null)} />
      )}
      {confirmDeleteId && (
        <ConfirmDialog
          message={`"${confirmDeleteId.name}" adlı müşteriyi silmek istediğinizden emin misiniz?`}
          confirmLabel="Evet, Sil"
          onConfirm={() => deleteClient(confirmDeleteId.id)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
      <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            Müşteriler
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? "Yükleniyor..." : `${clients.length} müşteri`}
          </p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
          <Plus size={15} /> Müşteri Ekle
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6 shadow-sm ring-1 ring-black/[0.03]">
          <h2 className="font-semibold text-slate-800 mb-4">{editingId != null ? "Müşteriyi Düzenle" : "Yeni Müşteri / İhtiyaç"}</h2>
          <form onSubmit={saveClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Ad Soyad *</label>
                <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Telefon</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">E-posta</label>
                <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">İşlem Tipi *</label>
                <select value={form.intent} onChange={(e) => setForm((p) => ({ ...p, intent: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                  <option value="aliyor">Satın Alıyor</option>
                  <option value="kiraciyor">Kiralamak İstiyor</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Oda Sayısı</label>
                <MultiCheckboxDropdown
                  placeholder="Seçiniz..."
                  options={ROOMS_OPTIONS}
                  selected={form.rooms}
                  onChange={(v) => setForm((p) => ({ ...p, rooms: v }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Gayrimenkul Tipleri</label>
              <MultiCheckboxDropdown
                placeholder="Daire, Villa, Arsa..."
                options={PROPERTY_TYPE_OPTIONS}
                selected={form.property_types}
                onChange={(v) => setForm((p) => ({ ...p, property_types: v }))}
              />
            </div>

            <MultiLocationPicker
              districts={form.districts}
              neighborhoods={form.neighborhoods}
              onDistrictsChange={(v) => setForm((p) => ({ ...p, districts: v }))}
              onNeighborhoodsChange={(v) => setForm((p) => ({ ...p, neighborhoods: v }))}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[["budget_min","Min Bütçe (₺)"],["budget_max","Max Bütçe (₺)"],["size_min","Min m²"],["size_max","Max m²"]].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
                  <input type="number" value={form[key as keyof typeof emptyForm] as string}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">İstenen Özellikler</label>
              <MultiCheckboxDropdown
                placeholder="Balkon, Otopark, Asansör..."
                options={FEATURE_OPTIONS}
                selected={form.features_wanted}
                onChange={(v) => setForm((p) => ({ ...p, features_wanted: v }))}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Notlar</label>
              <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={cancelForm} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">İptal</button>
              <button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-60">
                {saving ? "Kaydediliyor..." : editingId != null ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <p>Müşteriler yükleniyor...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>Henüz müşteri eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Alıcılar kolonu */}
          <div>
            {(() => {
              const group = clients.filter((c) => ["aliyor", "kiraciyor"].includes(c.intent));
              return (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3 text-emerald-700 bg-emerald-50 border-emerald-200 shadow-sm">
                    <span className="font-semibold text-sm">Alıcılar</span>
                    <span className="text-xs font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{group.length} kişi</span>
                  </div>
                  {group.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Kayıt yok</p>
                  ) : (
                    <div className="space-y-3">
                      {group.map((c) => (
                        <div key={c.id} onClick={() => setViewingClient(c)} className="group bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-800">{c.name}</h3>
                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{INTENT_LABELS[c.intent] || c.intent}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                                {c.phone && <span className="flex items-center gap-1"><Phone size={11} />{c.phone}</span>}
                                {c.email && <span className="flex items-center gap-1"><Mail size={11} />{c.email}</span>}
                              </div>
                              <div className="flex flex-wrap gap-1 text-xs">
                                {c.property_types.map((t) => <span key={t} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>)}
                                {c.cities.map((city) => <span key={city} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{city}</span>)}
                                {c.districts.map((d) => <span key={d} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{d}</span>)}
                                {(c.neighborhoods ?? []).map((n) => <span key={n} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{n}</span>)}
                                {c.rooms && (Array.isArray(c.rooms) ? c.rooms : [c.rooms]).map((r) => (
                                  <span key={r} className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{r}</span>
                                ))}
                                {c.budget_max && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">max {c.budget_max.toLocaleString("tr-TR")} ₺</span>}
                                {c.features_wanted.map((f) => <span key={f} className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>)}
                              </div>
                              {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
                            </div>
                            <div className="flex items-center gap-1 ml-3">
                              <button onClick={e => { e.stopPropagation(); startEdit(c); }} className="text-slate-300 hover:text-amber-500 p-1"><Pencil size={14} /></button>
                              <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(c); }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Satıcılar kolonu — sadece portföy sahiplerinden türetilir */}
          <div>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3 text-blue-700 bg-blue-50 border-blue-200 shadow-sm">
              <span className="font-semibold text-sm">Satıcılar</span>
              <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{derivedSellers.length} kişi</span>
            </div>
            {derivedSellers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Portföyde kayıtlı mülk sahibi yok.
              </p>
            ) : (
              <div className="space-y-3">
                {derivedSellers.map((s) => (
                  <div
                    key={`derived-${s.name}`}
                    onClick={() => setViewingSeller(s)}
                    className="bg-white rounded-2xl border border-dashed border-blue-200 shadow-sm ring-1 ring-blue-50 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{s.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Home size={10} /> Portföy Sahibi
                      </span>
                    </div>
                    {s.phone && (
                      <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <Phone size={11} />{s.phone}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{s.count} portföy</span>
                      {Array.from(s.types).map(t => (
                        <span key={t} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
