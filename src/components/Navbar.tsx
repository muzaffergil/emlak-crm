"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Zap, PlusCircle } from "lucide-react";

const links = [
  { href: "/", label: "Portföy", icon: Building2 },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/matches", label: "Eşleşmeler", icon: Zap },
  { href: "/add-property", label: "Portföy Ekle", icon: PlusCircle },
];

export default function Navbar() {
  const pathname = usePathname();
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
      </div>
    </nav>
  );
}
