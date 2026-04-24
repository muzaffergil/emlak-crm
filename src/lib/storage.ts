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
  budget_min?: number;
  budget_max?: number;
  size_min?: number;
  size_max?: number;
  rooms?: string;
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

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId<T extends { id: number }>(items: T[]): number {
  return items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
}

const now = () => new Date().toLocaleString("tr-TR");

export const propertyStore = {
  getAll(): Property[] {
    return read<Property>("emlak_properties").sort(
      (a, b) => b.id - a.id
    );
  },
  add(data: Omit<Property, "id" | "created_at">): Property {
    const items = read<Property>("emlak_properties");
    const item: Property = { ...data, id: nextId(items), created_at: now() };
    write("emlak_properties", [item, ...items]);
    return item;
  },
  delete(id: number): void {
    write(
      "emlak_properties",
      read<Property>("emlak_properties").filter((p) => p.id !== id)
    );
    matchStore.deleteByProperty(id);
  },
};

export const clientStore = {
  getAll(): Client[] {
    return read<Client>("emlak_clients").sort((a, b) => b.id - a.id);
  },
  add(data: Omit<Client, "id" | "created_at">): Client {
    const items = read<Client>("emlak_clients");
    const item: Client = { ...data, id: nextId(items), created_at: now() };
    write("emlak_clients", [item, ...items]);
    return item;
  },
  delete(id: number): void {
    write(
      "emlak_clients",
      read<Client>("emlak_clients").filter((c) => c.id !== id)
    );
    matchStore.deleteByClient(id);
  },
};

export const matchStore = {
  getAll(): Match[] {
    return read<Match>("emlak_matches");
  },
  upsert(data: Omit<Match, "id" | "created_at">): void {
    const items = read<Match>("emlak_matches");
    const existing = items.findIndex(
      (m) => m.client_id === data.client_id && m.property_id === data.property_id
    );
    if (existing >= 0) {
      items[existing] = { ...items[existing], score: data.score, reasons: data.reasons };
    } else {
      items.push({ ...data, id: nextId(items), created_at: now() });
    }
    write("emlak_matches", items);
  },
  deleteByClient(client_id: number): void {
    write(
      "emlak_matches",
      read<Match>("emlak_matches").filter((m) => m.client_id !== client_id)
    );
  },
  deleteByProperty(property_id: number): void {
    write(
      "emlak_matches",
      read<Match>("emlak_matches").filter((m) => m.property_id !== property_id)
    );
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
