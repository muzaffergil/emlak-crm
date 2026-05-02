"use client";
import { useEffect, useRef, useState } from "react";
import { Users, Trash2, Phone, Mail, Plus, X, ChevronDown } from "lucide-react";
import { clientStore, type Client } from "@/lib/storage";

const INTENT_LABELS: Record<string, string> = {
  aliyor: "Alıcı",
  kiraciyor: "Kiracı",
  satiyor: "Satıcı",
  kiraya_veriyor: "Kiraya Veren",
};

const ROOMS_OPTIONS = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1", "5+2", "6+1"];
const PROPERTY_TYPE_OPTIONS = ["Daire", "Villa", "Müstakil Ev", "Arsa", "Dükkan", "Ofis", "Bina", "Depo", "Tarla"];
const CITY_OPTIONS = ["Gaziantep", "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Kocaeli", "Mersin", "Diyarbakır", "Eskişehir", "Samsun", "Denizli", "Trabzon", "Kayseri", "Malatya", "Balıkesir"];
const DISTRICT_OPTIONS = ["Şahinbey", "Şehitkamil", "Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Yavuzeli"];
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

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  intent: "aliyor",
  property_types: [] as string[],
  cities: [] as string[],
  districts: [] as string[],
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => { setClients(clientStore.getAll()); }, []);

  function deleteClient(id: number) {
    if (!confirm("Bu müşteriyi silmek istiyor musunuz?")) return;
    clientStore.delete(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  function saveClient(e: React.FormEvent) {
    e.preventDefault();
    const newClient = clientStore.add({
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      intent: form.intent,
      property_types: form.property_types,
      cities: form.cities,
      districts: form.districts,
      budget_min: form.budget_min ? Number(form.budget_min) : undefined,
      budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      size_min: form.size_min ? Number(form.size_min) : undefined,
      size_max: form.size_max ? Number(form.size_max) : undefined,
      rooms: form.rooms.length > 0 ? form.rooms : undefined,
      features_wanted: form.features_wanted,
      notes: form.notes || undefined,
    });
    setClients((prev) => [newClient, ...prev]);
    setForm({ ...emptyForm });
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={24} className="text-amber-500" /> Müşteriler
          </h1>
          <p className="text-slate-500 text-sm mt-1">{clients.length} müşteri</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
          <Plus size={16} /> Müşteri Ekle
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Yeni Müşteri / İhtiyaç</h2>
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
                  <option value="satiyor">Satmak İstiyor</option>
                  <option value="kiraya_veriyor">Kiraya Vermek İstiyor</option>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Şehirler</label>
                <MultiCheckboxDropdown
                  placeholder="İstanbul, Gaziantep..."
                  options={CITY_OPTIONS}
                  selected={form.cities}
                  onChange={(v) => setForm((p) => ({ ...p, cities: v }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">İlçeler</label>
                <MultiCheckboxDropdown
                  placeholder="Şahinbey, Şehitkamil..."
                  options={DISTRICT_OPTIONS}
                  selected={form.districts}
                  onChange={(v) => setForm((p) => ({ ...p, districts: v }))}
                />
              </div>
            </div>

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

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">İptal</button>
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Kaydet</button>
            </div>
          </form>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>Henüz müşteri eklenmemiş.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
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
                    {c.rooms && (Array.isArray(c.rooms) ? c.rooms : [c.rooms]).map((r) => (
                      <span key={r} className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                    {c.budget_max && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">max {c.budget_max.toLocaleString("tr-TR")} ₺</span>}
                    {c.features_wanted.map((f) => <span key={f} className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{f}</span>)}
                  </div>
                  {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
                </div>
                <button onClick={() => deleteClient(c.id)} className="text-slate-300 hover:text-red-500 ml-3"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
