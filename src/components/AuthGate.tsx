"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = pathname === "/login" || pathname === "/p" || pathname === "/portal";

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [loading, user, isPublic, pathname, router]);

  if (loading && !isPublic) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 size={22} className="text-white" />
          </div>
          <Loader2 size={20} className="text-amber-500 animate-spin" />
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
