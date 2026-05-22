import { supabase } from "./supabase";

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
    const { data: row, error } = await supabase
      .from("properties")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return toProperty(row);
  },

  async addMany(items: Omit<Property, "id" | "created_at">[]): Promise<Property[]> {
    if (items.length === 0) return [];
    const { data, error } = await supabase
      .from("properties")
      .insert(items)
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
    const { error } = await supabase
      .from("properties")
      .delete()
      .gte("id", 0);
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
    const { data: row, error } = await supabase
      .from("clients")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return toClient(row);
  },

  async addMany(items: Omit<Client, "id" | "created_at">[]): Promise<Client[]> {
    if (items.length === 0) return [];
    const { data, error } = await supabase
      .from("clients")
      .insert(items)
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
    const { error } = await supabase
      .from("clients")
      .delete()
      .gte("id", 0);
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
    const { error } = await supabase.from("matches").insert(items);
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
    const { error } = await supabase
      .from("matches")
      .delete()
      .gte("id", 0);
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
  commission_rate?: number;
  commission_collected: boolean;
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
    commission_rate: r.commission_rate != null ? Number(r.commission_rate) : undefined,
    commission_collected: r.commission_collected ?? false,
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

  async add(payload: { property_data: Property; buyer_name: string; buyer_phone?: string; buyer_id?: number; commission_rate?: number }): Promise<Sale> {
    const { data: row, error } = await supabase
      .from("sales")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return toSale(row);
  },

  async update(id: number, payload: { property_data?: Property; buyer_name?: string; buyer_phone?: string; sold_at?: string; commission_rate?: number; commission_collected?: boolean }): Promise<void> {
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
