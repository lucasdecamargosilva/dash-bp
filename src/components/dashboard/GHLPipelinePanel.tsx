import { useState } from "react";
import { useGHLData } from "@/hooks/useGHLData";
import { type ChannelMetrics } from "@/lib/ghl";
import { cn } from "@/lib/utils";
import { Loader2, Filter, Users, Megaphone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GHLPipelinePanelProps {
  selectedPeriod?: string;
}

const FUNNEL_STAGES = [
  { key: "contato" as const, label: "Contatos" },
  { key: "msgEnviada" as const, label: "Msg Enviadas" },
  { key: "conexao" as const, label: "Conexoes" },
  { key: "whatsappObtido" as const, label: "WhatsApp" },
  { key: "reuniaoAgendada" as const, label: "Reunioes Ag." },
  { key: "reuniaoRealizada" as const, label: "Reunioes Re." },
  { key: "propostaEmAnalise" as const, label: "Propostas" },
  { key: "vendaFechada" as const, label: "Vendas" },
];

function StageBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">{label}</span>
        <span className="text-xs font-body font-bold text-navy-900 dark:text-foreground tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-steel-100 dark:bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MetricsCard({ metrics, maxValues }: { metrics: ChannelMetrics; maxValues: Record<string, number> }) {
  const title = metrics.pessoa && metrics.canal
    ? `${metrics.canal} - ${metrics.pessoa}`
    : metrics.pessoa || metrics.canal;

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border p-4 shadow-card hover:shadow-kpi transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-sm font-bold text-navy-900 dark:text-foreground truncate">
          {title}
        </h4>
        <span className="text-[10px] font-body font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded">
          {metrics.total} opps
        </span>
      </div>
      <div className="space-y-2">
        {FUNNEL_STAGES.map((stage) => {
          const value = metrics[stage.key];
          if (value === 0 && stage.key !== "vendaFechada") return null;
          return (
            <StageBar
              key={stage.key}
              value={value}
              max={maxValues[stage.key] || 1}
              label={stage.label}
            />
          );
        })}
      </div>
    </div>
  );
}

function SummaryTable({ data, view }: { data: ChannelMetrics[]; view: "canal" | "pessoa" | "combo" }) {
  if (data.length === 0) return null;

  // Calculate max for each stage for bar sizing
  const maxValues: Record<string, number> = {};
  for (const stage of FUNNEL_STAGES) {
    maxValues[stage.key] = Math.max(...data.map((d) => d[stage.key]), 1);
  }

  return (
    <div className="overflow-x-auto bp-scroll">
      <table className="w-full">
        <thead>
          <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
            <th className="px-3 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">
              {view === "canal" ? "Canal" : view === "pessoa" ? "Pessoa / Conta" : "Canal - Pessoa"}
            </th>
            {FUNNEL_STAGES.map((stage) => (
              <th key={stage.key} className="px-3 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">
                {stage.label}
              </th>
            ))}
            <th className="px-3 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const label = view === "canal" ? row.canal : view === "pessoa" ? row.pessoa : `${row.canal} - ${row.pessoa}`;
            return (
              <tr
                key={i}
                className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors"
              >
                <td className="px-3 py-2.5 font-body text-sm font-semibold text-navy-900 dark:text-foreground">
                  {label}
                </td>
                {FUNNEL_STAGES.map((stage) => (
                  <td key={stage.key} className="px-3 py-2.5 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">
                    {row[stage.key] > 0 ? row[stage.key].toLocaleString() : (
                      <span className="text-steel-300 dark:text-muted-foreground/40">-</span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right font-body text-sm font-bold text-navy-900 dark:text-foreground tabular-nums">
                  {row.total.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Totals row */}
        <tfoot>
          <tr className="border-t-2 border-steel-200 dark:border-border bg-steel-50/30 dark:bg-secondary/20">
            <td className="px-3 py-2.5 font-body text-sm font-bold text-navy-900 dark:text-foreground">
              Total
            </td>
            {FUNNEL_STAGES.map((stage) => {
              const total = data.reduce((sum, d) => sum + d[stage.key], 0);
              return (
                <td key={stage.key} className="px-3 py-2.5 text-right font-body text-sm font-bold text-navy-900 dark:text-foreground tabular-nums">
                  {total > 0 ? total.toLocaleString() : "-"}
                </td>
              );
            })}
            <td className="px-3 py-2.5 text-right font-body text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
              {data.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function GHLPipelinePanel({ selectedPeriod }: GHLPipelinePanelProps) {
  const month = selectedPeriod && selectedPeriod !== "all" ? selectedPeriod : undefined;
  const { data, isLoading, error } = useGHLData(month);
  const [view, setView] = useState<"canal" | "pessoa" | "combo">("combo");

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-8 animate-fade-up delay-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <p className="text-sm font-body text-steel-400 dark:text-muted-foreground">
            Carregando dados do CRM...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-8 animate-fade-up delay-8">
        <p className="text-sm font-body text-destructive text-center">
          Erro ao carregar dados do Go High Level
        </p>
      </div>
    );
  }

  const tableData = view === "canal" ? data.byCanal : view === "pessoa" ? data.byPessoa : data.byCanalPessoa;

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-steel-100 dark:border-border">
        <div>
          <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">
            Pipeline por Canal
          </h3>
          <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">
            Funil de Aquisicao - Prime ROI ({data.totalOpportunities.toLocaleString()} oportunidades)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-steel-400" />
          <Select value={view} onValueChange={(v) => setView(v as any)}>
            <SelectTrigger className="w-40 h-8 text-xs font-body bg-white dark:bg-card border-steel-200 dark:border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="combo">
                <span className="flex items-center gap-1.5">Canal + Pessoa</span>
              </SelectItem>
              <SelectItem value="canal">
                <span className="flex items-center gap-1.5">Por Canal</span>
              </SelectItem>
              <SelectItem value="pessoa">
                <span className="flex items-center gap-1.5">Por Pessoa</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-px bg-steel-100 dark:bg-border border-b border-steel-100 dark:border-border">
        {FUNNEL_STAGES.map((stage) => (
          <div key={stage.key} className="bg-white dark:bg-card px-3 py-3 text-center">
            <p className="text-[9px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground mb-1">
              {stage.label}
            </p>
            <p className="text-lg font-display font-bold text-navy-900 dark:text-foreground tabular-nums">
              {data.totals[stage.key].toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <SummaryTable data={tableData} view={view} />
    </div>
  );
}
