"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Building2, MapPin, Ruler, BedDouble, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { computeMatches } from "@/lib/claude";
import type { Property } from "@/lib/storage";

// ── Yardımcı: fiyat formatı ──────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} M ₺`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("tr-TR")} K ₺`;
  return `${n.toLocaleString("tr-TR")} ₺`;
}

// ── Portföy kartı ─────────────────────────────────────────────────────────────

const GRAD: Record<string, string> = {
  daire: "from-blue-400 to-indigo-500",
  villa: "from-emerald-400 to-teal-500",
  arsa: "from-amber-400 to-orange-500",
  "dükkan": "from-purple-400 to-violet-500",
  ofis: "from-slate-500 to-slate-700",
};

function PropCard({ p }: { p: Property }) {
  const grad = GRAD[p.type] ?? "from-amber-400 to-amber-600";
  const loc = [p.neighborhood, p.district].filter(Boolean).join(", ");
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-56 flex-shrink-0">
      <div className={`h-24 bg-gradient-to-br ${grad} flex items-center justify-center`}>
        <Building2 size={28} className="text-white/70" />
      </div>
      <div className="p-2.5 space-y-1">
        <p className="font-semibold text-slate-800 text-xs leading-snug line-clamp-2">{p.title}</p>
        {p.price && (
          <p className="text-amber-600 font-bold text-sm">
            {fmt(p.price)}
            {p.price_type === "kira" && <span className="text-[10px] font-normal text-slate-400 ml-1">/ay</span>}
          </p>
        )}
        {loc && (
          <p className="flex items-center gap-1 text-[10px] text-slate-500">
            <MapPin size={9} /> {loc}
          </p>
        )}
        <div className="flex gap-2 text-[10px] text-slate-400">
          {p.rooms && <span className="flex items-center gap-0.5"><BedDouble size={9} /> {p.rooms}</span>}
          {p.size  && <span className="flex items-center gap-0.5"><Ruler size={9} /> {p.size}m²</span>}
        </div>
      </div>
    </div>
  );
}

// ── Parser'lar ────────────────────────────────────────────────────────────────

function n(t: string) {
  return t.toLowerCase()
    .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u")
    .replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/İ/g,"i").replace(/Ğ/g,"g").replace(/Ü/g,"u")
    .replace(/Ş/g,"s").replace(/Ö/g,"o").replace(/Ç/g,"c");
}

function parseIntent(t: string): "aliyor" | "kiraciyor" | null {
  const s = n(t);
  if (/satin|satilik|almak|aliyorum|satalim|satin al/.test(s)) return "aliyor";
  if (/kira|kiralik|kiralamak|kiraliyorum/.test(s)) return "kiraciyor";
  if (s.includes("al") && !s.includes("kira")) return "aliyor";
  return null;
}

function parseType(t: string): string | null {
  const s = n(t);
  if (s.includes("daire") || s.includes("apartment")) return "daire";
  if (s.includes("villa") || s.includes("mustakil") || s.includes("mustak")) return "villa";
  if (s.includes("arsa") || s.includes("tarla")) return "arsa";
  if (s.includes("dukkan") || s.includes("isyeri") || s.includes("is yeri")) return "dükkan";
  if (s.includes("ofis") || s.includes("buro")) return "ofis";
  if (s.includes("bina") || s.includes("apartman")) return "bina";
  return null;
}

function parsePrice(t: string): { min?: number; max?: number } | null {
  const rangeM = t.match(/(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*)\s*(?:milyon|M)/i);
  if (rangeM) return { min: parseFloat(rangeM[1].replace(",",".")) * 1e6, max: parseFloat(rangeM[2].replace(",",".")) * 1e6 };

  const singleM = t.match(/(\d+[.,]?\d*)\s*(?:milyon|M\b)/i);
  if (singleM) { const v = parseFloat(singleM[1].replace(",",".")) * 1e6; return { max: v }; }

  const kM = t.match(/(\d+[.,]?\d*)\s*(?:bin|K\b)/i);
  if (kM) { const v = parseFloat(kM[1].replace(",",".")) * 1000; return { max: v }; }

  const rawM = t.replace(/\s/g,"").match(/(\d[\d.]+)/);
  if (rawM) { const v = parseFloat(rawM[1].replace(/\./g,"").replace(",",".")); if (v > 1000) return { max: v }; }
  return null;
}

function parseRooms(t: string): string | null {
  const m = t.match(/(\d+\+\d+)/);
  return m ? m[1] : null;
}

function parseDistrict(t: string): string[] {
  return t.split(/[,،\/\s]+/).map(s => s.trim()).filter(s => s.length > 2 && /^[A-ZÇĞİÖŞÜa-zçğıöşü]/.test(s));
}

// ── Konuşma durumu ────────────────────────────────────────────────────────────

type Step = "intent" | "type" | "location" | "budget" | "rooms" | "results";

interface ConvData {
  intent?: "aliyor" | "kiraciyor";
  property_types: string[];
  cities: string[];
  districts: string[];
  neighborhoods: string[];
  budget_min?: number;
  budget_max?: number;
  rooms: string[];
  features_wanted: string[];
}

const EMPTY: ConvData = {
  property_types: [], cities: ["Gaziantep"],
  districts: [], neighborhoods: [], rooms: [], features_wanted: [],
};

// ── Mesaj tipi ────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: Property[];
}

function msg(role: Message["role"], text: string, cards?: Property[]): Message {
  return { id: Math.random().toString(36).slice(2), role, text, cards };
}

// ── Adım soruları ─────────────────────────────────────────────────────────────

const STEP_Q: Record<Step, string> = {
  intent:   "Satın mı almak, yoksa kiralamak mı istiyorsunuz?",
  type:     "Ne tür bir mülk arıyorsunuz?\n(Daire, villa, arsa, dükkan, ofis…)",
  location: "Hangi ilçe veya semtte arıyorsunuz?\n(Örn: Şahinbey, Şehitkamil)",
  budget:   "Bütçeniz yaklaşık nedir?\n(Örn: 2.5 milyon, 3M, 15 bin/ay)",
  rooms:    "Kaç odalı düşünüyorsunuz?\n(Örn: 2+1, 3+1, 4+1)",
  results:  "",
};

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [messages, setMessages]     = useState<Message[]>([
    msg("assistant", "Merhaba! 👋 Ben EstateIQ'nun sanal emlak danışmanıyım.\n\nSize en uygun mülkü bulmak için birkaç soru soracağım.\n\n" + STEP_Q.intent),
  ]);
  const [step, setStep]   = useState<Step>("intent");
  const [data, setData]   = useState<ConvData>(EMPTY);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Müsait portföyleri yükle
  useEffect(() => {
    supabase
      .from("properties")
      .select("*")
      .eq("status", "musait")
      .then(({ data: rows }) => {
        if (rows) setProperties(rows as Property[]);
        setLoading(false);
      });
  }, []);

  // iOS klavye düzeltmesi — visualViewport ile container yüksekliğini güncelle
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${vv.height}px`;
        containerRef.current.style.top    = `${vv.offsetTop}px`;
      }
      // Klavye açılınca son mesajı görünür tut
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" }), 50);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function restart() {
    setStep("intent");
    setData(EMPTY);
    setInput("");
    setMessages([
      msg("assistant", "Sıfırlandı! Yeni bir arama yapalım.\n\n" + STEP_Q.intent),
    ]);
  }

  function showResults(convData: ConvData, props: Property[]) {
    const priceType = convData.intent === "kiraciyor" ? "kira" : "satis";
    const matches = computeMatches(
      { id: 0, intent: convData.intent ?? "aliyor", ...convData },
      props.map(p => ({ ...p, features: p.features ?? [] }))
    );

    const topProps = matches.slice(0, 6).map(m => props.find(p => p.id === m.property_id)!).filter(Boolean);

    if (topProps.length === 0) {
      return msg("assistant",
        "Üzgünüm, kriterlerinize tam uyan müsait portföy bulamadım 😔\n\nKriterleri biraz esnetmek ister misiniz? Yeniden başlamak için aşağıdaki 🔄 butonuna tıklayabilirsiniz."
      );
    }

    const intentLabel = convData.intent === "kiraciyor" ? "kiralık" : "satılık";
    const typeLabel   = convData.property_types[0] ?? "mülk";
    const loc         = convData.districts[0] ?? "Gaziantep";
    const bud         = convData.budget_max ? `, ${fmt(convData.budget_max)} bütçeyle` : "";

    return msg("assistant",
      `İşte size uygun ${intentLabel} ${typeLabel}ler${bud} (${loc}):\n\n${topProps.length} portföy bulundu 🏠`,
      topProps
    );
  }

  function handleAnswer(userText: string) {
    const userMsg = msg("user", userText);
    let nextStep  = step;
    let newData   = { ...data };
    let botReply: Message;

    if (step === "intent") {
      const parsed = parseIntent(userText);
      if (!parsed) {
        botReply = msg("assistant", "Anlayamadım 😊 Lütfen \"satın almak\" veya \"kiralamak\" şeklinde belirtin.");
        setMessages(prev => [...prev, userMsg, botReply]);
        return;
      }
      newData.intent = parsed;
      nextStep = "type";
      botReply = msg("assistant",
        `Anladım, ${parsed === "aliyor" ? "satılık" : "kiralık"} arıyorsunuz.\n\n${STEP_Q.type}`
      );
    } else if (step === "type") {
      const parsed = parseType(userText);
      if (!parsed) {
        botReply = msg("assistant", "Hangi tür mülk arıyorsunuz? (Daire, villa, arsa, dükkan, ofis…)");
        setMessages(prev => [...prev, userMsg, botReply]);
        return;
      }
      newData.property_types = [parsed];
      nextStep = "location";
      botReply = msg("assistant", `${parsed.charAt(0).toUpperCase() + parsed.slice(1)} arıyorsunuz.\n\n${STEP_Q.location}`);
    } else if (step === "location") {
      const parsed = parseDistrict(userText);
      newData.districts = parsed.length > 0 ? parsed : [];
      nextStep = "budget";
      const locText = parsed.length > 0 ? parsed.join(", ") : "Gaziantep geneli";
      botReply = msg("assistant", `${locText} bölgesi not edildi.\n\n${STEP_Q.budget}`);
    } else if (step === "budget") {
      const parsed = parsePrice(userText);
      if (!parsed) {
        botReply = msg("assistant", "Bütçenizi anlayamadım. Örn: \"2.5 milyon\", \"3M\", \"15 bin\" gibi yazabilirsiniz.");
        setMessages(prev => [...prev, userMsg, botReply]);
        return;
      }
      newData.budget_min = parsed.min;
      newData.budget_max = parsed.max;

      // Arsa/dükkan için oda sayısı sormaya gerek yok
      const skipRooms = ["arsa", "dükkan", "ofis"].includes(newData.property_types[0] ?? "");
      if (skipRooms) {
        nextStep = "results";
        botReply = showResults(newData, properties);
      } else {
        nextStep = "rooms";
        const budText = parsed.max ? fmt(parsed.max) : "belirtilmedi";
        botReply = msg("assistant", `Bütçe: ${budText}. \n\n${STEP_Q.rooms}`);
      }
    } else if (step === "rooms") {
      const parsed = parseRooms(userText);
      if (parsed) newData.rooms = [parsed];
      nextStep = "results";
      botReply = showResults(newData, properties);
    } else {
      // results aşamasında — yeniden arama ya da ek filtre
      const lc = n(userText);
      if (lc.includes("yeni") || lc.includes("basla") || lc.includes("sifirla") || lc.includes("restart")) {
        restart();
        return;
      }
      // Basit özellik refinement
      const newFeatures = [...newData.features_wanted];
      if (lc.includes("balkon")) newFeatures.push("balkon");
      if (lc.includes("bahce") || lc.includes("bahçe")) newFeatures.push("bahçe");
      if (lc.includes("otopark") || lc.includes("garaj")) newFeatures.push("otopark");
      if (lc.includes("asansor") || lc.includes("asansör")) newFeatures.push("asansör");
      if (lc.includes("site")) newFeatures.push("site");
      if (newFeatures.length > newData.features_wanted.length) {
        newData.features_wanted = newFeatures;
        botReply = showResults(newData, properties);
      } else {
        botReply = msg("assistant",
          "Aramayı daraltmak ister misiniz? Örn: \"balkon\", \"site\", \"otopark\" gibi özellik ekleyebilirsiniz.\nYa da yeni bir arama için \"yeni arama\" yazın."
        );
      }
    }

    setStep(nextStep);
    setData(newData);
    setMessages(prev => [...prev, userMsg, botReply]);
  }

  function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    handleAnswer(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-50 flex flex-col bg-slate-100"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))", paddingBottom: "12px" }}>
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
          <Building2 size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 leading-tight text-base">
            Estate<span className="text-amber-500">IQ</span> Asistan
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
            {loading ? "Portföyler yükleniyor…" : `${properties.length} portföy hazır`}
          </p>
        </div>
        {/* Yeniden başla — büyük dokunma alanı */}
        <button
          onClick={restart}
          title="Yeniden başla"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Mesajlar — iOS smooth scroll + overscroll engelle */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-4"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" } as React.CSSProperties}
      >
        {messages.map(m => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${
              m.role === "assistant" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-slate-700"
            }`}>
              {m.role === "assistant" ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
            </div>

            <div
              className={`flex flex-col gap-2 min-w-0 ${m.role === "user" ? "items-end" : "items-start"}`}
              style={{ maxWidth: "calc(100% - 48px)" }}
            >
              {/* Metin balonu */}
              <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
                m.role === "user"
                  ? "bg-amber-500 text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
              }`}>
                {m.text}
              </div>

              {/* Portföy kartları — yatay scroll (mobil dokunma optimize) */}
              {m.cards && m.cards.length > 0 && (
                <div
                  className="flex gap-3 overflow-x-auto pb-2"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    scrollSnapType: "x mandatory",
                    maxWidth: "calc(100vw - 60px)",
                  } as React.CSSProperties}
                >
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

      {/* Input — iOS safe area + 16px font (zoom engelle) */}
      <div
        className="flex-shrink-0 bg-white border-t border-slate-200 px-3 pt-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
            placeholder="Mesajınızı yazın…"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:bg-white transition-all disabled:opacity-50"
            style={{ fontSize: "16px" /* iOS zoom'u engeller */ }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform disabled:opacity-40"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2 pb-0.5">EstateIQ AI • Gaziantep Emlak</p>
      </div>
    </div>
  );
}
