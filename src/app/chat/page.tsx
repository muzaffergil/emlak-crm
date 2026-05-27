"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Building2, Loader2, MapPin, Ruler, BedDouble, MessageCircle } from "lucide-react";

interface PropertyCard {
  id: number;
  title: string;
  type: string;
  city: string;
  district?: string;
  neighborhood?: string;
  price?: number;
  price_type?: string;
  size?: number;
  rooms?: string;
  features?: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  properties?: PropertyCard[];
  isGreeting?: boolean;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const STATUS_COLORS: Record<string, string> = {
  daire: "from-blue-400 to-indigo-500",
  villa: "from-emerald-400 to-teal-500",
  arsa: "from-amber-400 to-orange-500",
  "dükkan": "from-purple-400 to-violet-500",
  ofis: "from-slate-400 to-slate-600",
  depo: "from-stone-400 to-stone-600",
  bina: "from-cyan-400 to-blue-500",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M ₺`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("tr-TR")} K ₺`;
  return `${n.toLocaleString("tr-TR")} ₺`;
}

function PropCard({ p }: { p: PropertyCard }) {
  const gradient = STATUS_COLORS[p.type] ?? "from-amber-400 to-amber-600";
  const location = [p.neighborhood, p.district, p.city].filter(Boolean).join(", ");

  return (
    <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ maxWidth: 260 }}>
      <div className={`w-full h-28 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <Building2 size={32} className="text-white/70" />
      </div>
      <div className="p-3 space-y-1">
        <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{p.title}</p>
        {p.price && (
          <p className="text-amber-600 font-bold text-base">
            {fmt(p.price)}
            {p.price_type === "kira" && <span className="text-xs font-normal text-slate-400 ml-1">/ay</span>}
          </p>
        )}
        {location && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {p.rooms && (
            <span className="flex items-center gap-1">
              <BedDouble size={10} /> {p.rooms}
            </span>
          )}
          {p.size && (
            <span className="flex items-center gap-1">
              <Ruler size={10} /> {p.size}m²
            </span>
          )}
          {p.type && <span className="capitalize text-slate-400">{p.type}</span>}
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ content, properties }: { content: string; properties: PropertyCard[] }) {
  const parts = content.split(/(\[PORTFÖY:\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[PORTFÖY:(\d+)\]/);
        if (match) {
          const id = parseInt(match[1]);
          const prop = properties.find(p => p.id === id);
          return prop ? <PropCard key={i} p={prop} /> : null;
        }
        return part ? (
          <span key={i} className="whitespace-pre-wrap">{part}</span>
        ) : null;
      })}
    </>
  );
}

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  isGreeting: true,
  content: "Merhaba! 👋 Ben EstateIQ'nun yapay zeka emlak danışmanıyım.\n\nSize en uygun mülkü bulmak için buradayım. Başlamak için:\n\n• Kiralık mı, satılık mı arıyorsunuz?\n• Ne tür bir mülk istiyorsunuz?\n• Bütçeniz nedir?",
  properties: [],
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: String(Date.now()), role: "user", content: text, properties: [] };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setErrorMsg(null);

    // API messages: skip the greeting, keep real conversation
    const apiMessages = updated
      .filter(m => !m.isGreeting)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Bir hata oluştu. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now()),
          role: "assistant",
          content: data.message,
          properties: data.properties ?? [],
        },
      ]);
    } catch {
      setErrorMsg("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-100"
      style={{ height: "100dvh" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
          <Building2 size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 leading-tight">
            Estate<span className="text-amber-500">IQ</span> Asistan
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Yapay Zeka Emlak Danışmanı
          </p>
        </div>
        <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
          <Bot size={16} className="text-amber-600" />
        </div>
      </div>

      {/* ── Mesajlar ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${
              msg.role === "assistant"
                ? "bg-gradient-to-br from-amber-400 to-amber-600"
                : "bg-slate-700"
            }`}>
              {msg.role === "assistant"
                ? <Bot size={13} className="text-white" />
                : <User size={13} className="text-white" />}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`} style={{ maxWidth: "80%" }}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-500 text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
              }`}>
                {msg.role === "assistant"
                  ? <AssistantBubble content={msg.content} properties={msg.properties ?? []} />
                  : <span className="whitespace-pre-wrap">{msg.content}</span>
                }
              </div>
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Hata */}
        {errorMsg && (
          <div className="flex justify-center">
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 max-w-xs text-center">
              {errorMsg}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Mesajınızı yazın..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:scale-100"
          >
            {loading
              ? <Loader2 size={18} className="text-white animate-spin" />
              : <Send size={18} className="text-white" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          EstateIQ AI • Yapay Zeka Emlak Danışmanı
        </p>
      </div>
    </div>
  );
}
