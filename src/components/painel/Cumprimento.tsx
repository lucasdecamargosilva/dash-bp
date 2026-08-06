import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FREQ_LABEL, quotaFreq, type Freq, type PanelChannel, type PanelMember } from "@/hooks/usePanelData";
import { Avatar, Card, EmptyState, LAYER_COLOR, PeriodNav, Progress, SectionTitle, Segmented, Label, nf } from "./shared";

/**
 * Quem cumpriu o quê. A pergunta que o head faz na reunião de segunda:
 * "o combinado do dia/semana/mês foi feito?" — vista por canal e por pessoa.
 */
export default function Cumprimento({
  freq, setFreq, refDate, setRefDate, channels, members, roles, tasks, quotas, isDoneFor,
}: {
  freq: Freq;
  setFreq: (f: Freq) => void;
  refDate: Date;
  setRefDate: (d: Date) => void;
  channels: PanelChannel[];
  members: PanelMember[];
  roles: any[];
  tasks: any[];
  quotas: any[];
  isDoneFor: (memberId: string, k: "task" | "quota", id: string) => boolean;
}) {
  const [by, setBy] = useState<"canal" | "pessoa">("canal");

  /** Itens que cada pessoa deve nesse canal, numa frequência. */
  const itemsIn = (memberId: string, channelId: string, f: Freq) => [
    ...quotas
      .filter((q: any) => q.member_id === memberId && q.channel_id === channelId && quotaFreq(q) === f)
      .map((q: any) => ({ k: "quota" as const, id: q.id })),
    ...tasks.filter((t: any) => t.channel_id === channelId && t.freq === f).map((t: any) => ({ k: "task" as const, id: t.id })),
  ];
  const itemsFor = (memberId: string, channelId: string) => itemsIn(memberId, channelId, freq);

  const ativo = (channelId: string) => channels.find((c) => c.id === channelId)?.active !== false;

  /** Uma linha por (pessoa, canal) — a unidade real de responsabilidade. */
  const cellsIn = (f: Freq) => {
    const out: { memberId: string; channelId: string; done: number; total: number }[] = [];
    const add = (memberId: string, channelId: string) => {
      const its = itemsIn(memberId, channelId, f);
      if (!its.length) return;
      out.push({
        memberId, channelId,
        done: its.filter((i) => isDoneFor(memberId, i.k, i.id)).length,
        total: its.length,
      });
    };
    for (const r of roles) {
      if (r.role === "super" || !ativo(r.channel_id)) continue;
      add(r.member_id, r.channel_id);
    }
    // cotas em canal onde a pessoa não tem papel formal também contam
    for (const q of quotas) {
      if (quotaFreq(q) !== f || !ativo(q.channel_id)) continue;
      if (out.some((c) => c.memberId === q.member_id && c.channelId === q.channel_id)) continue;
      add(q.member_id, q.channel_id);
    }
    return out;
  };

  const cells = useMemo(() => cellsIn(freq), [roles, quotas, tasks, freq, isDoneFor]);

  const geral = cells.reduce((a, c) => ({ done: a.done + c.done, total: a.total + c.total }), { done: 0, total: 0 });

  // As tres frequencias lado a lado. Os checks dos tres periodos ja vem
  // carregados, entao isso nao custa requisicao nenhuma.
  const resumo = useMemo(
    () => (["d", "s", "m"] as Freq[]).map((f) => {
      const t = cellsIn(f).reduce((a, c) => ({ done: a.done + c.done, total: a.total + c.total }), { done: 0, total: 0 });
      return { freq: f, ...t, pct: t.total ? Math.round((t.done / t.total) * 100) : null };
    }),
    [roles, quotas, tasks, isDoneFor]
  );

  const grouped = useMemo(() => {
    const key = by === "canal" ? "channelId" : "memberId";
    const map = new Map<string, { done: number; total: number; cells: typeof cells }>();
    for (const c of cells) {
      const k = c[key as "channelId" | "memberId"];
      const g = map.get(k) ?? { done: 0, total: 0, cells: [] };
      g.done += c.done; g.total += c.total; g.cells.push(c);
      map.set(k, g);
    }
    return [...map.entries()].sort((a, b) => {
      const pa = a[1].total ? a[1].done / a[1].total : 0;
      const pb = b[1].total ? b[1].done / b[1].total : 0;
      return pa - pb; // pior primeiro: é onde o head precisa agir
    });
  }, [cells, by]);

  const nameOf = (id: string) =>
    by === "canal" ? channels.find((c) => c.id === id)?.name ?? "—" : members.find((m) => m.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle title="Cumprimento" sub="O que foi combinado × o que foi feito — pior primeiro" />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Segmented<"canal"|"pessoa"> value={by} onChange={setBy} options={[{ id: "canal" as const, label: "Por canal" }, { id: "pessoa" as const, label: "Por pessoa" }]} />
          <PeriodNav freq={freq} setFreq={setFreq} refDate={refDate} setRef={setRefDate} />
        </div>
      </div>

      {/* as tres frequencias de uma vez — e clicar troca a lista de baixo */}
      <div className="grid gap-3 sm:grid-cols-3">
        {resumo.map((r) => {
          const ativa = r.freq === freq;
          const cor = r.pct === null ? "text-steel-300"
            : r.pct >= 80 ? "text-emerald-600 dark:text-emerald-400"
            : r.pct >= 50 ? "text-amber-600 dark:text-amber-400"
            : "text-red-600 dark:text-red-400";
          return (
            <button key={r.freq} onClick={() => setFreq(r.freq)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left shadow-card transition-colors dark:bg-card",
                ativa ? "border-sky-300 dark:border-sky-500/40" : "border-steel-100 hover:border-steel-200 dark:border-border"
              )}>
              <p className={cn("font-mono text-2xl font-bold tabular-nums", cor)}>
                {r.pct === null ? "—" : `${r.pct}%`}
              </p>
              <Label>Cotas e atividades {FREQ_LABEL[r.freq]}s</Label>
              <p className="mt-0.5 font-mono text-[11px] tabular-nums text-steel-400">
                {r.total ? `${nf(r.done)}/${nf(r.total)} itens` : "nada combinado"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="font-mono text-xl font-bold tabular-nums text-navy-900 dark:text-foreground">{nf(geral.done)}<span className="text-steel-300">/{nf(geral.total)}</span></p>
          <Label>Itens concluídos</Label>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {nf(grouped.filter(([, g]) => g.total && g.done < g.total).length)}
          </p>
          <Label>{by === "canal" ? "Canais" : "Pessoas"} em aberto</Label>
        </Card>
      </div>

      {grouped.length === 0 ? (
        <EmptyState>Nada combinado nessa frequência ainda. Cadastre atividades em Configurar.</EmptyState>
      ) : (
        <div className="space-y-2">
          {grouped.map(([id, g]) => {
            const ch = by === "canal" ? channels.find((c) => c.id === id) : null;
            const mb = by === "pessoa" ? members.find((m) => m.id === id) : null;
            const pct = g.total ? Math.round((g.done / g.total) * 100) : 0;
            return (
              <Card key={id} className="overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  {ch && <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-sm", LAYER_COLOR[ch.layer])} />}
                  {mb && <Avatar member={mb} size={22} />}
                  <span className="font-body text-sm font-bold text-navy-900 dark:text-foreground">{nameOf(id)}</span>
                  <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                    pct === 100 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : pct === 0 ? "bg-steel-100 text-steel-500 dark:bg-secondary dark:text-muted-foreground"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300")}>
                    {pct}%
                  </span>
                  <span className="ml-auto"><Progress done={g.done} total={g.total} width={70} /></span>
                </div>
                <div className="border-t border-steel-50 dark:border-border/50">
                  {g.cells
                    .slice()
                    .sort((a, b) => a.done / a.total - b.done / b.total)
                    .map((c) => {
                      const other = by === "canal" ? members.find((m) => m.id === c.memberId) : channels.find((x) => x.id === c.channelId);
                      if (!other) return null;
                      return (
                        <div key={`${c.memberId}-${c.channelId}`} className="flex items-center gap-2.5 border-b border-steel-50 px-4 py-2 last:border-0 dark:border-border/30">
                          {by === "canal" && <Avatar member={other as PanelMember} size={18} />}
                          {by === "pessoa" && <span className={cn("h-2 w-2 rounded-sm", LAYER_COLOR[(other as PanelChannel).layer])} />}
                          <span className="font-body text-xs text-navy-900 dark:text-foreground">{(other as any).name}</span>
                          <span className="ml-auto"><Progress done={c.done} total={c.total} width={44} /></span>
                        </div>
                      );
                    })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
