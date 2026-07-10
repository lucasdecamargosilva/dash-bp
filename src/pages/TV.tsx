import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { cn } from "@/lib/utils";
import bpGroupLogoWhite from "@/assets/bp-group-logo-white.png";

const GHL_USERS: Record<string, string> = {
  "vzPEBQaqgZw6Z2AhUqGQ": "Aline Autoral",
  "HLq1ZteZT3ov44XFhCcQ": "Andre Lima",
  "hSEGFIKfSCNXxpxhUqWT": "Carol Santana",
  "8MloR8VTt2BlQCvisQOS": "Felipe Caon",
  "hO9WG11u8CN6nnzFxZuT": "Fernanda Capella",
  "iP8qyqGLlIvw74rr1vvE": "Marcelo Oda",
  "DOaQWahn91t5DiJrpQdF": "Raphael Acioli",
  "9oq3gqfnwfVqxhX42eje": "Thiago Canina",
  "F7v0GiBvJvPVNotI7Sl9": "Thiago Sacramento",
  "P8SRDXzyajdPYrPfle4T": "Vitoria Cloud",
};

const REALIZED_STAGES = new Set(["Reuniao Realizada", "Proposta em Analise", "Venda Fechada"]);
const SCHEDULED_STAGES = new Set(["Reuniao Agendada", "Reuniao Realizada", "Proposta em Analise", "Venda Fechada"]);

interface Opp { id: string; stage: string; followers: string[]; assigned_to: string | null; monetary_value: number; last_stage_change_at: string | null; }
interface UserStats { agendadas: number; realizadas: number; vendas: number; valor: number; }

function emptyStats(): UserStats { return { agendadas: 0, realizadas: 0, vendas: 0, valor: 0 }; }

function aggregate(opps: Opp[]): Map<string, UserStats> {
  const map = new Map<string, UserStats>();
  const ensure = (id: string) => { if (!map.has(id)) map.set(id, emptyStats()); return map.get(id)!; };
  for (const opp of opps) {
    const val = parseFloat(opp.monetary_value as any) || 0;
    for (const fid of (opp.followers || [])) {
      if (!GHL_USERS[fid]) continue;
      const s = ensure(fid);
      if (REALIZED_STAGES.has(opp.stage)) s.realizadas++;
      if (opp.stage === "Venda Fechada") { s.vendas++; s.valor += val; }
    }
    if (opp.assigned_to && GHL_USERS[opp.assigned_to] && SCHEDULED_STAGES.has(opp.stage)) {
      ensure(opp.assigned_to).agendadas++;
    }
  }
  return map;
}

// ── Audio context (shared, unlocked on first click) ────────────
let _audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!_audioCtx) {
    try { _audioCtx = new AudioContext(); } catch { return null; }
  }
  return _audioCtx;
}

export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  // Play silent buffer to satisfy autoplay policy
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
}

function playSound(notes: [number, number][], volume = 0.3) {
  const ctx = getCtx();
  if (!ctx || ctx.state === "suspended") return;
  try {
    notes.reduce((t, [f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(volume, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.start(t); o.stop(t + d + 0.05);
      return t + d * 0.85;
    }, ctx.currentTime + 0.05);
  } catch {}
}

// Agendamento: 3 quick ascending pings (C4 E4 G4)
function playAgendaSound() {
  playSound([[523.25, 0.12], [659.25, 0.12], [783.99, 0.18]], 0.28);
}

// Apresentação: smooth warm rise (F4 A4 C5 E5)
function playApresentacaoSound() {
  playSound([[349.23, 0.14], [440, 0.14], [523.25, 0.14], [659.25, 0.22]], 0.3);
}

// Venda: air horn blasts (BRAAAAAP x2)
function playVendaSound() {
  const ctx = getCtx();
  if (!ctx || ctx.state === "suspended") return;
  try {
    const blastAt = (startT: number, dur: number) => {
      // Sawtooth + square layered for that harsh horn buzz
      const freqs = [233, 466, 699];
      for (const freq of freqs) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const dist = ctx.createWaveShaper();
        // Gentle waveshaping for slight distortion
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
        }
        dist.curve = curve;
        o.connect(dist); dist.connect(g); g.connect(ctx.destination);
        o.type = "sawtooth";
        // Slight pitch drop for realism
        o.frequency.setValueAtTime(freq * 1.04, startT);
        o.frequency.exponentialRampToValueAtTime(freq, startT + 0.08);
        const vol = freq === 233 ? 0.45 : freq === 466 ? 0.25 : 0.12;
        g.gain.setValueAtTime(0, startT);
        g.gain.linearRampToValueAtTime(vol, startT + 0.01);
        g.gain.setValueAtTime(vol, startT + dur - 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
        o.start(startT); o.stop(startT + dur + 0.05);
      }
    };
    const t0 = ctx.currentTime + 0.04;
    blastAt(t0, 0.55);        // first blast
    blastAt(t0 + 0.70, 0.75); // second longer blast
  } catch {}
}

// ── Types ──────────────────────────────────────────────────────
type CelebType = "venda" | "agendamento" | "apresentacao" | null;

// ── Confetti ───────────────────────────────────────────────────
const CONFETTI_VENDA = ["#22c55e","#facc15","#3b82f6","#f97316","#a855f7","#ec4899","#06b6d4","#ffffff"];
const CONFETTI_AGENDA = ["#38bdf8","#7dd3fc","#0ea5e9","#bae6fd","#e0f2fe","#ffffff","#93c5fd"];
const CONFETTI_APRES = ["#a78bfa","#c4b5fd","#8b5cf6","#ddd6fe","#e9d5ff","#f0abfc","#d946ef"];

function makeParticles(colors: string[]) {
  return Array.from({ length: 80 }, () => ({
    x: Math.random() * 100,
    c: colors[Math.floor(Math.random() * colors.length)],
    w: 6 + Math.random() * 8,
    h: 4 + Math.random() * 6,
    dl: Math.random() * 1,
    dr: 2 + Math.random() * 2,
    dx: -35 + Math.random() * 70,
    r: Math.random() * 360,
  }));
}

function Confetti({ active, type }: { active: boolean; type: CelebType }) {
  if (!active || !type) return null;
  const colors = type === "venda" ? CONFETTI_VENDA : type === "agendamento" ? CONFETTI_AGENDA : CONFETTI_APRES;
  const parts = makeParticles(colors);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10001 }}>
      <style>{`@keyframes fall{0%{transform:translateY(-20px) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) translateX(var(--d)) rotate(720deg);opacity:.2}}`}</style>
      {parts.map((p, i) => (
        <div key={i} className="absolute top-0" style={{
          left: `${p.x}%`, width: p.w, height: p.h, background: p.c, borderRadius: 2,
          animation: `fall ${p.dr}s ${p.dl}s ease-in both`,
          "--d": `${p.dx}px`, transform: `rotate(${p.r}deg)`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ── Screen Flash ───────────────────────────────────────────────
function ScreenFlash({ type }: { type: CelebType }) {
  if (!type) return null;
  const color =
    type === "venda" ? "rgba(34,197,94,0.18)" :
    type === "agendamento" ? "rgba(14,165,233,0.18)" :
    "rgba(139,92,246,0.18)";
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9998, background: color, animation: "flashFade 0.6s ease-out forwards" }}
    />
  );
}

// ── Celebration Banner ─────────────────────────────────────────
const CELEB_CONFIG = {
  venda:       { bg: "bg-green-500",  border: "border-green-300",  icon: "🏆", title: "VENDA FECHADA!",      sub: "" },
  agendamento: { bg: "bg-sky-500",    border: "border-sky-300",    icon: "📅", title: "REUNIÃO AGENDADA!",   sub: "" },
  apresentacao:{ bg: "bg-violet-600", border: "border-violet-300", icon: "🤝", title: "APRESENTAÇÃO!",       sub: "" },
};

function CelebBanner({ type, nome, valor }: { type: CelebType; nome: string; valor: number }) {
  if (!type) return null;
  const cfg = CELEB_CONFIG[type];
  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 10000, animation: "bannerIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
    >
      <div className={cn(
        "rounded-3xl px-16 py-10 text-center shadow-2xl border-4",
        cfg.bg, cfg.border
      )}>
        <div className="text-8xl mb-3" style={{ animation: "iconBounce 0.5s ease-out 0.1s both" }}>{cfg.icon}</div>
        <div className="text-white font-black text-5xl tracking-tight mb-3 drop-shadow-lg">{cfg.title}</div>
        <div className="text-white/90 text-3xl font-bold">{nome}</div>
        {type === "venda" && valor > 0 && (
          <div className="text-white text-4xl font-black mt-3 drop-shadow">
            {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────
const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function Header({ mes, onClose }: { mes: string; onClose: () => void }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  const [year, month] = mes.split("-").map(Number);
  return (
    <div className="flex items-center px-8 py-4 border-b border-white/10 relative shrink-0">
      {/* Logo + BP TV */}
      <div className="w-48 flex items-center gap-3">
        <img src={bpGroupLogoWhite} alt="BP Group" className="h-9 object-contain" />
        <span className="text-white/40 font-black text-sm tracking-widest uppercase border-l border-white/20 pl-3">BP TV</span>
      </div>
      {/* Month center */}
      <div className="absolute left-1/2 -translate-x-1/2 text-white font-black text-3xl tracking-wide">
        {MONTH_NAMES[(month || 1) - 1]}/{year}
      </div>
      {/* Clock + back */}
      <div className="ml-auto flex items-center gap-4">
        <span className="text-white font-mono font-black text-4xl tracking-wider">
          {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <button onClick={onClose} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 text-center flex-1 flex flex-col gap-1">
      <div className="text-white/50 text-xs font-bold tracking-widest uppercase">{label}</div>
      <div className={cn("text-7xl font-black tabular-nums leading-none my-1", color || "text-white")}>{value}</div>
      {sub && <div className="text-white/40 text-sm font-semibold">{sub}</div>}
    </div>
  );
}

// ── Ritmo Card ─────────────────────────────────────────────────
function RitmoCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-white/5 rounded-xl px-5 py-3 flex items-center gap-3 flex-1">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-white/40 text-xs font-bold tracking-widest uppercase leading-none mb-0.5">{label}</div>
        <div className="text-white font-black text-2xl tabular-nums leading-none">{value}</div>
      </div>
    </div>
  );
}

// ── Consultor Card ─────────────────────────────────────────────
function ConsultorCard({ nome, stats, metaVendas, ritmoRealizadas }: {
  nome: string; stats: UserStats; metaVendas: number; ritmoRealizadas: number;
}) {
  const pctV = metaVendas > 0 ? Math.min(100, (stats.vendas / metaVendas) * 100) : 0;
  const metaReun = ritmoRealizadas * metaVendas;
  const pctR = metaReun > 0 ? Math.min(100, (stats.realizadas / metaReun) * 100) : 0;
  const faltam = ritmoRealizadas > 0 ? Math.max(0, ritmoRealizadas - (stats.realizadas % ritmoRealizadas || ritmoRealizadas)) : 0;

  return (
    <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-white font-black text-xl leading-tight">{nome}</span>
        {ritmoRealizadas > 0 && <span className="text-white/30 text-xs font-mono shrink-0 ml-2">1 venda ≈ {ritmoRealizadas} apres.</span>}
      </div>
      <div>
        <span className="text-white font-black text-5xl tabular-nums">{stats.vendas}</span>
        {metaVendas > 0 && <span className="text-white/30 text-xl font-bold">/{metaVendas} vendas</span>}
      </div>
      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000",
          pctV >= 100 ? "bg-green-400" : pctV >= 50 ? "bg-yellow-400" : "bg-red-500"
        )} style={{ width: `${Math.max(pctV, stats.vendas > 0 ? 5 : 0)}%` }} />
      </div>
      <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
        <span>🤝</span><span>{stats.realizadas} apresentações no mês</span>
        {stats.agendadas > 0 && <span className="ml-auto text-sky-400">📅 {stats.agendadas} agendadas</span>}
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full bg-sky-500 transition-all duration-1000" style={{ width: `${Math.max(pctR, stats.realizadas > 0 ? 3 : 0)}%` }} />
      </div>
      {faltam > 0 && (
        <div className="text-white/40 text-xs font-semibold">
          🎯 faltam ~{faltam} para a próxima venda
        </div>
      )}
    </div>
  );
}

const CELEB_STAGES = new Set(["Reuniao Agendada", "Reuniao Realizada", "Venda Fechada"]);
// Window to detect "just arrived" opps (larger than poll interval)
const RECENT_MS = 90_000;

// ── Main ───────────────────────────────────────────────────────
export default function TV() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId || "";

  const [opps, setOpps] = useState<Opp[]>([]);
  const [metaVendasTotal, setMetaVendasTotal] = useState(0);
  const [celebType, setCelebType] = useState<CelebType>(null);
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [celebNome, setCelebNome] = useState("");
  const [celebValor, setCelebValor] = useState(0);

  // prevStages: ONLY updated inside loadOpps after diff check — never from Realtime directly
  const prevStagesRef = useRef(new Map<string, string>());
  const loadedOnceRef = useRef(false);
  const celebTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fromUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 3, 0, 0));

  useEffect(() => {
    const prev = document.title;
    document.title = "BP TV";
    return () => { document.title = prev; };
  }, []);

  const celebrate = useCallback((type: CelebType, nome: string, valor = 0) => {
    if (celebTimer.current) clearTimeout(celebTimer.current);
    setCelebType(type); setCelebNome(nome); setCelebValor(valor);
    if (type === "venda") playVendaSound();
    else if (type === "apresentacao") playApresentacaoSound();
    else playAgendaSound();
    celebTimer.current = setTimeout(() => setCelebType(null), 5500);
  }, []);

  const loadOpps = useCallback(async () => {
    if (!locationId) return;
    const { data } = await (supabase as any)
      .from("ghl_pipeline_opportunities")
      .select("id,stage,followers,assigned_to,monetary_value,last_stage_change_at")
      .eq("location_id", locationId)
      .gte("last_stage_change_at", fromUTC.toISOString());
    if (!data) return;

    const isFirst = !loadedOnceRef.current;
    loadedOnceRef.current = true;

    if (!isFirst) {
      const nowMs = Date.now();
      for (const opp of data) {
        const prevStage = prevStagesRef.current.get(opp.id);
        const newStage: string = opp.stage;
        let fireStage: string | null = null;

        if (prevStage === undefined) {
          // Opp just entered the monthly filter — celebrate only if very recent change
          if (CELEB_STAGES.has(newStage)) {
            const changedAt = opp.last_stage_change_at ? new Date(opp.last_stage_change_at).getTime() : 0;
            if (nowMs - changedAt < RECENT_MS) fireStage = newStage;
          }
        } else if (prevStage !== newStage && CELEB_STAGES.has(newStage)) {
          fireStage = newStage;
        }

        if (fireStage) {
          const followers: string[] = Array.isArray(opp.followers) ? opp.followers : [];
          const closer = followers.map((f: string) => GHL_USERS[f]).find(Boolean) || null;
          const owner = opp.assigned_to ? GHL_USERS[opp.assigned_to] : null;
          const nome = closer || owner || "Equipe";
          const valor = parseFloat(opp.monetary_value) || 0;
          if (fireStage === "Reuniao Agendada") celebrate("agendamento", owner || nome);
          else if (fireStage === "Reuniao Realizada") celebrate("apresentacao", nome);
          else celebrate("venda", nome, valor);
        }

        prevStagesRef.current.set(opp.id, newStage);
      }
    } else {
      // First load: just snapshot, no celebrations
      for (const o of data) prevStagesRef.current.set(o.id, o.stage);
    }

    setOpps(data);
  }, [locationId, celebrate]);

  useEffect(() => {
    if (!locationId) return;
    (supabase as any).from("comercial_metas").select("meta_vendas")
      .eq("mes", mes).eq("location_id", locationId).single()
      .then(({ data }: any) => { if (data) setMetaVendasTotal(data.meta_vendas || 0); });
  }, [locationId, mes]);

  useEffect(() => { loadOpps(); }, [loadOpps]);

  // Realtime: debounced trigger — celebration logic lives in loadOpps, not here
  useEffect(() => {
    if (!locationId) return;
    const ch = (supabase as any)
      .channel(`tv-ghl-${locationId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ghl_pipeline_opportunities",
        filter: `location_id=eq.${locationId}`
      }, () => {
        // Debounce: wait 400ms after last event burst before querying
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(loadOpps, 400);
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [locationId, loadOpps]);

  // Poll every 30s as fallback
  useEffect(() => {
    const id = setInterval(loadOpps, 30 * 1000);
    return () => clearInterval(id);
  }, [loadOpps]);

  const statsMap = aggregate(opps);

  const activeUsers = Array.from(
    new Set([
      ...opps.flatMap(o => (o.followers || []).filter(f => GHL_USERS[f])),
      ...opps.filter(o => o.assigned_to && GHL_USERS[o.assigned_to]).map(o => o.assigned_to!),
    ])
  ).map(uid => ({ uid, nome: GHL_USERS[uid], stats: statsMap.get(uid) || emptyStats() }))
    .sort((a, b) => b.stats.vendas - a.stats.vendas || b.stats.realizadas - a.stats.realizadas);

  const totalVendas = opps.filter(o => o.stage === "Venda Fechada").length;
  const totalRealizadas = opps.filter(o => REALIZED_STAGES.has(o.stage)).length;
  const totalAgendadas = opps.filter(o => SCHEDULED_STAGES.has(o.stage)).length;

  const ritmoAgendadasPorVenda = totalVendas > 0 ? Math.round(totalAgendadas / totalVendas) : 0;
  const ritmoRealizadasPorVenda = totalVendas > 0 ? Math.round(totalRealizadas / totalVendas) : 0;

  const pctV = metaVendasTotal > 0 ? Math.round((totalVendas / metaVendasTotal) * 100) : 0;
  const vendasColor = pctV >= 100 ? "text-green-400" : pctV >= 50 ? "text-yellow-400" : "text-white";

  const metaPerUser = activeUsers.length > 0 && metaVendasTotal > 0
    ? Math.round(metaVendasTotal / activeUsers.length) : 0;

  const cols = activeUsers.length <= 2 ? "grid-cols-2"
    : activeUsers.length <= 4 ? "grid-cols-2"
    : activeUsers.length <= 6 ? "grid-cols-3"
    : "grid-cols-4";

  const handlePageClick = () => {
    if (!soundUnlocked) {
      unlockAudio();
      setSoundUnlocked(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f1117] flex flex-col" style={{ zIndex: 9999 }} onClick={handlePageClick}>
      <style>{`
        @keyframes bannerIn { from { opacity:0; transform:scale(0.7) translateY(40px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes iconBounce { from { transform:scale(0) rotate(-20deg); } 60% { transform:scale(1.3) rotate(10deg); } to { transform:scale(1) rotate(0deg); } }
        @keyframes flashFade { 0% { opacity:1; } 100% { opacity:0; } }
      `}</style>

      {/* Sound unlock hint */}
      {!soundUnlocked && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-amber-500 text-black font-black text-lg px-8 py-4 rounded-2xl shadow-2xl cursor-pointer animate-pulse"
          style={{ zIndex: 10002 }}
          onClick={handlePageClick}
        >
          🔇 Clique em qualquer lugar para ativar o som
        </div>
      )}

      {/* Celebrations */}
      <ScreenFlash type={celebType} />
      <Confetti active={!!celebType} type={celebType} />
      <CelebBanner type={celebType} nome={celebNome} valor={celebValor} />

      <Header mes={mes} onClose={() => navigate("/comercial")} />

      <div className="flex-1 p-5 flex flex-col gap-4 overflow-auto">
        {/* Top stat cards */}
        <div className="flex gap-3">
          <StatCard label="Reuniões Agendadas" value={totalAgendadas} color="text-sky-400" />
          <StatCard label="Apresentações do Mês" value={totalRealizadas} color="text-white" />
          <StatCard
            label="Vendas do Mês"
            value={totalVendas}
            sub={metaVendasTotal > 0 ? `Meta da equipe: ${metaVendasTotal}` : undefined}
            color={vendasColor}
          />
        </div>

        {/* Ritmo */}
        {totalVendas > 0 && (
          <div className="flex gap-3">
            <RitmoCard icon="📅" label="Ritmo — Agendadas por Venda"
              value={ritmoAgendadasPorVenda > 0 ? `${ritmoAgendadasPorVenda} agend. ≈ 1 venda` : "--"} />
            <RitmoCard icon="🤝" label="Ritmo — Realizadas por Venda"
              value={ritmoRealizadasPorVenda > 0 ? `${ritmoRealizadasPorVenda} apres. ≈ 1 venda` : "--"} />
          </div>
        )}

        {/* Consultant grid */}
        <div className={cn("grid gap-3 flex-1", cols)}>
          {activeUsers.map(({ uid, nome, stats }) => (
            <ConsultorCard
              key={uid}
              nome={nome}
              stats={stats}
              metaVendas={metaPerUser}
              ritmoRealizadas={ritmoRealizadasPorVenda || 20}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
