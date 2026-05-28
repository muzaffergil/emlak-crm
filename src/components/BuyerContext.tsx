"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { buyerProfileStore, type BuyerProfile } from "@/lib/storage";

interface BuyerCtxType {
  user: User | null;
  buyerProfile: BuyerProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const BuyerCtx = createContext<BuyerCtxType>({
  user: null,
  buyerProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useBuyer() {
  return useContext(BuyerCtx);
}

export function BuyerProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    const p = await buyerProfileStore.get().catch(() => null);
    setBuyerProfile(p);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) {
        const p = await buyerProfileStore.get().catch(() => null);
        setBuyerProfile(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const p = await buyerProfileStore.get().catch(() => null);
        setBuyerProfile(p);
      } else {
        setBuyerProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <BuyerCtx.Provider value={{ user, buyerProfile, loading, signOut, refreshProfile }}>
      {children}
    </BuyerCtx.Provider>
  );
}
