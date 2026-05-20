"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Building2, Users, Zap, PlusCircle, Download, Upload, Loader2, Menu, X } from "lucide-react";
import { propertyStore, clientStore, matchStore } from "@/lib/storage";

const links = [
  { href: "/", label: "Portföy", icon: Building2 },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/matches", label: "Eşleşmeler", icon: Zap },
  { href: "/add-property", label: "Portföy Ekle", icon: PlusCircle },
];

async function exportData() {
  const [properties, clients, matches] = await Promise.all([
    propertyStore.getAll(),
    clientStore.getAll(),
    matchStore.getAll(),
  ]);
  const data = { emlak_properties: properties, emlak_clients: clients, emlak_matches: matches };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `emlak-yedek-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(file: File) {
  const text = await file.text();
  const data = JSON.parse(text);

  await matchStore.deleteAll();
  await clientStore.deleteAll();
  await propertyStore.deleteAll();

  if (Array.isArray(data.emlak_properties) && data.emlak_properties.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const props = data.emlak_properties.map(({ id, created_at, ...rest }: { id: unknown; created_at: unknown; [k: string]: unknown }) => rest);
    await propertyStore.addMany(props);
  }

  if (Array.isArray(data.emlak_clients) && data.emlak_clients.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cls = data.emlak_clients.map(({ id, created_at, ...rest }: { id: unknown; created_at: unknown; [k: string]: unknown }) => rest);
    await clientStore.addMany(cls);
  }

  window.location.reload();
}

export default function Navbar() {
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleExport() {
    setExporting(true);
    setMenuOpen(false);
    try { await exportData(); } finally { setExporting(false); }
  }

  async function handleImport(file: File) {
    if (!confirm("Mevcut tüm veriler silinip yeni dosya yüklenecek. Devam edilsin mi?")) return;
    setImporting(true);
    setMenuOpen(false);
    try { await importData(file); } catch { alert("Dosya okunamadı."); setImporting(false); }
  }

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Ana satır */}
        <div className="flex items-center h-14">
          <span className="font-bold text-lg text-amber-500 mr-6">EmlakCRM</span>

          {/* Masaüstü linkleri */}
          <div className="hidden md:flex items-center gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-amber-500 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Masaüstü dışa/içe aktar */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Verileri dışa aktar"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Dışa Aktar
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Verileri içe aktar"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              İçe Aktar
            </button>
          </div>

          {/* Mobil hamburger butonu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden ml-auto p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Menü"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobil açılır menü */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-2 flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-amber-500 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1 flex flex-col gap-1">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                Dışa Aktar
              </button>
              <button
                onClick={() => { setMenuOpen(false); fileRef.current?.click(); }}
                disabled={importing}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                İçe Aktar
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleImport(e.target.files[0]); }}
      />
    </nav>
  );
}
