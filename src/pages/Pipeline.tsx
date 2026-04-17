import { useState, useMemo } from "react";
import { startOfMonth } from "date-fns";
import { type DateRange } from "react-day-picker";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useTenant } from "@/context/TenantContext";
import { useGHLData } from "@/hooks/useGHLData";
import { type ChannelMetrics } from "@/lib/ghl";
import { cn } from "@/lib/utils";
import {
  Loader2, Filter, Users, Phone, MessageSquare, Link2,
  CalendarCheck, CalendarClock, FileText, Trophy, DollarSign,
  TrendingUp, TrendingDown, Minus, Calculator, Target, BarChart3, AlertTriangle, Zap
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const STAGES = [
  { key: "contato" as const, label: "Contatos", icon: Phone, color: "text-steel-500 dark:text-steel-400" },
  { key: "msgEnviada" as const, label: "Msg Enviadas", icon: MessageSquare, color: "text-sky-600 dark:text-sky-400" },
  { key: "conexao" as const, label: "Conexoes", icon: Link2, color: "text-sky-700 dark:text-sky-300" },
  { key: "whatsappObtido" as const, label: "WhatsApp", icon: Phone, color: "text-emerald-600 dark:text-emerald-400" },
  { key: "reuniaoAgendada" as const, label: "Reunioes Ag.", icon: CalendarClock, color: "text-amber-600 dark:text-amber-400" },
  { key: "reuniaoRealizada" as const, label: "Reunioes Re.", icon: CalendarCheck, color: "text-amber-700 dark:text-amber-300" },
  { key: "propostaEmAnalise" as const, label: "Propostas", icon: FileText, color: "text-violet-600 dark:text-violet-400" },
  { key: "vendaFechada" as const, label: "Vendas", icon: Trophy, color: "text-emerald-600 dark:text-emerald-400" },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
};

const formatFullCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
};

// ---- KPI Card for Pipeline ----
function PipelineKPI({ label, value, icon: Icon, color, meta, suffix }: {
  label: string; value: number; icon: any; color: string; meta?: number; suffix?: string;
}) {
  const pct = meta && meta > 0 ? ((value / meta) * 100) : null;
  const pctColor = pct !== null ? (pct >= 100 ? "text-emerald-600 dark:text-emerald-400" : pct >= 80 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400") : "";
  const pctBg = pct !== null ? (pct >= 100 ? "bg-emerald-50 dark:bg-emerald-500/10" : pct >= 80 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-red-50 dark:bg-red-500/10") : "";

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border p-4 shadow-card h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4 flex-shrink-0", color)} />
        <span className="text-[10px] font-body font-semibold uppercase tracking-[0.06em] text-steel-400 dark:text-muted-foreground leading-tight">
          {label}
        </span>
      </div>
      <p className={cn(
        "font-display font-bold text-navy-900 dark:text-foreground tabular-nums",
        suffix === "R$" ? "text-xs sm:text-sm" : "text-2xl"
      )}>
        {suffix === "R$" ? formatFullCurrency(value) : value.toLocaleString('pt-BR')}
      </p>
      {meta !== undefined && meta > 0 && pct !== null && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn("text-[10px] font-body font-bold px-1.5 py-0.5 rounded", pctBg, pctColor)}>
            {pct.toFixed(0)}% da meta
          </span>
          <span className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">
            meta: {suffix === "R$" ? formatCurrency(meta) : meta.toLocaleString('pt-BR')}
          </span>
        </div>
      )}
    </div>
  );
}

// ---- Helper: calculate accumulated (reached) values per stage ----
// A lead in "Venda Fechada" has passed through ALL previous stages.
// So "reached Contato" = total, "reached Msg Enviada" = total - contato, etc.
const STAGE_KEYS = STAGES.map(s => s.key);

function calcReached(row: ChannelMetrics): number[] {
  // reached[i] = sum of row values for stage i..end
  // This means: how many leads reached stage i (they are in stage i or beyond)
  const values = STAGE_KEYS.map(k => row[k]);
  const reached: number[] = [];
  let sum = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    sum += values[i];
    reached[i] = sum;
  }
  return reached;
}

// ---- Accumulated Funnel Table ----
function AccumulatedFunnelTable({ data, view, filterPessoa }: { data: ChannelMetrics[]; view: string; filterPessoa: string }) {
  let filtered = data;
  if (filterPessoa && filterPessoa !== "all") {
    if (view === "canal") {
      // Don't filter canal view by pessoa
    } else {
      filtered = data.filter(d => d.pessoa === filterPessoa);
    }
  }

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-sm font-body text-steel-400 dark:text-muted-foreground">
        Nenhum dado encontrado para o filtro selecionado.
      </div>
    );
  }

  // Calculate totals row
  const totalRow = { ...filtered[0] };
  STAGE_KEYS.forEach(k => { (totalRow as any)[k] = 0; });
  totalRow.total = 0;
  for (const row of filtered) {
    STAGE_KEYS.forEach(k => { (totalRow as any)[k] += row[k]; });
    totalRow.total += row.total;
  }
  const totalReached = calcReached(totalRow);

  return (
    <div className="overflow-x-auto bp-scroll">
      <table className="w-full">
        <thead>
          <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
            <th className="px-3 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">
              {view === "canal" ? "Canal" : view === "pessoa" ? "Pessoa / Conta" : "Canal | Pessoa"}
            </th>
            {STAGES.map(s => (
              <th key={s.key} className="px-3 py-2.5 text-center text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">
                <div>{s.label}</div>
                <div className="text-[8px] font-normal text-steel-300 dark:text-muted-foreground/50">chegaram | saida</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => {
            const label = view === "canal" ? row.canal : view === "pessoa" ? row.pessoa : `${row.canal} | ${row.pessoa}`;
            const reached = calcReached(row);
            return (
              <tr key={i} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors">
                <td className="px-3 py-2.5 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{label}</td>
                {STAGES.map((s, si) => {
                  const reachedVal = reached[si];
                  const drop = si < STAGES.length - 1 ? reached[si] - reached[si + 1] : 0;
                  const dropPct = reachedVal > 0 && si < STAGES.length - 1 ? ((drop / reachedVal) * 100) : 0;
                  return (
                    <td key={s.key} className="px-3 py-2.5 text-center font-body tabular-nums">
                      <div className="text-sm font-bold text-navy-900 dark:text-foreground">
                        {reachedVal > 0 ? reachedVal.toLocaleString() : <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}
                      </div>
                      {si < STAGES.length - 1 && reachedVal > 0 && (
                        <div className={cn(
                          "text-[10px] font-semibold",
                          dropPct > 60 ? "text-red-500 dark:text-red-400" :
                          dropPct > 40 ? "text-amber-600 dark:text-amber-400" :
                          "text-steel-400 dark:text-muted-foreground"
                        )}>
                          -{drop.toLocaleString()} ({dropPct.toFixed(0)}%)
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-steel-200 dark:border-border bg-steel-50/30 dark:bg-secondary/20">
            <td className="px-3 py-2.5 font-body text-sm font-bold text-navy-900 dark:text-foreground">Total</td>
            {STAGES.map((s, si) => {
              const reachedVal = totalReached[si];
              const drop = si < STAGES.length - 1 ? totalReached[si] - totalReached[si + 1] : 0;
              const dropPct = reachedVal > 0 && si < STAGES.length - 1 ? ((drop / reachedVal) * 100) : 0;
              const convPct = totalReached[0] > 0 ? ((reachedVal / totalReached[0]) * 100) : 0;
              return (
                <td key={s.key} className="px-3 py-2.5 text-center font-body tabular-nums">
                  <div className="text-sm font-bold text-navy-900 dark:text-foreground">{reachedVal > 0 ? reachedVal.toLocaleString() : "-"}</div>
                  {si > 0 && reachedVal > 0 && (
                    <div className={cn(
                      "text-[10px] font-bold px-1 rounded inline-block",
                      convPct >= 30 ? "text-emerald-600 dark:text-emerald-400" :
                      convPct >= 10 ? "text-amber-600 dark:text-amber-400" :
                      "text-red-500 dark:text-red-400"
                    )}>
                      {convPct.toFixed(1)}% do total
                    </div>
                  )}
                  {si < STAGES.length - 1 && reachedVal > 0 && (
                    <div className={cn(
                      "text-[10px] font-semibold",
                      dropPct > 60 ? "text-red-500 dark:text-red-400" :
                      dropPct > 40 ? "text-amber-600 dark:text-amber-400" :
                      "text-steel-400 dark:text-muted-foreground"
                    )}>
                      -{drop.toLocaleString()} ({dropPct.toFixed(0)}%)
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ---- Table Component ----
function PipelineTable({ data, view, filterPessoa }: { data: ChannelMetrics[]; view: string; filterPessoa: string }) {
  const [sortKey, setSortKey] = useState<string>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) { setSortDir(d => d === "desc" ? "asc" : "desc"); }
    else { setSortKey(key); setSortDir("desc"); }
  };

  let filtered = data;
  if (filterPessoa && filterPessoa !== "all") {
    filtered = data.filter(d => d.pessoa === filterPessoa || (view === "canal" && true));
    if (view === "combo") {
      filtered = data.filter(d => d.pessoa === filterPessoa);
    } else if (view === "pessoa") {
      filtered = data.filter(d => d.pessoa === filterPessoa);
    }
  }

  // Sort with accumulated values
  filtered = [...filtered].sort((a, b) => {
    // Alphabetic sort for label column
    if (sortKey === "label") {
      const aLabel = view === "canal" ? a.canal : view === "pessoa" ? a.pessoa : `${a.canal} | ${a.pessoa}`;
      const bLabel = view === "canal" ? b.canal : view === "pessoa" ? b.pessoa : `${b.canal} | ${b.pessoa}`;
      const cmp = aLabel.localeCompare(bLabel);
      return sortDir === "desc" ? -cmp : cmp;
    }

    const aVals = STAGE_KEYS.map(k => a[k] as number);
    const bVals = STAGE_KEYS.map(k => b[k] as number);
    const aAcc: number[] = []; const bAcc: number[] = [];
    let aS = 0, bS = 0;
    for (let i = aVals.length - 1; i >= 0; i--) { aS += aVals[i]; aAcc[i] = aS; bS += bVals[i]; bAcc[i] = bS; }

    let aVal: number, bVal: number;
    const si = STAGE_KEYS.indexOf(sortKey as any);
    if (si >= 0) { aVal = aAcc[si]; bVal = bAcc[si]; }
    else if (sortKey === "faturamento") { aVal = a.faturamento; bVal = b.faturamento; }
    else { aVal = a.total; bVal = b.total; }
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-sm font-body text-steel-400 dark:text-muted-foreground">
        Nenhum dado encontrado para o filtro selecionado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bp-scroll">
      <table className="w-full">
        <thead>
          <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
            <th onClick={() => handleSort("label")} className="px-3 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground cursor-pointer hover:text-navy-800 dark:hover:text-foreground transition-colors select-none">
              {view === "canal" ? "Canal" : view === "pessoa" ? "Pessoa / Conta" : "Canal | Pessoa"} {sortKey === "label" ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </th>
            {STAGES.map(s => (
              <th key={s.key} onClick={() => handleSort(s.key)} className="px-3 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground cursor-pointer hover:text-navy-800 dark:hover:text-foreground transition-colors select-none">
                {s.label} {sortKey === s.key ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </th>
            ))}
            <th onClick={() => handleSort("total")} className="px-3 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground cursor-pointer hover:text-navy-800 dark:hover:text-foreground transition-colors select-none">
              Total {sortKey === "total" ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </th>
            <th onClick={() => handleSort("faturamento")} className="px-3 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground cursor-pointer hover:text-navy-800 dark:hover:text-foreground transition-colors select-none">
              Faturamento {sortKey === "faturamento" ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => {
            const label = view === "canal" ? row.canal : view === "pessoa" ? row.pessoa : `${row.canal} | ${row.pessoa}`;
            const rowValues = STAGE_KEYS.map(k => row[k] as number);
            const rowAcc: number[] = [];
            let rowSum = 0;
            for (let j = rowValues.length - 1; j >= 0; j--) { rowSum += rowValues[j]; rowAcc[j] = rowSum; }
            return (
              <tr key={i} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors">
                <td className="px-3 py-2.5 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{label}</td>
                {STAGES.map((s, si) => (
                  <td key={s.key} className="px-3 py-2.5 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">
                    {rowAcc[si] > 0 ? rowAcc[si].toLocaleString() : <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right font-body text-sm font-bold text-navy-900 dark:text-foreground tabular-nums">
                  {row.total.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-right font-body text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {row.faturamento > 0 ? formatCurrency(row.faturamento) : <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {(() => {
            const totValues = STAGE_KEYS.map(k => filtered.reduce((sum, d) => sum + (d[k] as number), 0));
            const totAcc: number[] = [];
            let totSum = 0;
            for (let j = totValues.length - 1; j >= 0; j--) { totSum += totValues[j]; totAcc[j] = totSum; }
            return (
              <tr className="border-t-2 border-steel-200 dark:border-border bg-steel-50/30 dark:bg-secondary/20">
                <td className="px-3 py-2.5 font-body text-sm font-bold text-navy-900 dark:text-foreground">Total</td>
                {STAGES.map((s, si) => (
                  <td key={s.key} className="px-3 py-2.5 text-right font-body text-sm font-bold text-navy-900 dark:text-foreground tabular-nums">{totAcc[si] > 0 ? totAcc[si].toLocaleString() : "-"}</td>
                ))}
                <td className="px-3 py-2.5 text-right font-body text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                  {filtered.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-right font-body text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(filtered.reduce((sum, d) => sum + d.faturamento, 0))}
                </td>
              </tr>
            );
          })()}
        </tfoot>
      </table>
    </div>
  );
}

// ---- Goals Calculator ----
function GoalsCalculator() {
  const [vendas, setVendas] = useState("");
  const [ticket, setTicket] = useState("");
  const [taxaContato, setTaxaContato] = useState("2.5");
  const [taxaReuniao, setTaxaReuniao] = useState("40");
  const [taxaNoShow, setTaxaNoShow] = useState("30");
  const [taxaVenda, setTaxaVenda] = useState("25");
  const [showCalc, setShowCalc] = useState(false);

  const calc = useMemo(() => {
    const v = parseInt(vendas) || 0;
    const t = parseFloat(ticket) || 0;
    const tContato = parseFloat(taxaContato) || 1;
    const tReuniao = parseFloat(taxaReuniao) || 1;
    const tNoShow = parseFloat(taxaNoShow) || 0;
    const tVenda = parseFloat(taxaVenda) || 1;

    if (v === 0) return null;

    const reunioesRealizadas = Math.ceil(v / (tVenda / 100));
    const reunioesAgendadas = Math.ceil(reunioesRealizadas / (1 - tNoShow / 100));
    const contatos = Math.ceil(reunioesAgendadas / (tReuniao / 100));
    const mensagens = Math.ceil(contatos / (tContato / 100));
    const faturamento = v * t;

    return {
      vendas: v,
      reunioesRealizadas,
      reunioesAgendadas,
      contatos,
      mensagens,
      faturamento,
      ticketMedio: t,
      // Weekly
      vendasSemana: Math.ceil(v / 4),
      reunioesRealizadasSemana: Math.ceil(reunioesRealizadas / 4),
      reunioesAgendadasSemana: Math.ceil(reunioesAgendadas / 4),
      contatosSemana: Math.ceil(contatos / 4),
      mensagensSemana: Math.ceil(mensagens / 4),
    };
  }, [vendas, ticket, taxaContato, taxaReuniao, taxaNoShow, taxaVenda]);

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-steel-100 dark:border-border">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Calculadora de Metas</h3>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={() => setShowCalc(!showCalc)}
          className="text-xs font-body text-steel-500 dark:text-muted-foreground"
        >
          {showCalc ? "Esconder" : "Expandir"}
        </Button>
      </div>

      {showCalc && (
        <div className="p-5 space-y-5">
          {/* Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Vendas desejadas</Label>
              <Input type="number" value={vendas} onChange={e => setVendas(e.target.value)} placeholder="10" className="h-9 text-sm font-body" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Ticket medio (R$)</Label>
              <Input type="number" value={ticket} onChange={e => setTicket(e.target.value)} placeholder="60000" className="h-9 text-sm font-body" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Taxa contato→reuniao %</Label>
              <Input type="number" value={taxaContato} onChange={e => setTaxaContato(e.target.value)} placeholder="2.5" className="h-9 text-sm font-body" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Taxa reuniao %</Label>
              <Input type="number" value={taxaReuniao} onChange={e => setTaxaReuniao(e.target.value)} placeholder="40" className="h-9 text-sm font-body" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">No-show %</Label>
              <Input type="number" value={taxaNoShow} onChange={e => setTaxaNoShow(e.target.value)} placeholder="30" className="h-9 text-sm font-body" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Taxa venda %</Label>
              <Input type="number" value={taxaVenda} onChange={e => setTaxaVenda(e.target.value)} placeholder="25" className="h-9 text-sm font-body" />
            </div>
          </div>

          {/* Results */}
          {calc && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-body font-semibold text-steel-400 dark:text-muted-foreground uppercase tracking-wider mb-2">Metas Mensais</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <ResultCard label="Mensagens" value={calc.mensagens} icon={MessageSquare} />
                  <ResultCard label="Contatos" value={calc.contatos} icon={Phone} />
                  <ResultCard label="Reunioes Ag." value={calc.reunioesAgendadas} icon={CalendarClock} />
                  <ResultCard label="Reunioes Re." value={calc.reunioesRealizadas} icon={CalendarCheck} />
                  <ResultCard label="Vendas" value={calc.vendas} icon={Trophy} />
                  <ResultCard label="Faturamento" value={calc.faturamento} icon={DollarSign} isCurrency />
                </div>
              </div>
              <div>
                <p className="text-xs font-body font-semibold text-steel-400 dark:text-muted-foreground uppercase tracking-wider mb-2">Metas Semanais</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <ResultCard label="Mensagens/sem" value={calc.mensagensSemana} icon={MessageSquare} />
                  <ResultCard label="Contatos/sem" value={calc.contatosSemana} icon={Phone} />
                  <ResultCard label="Reunioes Ag./sem" value={calc.reunioesAgendadasSemana} icon={CalendarClock} />
                  <ResultCard label="Reunioes Re./sem" value={calc.reunioesRealizadasSemana} icon={CalendarCheck} />
                  <ResultCard label="Vendas/sem" value={calc.vendasSemana} icon={Trophy} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, icon: Icon, isCurrency }: { label: string; value: number; icon: any; isCurrency?: boolean }) {
  return (
    <div className="bg-steel-50 dark:bg-secondary/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-sky-600 dark:text-sky-400" />
        <span className="text-[9px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-display font-bold text-navy-900 dark:text-foreground tabular-nums">
        {isCurrency ? formatCurrency(value) : value.toLocaleString('pt-BR')}
      </p>
    </div>
  );
}

// ---- Main Page ----
const Pipeline = () => {
  const { tenant } = useTenant();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [view, setView] = useState<"canal" | "pessoa" | "combo">("combo");
  const [filterPessoa, setFilterPessoa] = useState("all");

  const { data, isLoading, error } = useGHLData(dateRange);

  // Get unique pessoas for filter
  const pessoas = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const d of data.byCanalPessoa) {
      if (d.pessoa && d.pessoa !== "Sem pessoa") set.add(d.pessoa);
    }
    return Array.from(set).sort();
  }, [data]);

  // Filtered totals - respect pessoa filter (must be before early returns)
  const t = useMemo(() => {
    if (!data) return { canal: "", pessoa: "", contato: 0, msgEnviada: 0, conexao: 0, whatsappObtido: 0, reuniaoAgendada: 0, reuniaoRealizada: 0, propostaEmAnalise: 0, vendaFechada: 0, faturamento: 0, total: 0 };
    if (!filterPessoa || filterPessoa === "all") return data.totals;
    const filtered = data.byCanalPessoa.filter(d => d.pessoa === filterPessoa);
    const totals = { canal: "Total", pessoa: filterPessoa, contato: 0, msgEnviada: 0, conexao: 0, whatsappObtido: 0, reuniaoAgendada: 0, reuniaoRealizada: 0, propostaEmAnalise: 0, vendaFechada: 0, faturamento: 0, total: 0 };
    for (const row of filtered) {
      totals.contato += row.contato;
      totals.msgEnviada += row.msgEnviada;
      totals.conexao += row.conexao;
      totals.whatsappObtido += row.whatsappObtido;
      totals.reuniaoAgendada += row.reuniaoAgendada;
      totals.reuniaoRealizada += row.reuniaoRealizada;
      totals.propostaEmAnalise += row.propostaEmAnalise;
      totals.vendaFechada += row.vendaFechada;
      totals.faturamento += row.faturamento;
      totals.total += row.total;
    }
    return totals;
  }, [data, filterPessoa]);

  if (!tenant.ghlLocationId) {
    return (
      <div className="min-h-screen bg-background bp-scroll">
        <DashboardHeader />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-3 bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border p-8 shadow-kpi max-w-md">
              <p className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Pipeline nao configurado</p>
              <p className="text-sm font-body text-steel-400 dark:text-muted-foreground">Sua conta ainda nao tem um pipeline de vendas configurado. Entre em contato com o administrador.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bp-scroll">
        <DashboardHeader />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-[60vh] gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            <p className="text-sm font-body text-steel-400 dark:text-muted-foreground">Carregando dados do CRM...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background bp-scroll">
        <DashboardHeader />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white dark:bg-card rounded-xl border border-destructive/30 p-8 text-center">
            <p className="text-sm font-body text-destructive">Erro ao carregar dados do Go High Level.</p>
          </div>
        </main>
      </div>
    );
  }

  const tableData = view === "canal" ? data.byCanal : view === "pessoa" ? data.byPessoa : data.byCanalPessoa;

  // Faturamento by canal (from acquisition_channel_metrics in Supabase - monetary value from GHL)
  // For now using vendaFechada count as proxy, can be enhanced with real revenue data

  return (
    <div className="min-h-screen bg-background bp-scroll">
      <DashboardHeader />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 animate-fade-up">
            <div>
              <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-foreground">
                Pipeline por Canal
              </h1>
              <p className="text-sm font-body text-steel-400 dark:text-muted-foreground mt-0.5">
                Funil de Aquisicao - Prime ROI ({data.totalOpportunities.toLocaleString()} oportunidades)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

              <Select value={filterPessoa} onValueChange={setFilterPessoa}>
                <SelectTrigger className="w-40 h-9 text-sm font-body bg-white dark:bg-card border-steel-200 dark:border-border">
                  <SelectValue placeholder="Pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as pessoas</SelectItem>
                  {pessoas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={view} onValueChange={v => setView(v as any)}>
                <SelectTrigger className="w-40 h-9 text-sm font-body bg-white dark:bg-card border-steel-200 dark:border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combo">Canal + Pessoa</SelectItem>
                  <SelectItem value="canal">Por Canal</SelectItem>
                  <SelectItem value="pessoa">Por Pessoa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KPI Summary + Faturamento (acumulado: cada etapa soma as posteriores) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-3 animate-fade-up delay-1">
            {(() => {
              const stageValues = STAGES.map(s => t[s.key] as number);
              const accumulated: number[] = [];
              let sum = 0;
              for (let i = stageValues.length - 1; i >= 0; i--) {
                sum += stageValues[i];
                accumulated[i] = sum;
              }
              return STAGES.map((s, i) => (
                <div key={s.key}>
                  <PipelineKPI
                    label={s.label}
                    value={accumulated[i]}
                    icon={s.icon}
                    color={s.color}
                  />
                </div>
              ));
            })()}
            <div>
              <PipelineKPI
                label="Faturamento"
                value={t.faturamento}
                icon={DollarSign}
                color="text-emerald-600 dark:text-emerald-400"
                suffix="R$"
              />
            </div>
          </div>

          {/* Conversao por Canal */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-2">
            <div className="px-5 py-4 border-b border-steel-100 dark:border-border">
              <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Conversao por Canal</h3>
              <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Taxa de conversao e faturamento por canal de aquisicao</p>
            </div>
            {(() => {
              const canaisBI = data.byCanal
                .filter(c => c.total >= 5)
                .map(c => ({
                  canal: c.canal, total: c.total, vendas: c.vendaFechada, faturamento: c.faturamento,
                  conversao: c.total > 0 ? (c.vendaFechada / c.total) * 100 : 0,
                  ticketMedio: c.vendaFechada > 0 ? c.faturamento / c.vendaFechada : 0,
                  leadsQualificados: c.whatsappObtido + c.reuniaoAgendada + c.reuniaoRealizada + c.propostaEmAnalise + c.vendaFechada,
                  taxaQualificacao: c.total > 0 ? ((c.whatsappObtido + c.reuniaoAgendada + c.reuniaoRealizada + c.propostaEmAnalise + c.vendaFechada) / c.total) * 100 : 0,
                  reunioes: c.reuniaoAgendada + c.reuniaoRealizada,
                }))
                .sort((a, b) => b.conversao - a.conversao);
              return (
                <div className="p-5 space-y-5">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={canaisBI.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
                        <XAxis type="number" fontSize={11} fontFamily="Plus Jakarta Sans" tickFormatter={v => `${v.toFixed(1)}%`} />
                        <YAxis type="category" dataKey="canal" fontSize={11} fontFamily="Plus Jakarta Sans" width={120} tickLine={false} axisLine={false} />
                        <Tooltip content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-card rounded-lg px-4 py-3 shadow-hover border border-steel-100 dark:border-border">
                                <p className="font-body text-xs font-bold text-navy-900 dark:text-foreground mb-1">{d.canal}</p>
                                <p className="font-body text-xs text-steel-500">Total: {d.total.toLocaleString()}</p>
                                <p className="font-body text-xs text-steel-500">Qualificados: {d.leadsQualificados} ({d.taxaQualificacao.toFixed(1)}%)</p>
                                <p className="font-body text-xs text-emerald-600">Vendas: {d.vendas} ({d.conversao.toFixed(2)}%)</p>
                                <p className="font-body text-xs text-emerald-600">Fat: {formatFullCurrency(d.faturamento)}</p>
                                {d.ticketMedio > 0 && <p className="font-body text-xs text-steel-500">Ticket: {formatFullCurrency(d.ticketMedio)}</p>}
                              </div>
                            );
                          }
                          return null;
                        }} />
                        <Bar dataKey="conversao" name="Conversao %" radius={[0, 4, 4, 0]} maxBarSize={20}>
                          {canaisBI.slice(0, 10).map((c, i) => (
                            <Cell key={i} fill={c.conversao >= 1 ? "#10b981" : c.conversao >= 0.1 ? "#f59e0b" : "#94a3b8"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto bp-scroll">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
                          <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Canal</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Total</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground group/qual relative">
                            <span className="border-b border-dashed border-steel-300 dark:border-steel-600 cursor-default">Qualificados</span>
                            <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover/qual:block">
                              <div className="bg-navy-900 dark:bg-card text-white dark:text-foreground font-normal normal-case tracking-normal rounded-xl px-4 py-3 shadow-lg border border-navy-800 dark:border-border w-64">
                                <p className="text-sm font-semibold mb-1">Leads Qualificados</p>
                                <p className="text-xs text-white/70 dark:text-muted-foreground leading-relaxed">Leads a partir de WhatsApp Obtido (WA + Reunioes + Propostas + Vendas)</p>
                              </div>
                            </div>
                          </th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground group/txq relative">
                            <span className="border-b border-dashed border-steel-300 dark:border-steel-600 cursor-default">Tx Qualif.</span>
                            <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover/txq:block">
                              <div className="bg-navy-900 dark:bg-card text-white dark:text-foreground font-normal normal-case tracking-normal rounded-xl px-4 py-3 shadow-lg border border-navy-800 dark:border-border w-56">
                                <p className="text-sm font-semibold mb-1">Taxa de Qualificacao</p>
                                <p className="text-xs text-white/70 dark:text-muted-foreground leading-relaxed">Qualificados / Total do canal</p>
                              </div>
                            </div>
                          </th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Reunioes</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Vendas</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Conversao</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Faturamento</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Ticket Medio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {canaisBI.map((c, i) => (
                          <tr key={i} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{c.canal}</td>
                            <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{c.total.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{c.leadsQualificados}</td>
                            <td className="px-4 py-3 text-right"><span className={cn("text-[10px] font-body font-bold px-1.5 py-0.5 rounded", c.taxaQualificacao >= 5 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : c.taxaQualificacao >= 1 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-steel-100 dark:bg-secondary text-steel-500 dark:text-muted-foreground")}>{c.taxaQualificacao.toFixed(1)}%</span></td>
                            <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{c.reunioes}</td>
                            <td className="px-4 py-3 text-right font-body text-sm font-bold text-navy-900 dark:text-foreground tabular-nums">{c.vendas}</td>
                            <td className="px-4 py-3 text-right"><span className={cn("text-[10px] font-body font-bold px-1.5 py-0.5 rounded", c.conversao >= 1 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : c.conversao >= 0.1 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-steel-100 dark:bg-secondary text-steel-500 dark:text-muted-foreground")}>{c.conversao.toFixed(2)}%</span></td>
                            <td className="px-4 py-3 text-right font-body text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{c.faturamento > 0 ? formatCurrency(c.faturamento) : "-"}</td>
                            <td className="px-4 py-3 text-right font-body text-sm text-steel-500 dark:text-muted-foreground tabular-nums">{c.ticketMedio > 0 ? formatCurrency(c.ticketMedio) : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Performance por Pessoa */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-3">
            <div className="px-5 py-4 border-b border-steel-100 dark:border-border">
              <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Performance por Pessoa</h3>
              <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Ranking de performance individual</p>
            </div>
            {(() => {
              const pessoasBI = data.byPessoa
                .filter(p => p.total >= 3 && p.pessoa !== "Sem pessoa")
                .map(p => ({
                  pessoa: p.pessoa, total: p.total, vendas: p.vendaFechada, faturamento: p.faturamento,
                  conversao: p.total > 0 ? (p.vendaFechada / p.total) * 100 : 0,
                  ticketMedio: p.vendaFechada > 0 ? p.faturamento / p.vendaFechada : 0,
                  leadsQualificados: p.whatsappObtido + p.reuniaoAgendada + p.reuniaoRealizada + p.propostaEmAnalise + p.vendaFechada,
                  reunioes: p.reuniaoRealizada, propostas: p.propostaEmAnalise,
                }))
                .sort((a, b) => b.faturamento - a.faturamento || b.conversao - a.conversao);
              return (
                <div className="overflow-x-auto bp-scroll">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
                        <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">#</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Pessoa</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Leads</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Qualificados</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Reunioes</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Propostas</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Vendas</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Conversao</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Faturamento</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Ticket Medio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pessoasBI.map((p, i) => (
                        <tr key={i} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-body text-sm text-steel-400">{i === 0 ? <Trophy className="h-4 w-4 text-amber-500" /> : i + 1}</td>
                          <td className="px-4 py-3 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{p.pessoa}</td>
                          <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{p.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{p.leadsQualificados}</td>
                          <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{p.reunioes}</td>
                          <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{p.propostas}</td>
                          <td className="px-4 py-3 text-right font-body text-sm font-bold text-navy-900 dark:text-foreground tabular-nums">{p.vendas}</td>
                          <td className="px-4 py-3 text-right"><span className={cn("text-[10px] font-body font-bold px-1.5 py-0.5 rounded", p.conversao >= 1 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : p.conversao >= 0.1 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-steel-100 dark:bg-secondary text-steel-500 dark:text-muted-foreground")}>{p.conversao.toFixed(2)}%</span></td>
                          <td className="px-4 py-3 text-right font-body text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{p.faturamento > 0 ? formatCurrency(p.faturamento) : "-"}</td>
                          <td className="px-4 py-3 text-right font-body text-sm text-steel-500 dark:text-muted-foreground tabular-nums">{p.ticketMedio > 0 ? formatCurrency(p.ticketMedio) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Detail Table */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-4">
            <div className="px-5 py-4 border-b border-steel-100 dark:border-border">
              <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Detalhamento por Canal</h3>
              <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Quantidade atual em cada etapa</p>
            </div>
            <PipelineTable data={tableData} view={view} filterPessoa={filterPessoa} />
          </div>

          {/* Funnel visualization */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-5 animate-fade-up delay-3">
            <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground mb-4">Funil de Conversao</h3>
            <div className="space-y-3">
              {STAGES.map((s, i) => {
                const value = t[s.key];
                const maxVal = Math.max(t.contato, t.msgEnviada, 1);
                const width = Math.max((value / maxVal) * 100, 3);
                const prevValue = i > 0 ? t[STAGES[i - 1].key] : value;
                const convRate = prevValue > 0 ? ((value / prevValue) * 100) : 0;

                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <s.icon className={cn("h-3.5 w-3.5", s.color)} />
                        <span className="text-sm font-body font-medium text-navy-800 dark:text-foreground/80">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-display font-bold text-navy-900 dark:text-foreground tabular-nums">
                          {value.toLocaleString('pt-BR')}
                        </span>
                        {i > 0 && (
                          <span className={cn(
                            "text-[10px] font-body font-bold px-1.5 py-0.5 rounded",
                            convRate >= 50 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                            convRate >= 20 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                            "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
                          )}>
                            {convRate.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-5 bg-steel-100 dark:bg-secondary rounded overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded transition-all duration-700",
                          i <= 1 ? "bg-navy-700 dark:bg-sky-600" :
                          i <= 3 ? "bg-sky-500 dark:bg-sky-500" :
                          i <= 5 ? "bg-amber-500 dark:bg-amber-400" :
                          "bg-emerald-500 dark:bg-emerald-400"
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights automaticos */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-5 animate-fade-up delay-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-amber-500" />
              <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Insights</h3>
            </div>
            {(() => {
              const insights: { icon: any; color: string; text: string }[] = [];
              const tot = data.totals;

              // Conversion rates
              const convMsgConexao = tot.msgEnviada > 0 ? (tot.conexao / tot.msgEnviada) * 100 : 0;
              const convConexaoWA = tot.conexao > 0 ? (tot.whatsappObtido / tot.conexao) * 100 : 0;
              const convWaReuniao = tot.whatsappObtido > 0 ? (tot.reuniaoAgendada / tot.whatsappObtido) * 100 : 0;
              const convPropostaVenda = tot.propostaEmAnalise > 0 ? (tot.vendaFechada / tot.propostaEmAnalise) * 100 : 0;
              const convGeral = tot.total > 0 ? (tot.vendaFechada / tot.total) * 100 : 0;

              // Best channel
              const bestCanal = data.byCanal.filter(c => c.vendaFechada > 0).sort((a, b) => {
                const ca = a.total > 0 ? a.vendaFechada / a.total : 0;
                const cb = b.total > 0 ? b.vendaFechada / b.total : 0;
                return cb - ca;
              })[0];
              if (bestCanal) {
                const rate = (bestCanal.vendaFechada / bestCanal.total * 100).toFixed(2);
                insights.push({ icon: Trophy, color: "text-emerald-600 dark:text-emerald-400", text: `Melhor canal: ${bestCanal.canal} com ${rate}% de conversao e ${bestCanal.vendaFechada} vendas (R$ ${bestCanal.faturamento.toLocaleString('pt-BR')})` });
              }

              // Best person
              const bestPessoa = data.byPessoa.filter(p => p.vendaFechada > 0 && p.pessoa !== "Sem pessoa").sort((a, b) => {
                const ca = a.total > 0 ? a.vendaFechada / a.total : 0;
                const cb = b.total > 0 ? b.vendaFechada / b.total : 0;
                return cb - ca;
              })[0];
              if (bestPessoa) {
                const rate = (bestPessoa.vendaFechada / bestPessoa.total * 100).toFixed(2);
                insights.push({ icon: Trophy, color: "text-emerald-600 dark:text-emerald-400", text: `Melhor closer: ${bestPessoa.pessoa} com ${rate}% de conversao (${bestPessoa.vendaFechada} vendas, R$ ${bestPessoa.faturamento.toLocaleString('pt-BR')})` });
              }

              // Biggest bottleneck
              const stages = [
                { name: "Msg Enviada → Conexao", rate: convMsgConexao, from: tot.msgEnviada, lost: tot.msgEnviada - tot.conexao },
                { name: "Conexao → WhatsApp", rate: convConexaoWA, from: tot.conexao, lost: tot.conexao - tot.whatsappObtido },
                { name: "WhatsApp → Reuniao", rate: convWaReuniao, from: tot.whatsappObtido, lost: tot.whatsappObtido - tot.reuniaoAgendada },
              ].filter(s => s.from > 10);
              const worstStage = stages.sort((a, b) => a.rate - b.rate)[0];
              if (worstStage) {
                insights.push({ icon: AlertTriangle, color: "text-red-500 dark:text-red-400", text: `Maior gargalo: ${worstStage.name} — apenas ${worstStage.rate.toFixed(1)}% de conversao (${worstStage.lost.toLocaleString()} leads perdidos)` });
              }

              // Ticket medio
              if (tot.vendaFechada > 0) {
                const ticket = tot.faturamento / tot.vendaFechada;
                insights.push({ icon: DollarSign, color: "text-sky-600 dark:text-sky-400", text: `Ticket medio: R$ ${ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por venda` });
              }

              // Conversion total
              if (tot.total > 0) {
                insights.push({ icon: TrendingUp, color: "text-sky-600 dark:text-sky-400", text: `Conversao geral: ${convGeral.toFixed(2)}% (${tot.total.toLocaleString()} oportunidades → ${tot.vendaFechada} vendas)` });
              }

              // Channels with zero sales
              const zeroCanais = data.byCanal.filter(c => c.vendaFechada === 0 && c.total >= 50);
              if (zeroCanais.length > 0) {
                const names = zeroCanais.slice(0, 3).map(c => `${c.canal} (${c.total})`).join(", ");
                insights.push({ icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", text: `Canais com volume mas sem vendas: ${names}` });
              }

              // Proposal to close rate
              if (convPropostaVenda > 0) {
                insights.push({ icon: FileText, color: "text-violet-600 dark:text-violet-400", text: `Taxa de fechamento (Proposta → Venda): ${convPropostaVenda.toFixed(1)}% (${tot.propostaEmAnalise} propostas → ${tot.vendaFechada} vendas)` });
              }

              return (
                <div className="space-y-3">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-steel-50/50 dark:bg-secondary/30">
                      <ins.icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", ins.color)} />
                      <p className="text-sm font-body text-navy-800 dark:text-foreground/80">{ins.text}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Pipeline;
