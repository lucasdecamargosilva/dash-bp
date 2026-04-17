import { useState, useMemo, useEffect } from "react";
import { startOfMonth } from "date-fns";
import { type DateRange } from "react-day-picker";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Users, CalendarCheck, Calendar, CalendarX, TrendingUp, DollarSign, Plus, Save, Trash2, Pencil, Settings,
  BarChart3, User, Trophy, AlertTriangle, CheckCircle2, Loader2, UserX, Link2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { useGHLData } from "@/hooks/useGHLData";
import { useTenant } from "@/context/TenantContext";

// Types
interface Consultor {
  id: string;
  nome: string;
  setor: "pre_venda" | "vendas";
  pct_meta: number; // 0-100, percentage of the monthly meta
  meta_leads: number;
  meta_agendamentos: number;
  meta_reunioes_realizadas: number;
  meta_vendas: number;
  meta_faturamento: number;
}

interface MetaMensal {
  mes: string;
  meta_leads: number;
  meta_agendamentos: number;
  meta_vendas: number;
  meta_faturamento: number;
}

interface DiarioEntry {
  id: string;
  consultor_id: string;
  data: string;
  leads_novos: number;
  conexoes: number;
  reunioes_agendadas: number;
  reunioes: number;
  vendas: number;
  valor_vendas: number;
}

// Helpers
const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const formatFullCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

function getMonthProgress() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  return { currentDay, daysInMonth, pct: Math.round((currentDay / daysInMonth) * 100) };
}

function StatusBadge({ value, meta }: { value: number; meta: number }) {
  if (meta === 0) return null;
  const pct = (value / meta) * 100;
  const monthPct = getMonthProgress().pct;

  if (pct >= monthPct) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded"><CheckCircle2 className="h-2.5 w-2.5" />{pct.toFixed(0)}%</span>;
  }
  if (pct >= monthPct * 0.7) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded"><AlertTriangle className="h-2.5 w-2.5" />{pct.toFixed(0)}%</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded"><AlertTriangle className="h-2.5 w-2.5" />{pct.toFixed(0)}%</span>;
}

// ---- Summary Card ----
function SummaryCard({ label, value, meta, icon: Icon, color, isCurrency }: {
  label: string; value: number; meta: number; icon: any; color: string; isCurrency?: boolean;
}) {
  const pct = meta > 0 ? (value / meta) * 100 : 0;
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border p-4 shadow-card overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg flex-shrink-0", color.replace("text-", "bg-").replace("600", "50").replace("dark:", ""), "dark:bg-opacity-10")}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
        <span className="text-[10px] font-body font-semibold uppercase tracking-[0.06em] text-steel-400 dark:text-muted-foreground leading-tight">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className={cn(
          "font-display font-bold text-navy-900 dark:text-foreground tabular-nums",
          isCurrency ? "text-sm sm:text-base" : "text-2xl"
        )}>
          {isCurrency ? formatFullCurrency(value) : value.toLocaleString('pt-BR')}
        </p>
        <StatusBadge value={value} meta={meta} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 gap-0.5">
        <span className="text-[10px] font-body text-steel-400 dark:text-muted-foreground truncate">Meta: {isCurrency ? formatCurrency(meta) : meta.toLocaleString('pt-BR')}</span>
        <span className="text-[10px] font-body text-steel-400 dark:text-muted-foreground truncate">Gap: {isCurrency ? formatCurrency(meta - value) : (meta - value).toLocaleString('pt-BR')}</span>
      </div>
      <div className="mt-2 h-1.5 bg-steel-100 dark:bg-secondary rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

// ---- Pacing Chart ----
function PacingChart({ diarioData, meta, daysInMonth }: { diarioData: DiarioEntry[]; meta: number; daysInMonth: number }) {
  const chartData = useMemo(() => {
    const data = [];
    let acumulado = 0;
    const dailyMeta = meta / daysInMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `2026-04-${String(day).padStart(2, '0')}`;
      const dayEntries = diarioData.filter(d => d.data === dateStr);
      const dayTotal = dayEntries.reduce((sum, d) => sum + d.valor_vendas, 0);
      acumulado += dayTotal;

      const isPast = day <= new Date().getDate();
      data.push({
        dia: day,
        metaLinear: Math.round(dailyMeta * day),
        realizado: isPast ? acumulado : undefined,
      });
    }
    return data;
  }, [diarioData, meta, daysInMonth]);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const colors = {
    grid: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
    axis: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8',
    tooltipBg: isDark ? '#1c2230' : 'white',
    tooltipBorder: isDark ? '#2a3040' : '#e5e7eb',
  };

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis dataKey="dia" stroke={colors.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} />
          <YAxis stroke={colors.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false}
            tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString()} />
          <Tooltip content={({ active, payload, label }) => {
            if (active && payload?.length) {
              return (
                <div style={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder }} className="rounded-lg px-4 py-3 shadow-hover border">
                  <p className="font-body text-xs text-steel-400 dark:text-muted-foreground mb-1.5 font-semibold">Dia {label}</p>
                  {payload.map((e, i) => (
                    <p key={i} className="text-sm font-body font-semibold" style={{ color: e.color }}>
                      {e.name}: {formatCurrency(e.value as number)}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }} />
          <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: '11px', paddingTop: '12px' }} />
          <Line type="monotone" dataKey="metaLinear" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Meta Linear" />
          <Line type="monotone" dataKey="realizado" stroke="#38a8f9" strokeWidth={2.5} dot={{ fill: "#38a8f9", r: 2 }} connectNulls={false} name="Realizado" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Consultor Input Form ----
function ConsultorInput({ consultor, mes, onSaved }: { consultor: Consultor; mes: string; onSaved: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [data, setData] = useState(today);
  const [leads, setLeads] = useState("");
  const [conexoes, setConexoes] = useState("");
  const [reunioesAgendadas, setReunioesAgendadas] = useState("");
  const [reunioes, setReunioes] = useState("");
  const [vendas, setVendas] = useState("");
  const [valorVendas, setValorVendas] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('comercial_diario').upsert({
        consultor_id: consultor.id,
        data,
        leads_novos: parseInt(leads) || 0,
        conexoes: parseInt(conexoes) || 0,
        reunioes_agendadas: parseInt(reunioesAgendadas) || 0,
        reunioes: parseInt(reunioes) || 0,
        vendas: parseInt(vendas) || 0,
        valor_vendas: parseFloat(valorVendas) || 0,
      }, { onConflict: 'consultor_id,data' });

      if (error) throw error;
      toast.success("Dados salvos com sucesso!");
      setLeads(""); setConexoes(""); setReunioesAgendadas(""); setReunioes(""); setVendas(""); setValorVendas("");
      onSaved();
    } catch (err) {
      toast.error("Erro ao salvar dados");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-steel-50 dark:bg-secondary/30 rounded-lg p-4">
      <p className="text-xs font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground mb-3">Input Diario - {consultor.nome}</p>
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">Data</Label>
          <Input type="date" value={data} onChange={e => setData(e.target.value)} className="h-8 text-xs font-body" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">Leads Novos</Label>
          <Input type="number" value={leads} onChange={e => setLeads(e.target.value)} placeholder="0" className="h-8 text-xs font-body" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">Conexoes</Label>
          <Input type="number" value={conexoes} onChange={e => setConexoes(e.target.value)} placeholder="0" className="h-8 text-xs font-body" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">Reun. Agendadas</Label>
          <Input type="number" value={reunioesAgendadas} onChange={e => setReunioesAgendadas(e.target.value)} placeholder="0" className="h-8 text-xs font-body" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">Reun. Realizadas</Label>
          <Input type="number" value={reunioes} onChange={e => setReunioes(e.target.value)} placeholder="0" className="h-8 text-xs font-body" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">Vendas</Label>
          <Input type="number" value={vendas} onChange={e => setVendas(e.target.value)} placeholder="0" className="h-8 text-xs font-body" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">Valor (R$)</Label>
          <div className="flex gap-1.5">
            <Input type="number" value={valorVendas} onChange={e => setValorVendas(e.target.value)} placeholder="0" className="h-8 text-xs font-body" />
            <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 px-3 bg-navy-900 hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
const Comercial = () => {
  const { tenant } = useTenant();
  const [section, setSection] = useState<"pre_venda" | "vendas" | "total">("pre_venda");
  const [activeTab, setActiveTab] = useState("geral");
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [metaMensal, setMetaMensal] = useState<MetaMensal | null>(null);
  const [diarioData, setDiarioData] = useState<DiarioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Date range for GHL data
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Canal config
  interface CanalConfig { id: number; canal: string; responsavel: string; setor: string; pct_meta?: number; meta_leads: number; meta_reunioes: number; meta_vendas: number; meta_faturamento: number; }
  const [canalConfigs, setCanalConfigs] = useState<CanalConfig[]>([]);
  const [allCanaisHistorico, setAllCanaisHistorico] = useState<{ canal: string; pessoa: string }[]>([]);

  useEffect(() => {
    // Load only configs for current month
    const curMonth = dateRange?.from ? `${dateRange.from.getFullYear()}-${String(dateRange.from.getMonth() + 1).padStart(2, "0")}` : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    (supabase as any).from("canal_config").select("*").eq("mes", curMonth).order("canal").then(({ data }: any) => {
      setCanalConfigs(data || []);
    });
    // Load ALL unique canal+pessoa from history (no date filter)
    (supabase as any).from("ghl_pipeline_opportunities").select("source,pessoa").then(({ data }: any) => {
      if (!data) return;
      const seen = new Set<string>();
      const unique: { canal: string; pessoa: string }[] = [];
      for (const row of data) {
        const canal = (row.source || "").trim();
        const pessoa = (row.pessoa || "").trim();
        if (!canal || canal === "Sem canal" || !pessoa || pessoa === "Sem pessoa") continue;
        const key = `${canal}|${pessoa}`;
        if (!seen.has(key)) { seen.add(key); unique.push({ canal, pessoa }); }
      }
      setAllCanaisHistorico(unique);
    });
  }, [refreshKey, dateRange]);

  // Current month from dateRange (for simulador de metas)
  const currentMes = useMemo(() => {
    if (dateRange?.from) {
      const d = dateRange.from;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  }, [dateRange]);

  // GHL pipeline data
  const { data: ghlData, isLoading: ghlLoading } = useGHLData(dateRange);

  // GHL accumulated totals
  const ghlTotals = useMemo(() => {
    const ghl = ghlData?.totals;
    if (!ghl) return { contato: 0, conexao: 0, whatsapp: 0, agendada: 0, realizada: 0, proposta: 0, venda: 0, faturamento: 0, noShow: 0 };
    const raw = [ghl.contato, ghl.msgEnviada, ghl.conexao, ghl.whatsappObtido, ghl.reuniaoAgendada, ghl.reuniaoRealizada, ghl.propostaEmAnalise, ghl.vendaFechada];
    const acc: number[] = [];
    let sum = 0;
    for (let i = raw.length - 1; i >= 0; i--) { sum += raw[i]; acc[i] = sum; }
    return {
      contato: acc[0], conexao: acc[2], whatsapp: acc[3], agendada: acc[4],
      realizada: acc[5], proposta: acc[6], venda: acc[7],
      faturamento: ghl.faturamento,
      noShow: Math.max(0, acc[4] - acc[5]),
    };
  }, [ghlData]);

  const mes = currentMes;
  const { currentDay, daysInMonth, pct: monthPct } = getMonthProgress();

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      const [cRes, mRes, dRes] = await Promise.all([
        (supabase as any).from('comercial_consultores').select('*').eq('ativo', true).order('nome'),
        (supabase as any).from('comercial_metas').select('*').eq('mes', mes).single(),
        (supabase as any).from('comercial_diario').select('*').gte('data', `${mes}-01`).lte('data', `${mes}-30`).order('data'),
      ]);
      setConsultores(cRes.data || []);
      setMetaMensal(mRes.data || null);
      setDiarioData(dRes.data || []);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  // Aggregated data
  const totals = useMemo(() => {
    const byConsultor = new Map<string, { leads: number; conexoes: number; reunioes_agendadas: number; reunioes: number; no_show: number; vendas: number; valor: number }>();
    for (const c of consultores) {
      byConsultor.set(c.id, { leads: 0, conexoes: 0, reunioes_agendadas: 0, reunioes: 0, no_show: 0, vendas: 0, valor: 0 });
    }
    for (const d of diarioData) {
      const existing = byConsultor.get(d.consultor_id);
      if (existing) {
        existing.leads += d.leads_novos;
        existing.conexoes += d.conexoes || 0;
        existing.reunioes_agendadas += d.reunioes_agendadas || 0;
        existing.reunioes += d.reunioes;
        existing.vendas += d.vendas;
        existing.valor += d.valor_vendas;
      }
    }
    for (const [, data] of byConsultor) {
      data.no_show = Math.max(0, data.reunioes_agendadas - data.reunioes);
    }
    const totalLeads = Array.from(byConsultor.values()).reduce((s, v) => s + v.leads, 0);
    const totalConexoes = Array.from(byConsultor.values()).reduce((s, v) => s + v.conexoes, 0);
    const totalAgendadas = Array.from(byConsultor.values()).reduce((s, v) => s + v.reunioes_agendadas, 0);
    const totalReunioes = Array.from(byConsultor.values()).reduce((s, v) => s + v.reunioes, 0);
    const totalNoShow = Array.from(byConsultor.values()).reduce((s, v) => s + v.no_show, 0);
    const totalVendas = Array.from(byConsultor.values()).reduce((s, v) => s + v.vendas, 0);
    const totalValor = Array.from(byConsultor.values()).reduce((s, v) => s + v.valor, 0);
    return { byConsultor, totalLeads, totalConexoes, totalAgendadas, totalReunioes, totalNoShow, totalVendas, totalValor };
  }, [consultores, diarioData]);

  const meta = metaMensal || { meta_leads: 0, meta_agendamentos: 0, meta_vendas: 0, meta_faturamento: 0 };
  const conversao = totals.totalLeads > 0 ? ((totals.totalVendas / totals.totalLeads) * 100) : 0;

  // Filter consultores by section
  const sectionConsultores = section === "total" ? consultores : consultores.filter(c => (c.setor || "pre_venda") === section);

  const sidebarItems = [
    { key: "geral", label: "Visao Geral", icon: BarChart3 },
    { key: "config", label: "Configuracoes", icon: Settings },
  ];

  const activeConsultor = consultores.find(c => c.id === activeTab);
  const consultorData = activeConsultor ? totals.byConsultor.get(activeConsultor.id) : null;
  const consultorDiario = activeConsultor ? diarioData.filter(d => d.consultor_id === activeConsultor.id) : [];

  // Calculate metas for a consultor based on their pct_meta
  const getConsultorMeta = (c: Consultor) => {
    const pct = (c.pct_meta || 0) / 100;
    return {
      leads: Math.round(meta.meta_leads * pct),
      agendamentos: Math.round(meta.meta_agendamentos * pct),
      vendas: Math.round(meta.meta_vendas * pct),
      faturamento: Math.round(meta.meta_faturamento * pct),
    };
  };

  if (!tenant.ghlLocationId) {
    return (
      <div className="min-h-screen bg-background bp-scroll">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3 bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border p-8 shadow-kpi max-w-md">
            <p className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Pipeline nao configurado</p>
            <p className="text-sm font-body text-steel-400 dark:text-muted-foreground">Sua conta ainda nao tem um pipeline de vendas configurado. Entre em contato com o administrador.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background bp-scroll">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh] gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
          <p className="text-sm font-body text-steel-400 dark:text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bp-scroll">
      <DashboardHeader />
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-56px)] bg-white dark:bg-card border-r border-steel-100 dark:border-border p-3 gap-1">
          {/* Section toggle */}
          <div className="flex rounded-lg bg-steel-100 dark:bg-secondary p-0.5 mb-3">
            {([
              { key: "pre_venda" as const, label: "Pre Venda" },
              { key: "vendas" as const, label: "Vendas" },
              { key: "total" as const, label: "Total" },
            ]).map(s => (
              <button
                key={s.key}
                onClick={() => { setSection(s.key); setActiveTab("geral"); }}
                className={cn(
                  "flex-1 text-xs font-body font-semibold py-2 rounded-md transition-colors",
                  section === s.key
                    ? "bg-navy-900 dark:bg-sky-600 text-white shadow-sm"
                    : "text-steel-500 dark:text-muted-foreground hover:text-navy-800 dark:hover:text-foreground"
                )}
              >{s.label}</button>
            ))}
          </div>

          {sidebarItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body font-medium transition-colors text-left w-full",
                activeTab === item.key
                  ? "bg-navy-900 dark:bg-sky-600 text-white"
                  : "text-steel-500 dark:text-muted-foreground hover:bg-steel-50 dark:hover:bg-secondary"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </aside>

        {/* Mobile tab selector */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-card border-t border-steel-100 dark:border-border p-2 space-y-1.5">
          {/* Section toggle mobile */}
          <div className="flex rounded-lg bg-steel-100 dark:bg-secondary p-0.5">
            {([
              { key: "pre_venda" as const, label: "Pre Venda" },
              { key: "vendas" as const, label: "Vendas" },
              { key: "total" as const, label: "Total" },
            ]).map(s => (
              <button
                key={s.key}
                onClick={() => { setSection(s.key); setActiveTab("geral"); }}
                className={cn(
                  "flex-1 text-xs font-body font-semibold py-1.5 rounded-md transition-colors",
                  section === s.key ? "bg-navy-900 dark:bg-sky-600 text-white" : "text-steel-500 dark:text-muted-foreground"
                )}
              >{s.label}</button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto bp-scroll">
            {sidebarItems.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium whitespace-nowrap",
                  activeTab === item.key
                    ? "bg-navy-900 dark:bg-sky-600 text-white"
                    : "text-steel-500 dark:text-muted-foreground bg-steel-50 dark:bg-secondary"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-12">
          <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-fade-up">
              <div>
                <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-foreground">
                  {activeTab === "geral"
                    ? (section === "pre_venda" ? "Pre Venda" : section === "vendas" ? "Vendas" : "Total Geral")
                    : activeTab === "config" ? "Configuracoes" : activeConsultor?.nome}
                </h1>
                <p className="text-sm font-body text-steel-400 dark:text-muted-foreground mt-0.5">
                  Dia {currentDay}/{daysInMonth} ({monthPct}% do mes)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
                <div className="bg-white dark:bg-card rounded-lg border border-steel-100 dark:border-border px-3 py-2">
                  <p className="text-[9px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Faturamento</p>
                  <p className="text-lg font-display font-bold text-navy-900 dark:text-foreground tabular-nums">
                    {formatFullCurrency(ghlTotals.faturamento)}
                  </p>
                </div>
              </div>
            </div>

            {/* VISAO GERAL */}
            {activeTab === "geral" && (
              <>
                {/* Meta Faturamento — destaque */}
                {meta.meta_faturamento > 0 && (
                  <div className="animate-fade-up delay-1">
                    {(() => {
                      const pct = meta.meta_faturamento > 0 ? (ghlTotals.faturamento / meta.meta_faturamento) * 100 : 0;
                      const gap = Math.max(meta.meta_faturamento - ghlTotals.faturamento, 0);
                      return (
                        <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-white dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-card p-6 shadow-kpi">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="text-[10px] font-body font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400 mb-1">Meta de Faturamento</p>
                              <p className="text-3xl sm:text-4xl font-display font-bold text-navy-900 dark:text-foreground tabular-nums">{formatFullCurrency(ghlTotals.faturamento)}</p>
                              <p className="text-xs font-body text-steel-500 dark:text-muted-foreground mt-1">de <span className="font-semibold text-navy-800 dark:text-foreground/80">{formatFullCurrency(meta.meta_faturamento)}</span></p>
                            </div>
                            <div className="text-right">
                              <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-bold",
                                pct >= 100 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" :
                                pct >= 70 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" :
                                "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                              )}>
                                {pct >= 100 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                {pct.toFixed(1)}%
                              </div>
                              <p className="text-[10px] font-body text-steel-400 dark:text-muted-foreground mt-1">
                                Faltam <span className="font-semibold text-red-500 dark:text-red-400">{formatCurrency(gap)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="h-3 bg-steel-100 dark:bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-700",
                                pct >= 100 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                                pct >= 70 ? "bg-gradient-to-r from-amber-500 to-amber-400" :
                                "bg-gradient-to-r from-sky-500 to-sky-400"
                              )}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Meta Cards — primeiro */}
                {meta.meta_leads > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up delay-2">
                    {[
                      { label: "Meta Contatos", value: meta.meta_leads, realizado: ghlTotals.contato, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20" },
                      { label: "Meta Agendamentos", value: meta.meta_agendamentos, realizado: ghlTotals.agendada, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
                      { label: "Meta Reun. Realizadas", value: meta.meta_agendamentos, realizado: ghlTotals.realizada, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20" },
                      { label: "Meta Vendas", value: meta.meta_vendas, realizado: ghlTotals.venda, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
                    ].map(m => {
                      const pct = m.value > 0 ? (m.realizado / m.value) * 100 : 0;
                      return (
                        <div key={m.label} className={cn("rounded-xl border p-4 text-center", m.bg)}>
                          <p className={cn("text-[9px] font-body font-semibold uppercase tracking-wider mb-1", m.color)}>{m.label}</p>
                          <p className="text-2xl font-display font-bold text-navy-900 dark:text-foreground tabular-nums">{m.value.toLocaleString('pt-BR')}</p>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <p className={cn("text-xs font-body font-semibold", pct >= 100 ? "text-emerald-600 dark:text-emerald-400" : pct >= 70 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400")}>
                              {pct.toFixed(0)}%
                            </p>
                            <p className="text-[10px] font-body text-steel-400 dark:text-muted-foreground">
                              ({m.realizado.toLocaleString('pt-BR')}/{m.value.toLocaleString('pt-BR')})
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary Cards - Pre Venda */}
                {section === "pre_venda" && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 animate-fade-up delay-2">
                    <SummaryCard label="Total Leads" value={ghlTotals.contato} meta={meta.meta_leads} icon={Users} color="text-sky-600 dark:text-sky-400" />
                    <SummaryCard label="Conexoes" value={ghlTotals.conexao} meta={0} icon={Link2} color="text-sky-700 dark:text-sky-300" />
                    <SummaryCard label="Reunioes Agendadas" value={ghlTotals.agendada} meta={meta.meta_agendamentos} icon={CalendarCheck} color="text-amber-600 dark:text-amber-400" />
                    <SummaryCard label="Reunioes Realizadas" value={ghlTotals.realizada} meta={meta.meta_agendamentos} icon={Calendar} color="text-violet-600 dark:text-violet-400" />
                    <SummaryCard label="No Show" value={ghlTotals.noShow} meta={0} icon={CalendarX} color="text-red-600 dark:text-red-400" />
                    <SummaryCard label="Vendas" value={ghlTotals.venda} meta={meta.meta_vendas} icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" />
                    <SummaryCard label="Faturamento" value={ghlTotals.faturamento} meta={meta.meta_faturamento} icon={DollarSign} color="text-emerald-600 dark:text-emerald-400" isCurrency />
                  </div>
                )}

                {/* Summary Cards - Vendas */}
                {section === "vendas" && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 animate-fade-up delay-2">
                    <SummaryCard label="Reunioes Agendadas" value={ghlTotals.agendada} meta={meta.meta_agendamentos} icon={CalendarCheck} color="text-amber-600 dark:text-amber-400" />
                    <SummaryCard label="No Show" value={ghlTotals.noShow} meta={0} icon={CalendarX} color="text-red-600 dark:text-red-400" />
                    <SummaryCard label="Reunioes Realizadas" value={ghlTotals.realizada} meta={meta.meta_agendamentos} icon={Calendar} color="text-violet-600 dark:text-violet-400" />
                    <SummaryCard label="Vendas" value={ghlTotals.venda} meta={meta.meta_vendas} icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" />
                    <SummaryCard label="Faturamento" value={ghlTotals.faturamento} meta={meta.meta_faturamento} icon={DollarSign} color="text-emerald-600 dark:text-emerald-400" isCurrency />
                  </div>
                )}

                {/* Summary Cards - Total Geral */}
                {section === "total" && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 animate-fade-up delay-2">
                    <SummaryCard label="Total Leads" value={ghlTotals.contato} meta={meta.meta_leads} icon={Users} color="text-sky-600 dark:text-sky-400" />
                    <SummaryCard label="Conexoes" value={ghlTotals.conexao} meta={0} icon={Link2} color="text-sky-700 dark:text-sky-300" />
                    <SummaryCard label="Reunioes Agendadas" value={ghlTotals.agendada} meta={meta.meta_agendamentos} icon={CalendarCheck} color="text-amber-600 dark:text-amber-400" />
                    <SummaryCard label="Reunioes Realizadas" value={ghlTotals.realizada} meta={meta.meta_agendamentos} icon={Calendar} color="text-violet-600 dark:text-violet-400" />
                    <SummaryCard label="No Show" value={ghlTotals.noShow} meta={0} icon={CalendarX} color="text-red-600 dark:text-red-400" />
                    <SummaryCard label="Vendas" value={ghlTotals.venda} meta={meta.meta_vendas} icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" />
                    <SummaryCard label="Faturamento" value={ghlTotals.faturamento} meta={meta.meta_faturamento} icon={DollarSign} color="text-emerald-600 dark:text-emerald-400" isCurrency />
                  </div>
                )}

                {/* Performance por Canal — Cards com responsavel e metas */}
                {ghlData && ghlData.byCanalPessoa.length > 0 && (
                  <div className="animate-fade-up delay-2">
                    <div className="mb-4">
                      <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Performance por Canal + Pessoa</h3>
                      <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Resultados por canal+pessoa, responsavel e % da meta individual</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {ghlData.byCanalPessoa
                        .filter(c => c.total >= 3 && c.canal && c.canal !== "Sem canal" && c.pessoa && c.pessoa !== "Sem pessoa")
                        .sort((a, b) => b.total - a.total)
                        .map((c, i) => {
                          const canalLabel = `${c.canal} | ${c.pessoa}`;
                          const raw = [c.contato, c.msgEnviada, c.conexao, c.whatsappObtido, c.reuniaoAgendada, c.reuniaoRealizada, c.propostaEmAnalise, c.vendaFechada];
                          let sum = 0;
                          const acc: number[] = [];
                          for (let j = raw.length - 1; j >= 0; j--) { sum += raw[j]; acc[j] = sum; }
                          const leads = acc[0];
                          const reunioes = acc[4];
                          const vendas = c.vendaFechada;
                          const fat = c.faturamento;
                          const hasVendas = vendas > 0;

                          // Canal config (responsavel + metas)
                          const cfg = canalConfigs.find(cc => cc.canal === canalLabel);
                          const responsavel = cfg?.responsavel || "";
                          const cMeta = { leads: cfg?.meta_leads || 0, reunioes: cfg?.meta_reunioes || 0, vendas: cfg?.meta_vendas || 0, fat: cfg?.meta_faturamento || 0 };
                          const hasMeta = cMeta.leads > 0 || cMeta.vendas > 0;

                          // Metas por canal
                          const metaItems = [
                            { label: "Leads", real: leads, meta: cMeta.leads, color: "bg-sky-400 dark:bg-sky-500" },
                            { label: "Reunioes", real: reunioes, meta: cMeta.reunioes, color: "bg-amber-400 dark:bg-amber-500" },
                            { label: "Vendas", real: vendas, meta: cMeta.vendas, color: "bg-emerald-500 dark:bg-emerald-400" },
                          ];

                          return (
                            <div key={i} className={cn(
                              "rounded-xl border p-4 transition-all duration-200 hover:shadow-hover",
                              hasVendas
                                ? "bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-500/5 dark:to-card border-emerald-200/60 dark:border-emerald-500/20"
                                : "bg-white dark:bg-card border-steel-100 dark:border-border"
                            )}>
                              {/* Header */}
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-body font-bold text-navy-900 dark:text-foreground">{c.canal} <span className="text-steel-400 dark:text-muted-foreground font-normal">| {c.pessoa}</span></h4>
                                {hasVendas && (
                                  <span className="text-[10px] font-body font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                    {vendas} {vendas === 1 ? "venda" : "vendas"}
                                  </span>
                                )}
                              </div>
                              {/* Responsavel */}
                              {responsavel && (
                                <p className="text-[10px] font-body text-sky-600 dark:text-sky-400 font-semibold mb-3">
                                  {responsavel}
                                </p>
                              )}
                              {!responsavel && <div className="mb-3" />}

                              {/* Metrics with meta bars */}
                              <div className="space-y-3 mb-3">
                                {metaItems.map((m, mi) => {
                                  const pct = m.meta > 0 ? Math.min((m.real / m.meta) * 100, 100) : 0;
                                  return (
                                    <div key={mi}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">{m.label}</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-sm font-display font-bold text-navy-900 dark:text-foreground tabular-nums">{m.real.toLocaleString()}</span>
                                          {m.meta > 0 && (
                                            <span className={cn("text-[10px] font-body font-bold px-1 py-0.5 rounded",
                                              pct >= 100 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                              pct >= 50 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                              "bg-steel-100 dark:bg-secondary text-steel-500 dark:text-muted-foreground"
                                            )}>
                                              {pct.toFixed(0)}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {m.meta > 0 && (
                                        <div className="h-1.5 bg-steel-100 dark:bg-secondary rounded-full overflow-hidden">
                                          <div className={cn("h-full rounded-full transition-all duration-500", m.color)} style={{ width: `${pct}%` }} />
                                        </div>
                                      )}
                                      {m.meta > 0 && (
                                        <p className="text-[9px] font-body text-steel-400 dark:text-muted-foreground mt-0.5">Meta: {m.label === "Vendas" ? m.meta : m.meta.toLocaleString()}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Faturamento */}
                              <div className="pt-3 border-t border-steel-100/60 dark:border-border/40">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Faturamento</span>
                                  <p className={cn("text-sm font-display font-bold tabular-nums", fat > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-steel-300 dark:text-muted-foreground/30")}>
                                    {fat > 0 ? formatCurrency(fat) : "-"}
                                  </p>
                                </div>
                                {cMeta.fat > 0 && (
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-[9px] font-body text-steel-400 dark:text-muted-foreground">Meta: {formatCurrency(cMeta.fat)}</span>
                                    <span className={cn("text-[10px] font-body font-bold",
                                      fat >= cMeta.fat ? "text-emerald-600 dark:text-emerald-400" :
                                      fat >= cMeta.fat * 0.5 ? "text-amber-600 dark:text-amber-400" :
                                      "text-steel-400 dark:text-muted-foreground"
                                    )}>{(cMeta.fat > 0 ? (fat / cMeta.fat) * 100 : 0).toFixed(0)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Detalhamento por Canal */}
                {ghlData && ghlData.byCanal.length > 0 && (
                  <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-3">
                    <div className="px-5 py-4 border-b border-steel-100 dark:border-border">
                      <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Detalhamento por Canal</h3>
                      <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Leads acumulados por etapa em cada canal</p>
                    </div>
                    <div className="overflow-x-auto bp-scroll">
                      {(() => {
                        const STAGE_LABELS = ["Contato", "Msg Env.", "Conexao", "WhatsApp", "Reun. Ag.", "Reun. Re.", "Proposta", "Venda"];
                        const STAGE_KEYS: (keyof typeof ghlData.byCanal[0])[] = ["contato", "msgEnviada", "conexao", "whatsappObtido", "reuniaoAgendada", "reuniaoRealizada", "propostaEmAnalise", "vendaFechada"];

                        const canais = ghlData.byCanal
                          .filter(c => c.total >= 3)
                          .sort((a, b) => b.total - a.total);

                        return (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
                                <th className="px-3 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Canal</th>
                                {STAGE_LABELS.map(l => (
                                  <th key={l} className="px-3 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">{l}</th>
                                ))}
                                <th className="px-3 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Fat.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {canais.map((c, i) => {
                                const rawVals = STAGE_KEYS.map(k => c[k] as number);
                                const rowAcc: number[] = [];
                                let rowSum = 0;
                                for (let j = rawVals.length - 1; j >= 0; j--) { rowSum += rawVals[j]; rowAcc[j] = rowSum; }
                                return (
                                  <tr key={i} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors">
                                    <td className="px-3 py-2.5 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{c.canal}</td>
                                    {rowAcc.map((val, si) => (
                                      <td key={si} className="px-3 py-2.5 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">
                                        {val > 0 ? val.toLocaleString() : <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2.5 text-right font-body text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                      {c.faturamento > 0 ? formatCurrency(c.faturamento) : <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              {(() => {
                                const totVals = STAGE_KEYS.map(k => canais.reduce((s, c) => s + (c[k] as number), 0));
                                const totAcc: number[] = [];
                                let totSum = 0;
                                for (let j = totVals.length - 1; j >= 0; j--) { totSum += totVals[j]; totAcc[j] = totSum; }
                                return (
                                  <tr className="border-t-2 border-steel-200 dark:border-border bg-steel-50/30 dark:bg-secondary/20">
                                    <td className="px-3 py-2.5 font-body text-sm font-bold text-navy-900 dark:text-foreground">Total</td>
                                    {totAcc.map((val, si) => (
                                      <td key={si} className="px-3 py-2.5 text-right font-body text-sm font-bold text-navy-900 dark:text-foreground tabular-nums">{val > 0 ? val.toLocaleString() : "-"}</td>
                                    ))}
                                    <td className="px-3 py-2.5 text-right font-body text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                      {formatCurrency(canais.reduce((s, c) => s + c.faturamento, 0))}
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tfoot>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Pacing Chart */}
                <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-5 animate-fade-up delay-3">
                  <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground mb-4">Pacing de Faturamento</h3>
                  <PacingChart diarioData={diarioData} meta={meta.meta_faturamento} daysInMonth={daysInMonth} />
                </div>

              </>
            )}

            {/* ABA CONFIGURACOES */}
            {activeTab === "config" && (
              <ConfigPanel
                consultores={consultores}
                metaMensal={metaMensal}
                mes={mes}
                ghlCanais={ghlData?.byCanalPessoa || []}
                allCanaisHistorico={allCanaisHistorico}
                canalConfigs={canalConfigs}
                onSaved={() => setRefreshKey(k => k + 1)}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

// ---- Config Panel ----
function ConfigPanel({ consultores, metaMensal, mes, ghlCanais, canalConfigs, allCanaisHistorico, onSaved }: {
  consultores: Consultor[]; metaMensal: MetaMensal | null; mes: string; ghlCanais: any[]; canalConfigs: any[]; allCanaisHistorico: { canal: string; pessoa: string }[]; onSaved: () => void;
}) {
  // Canal config
  const [editingCanal, setEditingCanal] = useState<string | null>(null);
  const [canalForm, setCanalForm] = useState({ responsavel: "", setor: "pre_venda", pct_meta: "", meta_leads: "", meta_reunioes: "", meta_vendas: "", meta_faturamento: "" });
  const [savingCanal, setSavingCanal] = useState(false);
  const [deleteCanalConfirm, setDeleteCanalConfirm] = useState<{ canal: string; id: number } | null>(null);

  const handleConfirmDeleteCanal = async () => {
    if (!deleteCanalConfirm) return;
    const { error } = await (supabase as any).from("canal_config").delete().eq("id", deleteCanalConfirm.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success(`Config do canal "${deleteCanalConfirm.canal}" removida`);
    setDeleteCanalConfirm(null);
    onSaved();
  };

  const handleSaveCanal = async (canal: string) => {
    setSavingCanal(true);
    try {
      const data = {
        canal,
        mes,
        responsavel: canalForm.responsavel,
        setor: canalForm.setor,
        pct_meta: parseFloat(canalForm.pct_meta) || 0,
        meta_leads: parseInt(canalForm.meta_leads) || 0,
        meta_reunioes: parseInt(canalForm.meta_reunioes) || 0,
        meta_vendas: parseInt(canalForm.meta_vendas) || 0,
        meta_faturamento: parseFloat(canalForm.meta_faturamento) || 0,
      };
      const existing = canalConfigs.find((cc: any) => cc.canal === canal && cc.mes === mes);
      if (existing) {
        await (supabase as any).from("canal_config").update(data).eq("id", existing.id);
      } else {
        await (supabase as any).from("canal_config").insert(data);
      }
      toast.success(`Canal "${canal}" salvo!`);
      setEditingCanal(null);
      onSaved();
    } catch { toast.error("Erro ao salvar canal"); }
    finally { setSavingCanal(false); }
  };

  const startEditCanal = (canal: string) => {
    const cfg = canalConfigs.find((cc: any) => cc.canal === canal);
    setCanalForm({
      responsavel: cfg?.responsavel || "",
      setor: cfg?.setor || "pre_venda",
      pct_meta: cfg?.pct_meta?.toString() || "",
      meta_leads: cfg?.meta_leads?.toString() || "",
      meta_reunioes: cfg?.meta_reunioes?.toString() || "",
      meta_vendas: cfg?.meta_vendas?.toString() || "",
      meta_faturamento: cfg?.meta_faturamento?.toString() || "",
    });
    setEditingCanal(canal);
  };
  // Add consultor form
  const [novoNome, setNovoNome] = useState("");
  const [novoSetor, setNovoSetor] = useState<"pre_venda" | "vendas">("pre_venda");
  const [novoPctMeta, setNovoPctMeta] = useState("");
  const [novoMetaLeads, setNovoMetaLeads] = useState("");
  const [novoMetaAg, setNovoMetaAg] = useState("");
  const [novoMetaReun, setNovoMetaReun] = useState("");
  const [novoMetaVendas, setNovoMetaVendas] = useState("");
  const [novoMetaFat, setNovoMetaFat] = useState("");
  const [saving, setSaving] = useState(false);

  // Meta mensal form
  const [autoCalc, setAutoCalc] = useState(true);
  const [mVendas, setMVendas] = useState(metaMensal?.meta_vendas?.toString() || "");
  const [mFat, setMFat] = useState(metaMensal?.meta_faturamento?.toString() || "");
  // Auto mode: taxas
  const [taxaContatoAgend, setTaxaContatoAgend] = useState("3");
  const [taxaNoShow, setTaxaNoShow] = useState("30");
  const [taxaReunVenda, setTaxaReunVenda] = useState("25");
  // Manual mode: metas manuais
  const [manualContatos, setManualContatos] = useState(metaMensal?.meta_leads?.toString() || "");
  const [manualAgendamentos, setManualAgendamentos] = useState(metaMensal?.meta_agendamentos?.toString() || "");
  const [manualReunRealizadas, setManualReunRealizadas] = useState("");

  // Calculated metas (auto mode)
  const calcMetas = useMemo(() => {
    const vendas = parseInt(mVendas) || 0;
    const tReunVenda = parseFloat(taxaReunVenda) || 1;
    const tNoShow = parseFloat(taxaNoShow) || 0;
    const tContatoAgend = parseFloat(taxaContatoAgend) || 1;

    if (vendas === 0) return { reunRealizadas: 0, agendamentos: 0, contatos: 0 };

    const reunRealizadas = Math.ceil(vendas / (tReunVenda / 100));
    const agendamentos = Math.ceil(reunRealizadas / (1 - tNoShow / 100));
    const contatos = Math.ceil(agendamentos / (tContatoAgend / 100));

    return { reunRealizadas, agendamentos, contatos };
  }, [mVendas, taxaContatoAgend, taxaNoShow, taxaReunVenda]);

  // Final metas (respects toggle)
  const finalMetas = useMemo(() => {
    if (autoCalc) {
      return { contatos: calcMetas.contatos, agendamentos: calcMetas.agendamentos, reunRealizadas: calcMetas.reunRealizadas };
    }
    return {
      contatos: parseInt(manualContatos) || 0,
      agendamentos: parseInt(manualAgendamentos) || 0,
      reunRealizadas: parseInt(manualReunRealizadas) || 0,
    };
  }, [autoCalc, calcMetas, manualContatos, manualAgendamentos, manualReunRealizadas]);

  const [savingMeta, setSavingMeta] = useState(false);

  // Edit consultor
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editSetor, setEditSetor] = useState<"pre_venda" | "vendas">("pre_venda");
  const [editPctMeta, setEditPctMeta] = useState("");
  const [editMetaLeads, setEditMetaLeads] = useState("");
  const [editMetaAg, setEditMetaAg] = useState("");
  const [editMetaReun, setEditMetaReun] = useState("");
  const [editMetaVendas, setEditMetaVendas] = useState("");
  const [editMetaFat, setEditMetaFat] = useState("");

  const handleAddConsultor = async () => {
    if (!novoNome.trim()) { toast.error("Nome obrigatorio"); return; }
    setSaving(true);
    try {
      const insertData: any = {
        nome: novoNome.trim(),
        meta_leads: parseInt(novoMetaLeads) || 0,
        meta_agendamentos: parseInt(novoMetaAg) || 0,
        meta_vendas: parseInt(novoMetaVendas) || 0,
        meta_faturamento: parseFloat(novoMetaFat) || 0,
      };
      // Only include columns that exist in the table (avoid 400 errors)
      if (novoSetor && novoSetor !== "pre_venda") insertData.setor = novoSetor;
      if (novoPctMeta && parseFloat(novoPctMeta) > 0) insertData.pct_meta = parseFloat(novoPctMeta);
      if (novoMetaReun && parseInt(novoMetaReun) > 0) insertData.meta_reunioes_realizadas = parseInt(novoMetaReun);
      const { error } = await (supabase as any).from('comercial_consultores').insert(insertData);
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
      toast.success("Consultor adicionado!");
      setNovoNome(""); setNovoSetor("pre_venda"); setNovoPctMeta(""); setNovoMetaLeads(""); setNovoMetaAg(""); setNovoMetaReun(""); setNovoMetaVendas(""); setNovoMetaFat("");
      onSaved();
    } catch { toast.error("Erro ao adicionar"); }
    finally { setSaving(false); }
  };

  const handleDeleteConsultor = async (id: string, nome: string) => {
    if (!window.confirm(`Excluir consultor "${nome}" e todos os registros dele?`)) return;
    await (supabase as any).from('comercial_diario').delete().eq('consultor_id', id);
    const { error } = await (supabase as any).from('comercial_consultores').delete().eq('id', id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Consultor excluido");
    onSaved();
  };

  const handleStartEdit = (c: Consultor) => {
    setEditId(c.id);
    setEditNome(c.nome);
    setEditSetor(c.setor || "pre_venda");
    setEditPctMeta((c.pct_meta || 0).toString());
    setEditMetaLeads(c.meta_leads.toString());
    setEditMetaAg(c.meta_agendamentos.toString());
    setEditMetaReun((c.meta_reunioes_realizadas || 0).toString());
    setEditMetaVendas(c.meta_vendas.toString());
    setEditMetaFat(c.meta_faturamento.toString());
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    const updateData: any = {
      nome: editNome.trim(),
      meta_leads: parseInt(editMetaLeads) || 0,
      meta_agendamentos: parseInt(editMetaAg) || 0,
      meta_vendas: parseInt(editMetaVendas) || 0,
      meta_faturamento: parseFloat(editMetaFat) || 0,
    };
    if (editSetor && editSetor !== "pre_venda") updateData.setor = editSetor;
    if (editPctMeta && parseFloat(editPctMeta) > 0) updateData.pct_meta = parseFloat(editPctMeta);
    if (editMetaReun && parseInt(editMetaReun) > 0) updateData.meta_reunioes_realizadas = parseInt(editMetaReun);
    const { error } = await (supabase as any).from('comercial_consultores').update(updateData).eq('id', editId);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Consultor atualizado");
    setEditId(null);
    onSaved();
  };

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    try {
      const { error } = await (supabase as any).from('comercial_metas').upsert({
        mes,
        meta_leads: finalMetas.contatos,
        meta_agendamentos: finalMetas.agendamentos,
        meta_vendas: parseInt(mVendas) || 0,
        meta_faturamento: parseFloat(mFat) || 0,
      }, { onConflict: 'mes' });
      if (error) throw error;
      toast.success("Meta mensal salva!");
      onSaved();
    } catch { toast.error("Erro ao salvar meta"); }
    finally { setSavingMeta(false); }
  };

  return (
    <div className="space-y-6">
      {/* Simulador de Metas */}
      <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-1">
        <div className="px-5 py-4 border-b border-steel-100 dark:border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Simulador de Metas - {mes}</h3>
            <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">
              {autoCalc ? "Calculo automatico a partir das taxas de conversao" : "Defina cada meta manualmente"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-body font-semibold", autoCalc ? "text-sky-600 dark:text-sky-400" : "text-violet-600 dark:text-violet-400")}>
              {autoCalc ? "Automatico" : "Manual"}
            </span>
            <button
              onClick={() => setAutoCalc(!autoCalc)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                autoCalc ? "bg-sky-500" : "bg-violet-500"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow",
                autoCalc ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {/* Sempre visível: Meta de Vendas e Faturamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Meta de Vendas</Label>
              <Input type="number" value={mVendas} onChange={e => setMVendas(e.target.value)} placeholder="10" className="h-9 text-sm font-body" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Meta Faturamento (R$)</Label>
              <Input type="number" value={mFat} onChange={e => setMFat(e.target.value)} placeholder="600000" className="h-9 text-sm font-body" />
            </div>
          </div>

          {/* Modo Automático: taxas de conversão */}
          {autoCalc && (
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">Taxas de Conversao</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Tx Contato - Vendas %</Label>
                  <Input type="number" step="0.1" value={taxaContatoAgend} onChange={e => setTaxaContatoAgend(e.target.value)} placeholder="3" className="h-9 text-sm font-body" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Tx No-Show %</Label>
                  <Input type="number" step="0.1" value={taxaNoShow} onChange={e => setTaxaNoShow(e.target.value)} placeholder="30" className="h-9 text-sm font-body" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Tx Reuniao - Venda %</Label>
                  <Input type="number" step="0.1" value={taxaReunVenda} onChange={e => setTaxaReunVenda(e.target.value)} placeholder="25" className="h-9 text-sm font-body" />
                </div>
              </div>
            </div>
          )}

          {/* Modo Manual: inputs diretos */}
          {!autoCalc && (
            <div>
              <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">Metas Manuais</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Meta Contatos</Label>
                  <Input type="number" value={manualContatos} onChange={e => setManualContatos(e.target.value)} placeholder="0" className="h-9 text-sm font-body" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Meta Agendamentos</Label>
                  <Input type="number" value={manualAgendamentos} onChange={e => setManualAgendamentos(e.target.value)} placeholder="0" className="h-9 text-sm font-body" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">Meta Reun. Realizadas</Label>
                  <Input type="number" value={manualReunRealizadas} onChange={e => setManualReunRealizadas(e.target.value)} placeholder="0" className="h-9 text-sm font-body" />
                </div>
              </div>
            </div>
          )}

          {/* Resultado das metas */}
          {(parseInt(mVendas) > 0 || !autoCalc) && (finalMetas.contatos > 0 || finalMetas.agendamentos > 0 || finalMetas.reunRealizadas > 0 || parseInt(mVendas) > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Meta Contatos", value: finalMetas.contatos, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10" },
                { label: "Meta Agendamentos", value: finalMetas.agendamentos, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                { label: "Meta Reun. Realizadas", value: finalMetas.reunRealizadas, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
                { label: "Meta Vendas", value: parseInt(mVendas) || 0, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
              ].map(m => (
                <div key={m.label} className={cn("rounded-lg p-3 text-center", m.bg)}>
                  <p className={cn("text-[9px] font-body font-semibold uppercase tracking-wider mb-1", m.color)}>{m.label}</p>
                  <p className="text-2xl font-display font-bold text-navy-900 dark:text-foreground tabular-nums">{m.value.toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <Button onClick={handleSaveMeta} disabled={savingMeta || !mVendas} className="bg-navy-900 hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-body text-xs gap-1.5">
              {savingMeta ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Salvar Metas do Mes
            </Button>
          </div>
        </div>
      </div>

      {/* Configuracao de Canais */}
      <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-3">
        <div className="px-5 py-4 border-b border-steel-100 dark:border-border">
          <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Canais — Responsavel e Metas</h3>
          <p className="text-xs font-body text-steel-400 dark:text-muted-foreground mt-0.5">Atribua um responsavel e defina metas individuais por canal</p>
        </div>
        <div className="overflow-x-auto bp-scroll">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
                <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Canal</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Responsavel</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Setor</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">% Meta</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Meta Leads</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Meta Reun.</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Meta Vendas</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Meta Fat.</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Get ALL historical canal+pessoa combinations from database
                const allCanals = new Set<string>();
                allCanaisHistorico.forEach(c => {
                  allCanals.add(`${c.canal} | ${c.pessoa}`);
                });
                // Also include any existing configs that ARE valid (canal | pessoa format)
                canalConfigs.forEach((cc: any) => {
                  const key = (cc.canal || "").trim();
                  if (key && key.includes(" | ") && !key.includes("Sem canal") && !key.includes("Sem pessoa")) {
                    allCanals.add(key);
                  }
                });
                return Array.from(allCanals).sort().map(canal => {
                  const cfg = canalConfigs.find((cc: any) => cc.canal === canal);
                  const isEditing = editingCanal === canal;

                  if (isEditing) {
                    return (
                      <tr key={canal} className="border-b border-steel-50 dark:border-border/50 bg-sky-50/30 dark:bg-secondary/30">
                        <td className="px-4 py-2 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{canal}</td>
                        <td className="px-4 py-2"><Input value={canalForm.responsavel} onChange={e => setCanalForm({ ...canalForm, responsavel: e.target.value })} placeholder="Nome" className="h-8 text-xs font-body" /></td>
                        <td className="px-4 py-2">
                          <Select value={canalForm.setor} onValueChange={v => setCanalForm({ ...canalForm, setor: v })}>
                            <SelectTrigger className="h-8 text-xs font-body"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pre_venda">Pre Venda</SelectItem>
                              <SelectItem value="vendas">Vendas</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-2"><Input type="number" value={canalForm.pct_meta} onChange={e => setCanalForm({ ...canalForm, pct_meta: e.target.value })} placeholder="0" className="h-8 text-xs font-body text-right w-16" /></td>
                        <td className="px-4 py-2"><Input type="number" value={canalForm.meta_leads} onChange={e => setCanalForm({ ...canalForm, meta_leads: e.target.value })} placeholder="0" className="h-8 text-xs font-body text-right w-20" /></td>
                        <td className="px-4 py-2"><Input type="number" value={canalForm.meta_reunioes} onChange={e => setCanalForm({ ...canalForm, meta_reunioes: e.target.value })} placeholder="0" className="h-8 text-xs font-body text-right w-20" /></td>
                        <td className="px-4 py-2"><Input type="number" value={canalForm.meta_vendas} onChange={e => setCanalForm({ ...canalForm, meta_vendas: e.target.value })} placeholder="0" className="h-8 text-xs font-body text-right w-20" /></td>
                        <td className="px-4 py-2"><Input type="number" value={canalForm.meta_faturamento} onChange={e => setCanalForm({ ...canalForm, meta_faturamento: e.target.value })} placeholder="0" className="h-8 text-xs font-body text-right w-24" /></td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleSaveCanal(canal)} disabled={savingCanal} className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                              {savingCanal ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingCanal(null)} className="h-7 px-2 text-xs text-steel-400">Cancelar</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={canal} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors group">
                      <td className="px-4 py-3 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{canal}</td>
                      <td className="px-4 py-3 font-body text-sm text-sky-600 dark:text-sky-400 font-semibold">{cfg?.responsavel || <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}</td>
                      <td className="px-4 py-3 text-center">
                        {cfg?.setor ? (
                          <span className={cn("text-[10px] font-body font-bold px-2 py-0.5 rounded", cfg.setor === "pre_venda" ? "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}>
                            {cfg.setor === "pre_venda" ? "PV" : "V"}
                          </span>
                        ) : <span className="text-steel-300 dark:text-muted-foreground/30 text-[10px]">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-body text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">{cfg?.pct_meta ? `${cfg.pct_meta}%` : <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}</td>
                      <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{cfg?.meta_leads || <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}</td>
                      <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{cfg?.meta_reunioes || <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}</td>
                      <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{cfg?.meta_vendas || <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}</td>
                      <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{cfg?.meta_faturamento ? formatCurrency(cfg.meta_faturamento) : <span className="text-steel-300 dark:text-muted-foreground/30">-</span>}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="sm" onClick={() => startEditCanal(canal)} className="h-7 w-7 p-0 text-steel-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {cfg && (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteCanalConfirm({ canal, id: cfg.id })} className="h-7 w-7 p-0 text-steel-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCanalConfirm} onOpenChange={(o) => !o && setDeleteCanalConfirm(null)}>
        <AlertDialogContent className="bg-white dark:bg-card border-steel-100 dark:border-border">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-center font-display text-lg">Excluir configuracao?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-body text-sm">
              Tem certeza que deseja excluir a configuracao do canal <span className="font-semibold text-navy-900 dark:text-foreground">{deleteCanalConfirm?.canal}</span>?
              <br />
              <span className="text-[11px] text-steel-400 dark:text-muted-foreground mt-1 block">Essa acao nao pode ser desfeita. As metas e responsavel serao removidos.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="font-body text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteCanal} className="bg-red-500 hover:bg-red-600 text-white font-body text-xs">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Comercial;
