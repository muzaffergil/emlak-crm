"use client";
import { useEffect, useState } from "react";
import { Users, Trash2, Phone, Mail, Plus, X } from "lucide-react";
import { clientStore, type Client } from "@/lib/storage";

const INTENT_LABELS: Record<string, string> = {
  aliyor: "Alıcı",
  kiraciyor: "Kiracı",
  satiyor: "Satıcı",
  kiraya_veriyor: "Kiraya Veren",
};

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
  rooms: "",
  features_wanted: [] as string[],
  notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [tagInput, setTagInput] = useState({ cities: "", districts: "", property_types: "", features_wanted: "" });

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
      rooms: form.rooms || undefined,
      features_wanted: form.features_wanted,
      notes: form.notes || undefined,
    });
    setClients((prev) => [newClient, ...prev]);
    setForm({ ...emptyForm });
    setShowForm(false);
  }

  function addTag(field: keyof typeof tagInput) {
    const val = tagInput[field].trim();
    if (!val) return;
    setForm((prev) => ({ ...prev, [field]: [...(prev[field as keyof typeof emptyForm] as string[]), val] }));
    setTagInput((prev) => ({ ...prev, [field]: "" }));
  }

  function removeTag(field: keyof typeof emptyForm, val: string) {
    setForm((prev) => ({ ...prev, [field]: (prev[field] as string[]).filter((v) => v !== val) }));
  }

  const TagInput = ({ field, placeholder }: { field: keyof typeof tagInput; placeholder: string }) => (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">
        {(form[field as keyof typeof emptyForm] as string[]).map((v) => (
          <span key={v} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            {v}
            <button type="button" onClick={() => removeTag(field as keyof typeof emptyForm, v)}><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input type="text" value={tagInput[field]}
          onChange={(e) => setTagInput((p) => ({ ...p, [field]: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(field))}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
        <button type="button" onClick={() => addTag(field)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm">Ekle</button>
      </div>
    </div>
  );

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
                <label className="text-xs font-medium text-slate-600 block mb-1">Oda Sayısı (örn: 3+1)</label>
                <input value={form.rooms} onChange={(e) => setForm((p) => ({ ...p, rooms: e.target.value }))} placeholder="3+1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Gayrimenkul Tipleri</label>
              <TagInput field="property_types" placeholder="daire, villa, arsa..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Şehirler</label>
                <TagInput field="cities" placeholder="İstanbul, Ankara..." />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">İlçeler</label>
                <TagInput field="districts" placeholder="Kadıköy, Beşiktaş..." />
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
              <TagInput field="features_wanted" placeholder="balkon, otopark, asansör..." />
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
                    {c.rooms && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{c.rooms}</span>}
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
