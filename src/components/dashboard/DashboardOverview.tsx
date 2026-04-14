import React, { useState, useEffect, useMemo } from 'react';
import { Users, Calendar, FileText, TrendingUp, DollarSign, Loader2, Link, Phone, Trophy } from "lucide-react";
import { startOfMonth } from "date-fns";
import { type DateRange } from "react-day-picker";
import { KPICard } from "./KPICard";
import { FunnelChart } from "./FunnelChart";
import { RevenueChart } from "./RevenueChart";
import { LeadsVsSalesChart } from "./LeadsVsSalesChart";
import { ChannelsManagementPanel } from "./ChannelsManagementPanel";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/context/TenantContext";
import { useGHLData } from "@/hooks/useGHLData";

const calculateChangePercentage = (current: number, previous?: number) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};


export function DashboardOverview() {
  const { user } = useAuth();
  const { tenant } = useTenant();

  // Date range filter — default to current month
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const {
    loading,
    error,
  } = useDashboard();

  // GHL real data from Supabase cache
  const { data: ghlData, isLoading: ghlLoading } = useGHLData(dateRange);
  const ghl = ghlData?.totals;

  // Historical chart data from GHL summary (by month)
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; leads: number; sales: number }[]>([]);

  useEffect(() => {
    const loadHistorical = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: rows } = await (supabase as any)
          .from("ghl_pipeline_summary")
          .select("month,contato,msg_enviada,whatsapp_obtido,reuniao_agendada,reuniao_realizada,proposta_em_analise,venda_fechada,faturamento,total")
          .eq("view_type", "total")
          .neq("month", "all")
          .order("month");

        if (rows && rows.length > 0) {
          const MONTH_LABELS: Record<string, string> = {
            "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun",
            "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez"
          };
          setRevenueData(rows.map((r: any) => {
            const [year, m] = r.month.split("-");
            // Leads qualificados = WhatsApp Obtido + Reuniao Agendada + Reuniao Realizada + Proposta + Venda Fechada
            const leadsQualificados = (r.whatsapp_obtido || 0) + (r.reuniao_agendada || 0) + (r.reuniao_realizada || 0) + (r.proposta_em_analise || 0) + (r.venda_fechada || 0);
            return {
              month: `${MONTH_LABELS[m] || m}/${year.slice(2)}`,
              revenue: parseFloat(r.faturamento) || 0,
              leads: leadsQualificados,
              sales: r.venda_fechada || 0,
            };
          }));
        }
      } catch (err) {
        console.error("Error loading historical:", err);
      }
    };
    loadHistorical();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-navy-200 border-t-navy-800 animate-spin mx-auto" />
          <p className="text-sm font-body text-steel-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3 bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border p-8 shadow-kpi">
          <p className="text-destructive font-body text-sm">{error}</p>
          <button className="text-sky-600 hover:text-sky-700 font-body text-sm font-semibold" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // GHL-based funnel data — raw values per stage (all 8 stages)
  const gRawStages = [
    ghl?.contato ?? 0,
    ghl?.msgEnviada ?? 0,
    ghl?.conexao ?? 0,
    ghl?.whatsappObtido ?? 0,
    ghl?.reuniaoAgendada ?? 0,
    ghl?.reuniaoRealizada ?? 0,
    ghl?.propostaEmAnalise ?? 0,
    ghl?.vendaFechada ?? 0,
  ];
  // Accumulated: each stage = itself + all stages after it
  // Contato = total de todos os leads no pipeline
  const gAcc: number[] = [];
  let gSum = 0;
  for (let i = gRawStages.length - 1; i >= 0; i--) {
    gSum += gRawStages[i];
    gAcc[i] = gSum;
  }
  const [gContato, , gConexao, gWhatsapp, gAgendada, gRealizada, gProposta, gVenda] = gAcc;
  const gFaturamento = ghl?.faturamento ?? 0;

  const funnelData = [
    { name: "Contato", value: gContato, conversionRate: 100 },
    { name: "Conexao", value: gConexao, conversionRate: gContato > 0 ? Math.round((gConexao / gContato) * 100) : 0 },
    { name: "WhatsApp Obtido", value: gWhatsapp, conversionRate: gConexao > 0 ? Math.round((gWhatsapp / gConexao) * 100) : 0 },
    { name: "Reuniao Agendada", value: gAgendada, conversionRate: gWhatsapp > 0 ? Math.round((gAgendada / gWhatsapp) * 100) : 0 },
    { name: "Reuniao Realizada", value: gRealizada, conversionRate: gAgendada > 0 ? Math.round((gRealizada / gAgendada) * 100) : 0 },
    { name: "Proposta em Analise", value: gProposta, conversionRate: gRealizada > 0 ? Math.round((gProposta / gRealizada) * 100) : 0 },
    { name: "Venda Fechada", value: gVenda, conversionRate: gProposta > 0 ? Math.round((gVenda / gProposta) * 100) : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page header + filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-foreground">
            Painel de Vendas
          </h1>
          <p className="text-sm font-body text-steel-400 dark:text-muted-foreground mt-0.5">
            Visao consolidada de metricas e performance comercial
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

          <div className="flex items-center gap-2 bg-white dark:bg-card rounded-lg border border-steel-200 dark:border-border px-3 h-9">
            <span className="text-sm font-body font-semibold text-navy-900 dark:text-foreground">{tenant.empresa}</span>
          </div>

        </div>
      </div>

      {/* KPI Cards — Funil de Aquisição (GHL) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="animate-fade-up delay-1">
          <KPICard title="Contato" value={gContato} icon={Users} variant="info" loading={ghlLoading} />
        </div>
        <div className="animate-fade-up delay-1">
          <KPICard title="Conexao" value={gConexao} icon={Link} variant="warning" loading={ghlLoading} />
        </div>
        <div className="animate-fade-up delay-2">
          <KPICard title="WhatsApp Obtido" value={gWhatsapp} icon={Phone} variant="warning" loading={ghlLoading} />
        </div>
        <div className="animate-fade-up delay-2">
          <KPICard title="Reuniao Agendada" value={gAgendada} icon={Calendar} variant="secondary" loading={ghlLoading} />
        </div>
        <div className="animate-fade-up delay-3">
          <KPICard title="Reuniao Realizada" value={gRealizada} icon={Calendar} variant="primary" loading={ghlLoading} />
        </div>
        <div className="animate-fade-up delay-3">
          <KPICard title="Proposta" value={gProposta} icon={FileText} variant="primary" loading={ghlLoading} />
        </div>
        <div className="animate-fade-up delay-4">
          <KPICard title="Venda Fechada" value={gVenda} icon={TrendingUp} variant="success" loading={ghlLoading} />
        </div>
        <div className="animate-fade-up delay-4">
          <KPICard title="Faturamento" value={gFaturamento} icon={DollarSign} variant="success" loading={ghlLoading} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-5 animate-fade-up delay-5">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Funil de Conversao</h3>
            <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Conversao por etapa do processo</p>
          </div>
          <FunnelChart stages={funnelData} title="Funil de Conversao" />
        </div>

        <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-5 animate-fade-up delay-6">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Faturamento Mensal</h3>
            <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Evolucao do faturamento por mes</p>
          </div>
          <RevenueChart data={revenueData} title="Faturamento Mensal" />
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-5 animate-fade-up delay-7">
        <div className="mb-4">
          <h3 className="font-display text-lg font-bold text-navy-900">Leads vs Vendas</h3>
          <p className="text-xs font-body text-steel-400 mt-0.5">Comparacao mensal entre leads qualificados e vendas</p>
        </div>
        <LeadsVsSalesChart data={revenueData} title="Leads vs Vendas" />
      </div>

      {/* Vendas Fechadas */}
      {ghlData?.vendas && ghlData.vendas.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-8">
          <div className="px-5 py-4 border-b border-steel-100 dark:border-border flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Vendas Fechadas</h3>
              <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">{ghlData.vendas.length} venda(s) no periodo</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ghlData.vendas.reduce((s, v) => s + v.monetaryValue, 0))}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto bp-scroll">
            <table className="w-full">
              <thead>
                <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
                  <th className="px-5 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">#</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Oportunidade</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Canal</th>
                  <th className="px-5 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Pessoa</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Valor</th>
                </tr>
              </thead>
              <tbody>
                {ghlData.vendas.map((v, i) => (
                  <tr key={i} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-body text-sm text-steel-400">{i === 0 ? <Trophy className="h-4 w-4 text-amber-500" /> : i + 1}</td>
                    <td className="px-5 py-3 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{v.name}</td>
                    <td className="px-5 py-3 font-body text-sm text-steel-500 dark:text-muted-foreground">{v.source || "-"}</td>
                    <td className="px-5 py-3 font-body text-sm text-steel-500 dark:text-muted-foreground">{v.pessoa || "-"}</td>
                    <td className="px-5 py-3 text-right font-body text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {v.monetaryValue > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.monetaryValue) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
