"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Building2, Users, Zap, Download, Upload, Loader2, Menu, X, BadgeCheck, Map, LayoutDashboard } from "lucide-react";
import { propertyStore, clientStore, matchStore } from "@/lib/storage";
import ConfirmDialog from "@/components/ConfirmDialog";

const links = [
  { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/", label: "Portföy", icon: Building2 },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/matches", label: "Eşleşmeler", icon: Zap },
  { href: "/sales", label: "Satışlar", icon: BadgeCheck },
  { href: "/map", label: "Harita", icon: Map },
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
  a.download = `estateiq-yedek-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.json`;
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function handleExport() {
    setExporting(true);
    setMenuOpen(false);
    try { await exportData(); } finally { setExporting(false); }
  }

  async function handleImport(file: File) {
    setMenuOpen(false);
    setPendingFile(file);
  }

  async function confirmImport() {
    if (!pendingFile) return;
    setImporting(true);
    setPendingFile(null);
    try { await importData(pendingFile); } catch { alert("Dosya okunamadı."); setImporting(false); }
  }

  return (
    <>
      {pendingFile && (
        <ConfirmDialog
          message="Mevcut tüm veriler silinip yeni dosya yüklenecek. Devam edilsin mi?"
          confirmLabel="Evet, İçe Aktar"
          cancelLabel="Hayır, İptal"
          danger={true}
          onConfirm={confirmImport}
          onCancel={() => setPendingFile(null)}
        />
      )}
      <nav className="sticky top-0 z-40 bg-slate-900 border-b border-white/[0.06] shadow-xl">
        <div className="max-w-7xl mx-auto px-4">
          {/* Ana satır */}
          <div className="flex items-center h-15 gap-2" style={{ height: "60px" }}>
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 mr-6 flex-shrink-0 group">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Building2 size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Estate<span className="text-amber-400">IQ</span>
              </span>
            </Link>

            {/* Masaüstü linkleri */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Masaüstü dışa/içe aktar */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
              >
                {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Dışa Aktar
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
              >
                {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                İçe Aktar
              </button>
            </div>

            {/* Mobil hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden ml-auto p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
              aria-label="Menü"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobil açılır menü */}
          {menuOpen && (
            <div className="md:hidden border-t border-white/[0.06] py-2 flex flex-col gap-0.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-amber-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
              <div className="border-t border-white/[0.06] mt-1 pt-1 flex flex-col gap-0.5">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
                >
                  {exporting ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                  Dışa Aktar
                </button>
                <button
                  onClick={() => { setMenuOpen(false); fileRef.current?.click(); }}
                  disabled={importing}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-50"
                >
                  {importing ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
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
    </>
  );
}
