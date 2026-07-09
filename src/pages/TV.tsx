import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { cn } from "@/lib/utils";

interface Consultor {
  id: string;
  nome: string;
  setor: "pre_venda" | "vendas";
  pct_meta: number;
}

interface DiarioEntry {
  consultor_id: string;
  leads_novos: number;
  reunioes: number;
  reunioes_agendadas?: number;
  vendas: number;
  valor_vendas: number;
}

interface MetaMensal {
  meta_vendas: number;
  meta_faturamento: number;
  meta_agendamentos: number;
  meta_leads: number;
  meta_reunioes_realizadas?: number;
}

// ---- Sound ----
function playSaleSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    const durations = [0.12, 0.12, 0.12, 0.2, 0.4];
    let t = ctx.currentTime + 0.05;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);
      osc.start(t); osc.stop(t + durations[i] + 0.05);
      t += durations[i] * 0.9;
    });
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.connect(bassGain); bassGain.connect(ctx.destination);
    bass.type = "sine"; bass.frequency.setValueAtTime(130, ctx.currentTime + 0.05);
    bassGain.gain.setValueAtTime(0.4, ctx.currentTime + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    bass.start(ctx.currentTime + 0.05); bass.stop(ctx.currentTime + 0.5);
  } catch {}
}

// ---- Confetti ----
const COLORS = ["#22c55e","#facc15","#3b82f6","#f97316","#a855f7","#ec4899","#06b6d4"];
const PARTICLES = Array.from({ length: 80 }, () => ({
  x: Math.random() * 100,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  w: 6 + Math.random() * 8,
  h: 4 + Math.random() * 6,
  delay: Math.random() * 1.2,
  dur: 2.5 + Math.random() * 2,
  drift: -30 + Math.random() * 60,
  rot: Math.random() * 360,
}));

function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10001 }}>
      <style>{`@keyframes fall{0%{transform:translateY(-20px) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) translateX(var(--d)) rotate(720deg);opacity:.3}}`}</style>
      {PARTICLES.map((p, i) => (
        <div key={i} className="absolute top-0" style={{
          left: `${p.x}%`, width: p.w, height: p.h,
          background: p.color, borderRadius: 2,
          animation: `fall ${p.dur}s ${p.delay}s ease-in both`,
          "--d": `${p.drift}px`,
          transform: `rotate(${p.rot}deg)`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ---- Sale Banner ----
function SaleBanner({ visible, vendedor, valor }: { visible: boolean; vendedor: string; valor: number }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none transition-all duration-500"
      style={{ zIndex: 10000, opacity: visible ? 1 : 0 }}>
      <div className={cn("bg-green-500 rounded-3xl px-16 py-10 text-center shadow-2xl transition-all duration-500", visible ? "scale-100" : "scale-75")}>
        <div className="text-7xl mb-3">🏆</div>
        <div className="text-white font-black text-5xl tracking-tight mb-2">VENDA FECHADA!</div>
        <div className="text-green-100 text-2xl font-bold">{vendedor}</div>
        {valor > 0 && <div className="text-white text-3xl font-black mt-2">{valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0})}</div>}
      </div>
    </div>
  );
}

// ---- Clock ----
function LiveClock({ mes }: { mes: string }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  const [year, month] = mes.split("-").map(Number);
  const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
      <div className="text-white/40 text-lg font-mono font-bold tracking-widest uppercase">
        {monthNames[(month || 1) - 1]}/{year}
      </div>
      <div className="text-white text-4xl font-mono font-black tracking-wider">
        {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </div>
  );
}

// ---- Stat Card ----
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 text-center flex-1">
      <div className="text-white/50 text-xs font-bold tracking-widest uppercase mb-2">{label}</div>
      <div className={cn("text-6xl font-black tabular-nums leading-none mb-1", color || "text-white")}>{value}</div>
      {sub && <div className="text-white/40 text-sm font-semibold mt-1">{sub}</div>}
    </div>
  );
}

// ---- Consultor Card ----
function ConsultorCard({ c, stats, metaVendas }: {
  c: Consultor;
  stats: { reunioes: number; vendas: number; valor: number };
  metaVendas: number;
}) {
  const pct = metaVendas > 0 ? Math.min(100, (stats.vendas / metaVendas) * 100) : 0;
  const faltam = Math.max(0, metaVendas - stats.vendas);
  const ritmo = stats.vendas > 0 && stats.reunioes > 0 ? Math.round(stats.reunioes / stats.vendas) : null;
  return (
    <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-white font-black text-xl">{c.nome}</span>
        {ritmo !== null && <span className="text-white/30 text-xs font-mono">1 venda ≈ {ritmo} apres.</span>}
      </div>
      <div>
        <span className="text-white font-black text-5xl tabular-nums">{stats.vendas}</span>
        <span className="text-white/30 text-2xl font-bold">/{metaVendas} vendas</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000",
          pct >= 100 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-500"
        )} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
          <span>🤝</span><span>{stats.reunioes} apresentações no mês</span>
        </div>
        {faltam > 0 && ritmo !== null && (
          <div className="text-white/40 text-xs font-semibold">
            🎯 faltam ~{ritmo * faltam} para a próx. venda
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main TV Page ----
export default function TV() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId || "";

  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [diarioData, setDiarioData] = useState<DiarioEntry[]>([]);
  const [meta, setMeta] = useState<MetaMensal>({ meta_vendas: 0, meta_faturamento: 0, meta_agendamentos: 0, meta_leads: 0 });
  const [celebrating, setCelebrating] = useState(false);
  const [saleInfo, setSaleInfo] = useState({ vendedor: "", valor: 0 });
  const prevVendasRef = useRef<Map<string, number>>(new Map());
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const triggerCelebration = useCallback((vendedor: string, valor: number) => {
    if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    setSaleInfo({ vendedor, valor });
    setCelebrating(true);
    playSaleSound();
    celebrateTimer.current = setTimeout(() => setCelebrating(false), 5500);
  }, []);

  // Initial load
  useEffect(() => {
    if (!locationId) return;
    async function load() {
      const [cRes, mRes, dRes] = await Promise.all([
        (supabase as any).from("comercial_consultores").select("*").eq("ativo", true).eq("location_id", locationId).order("nome"),
        (supabase as any).from("comercial_metas").select("*").eq("mes", mes).eq("location_id", locationId).single(),
        (supabase as any).from("comercial_diario").select("*").gte("data", `${mes}-01`).lte("data", `${mes}-31`).eq("location_id", locationId),
      ]);
      setConsultores(cRes.data || []);
      if (mRes.data) setMeta(mRes.data);
      setDiarioData(dRes.data || []);

      // Init prev vendas
      const byC = new Map<string, number>();
      for (const row of (dRes.data || [])) {
        byC.set(row.consultor_id, (byC.get(row.consultor_id) || 0) + (row.vendas || 0));
      }
      prevVendasRef.current = byC;
    }
    load();
  }, [locationId, mes]);

  // Realtime subscription
  useEffect(() => {
    if (!locationId) return;
    const channel = (supabase as any)
      .channel(`tv-${locationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comercial_diario", filter: `location_id=eq.${locationId}` },
        async () => {
          const { data } = await (supabase as any)
            .from("comercial_diario").select("*")
            .gte("data", `${mes}-01`).lte("data", `${mes}-31`)
            .eq("location_id", locationId);
          if (!data) return;

          const newByC = new Map<string, { vendas: number; valor: number }>();
          for (const row of data) {
            const curr = newByC.get(row.consultor_id) || { vendas: 0, valor: 0 };
            curr.vendas += row.vendas || 0;
            curr.valor += row.valor_vendas || 0;
            newByC.set(row.consultor_id, curr);
          }

          for (const [cid, curr] of newByC) {
            const prev = prevVendasRef.current.get(cid) || 0;
            if (curr.vendas > prev) {
              const c = consultores.find(x => x.id === cid);
              triggerCelebration(c?.nome || "Equipe", curr.valor);
              prevVendasRef.current.set(cid, curr.vendas);
            }
          }
          setDiarioData(data);
        }
      )
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [locationId, mes, consultores, triggerCelebration]);

  // Aggregate
  const byConsultor = new Map<string, { reunioes: number; vendas: number; valor: number }>();
  for (const c of consultores) byConsultor.set(c.id, { reunioes: 0, vendas: 0, valor: 0 });
  for (const d of diarioData) {
    const curr = byConsultor.get(d.consultor_id);
    if (curr) { curr.reunioes += d.reunioes || 0; curr.vendas += d.vendas || 0; curr.valor += d.valor_vendas || 0; }
  }
  const totalVendas = Array.from(byConsultor.values()).reduce((s, v) => s + v.vendas, 0);
  const totalReunioes = Array.from(byConsultor.values()).reduce((s, v) => s + v.reunioes, 0);
  const totalValor = Array.from(byConsultor.values()).reduce((s, v) => s + v.valor, 0);

  const metaVendasTotal = meta.meta_vendas || 0;
  const pctV = metaVendasTotal > 0 ? Math.round((totalVendas / metaVendasTotal) * 100) : 0;
  const vendasColor = pctV >= 100 ? "text-green-400" : pctV >= 50 ? "text-yellow-400" : "text-red-400";
  const ritmoEquipe = totalVendas > 0 && totalReunioes > 0 ? Math.round(totalReunioes / totalVendas) : null;

  const topConsultor = Array.from(byConsultor.entries())
    .map(([id, s]) => ({ nome: consultores.find(c => c.id === id)?.nome || "", vendas: s.vendas }))
    .sort((a, b) => b.vendas - a.vendas)[0];

  const cols = consultores.length <= 2 ? "grid-cols-2" : consultores.length <= 4 ? "grid-cols-2" : consultores.length <= 6 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col overflow-auto" style={{ zIndex: 9999 }}>
      <Confetti active={celebrating} />
      <SaleBanner visible={celebrating} vendedor={saleInfo.vendedor} valor={saleInfo.valor} />

      {/* Header */}
      <div className="relative">
        <LiveClock mes={mes} />
        <button
          onClick={() => navigate("/comercial")}
          className="absolute top-1/2 -translate-y-1/2 left-4 text-white/30 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5">
        {/* Stats row */}
        <div className="flex gap-4">
          <StatCard label="Vendas do Mês" value={totalVendas}
            sub={metaVendasTotal > 0 ? `Meta da equipe: ${metaVendasTotal}` : undefined}
            color={vendasColor} />
          <StatCard label="Apresentações do Mês" value={totalReunioes}
            sub={(meta.meta_reunioes_realizadas || 0) > 0 ? `Meta: ${meta.meta_reunioes_realizadas}` : undefined} />
          {totalValor > 0
            ? <StatCard label="Faturamento" value={totalValor.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0})} color="text-green-400" />
            : <StatCard label="Ritmo da Equipe" value={ritmoEquipe ?? "--"} sub={ritmoEquipe ? "apresentações ≈ 1 venda" : "sem vendas ainda"}
                color={ritmoEquipe && ritmoEquipe <= 10 ? "text-green-400" : "text-yellow-400"} />
          }
        </div>

        {/* Consultant grid */}
        <div className={cn("grid gap-4 flex-1", cols)}>
          {consultores.map(c => (
            <ConsultorCard
              key={c.id} c={c}
              stats={byConsultor.get(c.id) || { reunioes: 0, vendas: 0, valor: 0 }}
              metaVendas={Math.round(metaVendasTotal * ((c.pct_meta || 0) / 100))}
            />
          ))}
        </div>

        {/* Leader */}
        {topConsultor && topConsultor.vendas > 0 && (
          <div className="flex items-center justify-center gap-2 text-yellow-400/60 text-sm font-bold">
            <Trophy className="h-4 w-4" />
            <span>Liderando: {topConsultor.nome} com {topConsultor.vendas} {topConsultor.vendas === 1 ? "venda" : "vendas"}</span>
            <Trophy className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
