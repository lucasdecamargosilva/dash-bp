import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { cn } from "@/lib/utils";

interface Consultor { id: string; nome: string; setor: "pre_venda" | "vendas"; pct_meta: number; }
interface DiarioEntry { consultor_id: string; leads_novos: number; reunioes: number; reunioes_agendadas?: number; vendas: number; valor_vendas: number; }
interface MetaMensal { meta_vendas: number; meta_faturamento: number; meta_agendamentos: number; meta_leads: number; meta_reunioes_realizadas?: number; }

// ── Sound ──────────────────────────────────────────────────────
function playSaleSound() {
  try {
    const ctx = new AudioContext();
    [[523.25,.12],[659.25,.12],[783.99,.12],[1046.5,.2],[1318.51,.4]].reduce((t,[f,d])=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);o.type="sine";o.frequency.value=f as number;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+(d as number));
      o.start(t);o.stop(t+(d as number)+.05);
      return t+(d as number)*.9;
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
        <div key={i} className="absolute top-0" style={{left:`${p.x}%`,width:p.w,height:p.h,background:p.c,borderRadius:2,animation:`fall ${p.dr}s ${p.dl}s ease-in both`,"--d":`${p.dx}px`,transform:`rotate(${p.r}deg)`} as React.CSSProperties}/>
      ))}
    </div>
  );
}

// ── Sale Banner ────────────────────────────────────────────────
function SaleBanner({visible,vendedor,valor}:{visible:boolean;vendedor:string;valor:number}){
  return(
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none transition-all duration-500" style={{zIndex:10000,opacity:visible?1:0}}>
      <div className={cn("bg-green-500 rounded-3xl px-20 py-12 text-center shadow-2xl transition-all duration-500",visible?"scale-100":"scale-75")}>
        <div className="text-8xl mb-4">🏆</div>
        <div className="text-white font-black text-6xl tracking-tight mb-3">VENDA FECHADA!</div>
        <div className="text-green-100 text-3xl font-bold">{vendedor}</div>
        {valor>0&&<div className="text-white text-4xl font-black mt-3">{valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0})}</div>}
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
  const label=`${MONTH_NAMES[(month||1)-1]}/${year}`;
  const hhmm=time.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  return(
    <div className="flex items-center px-8 py-4 border-b border-white/10 relative">
      <div className="flex items-center gap-3 w-48">
        <img src="/bp-group-logo-white.png" alt="BP Group" className="h-8 object-contain"/>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 text-white font-black text-3xl tracking-wide">{label}</div>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-white font-mono font-black text-4xl tracking-wider">{hhmm}</span>
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
    <div className="bg-white/5 rounded-2xl p-6 text-center flex-1 flex flex-col gap-1">
      <div className="text-white/50 text-xs font-bold tracking-widest uppercase">{label}</div>
      <div className={cn("text-7xl font-black tabular-nums leading-none my-1",color||"text-white")}>{value}</div>
      {sub&&<div className="text-white/40 text-sm font-semibold">{sub}</div>}
    </div>
  );
}

// ── Consultor Card ─────────────────────────────────────────────
function ConsultorCard({c,vendas,reunioes,metaVendas,ritmo}:{
  c:Consultor; vendas:number; reunioes:number; metaVendas:number; ritmo:number;
}){
  const pctV=metaVendas>0?Math.min(100,(vendas/metaVendas)*100):0;
  const metaReun=ritmo*metaVendas;
  const pctR=metaReun>0?Math.min(100,(reunioes/metaReun)*100):0;
  const faltam=ritmo>0?Math.max(0,ritmo-(reunioes%ritmo||ritmo)):0;

  return(
    <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-3 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-white font-black text-xl leading-tight">{c.nome}</span>
        {ritmo>0&&<span className="text-white/30 text-xs font-mono shrink-0 ml-2">1 venda ≈ {ritmo} apres.</span>}
      </div>

      {/* Vendas */}
      <div>
        <span className="text-white font-black text-5xl tabular-nums">{vendas}</span>
        <span className="text-white/30 text-xl font-bold">/{metaVendas} vendas</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000",pctV>=100?"bg-green-400":pctV>=50?"bg-yellow-400":"bg-red-500")} style={{width:`${pctV}%`}}/>
      </div>

      {/* Apresentações */}
      <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold">
        <span>🤝</span><span>{reunioes} apresentações no mês</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full bg-sky-500 transition-all duration-1000" style={{width:`${pctR}%`}}/>
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
  const navigate=useNavigate();
  const{tenant}=useTenant();
  const locationId=tenant.ghlLocationId||"";

  const[consultores,setConsultores]=useState<Consultor[]>([]);
  const[diarioData,setDiarioData]=useState<DiarioEntry[]>([]);
  const[meta,setMeta]=useState<MetaMensal>({meta_vendas:0,meta_faturamento:0,meta_agendamentos:0,meta_leads:0});
  const[celebrating,setCelebrating]=useState(false);
  const[saleInfo,setSaleInfo]=useState({vendedor:"",valor:0});
  const prevVendasRef=useRef(new Map<string,number>());
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  const now=new Date();
  const mes=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  const celebrate=useCallback((nome:string,valor:number)=>{
    if(timer.current)clearTimeout(timer.current);
    setSaleInfo({vendedor:nome,valor});
    setCelebrating(true);
    playSaleSound();
    timer.current=setTimeout(()=>setCelebrating(false),5500);
  },[]);

  useEffect(()=>{
    if(!locationId)return;
    async function load(){
      const[cR,mR,dR]=await Promise.all([
        (supabase as any).from("comercial_consultores").select("*").eq("ativo",true).eq("location_id",locationId).order("nome"),
        (supabase as any).from("comercial_metas").select("*").eq("mes",mes).eq("location_id",locationId).single(),
        (supabase as any).from("comercial_diario").select("*").gte("data",`${mes}-01`).lte("data",`${mes}-31`).eq("location_id",locationId),
      ]);
      setConsultores(cR.data||[]);
      if(mR.data)setMeta(mR.data);
      setDiarioData(dR.data||[]);
      const m=new Map<string,number>();
      for(const r of(dR.data||[]))m.set(r.consultor_id,(m.get(r.consultor_id)||0)+(r.vendas||0));
      prevVendasRef.current=m;
    }
    load();
  },[locationId,mes]);

  useEffect(()=>{
    if(!locationId)return;
    const ch=(supabase as any).channel(`tv-${locationId}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"comercial_diario",filter:`location_id=eq.${locationId}`},
        async()=>{
          const{data}=await(supabase as any).from("comercial_diario").select("*").gte("data",`${mes}-01`).lte("data",`${mes}-31`).eq("location_id",locationId);
          if(!data)return;
          const m=new Map<string,{v:number;vl:number}>();
          for(const r of data){const c=m.get(r.consultor_id)||{v:0,vl:0};c.v+=r.vendas||0;c.vl+=r.valor_vendas||0;m.set(r.consultor_id,c);}
          for(const[id,curr]of m){
            const prev=prevVendasRef.current.get(id)||0;
            if(curr.v>prev){const nome=consultores.find(x=>x.id===id)?.nome||"Equipe";celebrate(nome,curr.vl);prevVendasRef.current.set(id,curr.v);}
          }
          setDiarioData(data);
        }
      ).subscribe();
    return()=>{(supabase as any).removeChannel(ch);};
  },[locationId,mes,consultores,celebrate]);

  // Aggregate
  const byC=new Map<string,{vendas:number;reunioes:number;valor:number}>();
  for(const c of consultores)byC.set(c.id,{vendas:0,reunioes:0,valor:0});
  for(const d of diarioData){const x=byC.get(d.consultor_id);if(x){x.vendas+=d.vendas||0;x.reunioes+=d.reunioes||0;x.valor+=d.valor_vendas||0;}}

  const totalVendas=Array.from(byC.values()).reduce((s,v)=>s+v.vendas,0);
  const totalReunioes=Array.from(byC.values()).reduce((s,v)=>s+v.reunioes,0);
  const totalValor=Array.from(byC.values()).reduce((s,v)=>s+v.valor,0);
  const metaV=meta.meta_vendas||0;
  const metaR=meta.meta_reunioes_realizadas||0;

  const pctV=metaV>0?Math.round((totalVendas/metaV)*100):0;
  const pctR=metaR>0?Math.round((totalReunioes/metaR)*100):0;
  const vendasColor=pctV>=100?"text-green-400":pctV>=50?"text-yellow-400":"text-white";
  const reunColor=metaR>0?(pctR>=100?"text-green-400":pctR>=50?"text-yellow-400":"text-red-400"):"text-white";

  const ritmo=totalVendas>0&&totalReunioes>0?Math.round(totalReunioes/totalVendas):20;

  const cols=consultores.length<=2?"grid-cols-2":consultores.length<=4?"grid-cols-2":consultores.length<=6?"grid-cols-3":"grid-cols-4";

  return(
    <div className="fixed inset-0 bg-[#0f1117] flex flex-col" style={{zIndex:9999}}>
      <Confetti active={celebrating}/>
      <SaleBanner visible={celebrating} vendedor={saleInfo.vendedor} valor={saleInfo.valor}/>

      <Header mes={mes} onClose={()=>navigate("/comercial")}/>

      <div className="flex-1 p-6 flex flex-col gap-5 overflow-auto">
        {/* Top stats */}
        <div className="flex gap-4">
          <StatCard label="Vendas do Mês" value={totalVendas} sub={metaV>0?`Meta da equipe: ${metaV}`:undefined} color={vendasColor}/>
          <StatCard label="Apresentações do Mês" value={totalReunioes} sub={metaR>0?`Meta: ${metaR}`:undefined} color={reunColor}/>
          {totalValor>0
            ?<StatCard label="Faturamento" value={totalValor.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0})} color="text-green-400"/>
            :<StatCard label="Ritmo da Equipe" value={ritmo} sub="apresentações ≈ 1 venda" color={ritmo<=10?"text-green-400":"text-yellow-400"}/>
          }
        </div>

        {/* Consultores */}
        <div className={cn("grid gap-4 flex-1",cols)}>
          {consultores.map(c=>{
            const s=byC.get(c.id)||{vendas:0,reunioes:0,valor:0};
            const metaVendas=Math.round(metaV*((c.pct_meta||0)/100));
            return<ConsultorCard key={c.id} c={c} vendas={s.vendas} reunioes={s.reunioes} metaVendas={metaVendas} ritmo={ritmo}/>;
          })}
        </div>
      </div>
    </div>
  );
}
