import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, Flame, Users, ListChecks, Gauge, Plus, Trash2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  LAYERS, FREQ_LABEL, useRealizado, usePanelMutation,
  type Freq, type PanelChannel, type PanelMember,
} from "@/hooks/usePanelData";
import { Avatar, Card, EmptyState, FREQ_NAME, LAYER_COLOR, LAYER_TEXT, Label, RoleBadge, Row, SectionTitle, Segmented, brl, nf } from "./shared";

export default function Canais({
  locationId, channels, roles, members, tasks, quotas, detail, setDetail, freq, setFreq, month, meId,
}: {
  locationId: string;
  channels: PanelChannel[];
  roles: any[];
  members: PanelMember[];
  tasks: any[];
  quotas: any[];
  detail: string | null;
  setDetail: (v: string | null) => void;
  freq: Freq;
  setFreq: (f: Freq) => void;
  month: string;
  meId: string;
}) {
  const realizado = useRealizado(locationId, month);

  if (detail) {
    const c = channels.find((x) => x.id === detail);
    if (!c) return null;
    // quem acompanha o canal manda na rotina dele
    const podeEditar = roles.some((r: any) => r.member_id === meId && r.channel_id === c.id && r.role === "super");
    return (
      <Detalhe
        c={c} roles={roles} members={members} tasks={tasks} quotas={quotas}
        real={realizado.data?.byChannel.get(c.id)} month={month} onBack={() => setDetail(null)}
        podeEditar={podeEditar} locationId={locationId}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SectionTitle title="Canais de aquisição" sub={`${channels.length} canais · toque para abrir o detalhe`} />
        <div className="ml-auto">
          <Segmented value={freq} onChange={setFreq}
            options={[{ id: "d" as Freq, label: "Hoje" }, { id: "s" as Freq, label: "Semana" }, { id: "m" as Freq, label: "Mês" }]} />
        </div>
      </div>

      {(Object.keys(LAYERS) as (keyof typeof LAYERS)[]).map((lk) => {
        const cs = channels.filter((c) => c.layer === lk && c.active);
        if (!cs.length) return null;
        return (
          <div key={lk}>
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-wider", LAYER_TEXT[lk])}>
                <Flame className="h-3 w-3" /> {LAYERS[lk].label}
              </span>
              <span className="font-body text-xs text-steel-300">{LAYERS[lk].desc}</span>
              <span className="h-px flex-1 bg-steel-100 dark:bg-border" />
            </div>
            <div className="space-y-2">
              {cs.map((c) => {
                const rs = roles.filter((r: any) => r.channel_id === c.id && r.role !== "super");
                const head = roles.find((r: any) => r.channel_id === c.id && r.role === "super");
                const headM = head ? members.find((m) => m.id === head.member_id) : null;
                const n = tasks.filter((t: any) => t.channel_id === c.id && t.freq === freq).length;
                const qd = quotas.filter((q: any) => q.channel_id === c.id).reduce((a: number, q: any) => a + q.per_day, 0);
                const r = realizado.data?.byChannel.get(c.id);
                return (
                  <Row key={c.id} onClick={() => setDetail(c.id)}>
                    <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-sm", LAYER_COLOR[c.layer])} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 font-body text-sm font-bold text-navy-900 dark:text-foreground">
                        {c.name}
                        {c.is_presales && <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">pré-venda</span>}
                        {c.is_draft && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">em construção</span>}
                      </span>
                      <span className="font-body text-[11px] text-steel-400 dark:text-muted-foreground">
                        {n} atividade{n === 1 ? "" : "s"} {FREQ_LABEL[freq]}
                        {qd > 0 && ` · ${qd} msgs/dia`}
                        {c.meta ? ` · meta ${c.meta}` : ""}
                        {headM ? ` · head ${headM.name}` : ""}
                      </span>
                    </span>
                    {r && (
                      <span className="hidden text-right sm:block">
                        <span className="block font-mono text-sm font-bold tabular-nums text-navy-900 dark:text-foreground">{nf(r.opps)}</span>
                        <span className="block font-body text-[9px] uppercase tracking-wide text-steel-400">opps no mês</span>
                      </span>
                    )}
                    <span className="flex -space-x-1.5">
                      {rs.slice(0, 4).map((r2: any) => {
                        const m = members.find((x) => x.id === r2.member_id);
                        return m ? <Avatar key={r2.id} member={m} size={22} /> : null;
                      })}
                    </span>
                  </Row>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* encerrados ficam a parte: nao cobram rotina, mas o historico segue neles */}
      {channels.some((c) => !c.active) && (
        <div className="pt-2">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-steel-300">Encerrados</span>
            <span className="font-body text-xs text-steel-300">Fora da operação — o histórico continua contando</span>
            <span className="h-px flex-1 bg-steel-100 dark:bg-border" />
          </div>
          <div className="space-y-2">
            {channels.filter((c) => !c.active).map((c) => {
              const r = realizado.data?.byChannel.get(c.id);
              return (
                <Row key={c.id} onClick={() => setDetail(c.id)} className="opacity-60">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm bg-steel-300" />
                  <span className="min-w-0 flex-1">
                    <span className="font-body text-sm font-bold text-steel-400 dark:text-muted-foreground">{c.name}</span>
                    <span className="block font-body text-[11px] text-steel-300">sai de operação</span>
                  </span>
                  {r && (
                    <span className="hidden text-right sm:block">
                      <span className="block font-mono text-sm font-bold tabular-nums text-steel-400">{nf(r.opps)}</span>
                      <span className="block font-body text-[9px] uppercase tracking-wide text-steel-300">opps no mês</span>
                    </span>
                  )}
                </Row>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Detalhe({ c, roles, members, tasks, quotas, real, month, onBack, podeEditar, locationId }: any) {
  const rs = roles.filter((r: any) => r.channel_id === c.id);
  const qs = quotas.filter((q: any) => q.channel_id === c.id);
  const cota = qs.reduce((a: number, q: any) => a + q.per_day, 0);
  const { create, remove } = usePanelMutation(locationId);
  const { toast } = useToast();
  const [editando, setEditando] = useState(false);
  const [novo, setNovo] = useState("");
  const [novaFreq, setNovaFreq] = useState<Freq>("d");

  const addTarefa = () => {
    if (!novo.trim()) return;
    create.mutate(
      { table: "panel_tasks", values: { channel_id: c.id, freq: novaFreq, title: novo.trim(), sort_order: tasks.filter((t: any) => t.channel_id === c.id && t.freq === novaFreq).length + 1 } },
      { onSuccess: () => { toast({ title: "Atividade adicionada" }); setNovo(""); },
        onError: (e: any) => toast({ title: "Não consegui salvar", description: e.message, variant: "destructive" }) }
    );
  };
  const delTarefa = (id: string) =>
    remove.mutate({ table: "panel_tasks", id }, {
      onSuccess: () => toast({ title: "Atividade removida" }),
      onError: (e: any) => toast({ title: "Não consegui remover", description: e.message, variant: "destructive" }),
    });

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 font-body text-xs font-semibold text-steel-400 hover:text-navy-900 dark:hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Canais
      </button>

      <Card className="overflow-hidden">
        <div className="relative border-b border-steel-50 p-5 dark:border-border/60">
          <span className={cn("absolute inset-y-0 left-0 w-1", LAYER_COLOR[c.layer])} />
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-xl font-bold tracking-tight text-navy-900 dark:text-foreground">{c.name}</h1>
            <span className={cn("inline-flex items-center gap-1 font-body text-[10px] font-bold uppercase tracking-wider", LAYER_TEXT[c.layer])}>
              <Flame className="h-3 w-3" /> {LAYERS[c.layer as keyof typeof LAYERS].label}
            </span>
            {c.is_presales && <span className="rounded-full bg-sky-50 px-2 py-0.5 font-body text-[9px] font-bold uppercase text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">pré-venda</span>}
            {c.is_draft && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-body text-[9px] font-bold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">em construção</span>}
          </div>
          <p className="mt-1 font-body text-xs text-steel-400 dark:text-muted-foreground">
            Meta do ciclo: {c.meta || "—"} · para editar, use <b>Configurar → Canais</b>
          </p>
        </div>

        {/* realizado do mês, direto do pipeline */}
        <div className="grid grid-cols-2 divide-x divide-steel-50 border-b border-steel-50 sm:grid-cols-5 dark:divide-border/40 dark:border-border/60">
          {[
            { l: "Oportunidades", v: real ? nf(real.opps) : "—" },
            { l: "Reuniões", v: real ? nf(real.reunioes) : "—" },
            { l: "Propostas", v: real ? nf(real.propostas) : "—" },
            { l: "Vendas", v: real ? nf(real.vendas) : "—", hot: !!real?.vendas },
            { l: "Faturamento", v: real?.faturamento ? brl(real.faturamento) : "—" },
          ].map((k) => (
            <div key={k.l} className="p-3">
              <p className={cn("font-mono text-base font-bold tabular-nums", k.hot ? "text-emerald-600 dark:text-emerald-400" : "text-navy-900 dark:text-foreground")}>{k.v}</p>
              <Label>{k.l}</Label>
            </div>
          ))}
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-wider text-steel-400">
              <Users className="h-3.5 w-3.5" /> Responsáveis · {rs.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {rs.length === 0 && <span className="font-body text-xs text-steel-400">Ninguém atribuído.</span>}
              {rs.map((r: any) => {
                const m = members.find((x: PanelMember) => x.id === r.member_id);
                return m ? (
                  <span key={r.id} className="inline-flex items-center gap-2 rounded-full border border-steel-100 px-2.5 py-1 font-body text-xs font-semibold text-navy-900 dark:border-border dark:text-foreground">
                    <Avatar member={m} size={20} /> {m.name} <RoleBadge role={r.role} />
                  </span>
                ) : null;
              })}
            </div>

            {qs.length > 0 && (
              <>
                <p className="mb-2 mt-5 flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-wider text-steel-400">
                  <Gauge className="h-3.5 w-3.5" /> Cotas · {cota} msgs/dia
                </p>
                <div className="space-y-1">
                  {qs.map((q: any) => {
                    const m = members.find((x: PanelMember) => x.id === q.member_id);
                    return (
                      <div key={q.id} className="flex items-center gap-2 rounded-lg border border-steel-100 px-3 py-1.5 dark:border-border">
                        {m && <Avatar member={m} size={18} />}
                        <span className="font-body text-xs font-semibold text-navy-900 dark:text-foreground">{m?.name}</span>
                        <span className="font-body text-xs text-steel-400">{q.account}</span>
                        <span className="ml-auto font-mono text-xs font-bold tabular-nums text-navy-900 dark:text-foreground">{q.per_day}<span className="text-[9px] text-steel-400">/dia</span></span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-wider text-steel-400">
                <ListChecks className="h-3.5 w-3.5" /> Rotina · {tasks.filter((t: any) => t.channel_id === c.id).length} atividades
              </p>
              {podeEditar && (
                <button onClick={() => setEditando(!editando)}
                  className={cn("ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide transition-colors",
                    editando ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300")}>
                  {editando ? <><Check className="h-3 w-3" /> pronto</> : <><Pencil className="h-3 w-3" /> editar</>}
                </button>
              )}
            </div>

            {(["d", "s", "m"] as Freq[]).map((f) => {
              const its = tasks.filter((t: any) => t.channel_id === c.id && t.freq === f);
              if (!its.length) return null;
              return (
                <div key={f} className="mb-3">
                  <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">{FREQ_NAME[f]} · {its.length}</p>
                  <ul className="space-y-0.5">
                    {its.map((t: any) => (
                      <li key={t.id} className="group flex items-start gap-2 font-body text-sm text-navy-900 dark:text-foreground">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-steel-300" />
                        <span className="flex-1">{t.title}</span>
                        {editando && (
                          <button onClick={() => delTarefa(t.id)} title="Remover atividade"
                            className="mt-0.5 text-steel-300 transition-colors hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {tasks.filter((t: any) => t.channel_id === c.id).length === 0 && !editando && (
              <p className="font-body text-xs italic text-steel-400">
                Sem rotina definida.{podeEditar ? " Toque em editar para cadastrar." : " Peça ao head do canal para cadastrar."}
              </p>
            )}

            {editando && (
              <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-500/30 dark:bg-sky-500/5">
                <Label>Nova atividade</Label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Input value={novo} onChange={(e) => setNovo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTarefa()}
                    placeholder="Ex.: 20 ligações" className="h-8 min-w-[150px] flex-1 font-body text-xs" />
                  <Segmented<Freq> value={novaFreq} onChange={setNovaFreq} size="sm"
                    options={[{ id: "d", label: "Dia" }, { id: "s", label: "Semana" }, { id: "m", label: "Mês" }]} />
                  <Button size="sm" className="h-8 gap-1 font-body text-xs" onClick={addTarefa}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                <p className="mt-2 font-body text-[10px] text-steel-400 dark:text-muted-foreground">
                  Você acompanha este canal, então pode mudar a rotina dele.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
