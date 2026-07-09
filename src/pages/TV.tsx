import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { cn } from "@/lib/utils";

// GHL user ID → name map (same as Comercial.tsx)
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

interface Opp { id: string; stage: string; followers: string[]; assigned_to: string | null; monetary_value: number; }
interface UserStats { agendadas: number; realizadas: number; vendas: number; valor: number; }

function emptyStats(): UserStats { return { agendadas: 0, realizadas: 0, vendas: 0, valor: 0 }; }

function aggregate(opps: Opp[]): Map<string, UserStats> {
  const map = new Map<string, UserStats>();
  const ensure = (id: string) => { if (!map.has(id)) map.set(id, emptyStats()); return map.get(id)!; };
  for (const opp of opps) {
    const val = parseFloat(opp.monetary_value as any) || 0;
    // Followers = closers (realizadas + vendas)
    for (const fid of (opp.followers || [])) {
      if (!GHL_USERS[fid]) continue;
      const s = ensure(fid);
      if (REALIZED_STAGES.has(opp.stage)) s.realizadas++;
      if (opp.stage === "Venda Fechada") { s.vendas++; s.valor += val; }
    }
    // Owner = SDR (agendadas)
    if (opp.assigned_to && GHL_USERS[opp.assigned_to] && SCHEDULED_STAGES.has(opp.stage)) {
      ensure(opp.assigned_to).agendadas++;
    }
  }
  return map;
}

// ── Sound ──────────────────────────────────────────────────────
function playVendaSound() {
  try {
    const ctx = new AudioContext();
    [[523.25,.12],[659.25,.12],[783.99,.12],[1046.5,.2],[1318.51,.4]].reduce((t,[f,d])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);o.type="sine";o.frequency.value=f as number;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+(d as number));
      o.start(t);o.stop(t+(d as number)+.05);return t+(d as number)*.9;
    }, ctx.currentTime+.05);
  } catch {}
}

function playAgendaSound() {
  try {
    const ctx = new AudioContext();
    [[440,.1],[554.37,.1],[659.25,.2]].reduce((t,[f,d])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);o.type="sine";o.frequency.value=f as number;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.25,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+(d as number));
      o.start(t);o.stop(t+(d as number)+.05);return t+(d as number)*.85;
    }, ctx.currentTime+.05);
  } catch {}
}

// ── Confetti ───────────────────────────────────────────────────
const COLORS=["#22c55e","#facc15","#3b82f6","#f97316","#a855f7","#ec4899","#06b6d4"];
const PARTS=Array.from({length:80},()=>({x:Math.random()*100,c:COLORS[Math.floor(Math.random()*7)],w:6+Math.random()*8,h:4+Math.random()*6,dl:Math.random()*1.2,dr:2.5+Math.random()*2,dx:-30+Math.random()*60,r:Math.random()*360}));

function Confetti({active}:{active:boolean}){
  if(!active)return null;
  return(
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{zIndex:10001}}>
      <style>{`@keyframes fall{0%{transform:translateY(-20px) translateX(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) translateX(var(--d)) rotate(720deg);opacity:.3}}`}</style>
      {PARTS.map((p,i)=>(
        <div key={i} className="absolute top-0" style={{left:`${p.x}%`,width:p.w,height:p.h,background:p.c,borderRadius:2,animation:`fall ${p.dr}s ${p.dl}s ease-in both`,"--d":`${p.dx}px`,transform:`rotate(${p.r}deg)`}as React.CSSProperties}/>
      ))}
    </div>
  );
}

// ── Celebration Banner ─────────────────────────────────────────
type CelebType = "venda" | "agendamento" | null;

function CelebBanner({type,nome,valor}:{type:CelebType;nome:string;valor:number}){
  const visible = !!type;
  const isVenda = type === "venda";
  return(
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none transition-all duration-500" style={{zIndex:10000,opacity:visible?1:0}}>
      <div className={cn(
        "rounded-3xl px-20 py-12 text-center shadow-2xl transition-all duration-500",
        isVenda?"bg-green-500":"bg-sky-500",
        visible?"scale-100":"scale-75"
      )}>
        <div className="text-8xl mb-4">{isVenda?"🏆":"📅"}</div>
        <div className="text-white font-black text-5xl tracking-tight mb-3">
          {isVenda?"VENDA FECHADA!":"REUNIÃO AGENDADA!"}
        </div>
        <div className="text-white/90 text-3xl font-bold">{nome}</div>
        {isVenda&&valor>0&&<div className="text-white text-4xl font-black mt-3">{valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0})}</div>}
      </div>
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────
const MONTH_NAMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function Header({mes,onClose}:{mes:string;onClose:()=>void}){
  const[time,setTime]=useState(()=>new Date());
  useEffect(()=>{const id=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(id);},[]);
  const[year,month]=mes.split("-").map(Number);
  return(
    <div className="flex items-center px-8 py-4 border-b border-white/10 relative shrink-0">
      <div className="w-44">
        <img src="/bp-group-logo-white.png" alt="BP Group" className="h-8 object-contain"/>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 text-white font-black text-3xl tracking-wide">
        {MONTH_NAMES[(month||1)-1]}/{year}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-white font-mono font-black text-4xl tracking-wider">
          {time.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
        </span>
        <button onClick={onClose} className="text-white/30 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
          <X className="h-5 w-5"/>
        </button>
      </div>
    </div>
  );
}

// ── Top Stat Card ──────────────────────────────────────────────
function StatCard({label,value,sub,color}:{label:string;value:string|number;sub?:string;color?:string}){
  return(
    <div className="bg-white/5 rounded-2xl p-5 text-center flex-1 flex flex-col gap-1">
      <div className="text-white/50 text-xs font-bold tracking-widest uppercase">{label}</div>
      <div className={cn("text-7xl font-black tabular-nums leading-none my-1",color||"text-white")}>{value}</div>
      {sub&&<div className="text-white/40 text-sm font-semibold">{sub}</div>}
    </div>
  );
}

// ── Ritmo Card ─────────────────────────────────────────────────
function RitmoCard({label,value,icon}:{label:string;value:number|string;icon:string}){
  return(
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
function ConsultorCard({nome,stats,metaVendas,ritmoRealizadas}:{
  nome:string; stats:UserStats; metaVendas:number; ritmoRealizadas:number;
}){
  const pctV = metaVendas>0?Math.min(100,(stats.vendas/metaVendas)*100):0;
  const metaReun = ritmoRealizadas*metaVendas;
  const pctR = metaReun>0?Math.min(100,(stats.realizadas/metaReun)*100):0;
  const faltam = ritmoRealizadas>0?Math.max(0,ritmoRealizadas-(stats.realizadas%ritmoRealizadas||ritmoRealizadas)):0;

  return(
    <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-white font-black text-xl leading-tight">{nome}</span>
        {ritmoRealizadas>0&&<span className="text-white/30 text-xs font-mono shrink-0 ml-2">1 venda ≈ {ritmoRealizadas} apres.</span>}
      </div>

      {/* Vendas */}
      <div>
        <span className="text-white font-black text-5xl tabular-nums">{stats.vendas}</span>
        {metaVendas>0&&<span className="text-white/30 text-xl font-bold">/{metaVendas} vendas</span>}
      </div>
      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000",
          pctV>=100?"bg-green-400":pctV>=50?"bg-yellow-400":"bg-red-500"
        )} style={{width:`${Math.max(pctV,stats.vendas>0?5:0)}%`}}/>
      </div>

      {/* Realizadas */}
      <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
        <span>🤝</span><span>{stats.realizadas} apresentações no mês</span>
        {stats.agendadas>0&&<span className="ml-auto text-sky-400">📅 {stats.agendadas} agendadas</span>}
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full bg-sky-500 transition-all duration-1000" style={{width:`${Math.max(pctR,stats.realizadas>0?3:0)}%`}}/>
      </div>

      {faltam>0&&(
        <div className="text-white/40 text-xs font-semibold">
          🎯 faltam ~{faltam} para a próxima venda
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function TV(){
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId||"";

  const [opps, setOpps] = useState<Opp[]>([]);
  const [metaVendasTotal, setMetaVendasTotal] = useState(0);
  const [celebType, setCelebType] = useState<CelebType>(null);
  const [celebNome, setCelebNome] = useState("");
  const [celebValor, setCelebValor] = useState(0);

  const prevStagesRef = useRef(new Map<string, string>());
  const celebTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  const now = new Date();
  const mes = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  // First day of month in UTC+0 (GHL stores UTC, Brazil = UTC-3 so month starts at 03:00 UTC)
  const fromUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 3, 0, 0));

  const celebrate = useCallback((type: CelebType, nome: string, valor = 0) => {
    if (celebTimer.current) clearTimeout(celebTimer.current);
    setCelebType(type); setCelebNome(nome); setCelebValor(valor);
    if (type === "venda") playVendaSound(); else playAgendaSound();
    celebTimer.current = setTimeout(() => setCelebType(null), 5500);
  }, []);

  // Load GHL opportunities for current month
  const loadOpps = useCallback(async () => {
    if (!locationId) return;
    const { data } = await (supabase as any)
      .from("ghl_pipeline_opportunities")
      .select("id,stage,followers,assigned_to,monetary_value")
      .eq("location_id", locationId)
      .gte("last_stage_change_at", fromUTC.toISOString());
    if (data) {
      setOpps(data);
      // Init prevStages
      for (const o of data) prevStagesRef.current.set(o.id, o.stage);
    }
  }, [locationId]);

  // Load meta
  useEffect(() => {
    if (!locationId) return;
    (supabase as any).from("comercial_metas").select("meta_vendas")
      .eq("mes", mes).eq("location_id", locationId).single()
      .then(({ data }: any) => { if (data) setMetaVendasTotal(data.meta_vendas||0); });
  }, [locationId, mes]);

  useEffect(() => { loadOpps(); }, [loadOpps]);

  // Realtime: detect stage changes in ghl_pipeline_opportunities
  useEffect(() => {
    if (!locationId) return;
    const ch = (supabase as any)
      .channel(`tv-ghl-${locationId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ghl_pipeline_opportunities",
        filter: `location_id=eq.${locationId}`
      }, async (payload: any) => {
        const opp = payload.new as Opp;
        if (!opp) return;
        const prevStage = prevStagesRef.current.get(opp.id);

        if (opp.stage !== prevStage) {
          // New agendamento: stage just became Reuniao Agendada
          if (opp.stage === "Reuniao Agendada" && prevStage !== "Reuniao Agendada") {
            const ownerName = opp.assigned_to ? GHL_USERS[opp.assigned_to] : null;
            celebrate("agendamento", ownerName || "Equipe");
          }
          // New venda: stage just became Venda Fechada
          if (opp.stage === "Venda Fechada" && prevStage !== "Venda Fechada") {
            const followers = opp.followers || [];
            const closerName = followers.length > 0 ? GHL_USERS[followers[0]] : null;
            celebrate("venda", closerName || "Equipe", parseFloat(opp.monetary_value as any) || 0);
          }
        }
        prevStagesRef.current.set(opp.id, opp.stage);
        // Reload all opps to update counts
        loadOpps();
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [locationId, celebrate, loadOpps]);

  // Poll every 5 min as fallback
  useEffect(() => {
    const id = setInterval(loadOpps, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadOpps]);

  // Aggregate
  const statsMap = aggregate(opps);

  // Build sorted list of active users (by vendas desc, then realizadas desc)
  const activeUsers = Array.from(
    new Set([
      ...opps.flatMap(o => (o.followers||[]).filter(f => GHL_USERS[f])),
      ...opps.filter(o => o.assigned_to && GHL_USERS[o.assigned_to]).map(o => o.assigned_to!),
    ])
  ).map(uid => ({ uid, nome: GHL_USERS[uid], stats: statsMap.get(uid) || emptyStats() }))
    .sort((a, b) => b.stats.vendas - a.stats.vendas || b.stats.realizadas - a.stats.realizadas);

  // Team totals
  const totalVendas = activeUsers.reduce((s, u) => s + u.stats.vendas, 0);
  const totalRealizadas = activeUsers.reduce((s, u) => s + u.stats.realizadas, 0);
  // Agendadas: deduplicated by opportunity (only count each opp once)
  const totalAgendadas = opps.filter(o => SCHEDULED_STAGES.has(o.stage) && o.assigned_to && GHL_USERS[o.assigned_to]).length;

  // Ritmo: team-level ratios
  const ritmoAgendadasPorVenda = totalVendas > 0 ? Math.round(totalAgendadas / totalVendas) : 0;
  const ritmoRealizadasPorVenda = totalVendas > 0 ? Math.round(totalRealizadas / totalVendas) : 0;

  // Colors
  const pctV = metaVendasTotal > 0 ? Math.round((totalVendas / metaVendasTotal) * 100) : 0;
  const vendasColor = pctV >= 100 ? "text-green-400" : pctV >= 50 ? "text-yellow-400" : "text-white";

  // Per-user meta (proportional to team meta, split equally)
  const metaPerUser = activeUsers.length > 0 && metaVendasTotal > 0
    ? Math.round(metaVendasTotal / activeUsers.length) : 0;

  const cols = activeUsers.length <= 2 ? "grid-cols-2"
    : activeUsers.length <= 4 ? "grid-cols-2"
    : activeUsers.length <= 6 ? "grid-cols-3"
    : "grid-cols-4";

  return (
    <div className="fixed inset-0 bg-[#0f1117] flex flex-col" style={{ zIndex: 9999 }}>
      <Confetti active={celebType === "venda"} />
      <CelebBanner type={celebType} nome={celebNome} valor={celebValor} />

      <Header mes={mes} onClose={() => navigate("/comercial")} />

      <div className="flex-1 p-5 flex flex-col gap-4 overflow-auto">
        {/* Top stat cards */}
        <div className="flex gap-3">
          <StatCard
            label="Reuniões Agendadas"
            value={totalAgendadas}
            color="text-sky-400"
          />
          <StatCard
            label="Apresentações do Mês"
            value={totalRealizadas}
            color="text-white"
          />
          <StatCard
            label="Vendas do Mês"
            value={totalVendas}
            sub={metaVendasTotal > 0 ? `Meta da equipe: ${metaVendasTotal}` : undefined}
            color={vendasColor}
          />
        </div>

        {/* Ritmo cards */}
        {totalVendas > 0 && (
          <div className="flex gap-3">
            <RitmoCard
              icon="📅"
              label="Ritmo — Agendadas por Venda"
              value={ritmoAgendadasPorVenda > 0 ? `${ritmoAgendadasPorVenda} agend. ≈ 1 venda` : "--"}
            />
            <RitmoCard
              icon="🤝"
              label="Ritmo — Realizadas por Venda"
              value={ritmoRealizadasPorVenda > 0 ? `${ritmoRealizadasPorVenda} apres. ≈ 1 venda` : "--"}
            />
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
