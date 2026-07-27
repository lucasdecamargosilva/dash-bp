import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Users, LayoutGrid, ListChecks, Gauge, Link2, AlertTriangle, Target, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  usePanelMutation, usePanelMaps, useSaveMap, usePanelGoals, useSaveGoal, usePanelAcessos, useGerirAcesso,
  LAYERS, FREQ_LABEL, type Freq, type Layer, type Role, type PanelChannel, type PanelMember,
} from "@/hooks/usePanelData";
import { Avatar, Card, EmptyState, FREQ_NAME, LAYER_COLOR, Label, RoleBadge, SectionTitle, Segmented } from "./shared";

type Sec = "pessoas" | "acessos" | "canais" | "atividades" | "metas" | "cotas" | "vinculos";

const SECOES: { id: Sec; label: string; icon: any; hint: string }[] = [
  { id: "pessoas", label: "Pessoas", icon: Users, hint: "Quem é do time, quem é head e o que cada um opera" },
  { id: "acessos", label: "Acessos", icon: KeyRound, hint: "Criar login para o time e redefinir senha de quem esquecer" },
  { id: "canais", label: "Canais", icon: LayoutGrid, hint: "Criar, editar e remover canais de aquisição" },
  { id: "atividades", label: "Atividades", icon: ListChecks, hint: "A rotina de cada canal — diária, semanal e mensal" },
  { id: "metas", label: "Metas do mês", icon: Target, hint: "O número que cada canal precisa entregar no ciclo" },
  { id: "cotas", label: "Cotas", icon: Gauge, hint: "Volume diário de prospecção por conta" },
  { id: "vinculos", label: "Vínculos", icon: Link2, hint: "Ligar os nomes do CRM aos canais e pessoas do painel" },
];

const MES_NOME = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const rotuloMes = (c: string) => {
  const [y, m] = c.split("-");
  return `${MES_NOME[+m - 1]}/${y.slice(2)}`;
};

export default function Configurar({ locationId, channels, members, roles, tasks, quotas }: {
  locationId: string;
  channels: PanelChannel[];
  members: PanelMember[];
  roles: any[];
  tasks: any[];
  quotas: any[];
}) {
  const [sec, setSec] = useState<Sec>("pessoas");
  const { create, update, remove } = usePanelMutation(locationId);
  const { toast } = useToast();

  const ok = (msg: string) => toast({ title: msg });
  const fail = (e: any) => toast({ title: "Não consegui salvar", description: e?.message, variant: "destructive" });
  const doCreate = (table: any, values: any, msg: string) =>
    create.mutate({ table, values }, { onSuccess: () => ok(msg), onError: fail });
  const doUpdate = (table: any, id: string, values: any) =>
    update.mutate({ table, id, values }, { onSuccess: () => ok("Atualizado"), onError: fail });
  const doRemove = (table: any, id: string, msg: string) =>
    remove.mutate({ table, id }, { onSuccess: () => ok(msg), onError: fail });

  const atual = SECOES.find((s) => s.id === sec)!;

  return (
    <div className="space-y-4">
      <SectionTitle title="Configurar" sub="Tudo que alimenta o painel — em um lugar só" />

      <div className="flex flex-wrap gap-2">
        {SECOES.map((s) => (
          <button key={s.id} onClick={() => setSec(s.id)}
            className={cn("flex items-center gap-2 rounded-xl border px-3.5 py-2 font-body text-sm font-semibold transition-all",
              sec === s.id
                ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300"
                : "border-steel-100 bg-white text-steel-400 hover:text-navy-900 dark:border-border dark:bg-card dark:hover:text-foreground")}>
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>
      <p className="font-body text-xs text-steel-400 dark:text-muted-foreground">{atual.hint}</p>

      {sec === "pessoas" && <Pessoas {...{ members, roles, channels, doCreate, doUpdate, doRemove }} />}
      {sec === "canais" && <Canais {...{ channels, tasks, roles, quotas, doCreate, doUpdate, doRemove }} />}
      {sec === "atividades" && <Atividades {...{ channels, tasks, doCreate, doRemove }} />}
      {sec === "acessos" && <Acessos members={members} />}
      {sec === "metas" && <Metas locationId={locationId} channels={channels} />}
      {sec === "cotas" && <Cotas {...{ channels, members, quotas, doCreate, doRemove }} />}
      {sec === "vinculos" && <Vinculos locationId={locationId} channels={channels} members={members} />}
    </div>
  );
}

/* ------------------------------------------------------------------ pessoas */
function Pessoas({ members, roles, channels, doCreate, doUpdate, doRemove }: any) {
  const [nome, setNome] = useState("");
  const [head, setHead] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [pCanal, setPCanal] = useState("");
  const [pPapel, setPPapel] = useState<Role>("dono");

  const pessoa = members.find((m: PanelMember) => m.id === sel);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-steel-50 p-4 dark:border-border/60">
          <Label>Time · {members.length}</Label>
        </div>
        <div className="max-h-[380px] overflow-y-auto bp-scroll">
          {members.map((m: PanelMember) => {
            const r = roles.filter((x: any) => x.member_id === m.id);
            return (
              <button key={m.id} onClick={() => setSel(m.id === sel ? null : m.id)}
                className={cn("flex w-full items-center gap-2.5 border-b border-steel-50 px-4 py-2.5 text-left transition-colors last:border-0 dark:border-border/40",
                  sel === m.id ? "bg-sky-50 dark:bg-sky-500/10" : "hover:bg-steel-50/60 dark:hover:bg-secondary/30")}>
                <Avatar member={m} size={26} />
                <span className="font-body text-sm font-semibold text-navy-900 dark:text-foreground">{m.name}</span>
                {m.is_head && <RoleBadge role="super" />}
                <span className="ml-auto font-body text-[11px] text-steel-400">
                  {r.filter((x: any) => x.role !== "super").length} opera · {r.filter((x: any) => x.role === "super").length} acompanha
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-steel-50 p-4 dark:border-border/60">
          <Label>Adicionar pessoa</Label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="h-8 flex-1 font-body text-xs" />
            <Segmented value={head ? "sim" : "nao"} onChange={(v) => setHead(v === "sim")} size="sm"
              options={[{ id: "nao", label: "Operador" }, { id: "sim", label: "Head" }]} />
            <Button size="sm" className="h-8 gap-1 font-body text-xs"
              onClick={() => {
                if (!nome.trim()) return;
                doCreate("panel_members", { name: nome.trim(), is_head: head, hue: (members.length * 47) % 360 }, "Pessoa adicionada");
                setNome("");
              }}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {!pessoa ? (
          <div className="p-8 text-center font-body text-sm text-steel-400 dark:text-muted-foreground">
            Selecione alguém para ver e mudar os papéis.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-steel-50 p-4 dark:border-border/60">
              <Avatar member={pessoa} size={30} />
              <span className="font-body text-base font-bold text-navy-900 dark:text-foreground">{pessoa.name}</span>
              <Segmented value={pessoa.is_head ? "sim" : "nao"} size="sm"
                onChange={(v) => doUpdate("panel_members", pessoa.id, { is_head: v === "sim" })}
                options={[{ id: "nao", label: "Operador" }, { id: "sim", label: "Head" }]} />
              <Button size="sm" variant="ghost" className="ml-auto h-7 gap-1 font-body text-xs text-steel-400 hover:text-red-600"
                onClick={() => {
                  if (!confirm(`Remover ${pessoa.name}? Os papéis, cotas e marcações dela saem junto.`)) return;
                  doRemove("panel_members", pessoa.id, "Pessoa removida");
                  setSel(null);
                }}>
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </Button>
            </div>
            <div className="p-4">
              <Label>Papéis nos canais</Label>
              <div className="mt-2 space-y-1.5">
                {roles.filter((r: any) => r.member_id === pessoa.id).length === 0 && (
                  <p className="font-body text-xs text-steel-400">Sem papéis ainda.</p>
                )}
                {roles.filter((r: any) => r.member_id === pessoa.id).map((r: any) => {
                  const c = channels.find((x: PanelChannel) => x.id === r.channel_id);
                  return (
                    <div key={r.id} className="flex items-center gap-2 rounded-lg border border-steel-100 px-3 py-2 dark:border-border">
                      <span className={cn("h-2 w-2 rounded-sm", LAYER_COLOR[c?.layer ?? "volume"])} />
                      <span className="font-body text-xs font-semibold text-navy-900 dark:text-foreground">{c?.name ?? "—"}</span>
                      <RoleBadge role={r.role} />
                      <button className="ml-auto text-steel-300 hover:text-red-600" onClick={() => doRemove("panel_roles", r.id, "Papel removido")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-[150px] flex-1">
                  <Label>Canal</Label>
                  <Select value={pCanal} onValueChange={setPCanal}>
                    <SelectTrigger className="mt-1 h-8 font-body text-xs"><SelectValue placeholder="Escolha" /></SelectTrigger>
                    <SelectContent>
                      {channels.map((c: PanelChannel) => <SelectItem key={c.id} value={c.id} className="font-body text-xs">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Papel</Label>
                  <Select value={pPapel} onValueChange={(v) => setPPapel(v as Role)}>
                    <SelectTrigger className="mt-1 h-8 w-[130px] font-body text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dono" className="font-body text-xs">Opera (dono)</SelectItem>
                      <SelectItem value="aux" className="font-body text-xs">Apoia (aux)</SelectItem>
                      <SelectItem value="super" className="font-body text-xs">Acompanha (head)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" className="h-8 gap-1 font-body text-xs"
                  onClick={() => {
                    if (!pCanal) return;
                    doCreate("panel_roles", { member_id: pessoa.id, channel_id: pCanal, role: pPapel }, "Papel atribuído");
                  }}>
                  <Plus className="h-3.5 w-3.5" /> Atribuir
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------- canais */
function Canais({ channels, tasks, roles, quotas, doCreate, doUpdate, doRemove }: any) {
  const [nome, setNome] = useState("");
  const [layer, setLayer] = useState<Layer>("volume");
  const [pv, setPv] = useState(false);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <Label>Novo canal</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do canal" className="h-8 min-w-[180px] flex-1 font-body text-xs" />
          <Select value={layer} onValueChange={(v) => setLayer(v as Layer)}>
            <SelectTrigger className="h-8 w-[150px] font-body text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(LAYERS) as Layer[]).map((l) => <SelectItem key={l} value={l} className="font-body text-xs">{LAYERS[l].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Segmented value={pv ? "sim" : "nao"} onChange={(v) => setPv(v === "sim")} size="sm"
            options={[{ id: "nao", label: "Comum" }, { id: "sim", label: "Pré-venda" }]} />
          <Button size="sm" className="h-8 gap-1 font-body text-xs"
            onClick={() => {
              if (!nome.trim()) return;
              doCreate("panel_channels", { name: nome.trim(), layer, is_presales: pv, sort_order: channels.length + 1 }, "Canal criado");
              setNome("");
            }}>
            <Plus className="h-3.5 w-3.5" /> Criar
          </Button>
        </div>
      </Card>

      {(Object.keys(LAYERS) as Layer[]).map((lk) => {
        const cs = channels.filter((c: PanelChannel) => c.layer === lk);
        if (!cs.length) return null;
        return (
          <div key={lk}>
            <div className="mb-1.5 flex items-center gap-2">
              <Label>{LAYERS[lk].label}</Label>
              <span className="h-px flex-1 bg-steel-100 dark:bg-border" />
            </div>
            <div className="space-y-1.5">
              {cs.map((c: PanelChannel) => (
                <Card key={c.id} className="flex flex-wrap items-center gap-2 p-3">
                  <span className={cn("h-2.5 w-2.5 rounded-sm", LAYER_COLOR[c.layer])} />
                  <Input defaultValue={c.name} className="h-7 w-[200px] font-body text-xs font-semibold"
                    onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && doUpdate("panel_channels", c.id, { name: e.target.value.trim() })} />
                  <Input defaultValue={c.meta ?? ""} placeholder="meta do ciclo" className="h-7 w-[150px] font-body text-xs"
                    onBlur={(e) => e.target.value !== (c.meta ?? "") && doUpdate("panel_channels", c.id, { meta: e.target.value || null })} />
                  <Select value={c.layer} onValueChange={(v) => doUpdate("panel_channels", c.id, { layer: v })}>
                    <SelectTrigger className="h-7 w-[140px] font-body text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LAYERS) as Layer[]).map((l) => <SelectItem key={l} value={l} className="font-body text-xs">{LAYERS[l].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Segmented value={c.is_presales ? "sim" : "nao"} size="sm"
                    onChange={(v) => doUpdate("panel_channels", c.id, { is_presales: v === "sim" })}
                    options={[{ id: "nao", label: "Comum" }, { id: "sim", label: "Pré-venda" }]} />
                  <Segmented value={c.active ? "on" : "off"} size="sm"
                    onChange={(v) => doUpdate("panel_channels", c.id, { active: v === "on" })}
                    options={[{ id: "on", label: "Em operação" }, { id: "off", label: "Encerrado" }]} />
                  <span className="font-body text-[11px] text-steel-400">
                    {roles.filter((r: any) => r.channel_id === c.id).length} resp · {tasks.filter((t: any) => t.channel_id === c.id).length} ativ
                  </span>
                  <button className="ml-auto text-steel-300 hover:text-red-600"
                    onClick={() => {
                      if (!confirm(`Excluir "${c.name}"? Saem junto ${roles.filter((r: any) => r.channel_id === c.id).length} responsáveis, ${tasks.filter((t: any) => t.channel_id === c.id).length} atividades e ${quotas.filter((q: any) => q.channel_id === c.id).length} cotas.`)) return;
                      doRemove("panel_channels", c.id, "Canal excluído");
                    }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- atividades */
function Atividades({ channels, tasks, doCreate, doRemove }: any) {
  const [canal, setCanal] = useState<string>(channels[0]?.id ?? "");
  const [texto, setTexto] = useState("");
  const [freq, setFreq] = useState<Freq>("d");
  const c = channels.find((x: PanelChannel) => x.id === canal);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1">
            <Label>Canal</Label>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger className="mt-1 h-8 font-body text-xs"><SelectValue placeholder="Escolha o canal" /></SelectTrigger>
              <SelectContent>
                {channels.map((x: PanelChannel) => <SelectItem key={x.id} value={x.id} className="font-body text-xs">{x.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {!c ? (
        <EmptyState>Escolha um canal para ver a rotina dele.</EmptyState>
      ) : (
        <>
          {(["d", "s", "m"] as Freq[]).map((f) => {
            const its = tasks.filter((t: any) => t.channel_id === c.id && t.freq === f);
            return (
              <Card key={f} className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-steel-50 px-4 py-2.5 dark:border-border/60">
                  <Label>{FREQ_NAME[f]} · {its.length}</Label>
                </div>
                {its.length === 0 ? (
                  <p className="px-4 py-3 font-body text-xs italic text-steel-400">Nenhuma atividade {FREQ_LABEL[f]}.</p>
                ) : (
                  its.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 border-b border-steel-50 px-4 py-2 last:border-0 dark:border-border/40">
                      <span className="h-1 w-1 rounded-full bg-steel-300" />
                      <span className="font-body text-sm text-navy-900 dark:text-foreground">{t.title}</span>
                      <button className="ml-auto text-steel-300 hover:text-red-600" onClick={() => doRemove("panel_tasks", t.id, "Atividade removida")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </Card>
            );
          })}
          <Card className="p-4">
            <Label>Nova atividade em {c.name}</Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: 20 ligações" className="h-8 min-w-[200px] flex-1 font-body text-xs" />
              <Segmented<Freq> value={freq} onChange={setFreq} size="sm"
                options={[{ id: "d" as Freq, label: "Dia" }, { id: "s" as Freq, label: "Semana" }, { id: "m" as Freq, label: "Mês" }]} />
              <Button size="sm" className="h-8 gap-1 font-body text-xs"
                onClick={() => {
                  if (!texto.trim()) return;
                  doCreate("panel_tasks", { channel_id: c.id, freq, title: texto.trim(), sort_order: tasks.filter((t: any) => t.channel_id === c.id && t.freq === freq).length + 1 }, "Atividade adicionada");
                  setTexto("");
                }}>
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ acessos */
/**
 * Criar login e redefinir senha do time.
 *
 * A senha nunca fica salva em lugar nenhum — é digitada aqui e vai direto para
 * o banco já com hash. Por isso a tela mostra a senha em texto enquanto você
 * digita: é a única chance de anotá-la para repassar à pessoa.
 */
function Acessos({ members }: { members: PanelMember[] }) {
  const acessos = usePanelAcessos(true);
  const { criar, redefinir } = useGerirAcesso();
  const { toast } = useToast();

  const [sel, setSel] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const acessoDe = (id: string) => acessos.data?.find((a) => a.member_id === id);
  const pessoa = members.find((m) => m.id === sel);
  const jaTem = sel ? acessoDe(sel) : undefined;

  const sugereEmail = (nome: string) =>
    `${nome.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").split(/\s+/)[0]}@bpgroupbr.com.br`;

  const escolher = (id: string) => {
    setSel(id === sel ? null : id);
    setSenha("");
    const m = members.find((x) => x.id === id);
    setEmail(acessoDe(id)?.email ?? (m ? sugereEmail(m.name) : ""));
  };

  const salvar = () => {
    if (!sel || senha.length < 8) return;
    const fim = {
      onSuccess: () => {
        toast({
          title: jaTem ? "Senha redefinida" : "Acesso criado",
          description: `Passe a senha para ${pessoa?.name} — ela não fica salva aqui.`,
        });
        setSenha("");
      },
      onError: (e: any) => toast({ title: "Não deu certo", description: e.message, variant: "destructive" }),
    };
    if (jaTem) redefinir.mutate({ memberId: sel, senha }, fim);
    else criar.mutate({ memberId: sel, email: email.trim(), senha }, fim);
  };

  const semAcesso = members.filter((m) => !acessoDe(m.id)).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-steel-50 p-4 dark:border-border/60">
          <Label>Time · {members.length}</Label>
          {semAcesso > 0 && (
            <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              {semAcesso} sem login
            </span>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto bp-scroll">
          {members.map((m) => {
            const a = acessoDe(m.id);
            return (
              <button key={m.id} onClick={() => escolher(m.id)}
                className={cn("flex w-full items-center gap-2.5 border-b border-steel-50 px-4 py-2.5 text-left transition-colors last:border-0 dark:border-border/40",
                  sel === m.id ? "bg-sky-50 dark:bg-sky-500/10" : "hover:bg-steel-50/60 dark:hover:bg-secondary/30")}>
                <Avatar member={m} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="block font-body text-sm font-semibold text-navy-900 dark:text-foreground">{m.name}</span>
                  <span className={cn("block truncate font-body text-[11px]", a ? "text-steel-400" : "text-amber-600 dark:text-amber-400")}>
                    {a ? a.email : "sem login"}
                  </span>
                </span>
                {m.is_head && <RoleBadge role="super" />}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {!pessoa ? (
          <div className="p-8 text-center font-body text-sm text-steel-400 dark:text-muted-foreground">
            Escolha alguém para criar o login ou trocar a senha.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-steel-50 p-4 dark:border-border/60">
              <Avatar member={pessoa} size={30} />
              <div>
                <p className="font-body text-base font-bold text-navy-900 dark:text-foreground">{pessoa.name}</p>
                <p className="font-body text-[11px] text-steel-400">
                  {jaTem ? `entra com ${jaTem.email}` : "ainda não tem acesso"}
                </p>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <Label>E-mail de acesso</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!jaTem}
                  placeholder="nome@bpgroupbr.com.br" className="mt-1 h-9 font-body text-sm" />
                {jaTem && <p className="mt-1 font-body text-[11px] text-steel-400">O e-mail de uma conta existente não muda por aqui.</p>}
              </div>
              <div>
                <Label>{jaTem ? "Nova senha" : "Senha inicial"}</Label>
                <Input value={senha} onChange={(e) => setSenha(e.target.value)} type="text"
                  placeholder="mínimo 8 caracteres" className="mt-1 h-9 font-mono text-sm" />
                <p className="mt-1 font-body text-[11px] text-steel-400">
                  Fica visível de propósito — anote agora, porque depois de salva ninguém mais consegue lê-la.
                </p>
              </div>
              <Button onClick={salvar} disabled={senha.length < 8 || (!jaTem && !email.trim()) || criar.isPending || redefinir.isPending}
                className="w-full font-body text-sm">
                {criar.isPending || redefinir.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…</>
                  : jaTem ? "Redefinir senha" : "Criar acesso"}
              </Button>
              {jaTem?.ultimo_acesso && (
                <p className="text-center font-body text-[11px] text-steel-400">
                  Último acesso em {new Date(jaTem.ultimo_acesso).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------- metas */
/**
 * Meta por canal e por mês. Fica separada do canal de propósito: guardada no
 * canal, virar o mês apagaria a referência anterior e não daria para comparar
 * ciclos nem cobrar o que foi combinado no mês passado.
 */
function Metas({ locationId, channels }: { locationId: string; channels: PanelChannel[] }) {
  const meses = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 1; i >= -6; i--) {
      const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
      out.push(x.toISOString().slice(0, 7));
    }
    return out;
  }, []);
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const goals = usePanelGoals(locationId, mes);
  const save = useSaveGoal(locationId);
  const { toast } = useToast();

  const doSave = (channelId: string, campo: string, valor: string) => {
    const atual = goals.data?.find((g) => g.channel_id === channelId);
    const n = valor.trim() === "" ? null : Number(valor);
    if (n !== null && Number.isNaN(n)) return;
    save.mutate(
      { ...(atual ?? {}), channel_id: channelId, competencia: mes, [campo]: n } as any,
      { onSuccess: () => toast({ title: "Meta salva" }),
        onError: (e: any) => toast({ title: "Não consegui salvar", description: e.message, variant: "destructive" }) }
    );
  };

  const ativos = channels.filter((c) => c.active);
  const totais = (ativos.map((c) => goals.data?.find((g) => g.channel_id === c.id)) ?? [])
    .reduce((a, g) => ({
      contatos: a.contatos + (g?.contatos ?? 0), reunioes: a.reunioes + (g?.reunioes ?? 0),
      propostas: a.propostas + (g?.propostas ?? 0), vendas: a.vendas + (g?.vendas ?? 0),
    }), { contatos: 0, reunioes: 0, propostas: 0, vendas: 0 });

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Label>Ciclo</Label>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="h-8 w-[120px] font-body text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {meses.map((m) => <SelectItem key={m} value={m} className="font-body text-xs">{rotuloMes(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex flex-wrap gap-4">
          {[["Contatos", totais.contatos], ["Reuniões", totais.reunioes], ["Propostas", totais.propostas], ["Vendas", totais.vendas]].map(([l, v]) => (
            <div key={l as string} className="text-right">
              <p className="font-mono text-base font-bold tabular-nums text-navy-900 dark:text-foreground">{v as number}</p>
              <Label>{l as string}</Label>
            </div>
          ))}
        </div>
      </Card>

      {goals.isLoading ? (
        <EmptyState>Carregando metas…</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto bp-scroll">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-steel-100 bg-steel-50/50 dark:border-border dark:bg-secondary/30">
                  {["Canal", "Contatos", "Reuniões", "Propostas", "Vendas"].map((h, i) => (
                    <th key={h} className={cn("px-3 py-2 font-body text-[10px] font-bold uppercase tracking-wider text-steel-400", i === 0 ? "text-left" : "text-right")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ativos.map((c) => {
                  const g = goals.data?.find((x) => x.channel_id === c.id);
                  return (
                    <tr key={c.id} className="border-b border-steel-50 last:border-0 dark:border-border/40">
                      <td className="px-3 py-1.5">
                        <span className="flex items-center gap-2 font-body text-sm font-semibold text-navy-900 dark:text-foreground">
                          <span className={cn("h-2 w-2 rounded-sm", LAYER_COLOR[c.layer])} />{c.name}
                        </span>
                      </td>
                      {(["contatos", "reunioes", "propostas", "vendas"] as const).map((campo) => (
                        <td key={campo} className="px-2 py-1.5 text-right">
                          <Input
                            type="number" min="0" defaultValue={g?.[campo] ?? ""}
                            onBlur={(e) => { if (String(g?.[campo] ?? "") !== e.target.value) doSave(c.id, campo, e.target.value); }}
                            className="ml-auto h-7 w-[74px] text-right font-mono text-xs tabular-nums"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="cfg-hint font-body text-[11px] text-steel-400 dark:text-muted-foreground">
        As metas de agosto já nasceram com o realizado de julho como piso — ajuste o que for subir.
        Em <b>Time &amp; Metas</b> elas aparecem lado a lado com o realizado do mês.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------- cotas */
function Cotas({ channels, members, quotas, doCreate, doRemove }: any) {
  const pv = channels.filter((c: PanelChannel) => c.is_presales);
  const [m, setM] = useState("");
  const [c, setC] = useState("");
  const [conta, setConta] = useState("");
  const [dia, setDia] = useState("20");
  const total = quotas.reduce((a: number, q: any) => a + q.per_day, 0);

  return (
    <div className="space-y-3">
      <Card className="flex items-center gap-3 p-4">
        <span className="font-mono text-2xl font-bold tabular-nums text-navy-900 dark:text-foreground">{total}</span>
        <div><Label>Mensagens por dia</Label><p className="font-body text-xs text-steel-400">{total * 5}/semana · {total * 20}/mês</p></div>
      </Card>

      {pv.map((ch: PanelChannel) => {
        const qs = quotas.filter((q: any) => q.channel_id === ch.id);
        const sub = qs.reduce((a: number, q: any) => a + q.per_day, 0);
        return (
          <Card key={ch.id} className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-steel-50 px-4 py-2.5 dark:border-border/60">
              <span className={cn("h-2.5 w-2.5 rounded-sm", LAYER_COLOR[ch.layer])} />
              <span className="font-body text-sm font-bold text-navy-900 dark:text-foreground">{ch.name}</span>
              <span className={cn("ml-auto font-mono text-sm font-bold tabular-nums", sub ? "text-navy-900 dark:text-foreground" : "text-steel-300")}>{sub}<span className="text-[10px] text-steel-400">/dia</span></span>
            </div>
            {qs.length === 0 ? (
              <p className="flex items-center gap-1.5 px-4 py-2.5 font-body text-xs italic text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Sem cota — este canal não aparece no motor.
              </p>
            ) : (
              qs.map((q: any) => {
                const mm = members.find((x: PanelMember) => x.id === q.member_id);
                return (
                  <div key={q.id} className="flex items-center gap-2 border-b border-steel-50 px-4 py-2 last:border-0 dark:border-border/40">
                    {mm && <Avatar member={mm} size={20} />}
                    <span className="font-body text-xs font-semibold text-navy-900 dark:text-foreground">{mm?.name}</span>
                    <span className="font-body text-xs text-steel-400">{q.account}</span>
                    <span className="ml-auto font-mono text-sm font-bold tabular-nums text-navy-900 dark:text-foreground">{q.per_day}<span className="text-[10px] text-steel-400">/dia</span></span>
                    <button className="text-steel-300 hover:text-red-600" onClick={() => doRemove("panel_quotas", q.id, "Cota removida")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </Card>
        );
      })}

      <Card className="p-4">
        <Label>Nova cota</Label>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div className="min-w-[130px]"><Label>Pessoa</Label>
            <Select value={m} onValueChange={setM}>
              <SelectTrigger className="mt-1 h-8 font-body text-xs"><SelectValue placeholder="Quem" /></SelectTrigger>
              <SelectContent>{members.map((x: PanelMember) => <SelectItem key={x.id} value={x.id} className="font-body text-xs">{x.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-[140px]"><Label>Canal</Label>
            <Select value={c} onValueChange={setC}>
              <SelectTrigger className="mt-1 h-8 font-body text-xs"><SelectValue placeholder="Onde" /></SelectTrigger>
              <SelectContent>{pv.map((x: PanelChannel) => <SelectItem key={x.id} value={x.id} className="font-body text-xs">{x.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-[150px] flex-1"><Label>Conta</Label>
            <Input value={conta} onChange={(e) => setConta(e.target.value)} placeholder="Ex.: Insta Caon" className="mt-1 h-8 font-body text-xs" />
          </div>
          <div className="w-[80px]"><Label>Msgs/dia</Label>
            <Input value={dia} onChange={(e) => setDia(e.target.value)} type="number" min="0" className="mt-1 h-8 font-body text-xs" />
          </div>
          <Button size="sm" className="h-8 gap-1 font-body text-xs"
            onClick={() => {
              if (!m || !c || !conta.trim()) return;
              doCreate("panel_quotas", { member_id: m, channel_id: c, account: conta.trim(), per_day: parseInt(dia, 10) || 0 }, "Cota adicionada");
              setConta("");
            }}>
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------- vínculos */
function Vinculos({ locationId, channels, members }: any) {
  const maps = usePanelMaps(locationId);
  const save = useSaveMap(locationId);
  const { toast } = useToast();
  const set = (kind: "pessoa" | "source", id: string, target: string) =>
    save.mutate({ kind, id, targetId: target === "__none" ? null : target }, {
      onSuccess: () => toast({ title: "Vínculo salvo" }),
      onError: (e: any) => toast({ title: "Não consegui salvar", description: e.message, variant: "destructive" }),
    });

  if (maps.isLoading) return <EmptyState>Carregando vínculos…</EmptyState>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MapList title="Pessoas do CRM" hint="Cada rótulo de conta apontando para alguém do time. Uma pessoa pode ter várias contas."
        rows={(maps.data?.pessoas ?? []).map((p) => ({ id: p.id, label: p.pipeline_pessoa, value: p.member_id, note: p.note }))}
        options={members.map((m: PanelMember) => ({ id: m.id, label: m.name }))}
        onChange={(id, v) => set("pessoa", id, v)} />
      <MapList title="Origens do CRM" hint="Grafias diferentes do mesmo canal devem apontar para o mesmo destino."
        rows={(maps.data?.sources ?? []).map((s) => ({ id: s.id, label: s.pipeline_source, value: s.channel_id, note: s.note }))}
        options={channels.map((c: PanelChannel) => ({ id: c.id, label: c.name }))}
        onChange={(id, v) => set("source", id, v)} />
    </div>
  );
}

function MapList({ title, hint, rows, options, onChange }: any) {
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [q, setQ] = useState("");
  const missing = rows.filter((r: any) => !r.value).length;
  let shown = onlyMissing ? rows.filter((r: any) => !r.value) : rows;
  if (q.trim()) shown = shown.filter((r: any) => r.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-steel-50 p-4 dark:border-border/60">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-sky-500" />
          <span className="font-body text-sm font-bold text-navy-900 dark:text-foreground">{title}</span>
          <span className="ml-auto font-body text-[11px] text-steel-400">{rows.length - missing}/{rows.length} vinculados</span>
        </div>
        <p className="mt-1 font-body text-[11px] text-steel-400 dark:text-muted-foreground">{hint}</p>
        <div className="mt-2 flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="h-7 flex-1 font-body text-xs" />
          {missing > 0 && (
            <button onClick={() => setOnlyMissing(!onlyMissing)}
              className={cn("whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wide transition-colors",
                onlyMissing ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300")}>
              {missing} sem vínculo
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto bp-scroll">
        {shown.map((r: any) => (
          <div key={r.id} className="flex items-center gap-2 border-b border-steel-50 px-4 py-2 last:border-0 dark:border-border/40">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-xs font-semibold text-navy-900 dark:text-foreground">{r.label}</span>
              {r.note && <span className="block truncate font-body text-[10px] text-steel-400">{r.note}</span>}
            </span>
            <Select value={r.value ?? "__none"} onValueChange={(v) => onChange(r.id, v)}>
              <SelectTrigger className={cn("h-7 w-[150px] font-body text-[11px]", !r.value && "border-amber-300 text-amber-700 dark:border-amber-500/40")}>
                <SelectValue placeholder="— sem vínculo —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none" className="font-body text-xs text-steel-400">— sem vínculo —</SelectItem>
                {options.map((o: any) => <SelectItem key={o.id} value={o.id} className="font-body text-xs">{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </Card>
  );
}
