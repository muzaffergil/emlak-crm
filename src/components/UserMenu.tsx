"use client";
import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const emailShort = user.email?.split("@")[0] ?? "Kullanıcı";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
      >
        <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={12} className="text-white" />
        </div>
        <span className="hidden sm:block max-w-[100px] truncate">{emailShort}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-800 border border-white/[0.1] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.08]">
            <p className="text-xs text-slate-500 mb-0.5">Giriş yapıldı</p>
            <p className="text-sm text-white font-medium truncate">{user.email}</p>
          </div>
          <button
            onClick={async () => { setOpen(false); await signOut(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={15} />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
