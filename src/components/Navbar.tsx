"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Building2, Users, Zap, PlusCircle, Download, Upload } from "lucide-react";

const links = [
  { href: "/", label: "Portföy", icon: Building2 },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/matches", label: "Eşleşmeler", icon: Zap },
  { href: "/add-property", label: "Portföy Ekle", icon: PlusCircle },
];

const KEYS = ["emlak_properties", "emlak_clients", "emlak_matches"];

function exportData() {
  const data: Record<string, unknown> = {};
  for (const key of KEYS) {
    try { data[key] = JSON.parse(localStorage.getItem(key) || "[]"); } catch { data[key] = []; }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `emlak-yedek-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      for (const key of KEYS) {
        if (Array.isArray(data[key])) localStorage.setItem(key, JSON.stringify(data[key]));
      }
      window.location.reload();
    } catch {
      alert("Dosya okunamadı.");
    }
  };
  reader.readAsText(file);
}

export default function Navbar() {
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 h-14">
        <span className="font-bold text-lg mr-6 text-amber-500">EmlakCRM</span>
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
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            title="Verileri dışa aktar"
          >
            <Download size={16} />
            Dışa Aktar
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            title="Verileri içe aktar"
          >
            <Upload size={16} />
            İçe Aktar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) importData(e.target.files[0]); }}
          />
        </div>
      </div>
    </nav>
  );
}
