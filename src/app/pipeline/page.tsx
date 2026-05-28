"use client";
import { useEffect, useState } from "react";
import { Kanban, Phone, MessageCircle, Users } from "lucide-react";
import { clientStore, type Client } from "@/lib/storage";

const STAGES: { key: string; label: string; color: string; bg: string; border: string }[] = [
  { key: "gorusme",  label: "Görüşme",  color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200" },
  { key: "gosterim", label: "Gösterim", color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200" },
  { key: "teklif",   label: "Teklif",   color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  { key: "kapandi",  label: "Kapandı",  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  { key: "iptal",    label: "İptal",    color: "text-slate-500",  bg: "bg-slate-50",   border: "border-slate-200" },
];

const INTENT_LABELS: Record<string, string> = {
  aliyor: "Alıcı", kiraciyor: "Kiracı",
};

function waLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "90")}`;
}

export default function PipelinePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  useEffect(() => {
    clientStore.getAll()
      .then(c => { setClients(c.filter(cl => ["aliyor", "kiraciyor"].includes(cl.intent))); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function moveToStage(clientId: number, stage: string) {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, stage } : c));
    await clientStore.update(clientId, { stage });
  }

  function onDragStart(id: number) {
    setDragging(id);
  }

  function onDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setOverStage(stage);
  }

  function onDrop(e: React.DragEvent, stage: string) {
    e.preventDefault();
    if (dragging !== null) moveToStage(dragging, stage);
    setDragging(null);
    setOverStage(null);
  }

  function onDragEnd() {
    setDragging(null);
    setOverStage(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map(s => (
            <div key={s.key} className="flex-shrink-0 w-52 h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
          <Kanban size={17} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-sm text-slate-500">Müşteri süreçlerini aşama aşama yönet</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm text-slate-500">
          <Users size={14} />
          {clients.length} aktif müşteri
        </div>
      </div>

      {/* Kanban tahtası */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {STAGES.map(stage => {
          const stageClients = clients.filter(c => (c.stage ?? "gorusme") === stage.key);
          const isOver = overStage === stage.key;

          return (
            <div
              key={stage.key}
              className={`flex-shrink-0 w-56 flex flex-col rounded-2xl border-2 transition-colors duration-150 ${
                isOver ? `${stage.border} ${stage.bg}` : "border-slate-100 bg-slate-50/60"
              }`}
              onDragOver={e => onDragOver(e, stage.key)}
              onDrop={e => onDrop(e, stage.key)}
            >
              {/* Kolon başlığı */}
              <div className={`px-3 py-3 rounded-t-2xl ${stage.bg} border-b ${stage.border}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wide ${stage.color}`}>{stage.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.bg} ${stage.color} border ${stage.border}`}>
                    {stageClients.length}
                  </span>
                </div>
              </div>

              {/* Kartlar */}
              <div className="flex flex-col gap-2 p-2 flex-1">
                {stageClients.map(c => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c.id)}
                    onDragEnd={onDragEnd}
                    className={`bg-white rounded-xl border border-slate-100 shadow-sm p-3 cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-md hover:border-slate-200 ${
                      dragging === c.id ? "opacity-40 scale-95" : ""
                    }`}
                  >
                    {/* İsim + intent */}
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{c.name}</p>
                      <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium">
                        {INTENT_LABELS[c.intent] ?? c.intent}
                      </span>
                    </div>

                    {/* Bütçe */}
                    {(c.budget_min || c.budget_max) && (
                      <p className="text-xs text-slate-500 mb-2">
                        {c.budget_min && c.budget_max
                          ? `${(c.budget_min / 1_000_000).toFixed(1)}M – ${(c.budget_max / 1_000_000).toFixed(1)}M ₺`
                          : c.budget_max
                          ? `max ${(c.budget_max / 1_000_000).toFixed(1)}M ₺`
                          : `min ${(c.budget_min! / 1_000_000).toFixed(1)}M ₺`}
                      </p>
                    )}

                    {/* İletişim */}
                    {c.phone && (
                      <div className="flex gap-1.5">
                        <a href={`tel:${c.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 transition-colors">
                          <Phone size={10} /> Ara
                        </a>
                        <a href={waLink(c.phone)} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs transition-colors">
                          <MessageCircle size={10} /> WA
                        </a>
                      </div>
                    )}

                    {/* Aşama değiştir (hızlı seçici) */}
                    <select
                      value={c.stage ?? "gorusme"}
                      onChange={e => { e.stopPropagation(); moveToStage(c.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className="mt-2 w-full px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-violet-300 cursor-pointer"
                    >
                      {STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                ))}

                {stageClients.length === 0 && (
                  <div className={`flex-1 flex items-center justify-center rounded-xl border-2 border-dashed ${stage.border} min-h-16`}>
                    <span className={`text-xs ${stage.color} opacity-40`}>Boş</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">Kartları sürükleyerek veya aşağıdaki açılır menüyle aşama değiştirebilirsiniz.</p>
    </div>
  );
}
