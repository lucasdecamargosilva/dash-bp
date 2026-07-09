import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Consultor {
  id: string;
  nome: string;
  setor: "pre_venda" | "vendas";
  pct_meta: number;
}

interface ConsultorStats {
  leads: number;
  conexoes: number;
  reunioes_agendadas: number;
  reunioes: number;
  no_show: number;
  vendas: number;
  valor: number;
}

interface MetaMensal {
  meta_leads: number;
  meta_agendamentos: number;
  meta_vendas: number;
  meta_faturamento: number;
  meta_reunioes_realizadas?: number;
}

interface TVModeProps {
  consultores: Consultor[];
  byConsultor: Map<string, ConsultorStats>;
  totalVendas: number;
  totalReunioes: number;
  totalValor: number;
  meta: MetaMensal;
  mes: string;
  locationId: string;
  onClose: () => void;
}

function playSaleSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    const durations = [0.12, 0.12, 0.12, 0.2, 0.4];
    let t = ctx.currentTime + 0.05;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);
      osc.start(t);
      osc.stop(t + durations[i] + 0.05);
      t += durations[i] * 0.9;
    });
    // bass hit
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.type = "sine";
    bass.frequency.setValueAtTime(130, ctx.currentTime + 0.05);
    bassGain.gain.setValueAtTime(0.4, ctx.currentTime + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    bass.start(ctx.currentTime + 0.05);
    bass.stop(ctx.currentTime + 0.5);
  } catch {}
}

function Confetti({ active }: { active: boolean }) {
  const particles = useRef<Array<{ x: number; color: string; size: number; delay: number; duration: number; drift: number }>>([]);
  if (particles.current.length === 0) {
    const colors = ["#22c55e", "#facc15", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#06b6d4"];
    for (let i = 0; i < 80; i++) {
      particles.current.push({
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 1.2,
        duration: 2.5 + Math.random() * 2,
        drift: -30 + Math.random() * 60,
      });
    }
  }

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10001 }}>
      {particles.current.map((p, i) => (
        <div
          key={i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in both`,
            transform: `rotate(${Math.random() * 360}deg)`,
            "--drift": `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(var(--drift)) rotate(720deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function SaleBanner({ vendedor, valor, visible }: { vendedor: string; valor: number; visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center pointer-events-none transition-all duration-500",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{ zIndex: 10000 }}
    >
      <div
        className={cn(
          "bg-green-500 rounded-3xl px-16 py-10 text-center shadow-2xl transition-all duration-500",
          visible ? "scale-100" : "scale-75"
        )}
      >
        <div className="text-7xl mb-3">🏆</div>
        <div className="text-white font-black text-5xl tracking-tight mb-2">VENDA FECHADA!</div>
        <div className="text-green-100 text-2xl font-bold">{vendedor}</div>
        {valor > 0 && (
          <div className="text-white text-3xl font-black mt-2">
            {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveClock({ mes }: { mes: string }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [year, month] = mes.split("-").map(Number);
  const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const monthLabel = `${monthNames[month - 1]}/${year}`;

  return (
    <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
      <div className="text-white/40 text-lg font-mono font-bold tracking-widest uppercase">{monthLabel}</div>
      <div className="text-white text-4xl font-mono font-black tracking-wider">
        {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 text-center flex-1">
      <div className="text-white/50 text-xs font-bold tracking-widest uppercase mb-2">{label}</div>
      <div className={cn("text-6xl font-black tabular-nums leading-none mb-1", color || "text-white")}>{value}</div>
      {sub && <div className="text-white/40 text-sm font-semibold mt-1">{sub}</div>}
    </div>
  );
}

function ConsultorCard({
  consultor,
  stats,
  metaVendas,
}: {
  consultor: Consultor;
  stats: ConsultorStats;
  metaVendas: number;
}) {
  const pct = metaVendas > 0 ? Math.min(100, (stats.vendas / metaVendas) * 100) : 0;
  const faltam = Math.max(0, metaVendas - stats.vendas);
  const ritmo = stats.vendas > 0 && stats.reunioes > 0
    ? Math.round(stats.reunioes / stats.vendas)
    : null;

  return (
    <div className="bg-white/5 hover:bg-white/8 rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-white font-black text-lg">{consultor.nome}</span>
        {ritmo !== null && (
          <span className="text-white/30 text-xs font-mono">1 venda ≈ {ritmo} apres.</span>
        )}
      </div>

      <div>
        <span className="text-white font-black text-4xl tabular-nums">{stats.vendas}</span>
        <span className="text-white/30 text-2xl font-bold">/{metaVendas} vendas</span>
      </div>

      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", pct >= 100 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-red-500")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
          <span>🤝</span>
          <span>{stats.reunioes} apresentações no mês</span>
        </div>
        {faltam > 0 && (
          <div className="text-white/40 text-xs font-semibold">
            🎯 faltam ~{ritmo !== null ? ritmo * faltam : "?"} para a próx. venda
          </div>
        )}
      </div>
    </div>
  );
}

export function TVMode({ consultores, byConsultor, totalVendas, totalReunioes, totalValor, meta, mes, locationId, onClose }: TVModeProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [saleInfo, setSaleInfo] = useState<{ vendedor: string; valor: number }>({ vendedor: "", valor: 0 });
  const prevVendasRef = useRef<Map<string, number>>(new Map());
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize ref with current data
  useEffect(() => {
    consultores.forEach(c => {
      const stats = byConsultor.get(c.id);
      if (stats) prevVendasRef.current.set(c.id, stats.vendas);
    });
  }, []);

  const triggerCelebration = useCallback((vendedor: string, valor: number) => {
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    setSaleInfo({ vendedor, valor });
    setCelebrating(true);
    playSaleSound();
    celebrateTimerRef.current = setTimeout(() => setCelebrating(false), 5500);
  }, []);

  // Supabase realtime subscription
  useEffect(() => {
    const channel = (supabase as any)
      .channel(`tv-comercial-${locationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comercial_diario", filter: `location_id=eq.${locationId}` },
        async () => {
          // Refetch diario for this month
          const { data } = await (supabase as any)
            .from("comercial_diario")
            .select("*")
            .gte("data", `${mes}-01`)
            .lte("data", `${mes}-31`)
            .eq("location_id", locationId);

          if (!data) return;

          // Aggregate new vendas by consultant
          const newByConsultor = new Map<string, { vendas: number; valor: number }>();
          for (const row of data) {
            const curr = newByConsultor.get(row.consultor_id) || { vendas: 0, valor: 0 };
            curr.vendas += row.vendas || 0;
            curr.valor += row.valor_vendas || 0;
            newByConsultor.set(row.consultor_id, curr);
          }

          // Check for increased vendas
          for (const [cid, curr] of newByConsultor) {
            const prev = prevVendasRef.current.get(cid) || 0;
            if (curr.vendas > prev) {
              const consultor = consultores.find(c => c.id === cid);
              triggerCelebration(consultor?.nome || "Equipe", curr.valor - (prev * (curr.valor / curr.vendas || 0)));
              prevVendasRef.current.set(cid, curr.vendas);
            }
          }
        }
      )
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [mes, locationId, consultores, triggerCelebration]);

  // Prevent scroll on body while TV is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const metaVendasTotal = meta.meta_vendas || 0;
  const pctVendas = metaVendasTotal > 0 ? Math.round((totalVendas / metaVendasTotal) * 100) : 0;
  const vendasColor = pctVendas >= 100 ? "text-green-400" : pctVendas >= 50 ? "text-yellow-400" : "text-red-400";

  const pctReunioes = (meta.meta_reunioes_realizadas || 0) > 0
    ? Math.round((totalReunioes / (meta.meta_reunioes_realizadas || 1)) * 100)
    : null;
  const reunioesColor = pctReunioes === null ? "text-white" : pctReunioes >= 100 ? "text-green-400" : pctReunioes >= 50 ? "text-yellow-400" : "text-red-400";

  const ritmoEquipe = totalVendas > 0 && totalReunioes > 0
    ? Math.round(totalReunioes / totalVendas)
    : null;

  const content = (
    <>
      <Confetti active={celebrating} />
      <SaleBanner vendedor={saleInfo.vendedor} valor={saleInfo.valor} visible={celebrating} />

      <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col overflow-auto" style={{ zIndex: 9999 }}>
        {/* Header */}
        <LiveClock mes={mes} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-white/30 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          style={{ zIndex: 10000 }}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 p-6 flex flex-col gap-5">
          {/* Top stats */}
          <div className="flex gap-4">
            <StatCard
              label="Vendas do Mês"
              value={totalVendas}
              sub={metaVendasTotal > 0 ? `Meta da equipe: ${metaVendasTotal}` : undefined}
              color={vendasColor}
            />
            <StatCard
              label="Apresentações do Mês"
              value={totalReunioes}
              sub={(meta.meta_reunioes_realizadas || 0) > 0 ? `Meta: ${meta.meta_reunioes_realizadas}` : undefined}
              color={reunioesColor}
            />
            {totalValor > 0 ? (
              <StatCard
                label="Faturamento"
                value={totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })}
                color="text-green-400"
              />
            ) : (
              <StatCard
                label="Ritmo da Equipe"
                value={ritmoEquipe !== null ? ritmoEquipe : "--"}
                sub={ritmoEquipe !== null ? "apresentações ≈ 1 venda" : "sem vendas ainda"}
                color={ritmoEquipe !== null && ritmoEquipe <= 10 ? "text-green-400" : "text-yellow-400"}
              />
            )}
          </div>

          {/* Consultant grid */}
          <div className={cn(
            "grid gap-4 flex-1",
            consultores.length <= 2 ? "grid-cols-2" :
            consultores.length <= 4 ? "grid-cols-2" :
            consultores.length <= 6 ? "grid-cols-3" : "grid-cols-4"
          )}>
            {consultores.map(c => {
              const stats = byConsultor.get(c.id) || { leads: 0, conexoes: 0, reunioes_agendadas: 0, reunioes: 0, no_show: 0, vendas: 0, valor: 0 };
              const metaVendas = Math.round(metaVendasTotal * ((c.pct_meta || 0) / 100));
              return (
                <ConsultorCard
                  key={c.id}
                  consultor={c}
                  stats={stats}
                  metaVendas={metaVendas}
                />
              );
            })}
          </div>

          {/* Trophy row for top seller */}
          {totalVendas > 0 && (() => {
            let top: { nome: string; vendas: number } | null = null;
            for (const c of consultores) {
              const stats = byConsultor.get(c.id);
              if (stats && (!top || stats.vendas > top.vendas)) {
                top = { nome: c.nome, vendas: stats.vendas };
              }
            }
            if (!top || top.vendas === 0) return null;
            return (
              <div className="flex items-center justify-center gap-2 text-yellow-400/60 text-sm font-bold">
                <Trophy className="h-4 w-4" />
                <span>Liderando: {top.nome} com {top.vendas} {top.vendas === 1 ? "venda" : "vendas"}</span>
                <Trophy className="h-4 w-4" />
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
