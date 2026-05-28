import { supabase } from "./supabase";

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Oturum bulunamadı");
  return data.user.id;
}

export interface PriceHistoryEntry {
  price: number;
  date: string;
}

export interface Property {
  id: number;
  title: string;
  type: string;
  city: string;
  district?: string;
  neighborhood?: string;
  price?: number;
  price_type: string;
  size?: number;
  rooms?: string;
  floor?: number;
  total_floors?: number;
  features: string[];
  description?: string;
  status: string;
  raw_text?: string;
  owner_name?: string;
  owner_phone?: string;
  photos?: string[];
  price_history?: PriceHistoryEntry[];
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  intent: string;
  stage?: string;
  property_types: string[];
  cities: string[];
  districts: string[];
  neighborhoods: string[];
  budget_min?: number;
  budget_max?: number;
  size_min?: number;
  size_max?: number;
  rooms?: string[];
  features_wanted: string[];
  notes?: string;
  created_at: string;
}

export interface Match {
  id: number;
  client_id: number;
  property_id: number;
  score: number;
  reasons: string[];
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProperty(r: any): Property {
  return {
    id: Number(r.id),
    title: r.title,
    type: r.type,
    city: r.city,
    district: r.district ?? undefined,
    neighborhood: r.neighborhood ?? undefined,
    price: r.price != null ? Number(r.price) : undefined,
    price_type: r.price_type,
    size: r.size != null ? Number(r.size) : undefined,
    rooms: r.rooms ?? undefined,
    floor: r.floor != null ? Number(r.floor) : undefined,
    total_floors: r.total_floors != null ? Number(r.total_floors) : undefined,
    features: Array.isArray(r.features) ? r.features : [],
    description: r.description ?? undefined,
    status: r.status,
    raw_text: r.raw_text ?? undefined,
    owner_name: r.owner_name ?? undefined,
    owner_phone: r.owner_phone ?? undefined,
    photos: Array.isArray(r.photos) && r.photos.length > 0 ? r.photos : undefined,
    price_history: Array.isArray(r.price_history) ? r.price_history : [],
    created_at: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClient(r: any): Client {
  return {
    id: Number(r.id),
    name: r.name,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    intent: r.intent,
    stage: r.stage ?? undefined,
    property_types: Array.isArray(r.property_types) ? r.property_types : [],
    cities: Array.isArray(r.cities) ? r.cities : [],
    districts: Array.isArray(r.districts) ? r.districts : [],
    neighborhoods: Array.isArray(r.neighborhoods) ? r.neighborhoods : [],
    budget_min: r.budget_min != null ? Number(r.budget_min) : undefined,
    budget_max: r.budget_max != null ? Number(r.budget_max) : undefined,
    size_min: r.size_min != null ? Number(r.size_min) : undefined,
    size_max: r.size_max != null ? Number(r.size_max) : undefined,
    rooms: Array.isArray(r.rooms) && r.rooms.length > 0 ? r.rooms : undefined,
    features_wanted: Array.isArray(r.features_wanted) ? r.features_wanted : [],
    notes: r.notes ?? undefined,
    created_at: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMatch(r: any): Match {
  return {
    id: Number(r.id),
    client_id: Number(r.client_id),
    property_id: Number(r.property_id),
    score: Number(r.score),
    reasons: Array.isArray(r.reasons) ? r.reasons : [],
    created_at: r.created_at,
  };
}

export const propertyStore = {
  async getAll(): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("id", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toProperty);
  },

  async add(data: Omit<Property, "id" | "created_at">): Promise<Property> {
    const uid = await currentUserId();
    const { data: row, error } = await supabase
      .from("properties")
      .insert([{ ...data, user_id: uid }])
      .select()
      .single();
    if (error) throw error;
    return toProperty(row);
  },

  async addMany(items: Omit<Property, "id" | "created_at">[]): Promise<Property[]> {
    if (items.length === 0) return [];
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from("properties")
      .insert(items.map((p) => ({ ...p, user_id: uid })))
      .select();
    if (error) throw error;
    return (data ?? []).map(toProperty);
  },

  async update(id: number, data: Partial<Omit<Property, "id" | "created_at">>): Promise<void> {
    const { error } = await supabase
      .from("properties")
      .update(data)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async deleteAll(): Promise<void> {
    const uid = await currentUserId();
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("user_id", uid);
    if (error) throw error;
  },
};

export const clientStore = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("id", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toClient);
  },

  async add(data: Omit<Client, "id" | "created_at">): Promise<Client> {
    const uid = await currentUserId();
    const { data: row, error } = await supabase
      .from("clients")
      .insert([{ ...data, user_id: uid }])
      .select()
      .single();
    if (error) throw error;
    return toClient(row);
  },

  async addMany(items: Omit<Client, "id" | "created_at">[]): Promise<Client[]> {
    if (items.length === 0) return [];
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from("clients")
      .insert(items.map((c) => ({ ...c, user_id: uid })))
      .select();
    if (error) throw error;
    return (data ?? []).map(toClient);
  },

  async update(id: number, data: Partial<Omit<Client, "id" | "created_at">>): Promise<void> {
    const { error } = await supabase
      .from("clients")
      .update(data)
      .eq("id", id);
    if (error) throw error;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async deleteAll(): Promise<void> {
    const uid = await currentUserId();
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("user_id", uid);
    if (error) throw error;
  },
};

export const matchStore = {
  async getAll(): Promise<Match[]> {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("score", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toMatch);
  },

  async insertMany(items: Omit<Match, "id" | "created_at">[]): Promise<void> {
    if (items.length === 0) return;
    const uid = await currentUserId();
    const { error } = await supabase.from("matches").insert(items.map((m) => ({ ...m, user_id: uid })));
    if (error) throw error;
  },

  async deleteByClient(clientId: number): Promise<void> {
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("client_id", clientId);
    if (error) throw error;
  },

  async deleteByProperty(propertyId: number): Promise<void> {
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("property_id", propertyId);
    if (error) throw error;
  },

  async deleteAll(): Promise<void> {
    const uid = await currentUserId();
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("user_id", uid);
    if (error) throw error;
  },
};

export interface Sale {
  id: number;
  property_data: Property;
  buyer_name: string;
  buyer_phone?: string;
  buyer_id?: number;
  sold_at: string;
  buyer_commission?: number;
  seller_commission?: number;
  buyer_commission_paid: number;
  seller_commission_paid: number;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSale(r: any): Sale {
  return {
    id: Number(r.id),
    property_data: r.property_data as Property,
    buyer_name: r.buyer_name,
    buyer_phone: r.buyer_phone ?? undefined,
    buyer_id: r.buyer_id != null ? Number(r.buyer_id) : undefined,
    sold_at: r.sold_at,
    buyer_commission: r.buyer_commission != null ? Number(r.buyer_commission) : undefined,
    seller_commission: r.seller_commission != null ? Number(r.seller_commission) : undefined,
    buyer_commission_paid: Number(r.buyer_commission_paid ?? 0),
    seller_commission_paid: Number(r.seller_commission_paid ?? 0),
    created_at: r.created_at,
  };
}

export const saleStore = {
  async getAll(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toSale);
  },

  async add(payload: { property_data: Property; buyer_name: string; buyer_phone?: string; buyer_id?: number }): Promise<Sale> {
    const uid = await currentUserId();
    const { data: row, error } = await supabase
      .from("sales")
      .insert([{ ...payload, user_id: uid }])
      .select()
      .single();
    if (error) throw error;
    return toSale(row);
  },

  async update(id: number, payload: { property_data?: Property; buyer_name?: string; buyer_phone?: string; sold_at?: string; buyer_commission?: number; seller_commission?: number; buyer_commission_paid?: number; seller_commission_paid?: number }): Promise<void> {
    const { error } = await supabase.from("sales").update(payload).eq("id", id);
    if (error) throw error;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) throw error;
  },
};

export const settingsStore = {
  getApiKey(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("emlak_api_key") || "";
  },
  setApiKey(key: string): void {
    localStorage.setItem("emlak_api_key", key);
  },
};

export const favoriteStore = {
  async getAll(): Promise<number[]> {
    const { data, error } = await supabase
      .from("favorites")
      .select("property_id");
    if (error) return [];
    return (data ?? []).map(r => Number(r.property_id));
  },

  async toggle(propertyId: number): Promise<boolean> {
    const uid = await currentUserId();
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("property_id", propertyId)
      .eq("user_id", uid)
      .single();

    if (data) {
      await supabase.from("favorites").delete().eq("property_id", propertyId).eq("user_id", uid);
      return false;
    } else {
      await supabase.from("favorites").insert([{ property_id: propertyId, user_id: uid }]);
      return true;
    }
  },

  async getCount(propertyId: number): Promise<number> {
    const { count } = await supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId);
    return count ?? 0;
  },
};

export interface Activity {
  id: number;
  client_id: number;
  property_id?: number;
  type: "whatsapp" | "arama" | "gosterim" | "not";
  note?: string;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toActivity(r: any): Activity {
  return {
    id: Number(r.id),
    client_id: Number(r.client_id),
    property_id: r.property_id != null ? Number(r.property_id) : undefined,
    type: r.type,
    note: r.note ?? undefined,
    created_at: r.created_at,
  };
}

export const activityStore = {
  async getByClient(clientId: number): Promise<Activity[]> {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toActivity);
  },

  async add(type: Activity["type"], clientId: number, propertyId?: number, note?: string): Promise<Activity> {
    const uid = await currentUserId();
    const { data: row, error } = await supabase
      .from("activities")
      .insert([{ type, client_id: clientId, property_id: propertyId ?? null, note: note ?? null, user_id: uid }])
      .select()
      .single();
    if (error) throw error;
    return toActivity(row);
  },

  async deleteByClient(clientId: number): Promise<void> {
    const { error } = await supabase.from("activities").delete().eq("client_id", clientId);
    if (error) throw error;
  },

  async getLastByClients(clientIds: number[]): Promise<Record<number, string>> {
    if (clientIds.length === 0) return {};
    const { data, error } = await supabase
      .from("activities")
      .select("client_id, created_at")
      .in("client_id", clientIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const result: Record<number, string> = {};
    for (const row of data ?? []) {
      const id = Number(row.client_id);
      if (!result[id]) result[id] = row.created_at;
    }
    return result;
  },
};

export interface PublicShare {
  id: string;
  property_data: Property;
  created_at: string;
}

export const shareStore = {
  async create(propertyData: Property): Promise<string> {
    const uid = await currentUserId();
    const { data: row, error } = await supabase
      .from("public_shares")
      .insert([{ property_data: propertyData, user_id: uid }])
      .select("id")
      .single();
    if (error) throw error;
    return row.id as string;
  },

  async get(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from("public_shares")
      .select("property_data")
      .eq("id", id)
      .single();
    if (error) return null;
    return data?.property_data as Property ?? null;
  },
};

export interface ClientPortal {
  id: string;
  client_name: string;
  client_phone?: string;
  matched_properties: Property[];
  created_at: string;
}

export interface PortalFeedback {
  id: number;
  portal_id: string;
  property_id: number;
  reaction: "ilgi" | "ilgisiz" | "gosterim";
  created_at: string;
}

export const portalStore = {
  async create(clientName: string, clientPhone: string | undefined, matchedProperties: Property[]): Promise<string> {
    const uid = await currentUserId();
    const { data: row, error } = await supabase
      .from("client_portals")
      .insert([{ client_name: clientName, client_phone: clientPhone ?? null, matched_properties: matchedProperties, user_id: uid }])
      .select("id")
      .single();
    if (error) throw error;
    return row.id as string;
  },

  async get(id: string): Promise<ClientPortal | null> {
    const { data, error } = await supabase
      .from("client_portals")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return {
      id: data.id,
      client_name: data.client_name,
      client_phone: data.client_phone ?? undefined,
      matched_properties: data.matched_properties as Property[],
      created_at: data.created_at,
    };
  },

  async addFeedback(portalId: string, propertyId: number, reaction: PortalFeedback["reaction"]): Promise<void> {
    await supabase.from("portal_feedback").insert([{ portal_id: portalId, property_id: propertyId, reaction }]);
  },

  async getFeedback(portalId: string): Promise<PortalFeedback[]> {
    const { data, error } = await supabase
      .from("portal_feedback")
      .select("*")
      .eq("portal_id", portalId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(r => ({
      id: Number(r.id),
      portal_id: r.portal_id,
      property_id: Number(r.property_id),
      reaction: r.reaction as PortalFeedback["reaction"],
      created_at: r.created_at,
    }));
  },
};
