import { useState, useMemo, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useTenant } from "@/context/TenantContext";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, LayoutGrid, BarChart3, Settings, CheckSquare } from "lucide-react";
import {
  usePanelStructure, usePanelChecks, useToggleCheck, useRealizado,
  periodKey, type Freq, type Role, type PanelChannel, type PanelMember,
} from "@/hooks/usePanelData";
import { Avatar, Card, EmptyState, LAYER_COLOR, Label, SectionTitle, Segmented, brl, nf } from "@/components/painel/shared";
import MinhaVisao from "@/components/painel/MinhaVisao";
import Cumprimento from "@/components/painel/Cumprimento";
import CanaisView from "@/components/painel/Canais";
import Configurar from "@/components/painel/Configurar";

type View = "minha" | "cumprimento" | "canais" | "time" | "config";

export default function Painel() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { toast } = useToast();
  const locationId = tenant.ghlLocationId;

  const [view, setView] = useState<View>("minha");
  const [freq, setFreq] = useState<Freq>("d");
  const [meId, setMeId] = useState(() => localStorage.getItem("panel-me") ?? "");
  const [viewAs, setViewAs] = useState("");
  const [channelDetail, setChannelDetail] = useState<string | null>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const structure = usePanelStructure(locationId);
  // busca as três janelas de uma vez: o cumprimento compara dia, semana e mês
  const keys = useMemo(() => [periodKey("d"), periodKey("s"), periodKey("m")], []);
  const checks = usePanelChecks(locationId, keys);
  const toggle = useToggleCheck(locationId);

  const members = structure.data?.members ?? [];
  const channels = structure.data?.channels ?? [];
  const roles = structure.data?.roles ?? [];
  const tasks = structure.data?.tasks ?? [];
  const quotas = structure.data?.quotas ?? [];

  useEffect(() => {
    if (meId || !members.length) return;
    const byProfile = members.find((m: any) => m.profile_id && m.profile_id === user?.id);
    if (byProfile) setMeId(byProfile.id);
  }, [members, user, meId]);
  useEffect(() => { if (meId) localStorage.setItem("panel-me", meId); }, [meId]);

  const me = members.find((m) => m.id === meId);
  const isHead = !!me?.is_head;
  const targetId = isHead && viewAs ? viewAs : meId;
  const target = members.find((m) => m.id === targetId);

  // um Set por (pessoa, item) — o check é do período corrente de cada frequência
  const doneSet = useMemo(() => {
    const s = new Set<string>();
    for (const c of checks.data ?? []) s.add(`${c.member_id}|${c.subject_type}|${c.subject_id}`);
    return s;
  }, [checks.data]);
  const isDoneFor = (memberId: string, t: "task" | "quota", id: string) => doneSet.has(`${memberId}|${t}|${id}`);

  const flip = (memberId: string, t: "task" | "quota", id: string) => {
    toggle.mutate(
      { memberId, subjectType: t, subjectId: id, freq, periodKey: periodKey(freq), done: !isDoneFor(memberId, t, id) },
      { onError: (e: any) => toast({ title: "Não consegui salvar", description: e.message, variant: "destructive" }) }
    );
  };

  /** Canais que a pessoa executa: dono/aux — ou onde tem cota. */
  const groupsFor = (memberId: string) => {
    const own = new Set(roles.filter((r) => r.member_id === memberId && r.role !== "super").map((r) => r.channel_id));
    quotas.filter((q) => q.member_id === memberId).forEach((q) => own.add(q.channel_id));
    return channels
      .filter((c) => own.has(c.id))
      .map((c) => {
        const items = [
          ...(freq === "d"
            ? quotas.filter((q) => q.member_id === memberId && q.channel_id === c.id)
                .map((q) => ({ kind: "quota" as const, id: q.id, title: `Bater a cota — ${q.account}`, target: `${q.per_day}/dia` }))
            : []),
          ...tasks.filter((t) => t.channel_id === c.id && t.freq === freq)
            .map((t) => ({ kind: "task" as const, id: t.id, title: t.title, target: t.target })),
        ];
        const role = (roles.find((r) => r.member_id === memberId && r.channel_id === c.id && r.role !== "super")?.role ?? "dono") as Role;
        return { channel: c, items, role };
      })
      .filter((g) => g.items.length > 0);
  };

  if (structure.isLoading) {
    return (
      <div className="min-h-screen bg-steel-50 dark:bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-steel-400" /></div>
      </div>
    );
  }
  if (structure.error) {
    return (
      <div className="min-h-screen bg-steel-50 dark:bg-background">
        <DashboardHeader />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <Card className="p-6">
            <SectionTitle title="Não consegui carregar o painel" sub={(structure.error as any).message} />
            <Button className="mt-4" onClick={() => structure.refetch()}>Tentar de novo</Button>
          </Card>
        </div>
      </div>
    );
  }

  const NAV: { id: View; label: string; icon: any }[] = [
    { id: "minha", label: "Minha visão", icon: User },
    { id: "canais", label: "Canais", icon: LayoutGrid },
    ...(isHead
      ? [
          { id: "cumprimento" as View, label: "Cumprimento", icon: CheckSquare },
          { id: "time" as View, label: "Time & Metas", icon: BarChart3 },
          { id: "config" as View, label: "Configurar", icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-steel-50 dark:bg-background">
      <DashboardHeader />

      <div className="sticky top-14 z-40 border-b border-steel-100 bg-white/90 backdrop-blur dark:border-border dark:bg-card/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setView(n.id); setChannelDetail(null); }}
                className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-body text-sm font-semibold transition-colors",
                  view === n.id ? "bg-navy-900 text-white dark:bg-secondary dark:text-foreground"
                    : "text-steel-400 hover:text-navy-900 dark:text-muted-foreground dark:hover:text-foreground")}>
                <n.icon className="h-4 w-4" />{n.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Label>Sou</Label>
            <Select value={meId} onValueChange={(v) => { setMeId(v); setViewAs(""); }}>
              <SelectTrigger className="h-8 w-[168px] font-body text-xs"><SelectValue placeholder="Escolha seu nome" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="font-body text-xs">{m.name}{m.is_head ? " · head" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!meId ? (
          <Card className="p-8 text-center">
            <User className="mx-auto mb-3 h-8 w-8 text-steel-300" />
            <SectionTitle title="Escolha seu nome para começar" sub="Cada pessoa vê a própria rotina; os heads acompanham o time inteiro." />
          </Card>
        ) : view === "minha" ? (
          <MinhaVisao
            target={target!} isHead={isHead} members={members} viewAs={viewAs} setViewAs={setViewAs}
            freq={freq} setFreq={setFreq} groups={groupsFor(targetId)}
            supervised={channels.filter((c) => roles.some((r) => r.member_id === targetId && r.channel_id === c.id && r.role === "super"))}
            roles={roles} tasks={tasks} quotas={quotas}
            isDone={(t, id) => isDoneFor(targetId, t, id)}
            flip={(t, id) => flip(targetId, t, id)}
            isDoneFor={isDoneFor}
          />
        ) : view === "cumprimento" ? (
          <Cumprimento freq={freq} setFreq={setFreq} channels={channels} members={members}
            roles={roles} tasks={tasks} quotas={quotas} isDoneFor={isDoneFor} />
        ) : view === "canais" ? (
          <CanaisView locationId={locationId} channels={channels} roles={roles} members={members}
            tasks={tasks} quotas={quotas} detail={channelDetail} setDetail={setChannelDetail}
            freq={freq} setFreq={setFreq} month={month} />
        ) : view === "time" ? (
          <TimeMetas locationId={locationId} month={month} setMonth={setMonth} channels={channels} members={members} />
        ) : (
          <Configurar locationId={locationId} channels={channels} members={members} roles={roles} tasks={tasks} quotas={quotas} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------ time & metas */
function TimeMetas({ locationId, month, setMonth, channels, members }: any) {
  const realizado = useRealizado(locationId, month);
  const months = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 0; i < 8; i++) out.push(new Date(d.getFullYear(), d.getMonth() - i, 1).toISOString().slice(0, 7));
    return out;
  }, []);
  const label = (m: string) => {
    const [y, mm] = m.split("-");
    return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][+mm - 1]}/${y.slice(2)}`;
  };

  const chRows = useMemo(() => {
    if (!realizado.data) return [];
    return channels.map((c: PanelChannel) => ({ c, r: realizado.data!.byChannel.get(c.id) }))
      .filter((x: any) => x.r).sort((a: any, b: any) => b.r.opps - a.r.opps);
  }, [realizado.data, channels]);
  const mbRows = useMemo(() => {
    if (!realizado.data) return [];
    return members.map((m: PanelMember) => ({ m, r: realizado.data!.byMember.get(m.id) }))
      .filter((x: any) => x.r).sort((a: any, b: any) => b.r.opps - a.r.opps);
  }, [realizado.data, members]);
  const totals = useMemo(() => {
    let vendas = 0, fat = 0, reun = 0;
    for (const { r } of chRows) { vendas += r.vendas; fat += r.faturamento; reun += r.reunioes; }
    return { vendas, fat, reun };
  }, [chRows]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle title="Time & Metas" sub="Realizado direto do pipeline, cruzado pelos vínculos do painel" />
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="ml-auto h-8 w-[120px] font-body text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m) => <SelectItem key={m} value={m} className="font-body text-xs">{label(m)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {realizado.isLoading ? (
        <Card className="flex items-center justify-center p-12"><Loader2 className="h-5 w-5 animate-spin text-steel-400" /></Card>
      ) : realizado.error ? (
        <EmptyState>Não consegui carregar o realizado: {(realizado.error as any).message}</EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { l: "Oportunidades", v: nf(realizado.data!.total) },
              { l: "Reuniões", v: nf(totals.reun) },
              { l: "Vendas", v: nf(totals.vendas) },
              { l: "Faturamento", v: brl(totals.fat) },
            ].map((k) => (
              <Card key={k.l} className="p-4">
                <p className="font-mono text-xl font-bold tabular-nums text-navy-900 dark:text-foreground">{k.v}</p>
                <Label>{k.l}</Label>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-steel-50 px-4 py-2.5 dark:border-border/60"><Label>Por canal</Label></div>
            <div className="overflow-x-auto bp-scroll">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-steel-100 bg-steel-50/50 dark:border-border dark:bg-secondary/30">
                    {["Canal", "Oportunidades", "Reuniões", "Propostas", "Vendas", "Faturamento"].map((h, i) => (
                      <th key={h} className={cn("px-3 py-2 font-body text-[10px] font-bold uppercase tracking-wider text-steel-400", i === 0 ? "text-left" : "text-right")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chRows.map(({ c, r }: any) => (
                    <tr key={c.id} className="border-b border-steel-50 last:border-0 dark:border-border/40">
                      <td className="px-3 py-2 font-body text-sm font-semibold text-navy-900 dark:text-foreground">
                        <span className="mr-2 inline-block align-middle"><span className={cn("block h-2 w-2 rounded-sm", LAYER_COLOR[c.layer])} /></span>
                        {c.name}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-navy-900 dark:text-foreground">{nf(r.opps)}</td>
                      <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-steel-500 dark:text-muted-foreground">{nf(r.reunioes)}</td>
                      <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-steel-500 dark:text-muted-foreground">{nf(r.propostas)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={cn("rounded-md px-2 py-0.5 font-mono text-sm font-bold tabular-nums",
                          r.vendas > 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : "bg-steel-50 text-steel-400 dark:bg-secondary dark:text-muted-foreground")}>{r.vendas}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-navy-900 dark:text-foreground">{r.faturamento ? brl(r.faturamento) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-steel-50 px-4 py-2.5 dark:border-border/60"><Label>Por pessoa</Label></div>
            <div className="divide-y divide-steel-50 dark:divide-border/40">
              {mbRows.map(({ m, r }: any) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar member={m} size={22} />
                  <span className="w-24 flex-shrink-0 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{m.name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-steel-100 dark:bg-secondary">
                    <span className={cn("block h-full rounded-full", r.vendas > 0 ? "bg-emerald-500" : "bg-sky-500")}
                      style={{ width: `${(r.opps / (mbRows[0].r.opps || 1)) * 100}%` }} />
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-steel-400 dark:text-muted-foreground">
                    {nf(r.opps)} opps · {r.propostas} prop ·{" "}
                    <b className={r.vendas > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>{r.vendas} venda{r.vendas === 1 ? "" : "s"}</b>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
