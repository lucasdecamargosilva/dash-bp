import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Eye, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FREQ_LABEL, type Freq, type PanelChannel, type PanelMember, type Role,
} from "@/hooks/usePanelData";
import { Avatar, Card, CheckBox, EmptyState, LAYER_COLOR, Progress, RoleBadge, SectionTitle, Segmented, Label } from "./shared";

interface Item { kind: "task" | "quota"; id: string; title: string; target?: string | null }
interface Group { channel: PanelChannel; items: Item[]; role: Role }

export default function MinhaVisao({
  target, isHead, members, viewAs, setViewAs, freq, setFreq,
  groups, supervised, roles, tasks, quotas,
  isDone, flip, isDoneFor,
}: {
  target: PanelMember;
  isHead: boolean;
  members: PanelMember[];
  viewAs: string;
  setViewAs: (v: string) => void;
  freq: Freq;
  setFreq: (f: Freq) => void;
  groups: Group[];
  supervised: PanelChannel[];
  roles: any[];
  tasks: any[];
  quotas: any[];
  isDone: (k: "task" | "quota", id: string) => boolean;
  flip: (k: "task" | "quota", id: string) => void;
  isDoneFor: (memberId: string, k: "task" | "quota", id: string) => boolean;
}) {
  // Quem acumula os dois papéis (o caso do Oda) escolhe o que quer ver.
  const hasOperation = groups.length > 0;
  // basta acompanhar um canal para ter time — nao precisa ser head global
  const hasTeam = supervised.length > 0;
  const [mode, setMode] = useState<"operacao" | "time">(hasOperation ? "operacao" : "time");
  const [open, setOpen] = useState<string | null>(groups[0]?.channel.id ?? null);

  const total = groups.reduce((a, g) => a + g.items.length, 0);
  const done = groups.reduce((a, g) => a + g.items.filter((i) => isDone(i.kind, i.id)).length, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center gap-5 p-5">
        <div className="relative h-16 w-16 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" strokeWidth="7" className="stroke-steel-100 dark:stroke-secondary" />
            <circle cx="32" cy="32" r="28" fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-sky-500"
              strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - pct / 100)} />
          </svg>
          <span className="absolute inset-0 grid place-items-center font-body text-sm font-bold tabular-nums text-navy-900 dark:text-foreground">{pct}%</span>
        </div>
        <div className="min-w-0">
          <Label>Rotina {FREQ_LABEL[freq]}</Label>
          <h1 className="font-body text-xl font-bold tracking-tight text-navy-900 dark:text-foreground">{target?.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {hasOperation && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                <Briefcase className="h-2.5 w-2.5" /> opera {groups.length} canal{groups.length > 1 ? "is" : ""}
              </span>
            )}
            {hasTeam && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                <Eye className="h-2.5 w-2.5" /> acompanha {supervised.length}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {isHead && (
            <Select value={viewAs || target?.id} onValueChange={setViewAs}>
              <SelectTrigger className="h-8 w-[152px] font-body text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map((m) => <SelectItem key={m.id} value={m.id} className="font-body text-xs">Ver como {m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Segmented
            value={freq}
            onChange={setFreq}
            options={[{ id: "d" as Freq, label: "Hoje" }, { id: "s" as Freq, label: "Semana" }, { id: "m" as Freq, label: "Mês" }]}
          />
        </div>
      </Card>

      {/* Quem tem os dois chapéus alterna aqui — é o caso do Oda */}
      {hasOperation && hasTeam && (
        <Segmented<"operacao" | "time">
          value={mode}
          onChange={setMode}
          options={[
            { id: "operacao" as const, label: `Minhas atividades (${done}/${total})` },
            { id: "time" as const, label: `Meu time (${supervised.length} canais)` },
          ]}
        />
      )}

      {(!hasTeam || mode === "operacao") && (
        !hasOperation ? (
          <EmptyState>Nenhuma atividade {FREQ_LABEL[freq]} atribuída a {target?.name}.</EmptyState>
        ) : (
          <div className="space-y-2.5">
            {groups.map((g) => {
              const d = g.items.filter((i) => isDone(i.kind, i.id)).length;
              const isOpen = open === g.channel.id;
              return (
                <Card key={g.channel.id} className={cn("overflow-hidden transition-colors", isOpen && "border-sky-300 dark:border-sky-500/40")}>
                  <button onClick={() => setOpen(isOpen ? null : g.channel.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-sm", LAYER_COLOR[g.channel.layer])} />
                    <span className="font-body text-sm font-bold text-navy-900 dark:text-foreground">{g.channel.name}</span>
                    <RoleBadge role={g.role} />
                    <span className="ml-auto flex items-center gap-3">
                      <Progress done={d} total={g.items.length} />
                      <ChevronRight className={cn("h-4 w-4 text-steel-300 transition-transform", isOpen && "rotate-90 text-sky-500")} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-steel-50 dark:border-border/60">
                      {g.items.map((it) => {
                        const checked = isDone(it.kind, it.id);
                        return (
                          <button key={it.id} onClick={() => flip(it.kind, it.id)}
                            className="flex w-full items-start gap-3 border-b border-steel-50 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-steel-50/60 dark:border-border/40 dark:hover:bg-secondary/30">
                            <CheckBox checked={checked} />
                            <span className={cn("font-body text-sm", checked ? "text-steel-300 line-through dark:text-muted-foreground/60" : "text-navy-900 dark:text-foreground")}>
                              {it.title}
                              {it.target && (
                                <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                                  {it.target}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {hasTeam && (!hasOperation || mode === "time") && (
        <div className="space-y-3">
          <SectionTitle title="Time abaixo de você" sub={`Progresso ${FREQ_LABEL[freq]} de quem você acompanha`} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {supervised.map((c) => {
              const people = roles.filter((r: any) => r.channel_id === c.id && r.role !== "super");
              return (
                <Card key={c.id} className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-sm", LAYER_COLOR[c.layer])} />
                    <span className="font-body text-sm font-bold text-navy-900 dark:text-foreground">{c.name}</span>
                  </div>
                  {people.length === 0 && <p className="font-body text-xs text-steel-400">Sem responsáveis.</p>}
                  {people.map((r: any) => {
                    const m = members.find((x) => x.id === r.member_id);
                    if (!m) return null;
                    const its = [
                      ...(freq === "d" ? quotas.filter((q: any) => q.member_id === m.id && q.channel_id === c.id).map((q: any) => ({ k: "quota" as const, id: q.id })) : []),
                      ...tasks.filter((t: any) => t.channel_id === c.id && t.freq === freq).map((t: any) => ({ k: "task" as const, id: t.id })),
                    ];
                    const dn = its.filter((i) => isDoneFor(m.id, i.k, i.id)).length;
                    return (
                      <div key={r.id} className="flex items-center gap-2 border-t border-steel-50 py-1.5 dark:border-border/40">
                        <Avatar member={m} size={18} />
                        <span className="font-body text-xs font-semibold text-navy-900 dark:text-foreground">{m.name}</span>
                        <span className="ml-auto"><Progress done={dn} total={its.length} width={40} /></span>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
