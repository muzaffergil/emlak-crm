import Anthropic from "@anthropic-ai/sdk";
import { settingsStore } from "./storage";

function getClient(): Anthropic {
  const apiKey = settingsStore.getApiKey();
  if (!apiKey) throw new Error("API anahtarı ayarlanmamış. Lütfen Ayarlar sayfasından ekleyin.");
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export interface ParsedProperty {
  title: string;
  type: string;
  city: string;
  district?: string;
  neighborhood?: string;
  price?: number;
  price_type?: string;
  size?: number;
  rooms?: string;
  floor?: number;
  total_floors?: number;
  features: string[];
  description?: string;
}

export async function parsePropertyFromText(text: string): Promise<ParsedProperty> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `Sen bir Türk emlak uzmanısın. Sana verilen metin açıklamasından gayrimenkul bilgilerini JSON formatında çıkar.

Çıkarman gereken alanlar:
- title: kısa başlık (örn: "3+1 Kadıköy Daire")
- type: daire | villa | arsa | dükkan | ofis | depo | bina
- city: şehir adı
- district: ilçe (opsiyonel)
- neighborhood: mahalle (opsiyonel)
- price: sayısal fiyat TL cinsinden (varsa)
- price_type: "satis" veya "kira"
- size: m² sayısal (varsa)
- rooms: oda sayısı string (örn: "3+1")
- floor: bulunduğu kat sayısal (varsa)
- total_floors: bina toplam kat (varsa)
- features: özellik listesi (örn: ["balkon","otopark","asansör"])
- description: kısa açıklama

Sadece JSON döndür, başka hiçbir şey yazma.`,
    messages: [{ role: "user", content: text }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Beklenmeyen yanıt tipi");
  const jsonText = content.text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(jsonText);
}

export async function computeMatches(
  clientData: {
    id: number;
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
  },
  properties: {
    id: number;
    type: string;
    city: string;
    district?: string;
    price?: number;
    price_type?: string;
    size?: number;
    rooms?: string;
    features: string[];
    title: string;
  }[]
): Promise<{ property_id: number; score: number; reasons: string[] }[]> {
  if (properties.length === 0) return [];
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `Sen bir emlak eşleştirme uzmanısın. Müşteri ihtiyaçlarını portföydeki gayrimenkullerle eşleştir.
Her eşleşme için 0-100 arası puan ver ve kısa sebep listesi yaz.
Sadece JSON array döndür: [{"property_id": N, "score": N, "reasons": ["sebep1","sebep2"]}]
Puanı 40'ın altında olan eşleşmeleri listeye ekleme.`,
    messages: [
      {
        role: "user",
        content: `Müşteri ihtiyacı: ${JSON.stringify(clientData)}\n\nPortföy: ${JSON.stringify(properties)}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") return [];
  const jsonText = content.text.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(jsonText);
}
