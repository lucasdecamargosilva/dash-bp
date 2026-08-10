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
  usePanelStructure, usePanelChecks, useToggleCheck, useRealizado, usePanelGoals,
  periodKey, quotaFreq, quotaQty, FREQ_POR,
  type Freq, type Role, type PanelChannel, type PanelMember,
} from "@/hooks/usePanelData";
import { Avatar, Card, EmptyState, LAYER_COLOR, Label, PeriodNav, SectionTitle, Segmented, brl, nf } from "@/components/painel/shared";
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
  // data de referência: qual dia/semana/mês estamos olhando
  const [refDate, setRefDate] = useState(() => new Date());

  const structure = usePanelStructure(locationId);
  // as três janelas do período de referência — permite olhar semanas e meses passados
  const keys = useMemo(
    () => [periodKey("d", refDate), periodKey("s", refDate), periodKey("m", refDate)],
    [refDate]
  );
  const checks = usePanelChecks(locationId, keys);
  const toggle = useToggleCheck(locationId);

  const members = structure.data?.members ?? [];
  const channels = structure.data?.channels ?? [];
  const roles = structure.data?.roles ?? [];
  const tasks = structure.data?.tasks ?? [];
  const quotas = structure.data?.quotas ?? [];

  // Quem está logado manda. Quando a pessoa está vinculada ao usuário, o
  // seletor "Sou" some — senão qualquer um se identificaria como head.
  const vinculado = useMemo(
    () => members.find((m: any) => m.profile_id && m.profile_id === user?.id),
    [members, user]
  );
  useEffect(() => {
    if (vinculado) { setMeId(vinculado.id); return; }
    if (meId || !members.length) return;
  }, [vinculado, members, meId]);
  useEffect(() => { if (meId) localStorage.setItem("panel-me", meId); }, [meId]);

  const me = members.find((m) => m.id === meId);
  // dois tipos de chefia: head global (administra tudo) e head de canal
  // (acompanha canais especificos). Quem acompanha algum canal ja precisa
  // enxergar o time e cobrar o combinado, mesmo sem ser head global.
  const isHead = !!me?.is_head;
  const supervisesAny = roles.some((r) => r.member_id === meId && r.role === "super");
  const canManage = isHead || supervisesAny;
  const targetId = canManage && viewAs ? viewAs : meId;
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
      { memberId, subjectType: t, subjectId: id, freq, periodKey: periodKey(freq, refDate), done: !isDoneFor(memberId, t, id) },
      { onError: (e: any) => toast({ title: "Não consegui salvar", description: e.message, variant: "destructive" }) }
    );
  };

  /** Canais que a pessoa executa: dono/aux — ou onde tem cota. */
  // Cada pessoa tem duas rotinas possiveis num canal: a de quem opera e a de
  // quem acompanha. Quem acumula os dois papeis (o caso do Oda no Outbound)
  // recebe os dois blocos, por isso um canal pode aparecer duas vezes.
  const groupsFor = (memberId: string) => {
    const opera = new Set(roles.filter((r) => r.member_id === memberId && r.role !== "super").map((r) => r.channel_id));
    quotas.filter((q) => q.member_id === memberId).forEach((q) => opera.add(q.channel_id));
    const acompanha = new Set(roles.filter((r) => r.member_id === memberId && r.role === "super").map((r) => r.channel_id));

    const tarefas = (channelId: string, audience: "operacao" | "head") =>
      tasks
        .filter((t) => t.channel_id === channelId && t.freq === freq && (t.audience ?? "operacao") === audience)
        .map((t) => ({ kind: "task" as const, id: t.id, title: t.title, target: t.target }));

    const out: { channel: PanelChannel; items: any[]; role: Role; audience: "operacao" | "head" }[] = [];
    for (const c of channels.filter((x) => x.active)) {
      if (opera.has(c.id)) {
        const items = [
          ...quotas
            .filter((q) => q.member_id === memberId && q.channel_id === c.id && quotaFreq(q) === freq)
            .map((q) => ({ kind: "quota" as const, id: q.id, title: `Bater a cota — ${q.account}`, target: `${quotaQty(q)}/${FREQ_POR[freq]}` })),
          ...tarefas(c.id, "operacao"),
        ];
        const role = (roles.find((r) => r.member_id === memberId && r.channel_id === c.id && r.role !== "super")?.role ?? "dono") as Role;
        if (items.length) out.push({ channel: c, items, role, audience: "operacao" });
      }
      if (acompanha.has(c.id)) {
        const items = tarefas(c.id, "head");
        if (items.length) out.push({ channel: c, items, role: "super" as Role, audience: "head" });
      }
    }
    return out;
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
    // quem acompanha canal cobra o combinado; só o head global configura
    ...(canManage
      ? [
          { id: "cumprimento" as View, label: "Cumprimento", icon: CheckSquare },
          { id: "time" as View, label: "Time & Metas", icon: BarChart3 },
        ]
      : []),
    ...(isHead ? [{ id: "config" as View, label: "Configurar", icon: Settings }] : []),
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
            {vinculado ? (
              <span className="flex items-center gap-2 rounded-full border border-steel-100 bg-steel-50 py-1 pl-1 pr-3 dark:border-border dark:bg-secondary/40">
                <Avatar member={vinculado} size={22} />
                <span className="font-body text-xs font-semibold text-navy-900 dark:text-foreground">
                  {vinculado.name}{vinculado.is_head ? " · head" : ""}
                </span>
              </span>
            ) : (
              <>
                <Label>Sou</Label>
                <Select value={meId} onValueChange={(v) => { setMeId(v); setViewAs(""); }}>
                  <SelectTrigger className="h-8 w-[168px] font-body text-xs"><SelectValue placeholder="Escolha seu nome" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="font-body text-xs">{m.name}{m.is_head ? " · head" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
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
            target={target!} isHead={canManage} members={members} viewAs={viewAs} setViewAs={setViewAs}
            freq={freq} setFreq={setFreq} refDate={refDate} setRefDate={setRefDate} groups={groupsFor(targetId)}
            supervised={channels.filter((c) => c.active && roles.some((r) => r.member_id === targetId && r.channel_id === c.id && r.role === "super"))}
            roles={roles} tasks={tasks} quotas={quotas}
            isDone={(t, id) => isDoneFor(targetId, t, id)}
            flip={(t, id) => flip(targetId, t, id)}
            isDoneFor={isDoneFor}
          />
        ) : view === "cumprimento" ? (
          <Cumprimento freq={freq} setFreq={setFreq} refDate={refDate} setRefDate={setRefDate} channels={channels} members={members}
            roles={roles} tasks={tasks} quotas={quotas} isDoneFor={isDoneFor} />
        ) : view === "canais" ? (
          <CanaisView locationId={locationId} channels={channels} roles={roles} members={members}
            tasks={tasks} quotas={quotas} detail={channelDetail} setDetail={setChannelDetail}
            freq={freq} setFreq={setFreq} month={month} meId={meId} isHead={isHead} />
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
function TimeMetas({ locationId, channels, members }: any) {
  // A tela navega por dia/semana/mes; a meta continua sendo mensal.
  const [freq, setFreq] = useState<Freq>("m");
  const [refDate, setRefDate] = useState(new Date());
  const compet = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, "0")}`;
  const realizado = useRealizado(locationId, compet, freq, refDate);
  const goals = usePanelGoals(locationId, compet);
  const metaDe = (id: string) => goals.data?.find((g) => g.channel_id === id);

  // Em dia/semana a meta mensal vira ritmo: a fatia proporcional do mes.
  // Linear por dias corridos — nao chuto dias uteis.
  const diasNoMes = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
  const fator = freq === "m" ? 1 : freq === "s" ? 7 / diasNoMes : 1 / diasNoMes;
  const ritmo = (meta?: number | null) => (meta && meta > 0 ? meta * fator : null);

  /** Realizado sobre meta, quando há meta. Devolve null para não inventar %. */
  const pctMeta = (feito: number, meta?: number | null) => {
    const alvo = ritmo(meta);
    return alvo ? Math.round((feito / alvo) * 100) : null;
  };
  const rotuloMeta = (meta?: number | null, dinheiro = false) => {
    const alvo = ritmo(meta);
    if (!alvo) return null;
    const v = dinheiro ? brl(Math.round(alvo)) : nf(Math.max(1, Math.round(alvo)));
    return freq === "m" ? `de ${v}` : `ritmo ${v}`;
  };

  // Sem realizado no mes, a linha ainda precisa existir se o canal tem meta —
  // senao a meta some da tela junto com o canal (foi o caso do Claude: meta de
  // 2.600 contatos invisivel porque o vinculo do source estava solto). O zero
  // e informacao: "combinamos X e nao andou nada".
  const VAZIO = { opps: 0, reunioes: 0, propostas: 0, vendas: 0, faturamento: 0 };
  const chRows = useMemo(() => {
    if (!realizado.data) return [];
    return channels
      .map((c: PanelChannel) => ({ c, r: realizado.data!.byChannel.get(c.id) }))
      .filter((x: any) => x.r || (x.c.active && metaDe(x.c.id)))
      .map((x: any) => ({ ...x, r: x.r ?? VAZIO }))
      .sort((a: any, b: any) => b.r.opps - a.r.opps);
  }, [realizado.data, channels, goals.data]);
  const mbRows = useMemo(() => {
    if (!realizado.data) return [];
    return members.map((m: PanelMember) => ({ m, r: realizado.data!.byMember.get(m.id) }))
      .filter((x: any) => x.r).sort((a: any, b: any) => b.r.opps - a.r.opps);
  }, [realizado.data, members]);
  const totals = useMemo(() => {
    let vendas = 0, fat = 0, reun = 0, opps = 0;
    for (const { r } of chRows) { vendas += r.vendas; fat += r.faturamento; reun += r.reunioes; opps += r.opps; }
    return { vendas, fat, reun, opps };
  }, [chRows]);
  // soma das metas dos canais ativos — o denominador dos cartoes de progresso
  const somaMetas = useMemo(() => {
    const a = { contatos: 0, reunioes: 0, vendas: 0, faturamento: 0 };
    for (const c of channels as PanelChannel[]) {
      if (!c.active) continue;
      const g = goals.data?.find((x) => x.channel_id === c.id);
      if (!g) continue;
      a.contatos += g.contatos ?? 0; a.reunioes += g.reunioes ?? 0;
      a.vendas += g.vendas ?? 0; a.faturamento += (g as any).faturamento ?? 0;
    }
    return a;
  }, [channels, goals.data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle title="Time & Metas" sub="Realizado direto do pipeline, cruzado pelos vínculos do painel" />
        <div className="ml-auto">
          <PeriodNav freq={freq} setFreq={setFreq} refDate={refDate} setRef={setRefDate} />
        </div>
      </div>

      {realizado.isLoading ? (
        <Card className="flex items-center justify-center p-12"><Loader2 className="h-5 w-5 animate-spin text-steel-400" /></Card>
      ) : realizado.error ? (
        <EmptyState>Não consegui carregar o realizado: {(realizado.error as any).message}</EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: "Contatos", v: nf(totals.opps), feito: totals.opps, meta: somaMetas.contatos, dinheiro: false },
              { l: "Reuniões", v: nf(totals.reun), feito: totals.reun, meta: somaMetas.reunioes, dinheiro: false },
              { l: "Vendas", v: nf(totals.vendas), feito: totals.vendas, meta: somaMetas.vendas, dinheiro: false },
              { l: "Faturamento", v: brl(totals.fat), feito: totals.fat, meta: somaMetas.faturamento, dinheiro: true },
            ].map((k) => {
              const p = pctMeta(k.feito, k.meta);
              const rot = rotuloMeta(k.meta, k.dinheiro);
              const cor = p === null ? "bg-steel-300"
                : p >= 100 ? "bg-emerald-500" : p >= 60 ? "bg-amber-500" : "bg-red-500";
              return (
              <Card key={k.l} className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-xl font-bold tabular-nums text-navy-900 dark:text-foreground">{k.v}</p>
                  {p !== null && (
                    <span className={cn("font-mono text-sm font-bold tabular-nums",
                      p >= 100 ? "text-emerald-600 dark:text-emerald-400" : p >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                      {p}%
                    </span>
                  )}
                </div>
                <Label>{k.l}{rot ? ` · ${rot}` : ""}</Label>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-steel-100 dark:bg-secondary">
                  <span className={cn("block h-full rounded-full transition-all", cor)}
                    style={{ width: `${Math.min(100, p ?? 0)}%` }} />
                </span>
              </Card>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-steel-50 px-4 py-2.5 dark:border-border/60"><Label>Por canal</Label></div>
            <div className="overflow-x-auto bp-scroll">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-steel-100 bg-steel-50/50 dark:border-border dark:bg-secondary/30">
                    {["Canal", "Contatos", "Reuniões", "Propostas", "Vendas", "Faturamento"].map((h, i) => (
                      <th key={h} className={cn("px-3 py-2 font-body text-[10px] font-bold uppercase tracking-wider text-steel-400", i === 0 ? "text-left" : "text-right")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chRows.map(({ c, r }: any) => {
                    const g = metaDe(c.id);
                    // celula = realizado em cima, meta embaixo; a cor diz se bateu
                    const cel = (feito: number, meta?: number | null) => {
                      const p = pctMeta(feito, meta);
                      return (
                        <td className="px-3 py-1.5 text-right">
                          <span className={cn("block font-mono text-sm font-semibold tabular-nums",
                            p === null ? "text-navy-900 dark:text-foreground"
                              : p >= 100 ? "text-emerald-600 dark:text-emerald-400"
                                : p >= 60 ? "text-amber-600 dark:text-amber-400" : "text-steel-500 dark:text-muted-foreground")}>
                            {nf(feito)}
                          </span>
                          {meta ? <span className="block font-mono text-[10px] tabular-nums text-steel-300">{rotuloMeta(meta)}{p !== null && ` · ${p}%`}</span> : null}
                        </td>
                      );
                    };
                    return (
                      <tr key={c.id} className="border-b border-steel-50 last:border-0 dark:border-border/40">
                        <td className="px-3 py-1.5 font-body text-sm font-semibold text-navy-900 dark:text-foreground">
                          <span className="mr-2 inline-block align-middle"><span className={cn("block h-2 w-2 rounded-sm", LAYER_COLOR[c.layer])} /></span>
                          {c.name}
                        </td>
                        {cel(r.opps, g?.contatos)}
                        {cel(r.reunioes, g?.reunioes)}
                        {cel(r.propostas, g?.propostas)}
                        {cel(r.vendas, g?.vendas)}
                        <td className="px-3 py-1.5 text-right">
                          {(() => {
                            const metaFat = (g as any)?.faturamento;
                            const p = pctMeta(r.faturamento, metaFat);
                            return (
                              <>
                                <span className={cn("block font-mono text-sm font-semibold tabular-nums",
                                  p === null ? "text-navy-900 dark:text-foreground"
                                    : p >= 100 ? "text-emerald-600 dark:text-emerald-400"
                                      : p >= 60 ? "text-amber-600 dark:text-amber-400" : "text-steel-500 dark:text-muted-foreground")}>
                                  {r.faturamento ? brl(r.faturamento) : "—"}
                                </span>
                                {metaFat ? <span className="block font-mono text-[10px] tabular-nums text-steel-300">{rotuloMeta(metaFat, true)}{p !== null && ` · ${p}%`}</span> : null}
                              </>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
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
