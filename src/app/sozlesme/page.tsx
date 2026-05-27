"use client";
import { useState } from "react";
import { FileText, Printer, RotateCcw } from "lucide-react";

const FIELDS: Array<{ key: string; label: string; multi?: boolean }> = [
  { key: "ili_ilcesi",          label: "İli / İlçesi" },
  { key: "ada_parsel",          label: "Ada / Parsel No." },
  { key: "daire_no",            label: "Daire Numarası (Bağımsız Bölüm)" },
  { key: "mahalle",             label: "Mahallesi" },
  { key: "sokak",               label: "Sokağı" },
  { key: "dis_kapi",            label: "Dış Kapı Numarası" },
  { key: "kiralanan_cins",      label: "Kiralanan Şeyin Cinsi" },
  { key: "kiraci_ad",           label: "Kiracının Adı Soyadı" },
  { key: "kiraci_tc",           label: "Kiracının T.C. Kimlik No." },
  { key: "kiraci_adres",        label: "Kiracının Adresi", multi: true },
  { key: "kiraya_veren_ad",     label: "Kiraya Verenin Adı Soyadı" },
  { key: "kiraya_veren_tc",     label: "Kiraya Verenin T.C. Kimlik No." },
  { key: "kiraya_veren_ikamet", label: "Kiraya Verenin İkâmetgahı", multi: true },
  { key: "garantor",            label: "Garantör / Kefil  (Ad Soyad / T.C. / Adres)", multi: true },
  { key: "yillik_kira",         label: "Bir Senelik Kira Karşılığı (₺)" },
  { key: "aylik_kira",          label: "Bir Aylık Kira Karşılığı (₺)" },
  { key: "kira_muddet",         label: "Kira Müddeti" },
  { key: "odeme_tarihi",        label: "Kiranın Ne Zaman Ödeneceği" },
  { key: "banka_iban",          label: "Kiranın Ödeneceği Banka Adı ve IBAN Numarası" },
  { key: "baslangic_tarihi",    label: "Kiranın Başlangıcı" },
  { key: "demirbaslar",         label: "Kiralananda Bulunan Demirbaşlar", multi: true },
  { key: "kullanim_amaci",      label: "Kiralananın Hangi Amaçla Kullanılacağı" },
];

const DEFAULTS: Record<string, string> = {
  kiralanan_cins: "Konut",
  kira_muddet: "1 Yıl",
  odeme_tarihi: "Her ayın 15'i",
  kullanim_amaci: "Konut olarak kullanılacaktır.",
};

function fmt(n: string) {
  const num = parseFloat(n.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? n : num.toLocaleString("tr-TR") + " ₺";
}

export default function SozlesmePage() {
  const [form, setForm] = useState<Record<string, string>>(DEFAULTS);

  const v = (key: string) => form[key] ?? "";
  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const CONTRACT_ROWS: [string, string][] = [
    ["İli/İlçesi", v("ili_ilcesi")],
    ["Ada/Parsel No.", v("ada_parsel")],
    ["Daire Numarası (Bağımsız Bölüm)", v("daire_no")],
    ["Mahallesi", v("mahalle")],
    ["Sokağı", v("sokak")],
    ["Dış Kapı Numarası", v("dis_kapi")],
    ["Kiralanan Şeyin Cinsi", v("kiralanan_cins")],
    ["Kiracının Adı Soyadı / T.C. Kimlik No.", [v("kiraci_ad"), v("kiraci_tc")].filter(Boolean).join(" / ")],
    ["Kiracının Adresi", v("kiraci_adres")],
    ["Kiraya Verenin Adı Soyadı / T.C. Kimlik No.", [v("kiraya_veren_ad"), v("kiraya_veren_tc")].filter(Boolean).join(" / ")],
    ["Kiraya Verenin İkâmetgahı", v("kiraya_veren_ikamet")],
    ["Garantör ve Müşterek Müteselsil Kefilin\nAdı Soyadı / T.C. Kimlik No. / Adresi", v("garantor")],
    ["Bir Senelik Kira Karşılığı", v("yillik_kira") ? fmt(v("yillik_kira")) : ""],
    ["Bir Aylık Kira Karşılığı", v("aylik_kira") ? fmt(v("aylik_kira")) : ""],
    ["Kira Müddeti", v("kira_muddet")],
    ["Kiranın Ne Zaman Ödeneceği", v("odeme_tarihi")],
    ["Kiranın Ödeneceği Banka Adı ve IBAN Numarası", v("banka_iban")],
    ["Kiranın Başlangıcı", v("baslangic_tarihi")],
    ["Kiralananda Bulunan Demirbaşlar", v("demirbaslar")],
    ["Kiralananın Hangi Amaçla Kullanılacağı", v("kullanim_amaci")],
  ];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav, header { display: none !important; }
          body { background: white !important; margin: 0; }
          main { padding: 0 !important; max-width: 100% !important; }
          .contract-wrap {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 1.5cm 2cm !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
        @page { size: A4; margin: 1.5cm; }
      `}</style>

      <div className="space-y-6">
        {/* Başlık */}
        <div className="no-print border-b border-slate-200 pb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
                  <FileText size={17} className="text-white" />
                </div>
                Kira Sözleşmesi
              </h1>
              <p className="text-slate-500 text-sm mt-1">Alanları doldurun, sağdaki önizlemeden kontrol edin, ardından yazdırın.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setForm(DEFAULTS)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <RotateCcw size={13} /> Sıfırla
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-xl shadow-sm shadow-teal-200 hover:from-teal-400 hover:to-cyan-500 transition-all"
              >
                <Printer size={14} /> Yazdır / PDF
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* ── Form ── */}
          <div className="no-print bg-white rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.03] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-sm font-semibold text-slate-700">Sözleşme Bilgileri</p>
            </div>
            <div className="p-5 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
              {FIELDS.map(({ key, label, multi }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  {multi ? (
                    <textarea
                      rows={2}
                      value={v(key)}
                      onChange={e => set(key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/50 resize-none transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      value={v(key)}
                      onChange={e => set(key, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/50 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Sözleşme önizleme (yazdırılacak kısım) ── */}
          <div className="contract-wrap bg-white rounded-2xl border border-slate-200 shadow-md p-8" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <h2 className="text-center font-bold text-base mb-6 tracking-widest" style={{ textDecoration: "underline" }}>
              KİRA SÖZLEŞMESİ
            </h2>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                {CONTRACT_ROWS.map(([label, value]) => (
                  <tr key={label}>
                    <td style={{
                      border: "1px solid #555",
                      padding: "6px 8px",
                      verticalAlign: "top",
                      width: "45%",
                      fontWeight: "500",
                      textDecoration: "underline",
                      whiteSpace: "pre-line",
                      lineHeight: "1.5",
                    }}>
                      {label}
                    </td>
                    <td style={{
                      border: "1px solid #555",
                      padding: "6px 8px",
                      verticalAlign: "top",
                      minHeight: "28px",
                      lineHeight: "1.5",
                      color: value ? "#111" : "#ccc",
                    }}>
                      {value || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* İmza alanları */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "48px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ height: "60px" }} />
                <div style={{ borderTop: "1px solid #666", paddingTop: "8px", fontSize: "12px" }}>
                  <div style={{ fontWeight: "bold" }}>KİRAYA VEREN</div>
                  <div style={{ color: "#555", marginTop: "4px" }}>{v("kiraya_veren_ad") || "Ad Soyad"}</div>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ height: "60px" }} />
                <div style={{ borderTop: "1px solid #666", paddingTop: "8px", fontSize: "12px" }}>
                  <div style={{ fontWeight: "bold" }}>KİRACI</div>
                  <div style={{ color: "#555", marginTop: "4px" }}>{v("kiraci_ad") || "Ad Soyad"}</div>
                </div>
              </div>
            </div>

            {v("garantor") && (
              <div style={{ textAlign: "center", marginTop: "32px" }}>
                <div style={{ height: "60px" }} />
                <div style={{ borderTop: "1px solid #666", paddingTop: "8px", fontSize: "12px" }}>
                  <div style={{ fontWeight: "bold" }}>KEFİL</div>
                  <div style={{ color: "#555", marginTop: "4px" }}>{v("garantor")}</div>
                </div>
              </div>
            )}

            <p style={{ textAlign: "center", fontSize: "11px", color: "#888", marginTop: "24px" }}>
              Tarih: {new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
