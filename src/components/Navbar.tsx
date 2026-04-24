"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Zap, PlusCircle, Settings } from "lucide-react";

const links = [
  { href: "/", label: "Portföy", icon: Building2 },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/matches", label: "Eşleşmeler", icon: Zap },
  { href: "/add-property", label: "Portföy Ekle", icon: PlusCircle },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 h-14">
        <span className="font-bold text-lg mr-6 text-amber-400">EmlakCRM</span>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname === href
                ? "bg-amber-500 text-white"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
