"use client";
import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Building2, MapPin, Ruler, BedDouble, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { computeMatches } from "@/lib/claude";
import type { Property } from "@/lib/storage";

// ── Yardımcılar ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M ₺`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("tr-TR")} K ₺`;
  return `${n.toLocaleString("tr-TR")} ₺`;
}

const GRAD: Record<string, string> = {
  daire: "from-blue-400 to-indigo-500",
  villa: "from-emerald-400 to-teal-500",
  arsa:  "from-amber-400 to-orange-500",
  "dükkan": "from-purple-400 to-violet-500",
  ofis:  "from-slate-500 to-slate-700",
};

function PropCard({ p }: { p: Property }) {
  const grad = GRAD[p.type] ?? "from-amber-400 to-amber-600";
  const loc  = [p.neighborhood, p.district].filter(Boolean).join(", ");
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0" style={{ width: 200 }}>
      <div className={`h-20 bg-gradient-to-br ${grad} flex items-center justify-center`}>
        <Building2 size={24} className="text-white/70" />
      </div>
      <div className="p-2.5 space-y-0.5">
        <p className="font-semibold text-slate-800 text-xs leading-snug line-clamp-2">{p.title}</p>
        {p.price && (
          <p className="text-amber-600 font-bold text-sm">
            {fmt(p.price)}
            {p.price_type === "kira" && <span className="text-[10px] font-normal text-slate-400 ml-1">/ay</span>}
          </p>
        )}
        {loc && <p className="flex items-center gap-1 text-[10px] text-slate-500"><MapPin size={9} />{loc}</p>}
        <div className="flex gap-2 text-[10px] text-slate-400">
          {p.rooms && <span className="flex items-center gap-0.5"><BedDouble size={9} />{p.rooms}</span>}
          {p.size  && <span className="flex items-center gap-0.5"><Ruler size={9} />{p.size}m²</span>}
        </div>
      </div>
    </div>
  );
}

// ── Parser'lar ────────────────────────────────────────────────────────────────

function norm(t: string) {
  return t.toLowerCase()
    .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u")
    .replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/İ/g,"i").replace(/Ğ/g,"g").replace(/Ü/g,"u")
    .replace(/Ş/g,"s").replace(/Ö/g,"o").replace(/Ç/g,"c");
}

function parseIntent(t: string): "aliyor" | "kiraciyor" | null {
  const s = norm(t);
  if (/satin|satilik|almak|aliyorum/.test(s)) return "aliyor";
  if (/kira|kiralik|kiralamak|kiraliyorum/.test(s)) return "kiraciyor";
  if (s.includes("al") && !s.includes("kira")) return "aliyor";
  return null;
}

function parseType(t: string): string | null {
  const s = norm(t);
  if (s.includes("daire") || s.includes("apartment")) return "daire";
  if (s.includes("villa") || s.includes("mustakil")) return "villa";
  if (s.includes("arsa") || s.includes("tarla")) return "arsa";
  if (s.includes("dukkan") || s.includes("isyeri")) return "dükkan";
  if (s.includes("ofis") || s.includes("buro")) return "ofis";
  if (s.includes("bina") || s.includes("apartman")) return "bina";
  return null;
}

function parsePrice(t: string): { min?: number; max?: number } | null {
  const rM = t.match(/(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*)\s*(?:milyon|M)/i);
  if (rM) return { min: parseFloat(rM[1].replace(",",".")) * 1e6, max: parseFloat(rM[2].replace(",",".")) * 1e6 };
  const sM = t.match(/(\d+[.,]?\d*)\s*(?:milyon|M\b)/i);
  if (sM) return { max: parseFloat(sM[1].replace(",",".")) * 1e6 };
  const kM = t.match(/(\d+[.,]?\d*)\s*(?:bin|K\b)/i);
  if (kM) return { max: parseFloat(kM[1].replace(",",".")) * 1000 };
  const rw = t.replace(/\s/g,"").match(/(\d[\d.]+)/);
  if (rw) { const v = parseFloat(rw[1].replace(/\./g,"").replace(",",".")); if (v > 1000) return { max: v }; }
  return null;
}

function parseRooms(t: string): string | null { return t.match(/(\d+\+\d+)/)?.[1] ?? null; }

function parseDistrict(t: string): string[] {
  return t.split(/[,،\/\s]+/).map(s => s.trim()).filter(s => s.length > 2 && /^[A-ZÇĞİÖŞÜa-zçğıöşü]/.test(s));
}

// ── Konuşma durumu ────────────────────────────────────────────────────────────

type Step = "intent" | "type" | "location" | "budget" | "rooms" | "results";

interface ConvData {
  intent?: "aliyor" | "kiraciyor";
  property_types: string[]; cities: string[];
  districts: string[]; neighborhoods: string[];
  budget_min?: number; budget_max?: number;
  rooms: string[]; features_wanted: string[];
}

const EMPTY: ConvData = {
  property_types: [], cities: ["Gaziantep"],
  districts: [], neighborhoods: [], rooms: [], features_wanted: [],
};

interface Msg { id: string; role: "user" | "assistant"; text: string; cards?: Property[]; }
function mk(role: Msg["role"], text: string, cards?: Property[]): Msg {
  return { id: Math.random().toString(36).slice(2), role, text, cards };
}

const STEP_Q: Record<Step, string> = {
  intent:   "Satın mı almak, yoksa kiralamak mı istiyorsunuz?",
  type:     "Ne tür bir mülk arıyorsunuz?\n(Daire, villa, arsa, dükkan, ofis…)",
  location: "Hangi ilçe veya semtte arıyorsunuz?\n(Örn: Şahinbey, Şehitkamil)",
  budget:   "Bütçeniz yaklaşık nedir?\n(Örn: 2.5 milyon, 3M)",
  rooms:    "Kaç odalı düşünüyorsunuz?\n(Örn: 2+1, 3+1)",
  results:  "",
};

// ── ChatWidget ────────────────────────────────────────────────────────────────

interface Props { isOpen: boolean; onClose: () => void; }

export default function ChatWidget({ isOpen, onClose }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [messages, setMessages]     = useState<Msg[]>([]);
  const [step, setStep]   = useState<Step>("intent");
  const [data, setData]   = useState<ConvData>(EMPTY);
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  // Portföyleri bir kez yükle
  useEffect(() => {
    if (loaded) return;
    supabase.from("properties").select("*").eq("status", "musait")
      .then(({ data: rows }) => {
        if (rows) setProperties(rows as Property[]);
        setLoaded(true);
      });
  }, [loaded]);

  // Açılınca greeting + input'a odaklan, kapanınca durumu sıfırla
  useEffect(() => {
    if (isOpen) {
      setMessages([mk("assistant",
        "Merhaba! 👋 Ben EstateIQ'nun sanal emlak danışmanıyım.\n\nSize en uygun mülkü bulmak için birkaç soru soracağım.\n\n" + STEP_Q.intent
      )]);
      setStep("intent");
      setData(EMPTY);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Escape ile kapat
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // iOS klavye düzeltmesi — card'ın paddingBottom'ını ayarla
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const kbH = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (cardRef.current) cardRef.current.style.paddingBottom = kbH > 0 ? `${kbH}px` : "0";
      if (kbH > 0) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 30);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, [isOpen]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function restart() {
    setStep("intent"); setData(EMPTY); setInput("");
    setMessages([mk("assistant", "Sıfırlandı! Yeni bir arama başlatalım.\n\n" + STEP_Q.intent)]);
  }

  function showResults(conv: ConvData, props: Property[]): Msg {
    const matches = computeMatches(
      { id: 0, intent: conv.intent ?? "aliyor", ...conv },
      props.map(p => ({ ...p, features: p.features ?? [] }))
    );
    const top = matches.slice(0, 6).map(m => props.find(p => p.id === m.property_id)!).filter(Boolean);
    if (!top.length) return mk("assistant", "Üzgünüm, kriterlerinize uyan müsait portföy bulamadım 😔\n\nFarklı kriterler deneyelim — yeniden başlamak için 🔄 butonuna tıklayın.");
    const iLabel = conv.intent === "kiraciyor" ? "kiralık" : "satılık";
    const tLabel = conv.property_types[0] ?? "mülk";
    const loc    = conv.districts[0] ?? "Gaziantep";
    const bud    = conv.budget_max ? `, ${fmt(conv.budget_max)} bütçeyle` : "";
    return mk("assistant", `İşte ${iLabel} ${tLabel}ler${bud} (${loc}) — ${top.length} sonuç 🏠`, top);
  }

  function handleAnswer(userText: string) {
    const uMsg = mk("user", userText);
    let ns = step, nd = { ...data };
    let bot: Msg;

    if (step === "intent") {
      const p = parseIntent(userText);
      if (!p) { bot = mk("assistant", "Lütfen \"satın almak\" veya \"kiralamak\" şeklinde belirtin."); setMessages(prev => [...prev, uMsg, bot]); return; }
      nd.intent = p; ns = "type";
      bot = mk("assistant", `${p === "aliyor" ? "Satılık" : "Kiralık"} arıyorsunuz.\n\n${STEP_Q.type}`);
    } else if (step === "type") {
      const p = parseType(userText);
      if (!p) { bot = mk("assistant", "Hangi tür? (Daire, villa, arsa, dükkan, ofis…)"); setMessages(prev => [...prev, uMsg, bot]); return; }
      nd.property_types = [p]; ns = "location";
      bot = mk("assistant", `${p.charAt(0).toUpperCase() + p.slice(1)} arıyorsunuz.\n\n${STEP_Q.location}`);
    } else if (step === "location") {
      const p = parseDistrict(userText);
      nd.districts = p.length ? p : []; ns = "budget";
      bot = mk("assistant", `${p.length ? p.join(", ") : "Gaziantep geneli"} not edildi.\n\n${STEP_Q.budget}`);
    } else if (step === "budget") {
      const p = parsePrice(userText);
      if (!p) { bot = mk("assistant", "Bütçenizi anlayamadım. Örn: \"2.5 milyon\", \"3M\""); setMessages(prev => [...prev, uMsg, bot]); return; }
      nd.budget_min = p.min; nd.budget_max = p.max;
      const skip = ["arsa","dükkan","ofis"].includes(nd.property_types[0] ?? "");
      if (skip) { ns = "results"; bot = showResults(nd, properties); }
      else { ns = "rooms"; bot = mk("assistant", `Bütçe: ${p.max ? fmt(p.max) : "belirtilmedi"}.\n\n${STEP_Q.rooms}`); }
    } else if (step === "rooms") {
      const p = parseRooms(userText);
      if (p) nd.rooms = [p]; ns = "results"; bot = showResults(nd, properties);
    } else {
      const lc = norm(userText);
      if (lc.includes("yeni") || lc.includes("sifirla") || lc.includes("basla")) { restart(); return; }
      const nf = [...nd.features_wanted];
      if (lc.includes("balkon")) nf.push("balkon");
      if (lc.includes("bahce")) nf.push("bahçe");
      if (lc.includes("otopark") || lc.includes("garaj")) nf.push("otopark");
      if (lc.includes("asansor")) nf.push("asansör");
      if (lc.includes("site")) nf.push("site");
      if (nf.length > nd.features_wanted.length) { nd.features_wanted = nf; bot = showResults(nd, properties); }
      else bot = mk("assistant", "\"balkon\", \"site\", \"otopark\" gibi özellik ekleyebilir ya da \"yeni arama\" yazabilirsiniz.");
    }

    setStep(ns); setData(nd);
    setMessages(prev => [...prev, uMsg, bot]);
  }

  function send() {
    const t = input.trim();
    if (!t) return;
    setInput("");
    handleAnswer(t);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Kart — mobilde bottom sheet, masaüstünde ortalanmış */}
      <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center pointer-events-none px-0 sm:px-4">
        <div
          ref={cardRef}
          className="pointer-events-auto w-full sm:max-w-md flex flex-col bg-white shadow-2xl overflow-hidden"
          style={{
            height: "min(88vh, 680px)",
            borderRadius: "20px 20px 0 0",
          }}
          // Masaüstünde tüm köşeler yuvarlak
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderRadius = "20px"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderRadius = window.innerWidth < 640 ? "20px 20px 0 0" : "20px"; }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-tight">
                Estate<span className="text-amber-500">IQ</span> Asistan
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${!loaded ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
                {!loaded ? "Yükleniyor…" : `${properties.length} müsait portföy`}
              </p>
            </div>
            <button onClick={restart} title="Yeniden başla"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <RotateCcw size={14} />
            </button>
            <button onClick={onClose} title="Kapat"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Mesajlar */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
            style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" } as React.CSSProperties}
          >
            {messages.map(m => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${
                  m.role === "assistant" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-slate-700"
                }`}>
                  {m.role === "assistant" ? <Bot size={12} className="text-white" /> : <User size={12} className="text-white" />}
                </div>
                <div className={`flex flex-col gap-2 min-w-0 ${m.role === "user" ? "items-end" : "items-start"}`}
                  style={{ maxWidth: "calc(100% - 40px)" }}>
                  <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-amber-500 text-white rounded-tr-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm"
                  }`}>
                    {m.text}
                  </div>
                  {m.cards && m.cards.length > 0 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-1"
                      style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory", maxWidth: "calc(100vw - 80px)" } as React.CSSProperties}>
                      {m.cards.map(p => (
                        <div key={p.id} style={{ scrollSnapAlign: "start", flexShrink: 0 }}>
                          <PropCard p={p} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-slate-100 px-3 py-2.5 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
                placeholder="Mesajınızı yazın…"
                className="chat-input flex-1 px-3.5 py-2.5 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:bg-white transition-all text-sm"
                style={{ fontSize: "16px" }}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform disabled:opacity-40"
              >
                <Send size={15} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
