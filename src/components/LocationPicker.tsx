"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export const GAZ_DISTRICTS = [
  "Şahinbey", "Şehitkamil", "Araban", "İslahiye",
  "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Yavuzeli",
];

export const GAZ_NEIGHBORHOODS: Record<string, string[]> = {
  "Şahinbey": [
    "23 Nisan", "25 Aralık", "60. Yıl", "75. Yıl", "Abdülhamid Han",
    "Akbayır", "Akbulut", "Akkent", "Akpınar", "Akyazı", "Akyol",
    "Alaybey", "Alibaba", "Alleben", "Almalı", "Aydınbaba",
    "Bahçelievler", "Barak", "Bayramlı", "Bağlarbaşı", "Bekirbey",
    "Bekişli", "Belenköy", "Bey", "Beyazlar", "Beydilli", "Beşkuyu",
    "Beştepe", "Binevler", "Bostancık", "Boyacı", "Bozca", "Bozoklar",
    "Burç Esentepe", "Burç Karakuyu", "Bülbülzade", "Cabi", "Cebeler",
    "Cengiz Topel", "Cevizli", "Cumhuriyet", "Damlacık", "Deniz",
    "Deredüzü", "Dokur", "Doğanca", "Dumlupınar", "Durantaş", "Düztepe",
    "Ekinli", "Ertuğrulgazi", "Fidanlık", "Fırat", "Gazitepe", "Geneyik",
    "Gerciğin", "Geylani", "Güllüce", "Gülpınar", "Gümüştekin",
    "Güneykent", "Güneş", "Güzelvadi", "Hacıköprü", "Hacıköy", "Hoşgör",
    "Kabarcık", "Kahvelipınar", "Kale", "Kaleboynu", "Kapçağız",
    "Karagöz", "Karataş", "Karayılan", "Karaçomak", "Kavaklık", "Kavşak",
    "Kazıklı", "Kepenek", "Kerer", "Kıbrıs", "Kılınçoğlu", "Killik",
    "Kolejtepe", "Konak", "Kozluca", "Kumruhamurkesen", "Kurbanbaba",
    "Kuşçu", "Külecik", "Kürüm", "Küçükkızılhisar", "Malazgirt",
    "Mavikent", "Mimar Sinan", "Morcalı", "Muhacirosman", "Mülk",
    "Narlıca", "Narlıtepe", "Nuripazarbaşı", "Ocaklar", "Onur",
    "Ortaklar", "Osmanlı", "Ozanlı", "Perilikaya", "Sarıbaşak",
    "Sarıkaya", "Sarısalkım", "Sarıt", "Savcılı", "Saçaklı", "Selçuklu",
    "Serince", "Serinevler", "Sultan Selim", "Suyabatmaz", "Sırasöğüt",
    "Tekstilkent", "Tiyekli", "Töreli", "Türkmenler", "Türktepe",
    "Türközü", "Ufacık", "Ulaş", "Uğurtepe", "Ünaldı", "Üçoklar",
    "Vatan", "Yamaçtepe", "Yavuzlar", "Yaycı", "Yaylacık", "Yazıbağı",
    "Yazıcık", "Yağdöver", "Yeditepe", "Yeniköy", "Yeşilevler",
    "Yeşilkent", "Yeşilköy", "Yeşilpınar", "Yeşilyurt", "Yoğuntaş",
    "Yukarıbayır", "Yığmatepe", "Zeytinli", "Çamlıca", "Çamtepe",
    "Çapalı", "Çağdaş", "Çevreli", "Çimenli", "Çubukdiken", "Çöreklik",
    "Öğretmenevleri", "İbn-i Sina", "İnönü", "İstiklal",
    "Şahintepe", "Şahveli", "Şenyurt",
  ],
  "Şehitkamil": [
    "15 Temmuz", "29 Ekim", "8 Şubat", "Acaroba", "Ağaçlıboyno",
    "Akçaburç", "Akçagöze", "Aktoprak", "Alpaslan", "Aşağı Arıl",
    "Atabek", "Atalar", "Atatürk", "Bağbaşı", "Başpınar Osb",
    "Batıkent", "Battal", "Bayatlı", "Bedirköy", "Belkız", "Beykent",
    "Beylerbeyi", "Beyreli", "Bilek", "Boyno", "Bozobası", "Burak",
    "Büyükpınar", "Cerityeniyapan", "Çağkuyu", "Çamlıtepe", "Çıksorut",
    "Değirmiçem", "Dımışkılı", "Durnalık", "Dülük", "Dündarlı",
    "Erikli", "Eskişarkaya", "Eydibaba", "Eyüpsultan", "Fıstıklık",
    "Gazikent", "Gaziler", "Göksüncük", "Göktürk", "Göllüce", "Günbulur",
    "Güngürge", "Güvenevler", "Hacıbaba", "Işıklı", "İbrahimli",
    "İbrahimşehir", "İncesu", "İskenderli", "Kabasakız", "Karacaahmet",
    "Karacaburç", "Karacaoğlan", "Karacaören", "Karadede", "Karahüyük",
    "Karakesek", "Karayusuflu", "Karpuzkaya", "Karşıyaka", "Kayaönü",
    "Kızıkhamurkesen", "Kızık Karasakal", "Koçlu", "Kozluyazı",
    "Köksalan", "Küllü", "Medegöz", "Merveşehir", "Mevlana", "Mücahitler",
    "Nesimi", "Onat Kutlar", "Osmangazi", "Öğümsöğüt", "Övündük",
    "Pancarlı", "Pirsultan", "Sacır", "Sam", "Sanayi", "Sancaktepe",
    "Sarıgüllük", "Sarılar", "Sefaşehir", "Selahattin Eyyubi", "Selimiye",
    "Serintepe", "Seymenli", "Seyrantepe", "Sinan", "Sinan Osb",
    "Sofalıcı", "Suboğaz", "Sülüklü", "Şirinevler", "Taşlıca",
    "Tekirsin", "Tokdemir", "Tuğlu", "Türkyurdu", "Uğruca", "Umut",
    "Üçgöze", "Ülkerli", "Yalankoz", "Yamaçoba", "Yaprak", "Yayıktaş",
    "Yenişarkaya", "Yeşilce", "Yığınlı", "Yukarı Arıl", "Zülfikar",
  ],
  "Nizip": [
    "Adaklı", "Akkuyu", "Akçakent", "Alahacı", "Altındağ", "Atatürk",
    "Aşağıbayındır", "Aşağıçardak", "Bahçeli", "Ballı", "Bağlıca",
    "Belkıs", "Belkıs Merkez", "Boyluca", "Bozalioğlu", "Cumhuriyet",
    "Dayıdağı", "Dazhüyük", "Dernek", "Doğrular", "Duraklı", "Dutlu",
    "Düzbayır", "Ekinci", "Erenköy", "Eskikonak", "Eyüp Sultan",
    "Fatih Sultan", "Fevkani", "Fevzi Paşa", "Fırat", "Gaziler",
    "Gevence", "Gökçeli", "Güder", "Gülkaya", "Gümüşgün", "Günaltı",
    "Gürbaşak", "Güzelköy", "Hafızpaşa", "Hancağız", "Hazımoğlu",
    "Kaleköy", "Kamışlı", "Karaburç", "Karşıyaka", "Kayalar", "Keklik",
    "Kesiktaş", "Kıbrıs", "Kıratlı", "Kıraçgülü", "Kızılcakent",
    "Kızılin", "Kocatepe", "Korucak", "Kumla", "Kurucahüyük", "Köseler",
    "Mağaracık", "Mehmetobası", "Menderes", "Mercanlı", "Mevlana",
    "Mihrap", "Mimar Sinan", "Nahırtepe", "Namık Kemal", "Osb",
    "Pazar Camii", "Saha", "Salkım", "Samandöken", "Samanlı", "Saray",
    "Sarıkoç", "Sekili", "Suboyu", "Sultan Abdülhamit", "Söğütlü",
    "Tahtani", "Tanır", "Tatlıcak", "Tosunlu", "Toydemir", "Tuluktaş",
    "Turlu", "Turnalı", "Uluyatır", "Yarımtepe", "Yağcılar",
    "Yağmuralan", "Yeniyapan", "Yeniyazı", "Yeşilevler", "Yolçatı",
    "Yukarıbayındır", "Yukarıçardak", "Yunus Emre", "Zeytinlik",
    "Çakmaktepe", "Çanakçı", "Çatalca", "Özyurt", "İkizce",
    "İntepe", "İstasyon", "İstiklal", "Şıhlar",
  ],
  "İslahiye": [
    "Akınyolu", "Alaca", "Altınüzüm", "Arpalı", "Atatürk", "Aydınlık",
    "Ağabey", "Ağalarobası", "Bahçelievler", "Bayraktepe", "Beyler",
    "Boğaziçi", "Burhaniye", "Burunsuzlar", "Cevdetpaşa", "Cumhuriyet",
    "Dervişpaşa", "Değirmencik", "Elbistanhüyüğü", "Erenler", "Esenler",
    "Fevzi Çakmak", "Fevzipaşa", "Göltepe", "Güllühüyük", "Güngören",
    "Haci Ali Öztürk", "Hanağzı", "Hasanlök", "Hürriyet", "Kabaklar",
    "Kalaycık", "Kale", "Karacaören", "Karakaya", "Karapolat",
    "Karapınar", "Kayabaşı", "Kazıklı", "Kozdere", "Koçcağız",
    "Kuşçumustafa", "Köklü", "Kırıkçalı", "Ortaklı", "Pınarbaşı",
    "Serinevler", "Sulumağara", "Tandır", "Telli", "Türkbahçe",
    "Yağızlar", "Yelliburun", "Yeni", "Yeniceli", "Yeniköy", "Yesemek",
    "Yeşilova", "Yeşilyurt", "Yolbaşı", "Yukarıbilenler", "Zincirli",
    "Çamlıca", "Çerçili", "Çolaklar", "Çubuk", "Çınarlı", "Örtülü",
    "İdilli", "Şahmaran", "Şerikanlı",
  ],
  "Araban": [
    "Akbudak", "Akkoç", "Altınpınar", "Aşağıkaravaiz", "Aşağıyufkalı",
    "Bağlıca", "Başpınar", "Beydili", "Dağdancık", "Doğan", "Dumlupınar",
    "Elif", "Emirhaydar", "Erenbağ", "Esentepe", "Eskialtıntaş",
    "Fakılı", "Fevzi Çakmak", "Fıstıklıdağ", "Gelinbuğday", "Gökçepayam",
    "Güllüce", "Gümüşpınar", "Güzey", "Hasanoğlu", "Hisar", "Kale",
    "Karababa", "Karacaören", "Köklüce", "Körhacıobası", "Küçüklü",
    "Mehmet Gökçek", "Muratlı", "Nurettin", "Sarıkaya", "Sarıtepe",
    "Tarlabaşı", "Taşdeğirmen", "Turgut Özal", "Yaylacık",
    "Yeni Altıntaş", "Yeşilova", "Yolveren", "Yukarıkaravaiz",
    "Yukarıyufkalı", "Ziyaret", "Çiftekoz", "Şerif Peri",
  ],
  "Karkamış": [
    "Akçaköy", "Alagöz", "Alaçalı", "Arıkdere", "Ayyıldız", "Balaban",
    "Beşkılıç", "Eceler", "Elifoğlu", "Erenyolu", "Etiler", "Gürçay",
    "Karacurun", "Karanfil", "Karşıyaka", "Kelekli", "Kepirler",
    "Korkmazlar", "Kuruyazı", "Kıvırcık", "Lojmanlar", "Savaş", "Soylu",
    "Subağı", "Teketaşı", "Tosunlu", "Türkyurdu", "Yarımca", "Yazır",
    "Yaşar", "Yeşerti", "Yolağzı", "Yurtbağı", "Zührecik", "Çarşı",
    "Çiftlik", "Öncüler", "Örmetaş", "Şenlik",
  ],
  "Nurdağı": [
    "6 Şubat", "Alpaslan Türkeş", "Altınova", "Aslanlı", "Ataköy",
    "Atatürk", "Atmalı", "Bademli", "Bahçelievler", "Balıkalan",
    "Başpınar", "Belpınar", "Demirler", "Durmuşlar", "Emirler",
    "Esenyurt", "Fatih", "Gedikli", "Gökçedere", "Gözlühüyük",
    "Hamidiye", "Hisar", "Karaburçlu", "Kartal", "Karşıyaka",
    "Kurudere", "Kuzoluk", "Kömürler", "Kırkpınar", "Kırışkal",
    "Mehmet Akif Ersoy", "Mesthüyük", "Naimler", "Nogaylar", "Olucak",
    "Sakçagözü", "Sayburun", "Tandırlı", "Terken", "Torunlar", "Tüllüce",
    "Yavuzselim", "Yaylacık", "Yeni", "Çakmak", "İkizkuyu", "İncegedik",
    "İncirli", "İçerisu", "Şatırhüyük",
  ],
  "Oğuzeli": [
    "Acer", "Akçamezra", "Altınyurt", "Ambarcık", "Arslanlı", "Asmacık",
    "Aydınkaya", "Aşağı Güneyse", "Aşağı Yeniyapan", "Belören",
    "Beşdeli", "Bulduk", "Büyükkaracaviran", "Cumhuriyet", "Demirkonak",
    "Devehüyüğü", "Dibecik", "Dikmetaş", "Direkli", "Dokuzyol",
    "Doğanpınar", "Duruköy", "Dutluca", "Ekinveren", "Ermiş", "Fatih",
    "Gebe", "Gedik", "Güllük", "Gündoğan", "Gürsu", "Güveçli",
    "Güzelce", "Hacar", "Hatunlu", "Hötoğlu", "Hürriyet", "Kabacaağaç",
    "Karaburun", "Karadibek", "Karaman", "Karataş", "Kavunluk",
    "Kayacık", "Kayalıpınar", "Kaşyolu", "Kersentaş", "Keçikuyusu",
    "Keçili", "Kovanlı", "Koçaklar", "Kurtuluş", "Kuruçay", "Körkün",
    "Kılavuz", "Mimar Sinan", "Oğuzlar", "Sazgın", "Sergili", "Sevindi",
    "Subaşı", "Sütlüce", "Taşlı", "Taşyazı", "Taşçanak", "Tüzel",
    "Tınazdere", "Ulaşlı", "Uğurova", "Yakacık", "Yalnızbağ", "Yazılı",
    "Yeni Cumhuriyet", "Yeniköy", "Yeşildere", "Yeşiltepe",
    "Yukarıgüneyse", "Çatalsu", "Çatalçam", "Çavuşbaşı", "Çaybaşı",
    "Çaybaşı Osb", "Çaybeyi", "Üçdamlar", "Üçkubbe", "İkizkuyu",
    "İnceyol", "İnkılap", "İnönü",
  ],
  "Yavuzeli": [
    "Akbayır", "Aşağıhöçüklü", "Aşağıkayabaşı", "Aşağıkekliktepe",
    "Bakırca", "Ballık", "Bağtepe", "Beğendik", "Bülbül",
    "Büyükkarakuyu", "Cingife", "Cumhuriyet", "Değirmitaş", "Düzce",
    "Fevzi Çakmak", "Göçmez", "Gülpınar", "Hacımallı", "Havuz",
    "Hürriyet", "Ilıcak", "Karabey", "Karahan", "Karahüseyinli",
    "Kasaba", "Keşrobası", "Kuzuyatağı", "Küçükkarakuyu", "Saraymağara",
    "Sarıbuğday", "Sarılar", "Sultan Selim", "Süleymanobası", "Tokaçlı",
    "Yarımca", "Yeniyurt", "Yukarıkekliktepe", "Yukarıyeniköy", "Yöreli",
    "Çiltoprak", "Çimenli", "Örenli", "Üçgöl", "Şenlikçe",
  ],
};

function norm(s: string) {
  return s
    .replace(/İ/g, "i").replace(/I/g, "i")
    .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
    .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç")
    .toLowerCase();
}

// ── Ortak: dikey liste dropdown ──────────────────────────────────────────────

function ListDropdown({
  label, options, selected, onChange, multi,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  multi: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter(o => norm(o).includes(norm(search)));

  function toggle(o: string) {
    if (multi) {
      onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o]);
    } else {
      onChange(selected[0] === o ? [] : [o]);
      setOpen(false);
      setSearch("");
    }
  }

  const btnLabel = selected.length === 0 ? label
    : selected.length <= 2 ? selected.join(", ")
    : `${selected.length} seçildi`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
      >
        <span className={`truncate ${selected.length === 0 ? "text-slate-400" : "text-slate-800"}`}>{btnLabel}</span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {selected.length > 0 && (
            <span onClick={e => { e.stopPropagation(); onChange([]); }} className="text-slate-300 hover:text-red-400">
              <X size={14} />
            </span>
          )}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-200 rounded-lg">
              <Search size={13} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ara..."
                className="text-sm flex-1 focus:outline-none text-black bg-transparent"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Sonuç yok</p>
            )}
            {filtered.map(o => {
              const isSelected = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-amber-50 ${isSelected ? "bg-amber-50 text-amber-800 font-medium" : "text-slate-700"}`}
                >
                  <span>{o}</span>
                  {isSelected && <Check size={15} className="text-amber-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          {multi && selected.length > 0 && (
            <div className="p-2 border-t border-slate-100 flex flex-wrap gap-1">
              {selected.map(s => (
                <span key={s} className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => toggle(s)}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tek seçimlik — portföy formu ─────────────────────────────────────────────

interface SinglePickerProps {
  district: string;
  neighborhood: string;
  onDistrictChange: (d: string) => void;
  onNeighborhoodChange: (n: string) => void;
}

export function SingleLocationPicker({ district, neighborhood, onDistrictChange, onNeighborhoodChange }: SinglePickerProps) {
  const neighOptions = district ? (GAZ_NEIGHBORHOODS[district] ?? []) : Object.values(GAZ_NEIGHBORHOODS).flat().sort();

  function handleDistrictChange(vals: string[]) {
    onDistrictChange(vals[0] ?? "");
    onNeighborhoodChange("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İl</p>
        <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-amber-50 text-amber-800 font-medium">
          Gaziantep
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İlçe</p>
        <ListDropdown label="İlçe seçin" options={GAZ_DISTRICTS} selected={district ? [district] : []} onChange={handleDistrictChange} multi={false} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">Mahalle</p>
        <ListDropdown label="Mahalle seçin" options={neighOptions} selected={neighborhood ? [neighborhood] : []} onChange={vals => onNeighborhoodChange(vals[0] ?? "")} multi={false} />
      </div>
    </div>
  );
}

// ── Çok seçimlik — müşteri formu ─────────────────────────────────────────────

interface MultiPickerProps {
  districts: string[];
  neighborhoods: string[];
  onDistrictsChange: (d: string[]) => void;
  onNeighborhoodsChange: (n: string[]) => void;
}

export function MultiLocationPicker({ districts, neighborhoods, onDistrictsChange, onNeighborhoodsChange }: MultiPickerProps) {
  const neighOptions = districts.length > 0
    ? districts.flatMap(d => GAZ_NEIGHBORHOODS[d] ?? [])
    : Object.values(GAZ_NEIGHBORHOODS).flat().sort();

  function handleDistrictsChange(ds: string[]) {
    onDistrictsChange(ds);
    const valid = ds.flatMap(d => GAZ_NEIGHBORHOODS[d] ?? []);
    onNeighborhoodsChange(neighborhoods.filter(n => valid.includes(n)));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İl</p>
        <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-amber-50 text-amber-800 font-medium">
          Gaziantep
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">İlçe</p>
        <ListDropdown label="İlçe seçin" options={GAZ_DISTRICTS} selected={districts} onChange={handleDistrictsChange} multi={true} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 block mb-1.5">Mahalle</p>
        <ListDropdown label="Mahalle seçin" options={neighOptions} selected={neighborhoods} onChange={onNeighborhoodsChange} multi={true} />
      </div>
    </div>
  );
}
