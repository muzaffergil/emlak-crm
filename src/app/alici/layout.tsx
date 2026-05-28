"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, Heart, User, CalendarCheck, LogIn, LogOut } from "lucide-react";
import { BuyerProvider, useBuyer } from "@/components/BuyerContext";

const NAV_LINKS = [
  { href: "/alici", label: "Portföyler", icon: Home },
  { href: "/alici/favoriler", label: "Favoriler", icon: Heart },
  { href: "/alici/taleplerim", label: "Taleplerim", icon: CalendarCheck },
  { href: "/alici/profil", label: "Profil", icon: User },
];

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = href === "/alici" ? pathname === "/alici" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
      }`}
    >
      <Icon size={14} />
      {label}
    </Link>
  );
}

function BottomNavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = href === "/alici" ? pathname === "/alici" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
        active ? "text-amber-600" : "text-slate-400"
      }`}
    >
      <Icon size={18} className="mb-0.5" />
      {label}
    </Link>
  );
}

function AliciHeader() {
  const { user, buyerProfile, signOut } = useBuyer();
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/alici" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow">
            <Building2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-800">Estate<span className="text-amber-500">IQ</span></span>
          <span className="hidden sm:inline text-xs text-slate-400 font-normal">Alıcı Portalı</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 ml-4">
          {NAV_LINKS.map(l => <NavLink key={l.href} {...l} />)}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-slate-600 truncate max-w-[140px]">
                {buyerProfile?.name ?? user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg transition-colors"
              >
                <LogOut size={13} /> Çıkış
              </button>
            </>
          ) : (
            <Link
              href="/alici/giris"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <LogIn size={13} /> Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex safe-area-inset-bottom">
      {NAV_LINKS.map(l => <BottomNavLink key={l.href} {...l} />)}
    </nav>
  );
}

export default function AliciLayout({ children }: { children: React.ReactNode }) {
  return (
    <BuyerProvider>
      {/* Negative margins undo the root layout's padding */}
      <div className="-mx-4 -mt-4 md:-mt-6 min-h-full">
        <AliciHeader />
        <div className="max-w-5xl mx-auto px-4 py-4 pb-20 md:pb-6">
          {children}
        </div>
        <BottomNav />
      </div>
    </BuyerProvider>
  );
}
