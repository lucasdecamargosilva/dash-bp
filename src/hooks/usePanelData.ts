import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// As tabelas panel_* ja estao em integrations/supabase/types.ts. O alias existe
// porque algumas chamadas montam o nome da tabela em runtime, e ai o construtor
// de query nao consegue estreitar o tipo sozinho; as interfaces abaixo seguram
// o contrato na saida de cada hook.
const db = supabase as any;

// Painel de Canais — estrutura operacional do time.
// As tabelas panel_* guardam o que combinamos fazer; os numeros realizados
// continuam vindo do pipeline (ghl_pipeline_opportunities), cruzados pelas
// tabelas de vinculo panel_source_map / panel_pessoa_map.

export type Freq = "d" | "s" | "m";
export type Role = "dono" | "aux" | "super";
export type Layer = "quentes" | "volume" | "construcao";

export interface PanelChannel {
  id: string;
  name: string;
  layer: Layer;
  is_presales: boolean;
  is_draft: boolean;
  meta: string | null;
  sort_order: number;
}
export interface PanelMember {
  id: string;
  name: string;
  is_head: boolean;
  hue: number;
  active: boolean;
}
export interface PanelRole {
  id: string;
  member_id: string;
  channel_id: string;
  role: Role;
}
export interface PanelTask {
  id: string;
  channel_id: string;
  freq: Freq;
  title: string;
  target: string | null;
  sort_order: number;
}
export interface PanelQuota {
  id: string;
  member_id: string;
  channel_id: string;
  account: string;
  per_day: number;
}
export interface PanelCheck {
  id: string;
  member_id: string;
  subject_type: "task" | "quota";
  subject_id: string;
  freq: Freq;
  period_key: string;
  done_qty: number | null;
}
export interface PessoaMapRow {
  id: string;
  pipeline_pessoa: string;
  member_id: string | null;
  note: string | null;
}
export interface SourceMapRow {
  id: string;
  pipeline_source: string;
  channel_id: string | null;
  note: string | null;
}

export const FREQ_LABEL: Record<Freq, string> = { d: "diária", s: "semanal", m: "mensal" };
export const LAYERS: Record<Layer, { label: string; desc: string }> = {
  quentes: { label: "Quentes", desc: "Proteger e ampliar" },
  volume: { label: "Volume & pré-vendas", desc: "Otimizar conversão" },
  construcao: { label: "Em construção", desc: "Tirar do papel" },
};

/** Chave do período — é o que faz o check zerar sozinho na virada. */
export function periodKey(freq: Freq, ref = new Date()): string {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, "0");
  if (freq === "m") return `${y}-${m}`;
  if (freq === "d") return `${y}-${m}-${String(ref.getDate()).padStart(2, "0")}`;
  const x = new Date(Date.UTC(y, ref.getMonth(), ref.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((x.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return `${x.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Estrutura do painel: canais, pessoas, papéis, atividades e cotas. */
export function usePanelStructure(locationId: string) {
  return useQuery({
    queryKey: ["panel-structure", locationId],
    enabled: !!locationId,
    queryFn: async () => {
      const [channels, members, roles, tasks, quotas] = await Promise.all([
        db.from("panel_channels").select("*").eq("location_id", locationId).order("sort_order"),
        db.from("panel_members").select("*").eq("location_id", locationId).order("name"),
        db.from("panel_roles").select("*").eq("location_id", locationId),
        db.from("panel_tasks").select("*").eq("location_id", locationId).order("sort_order"),
        db.from("panel_quotas").select("*").eq("location_id", locationId),
      ]);
      const err = channels.error || members.error || roles.error || tasks.error || quotas.error;
      if (err) throw err;
      return {
        channels: (channels.data ?? []) as PanelChannel[],
        members: (members.data ?? []) as PanelMember[],
        roles: (roles.data ?? []) as PanelRole[],
        tasks: (tasks.data ?? []) as PanelTask[],
        quotas: (quotas.data ?? []) as PanelQuota[],
      };
    },
  });
}

/** Marcações do período — compartilhadas: um marca, o head enxerga. */
export function usePanelChecks(locationId: string, periodKeys: string[]) {
  return useQuery({
    queryKey: ["panel-checks", locationId, periodKeys.join("|")],
    enabled: !!locationId && periodKeys.length > 0,
    queryFn: async () => {
      const { data, error } = await db.from("panel_checks")
        .select("*")
        .eq("location_id", locationId)
        .in("period_key", periodKeys);
      if (error) throw error;
      return (data ?? []) as PanelCheck[];
    },
  });
}

export function useToggleCheck(locationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      memberId: string;
      subjectType: "task" | "quota";
      subjectId: string;
      freq: Freq;
      periodKey: string;
      done: boolean;
      doneQty?: number | null;
    }) => {
      if (args.done) {
        const { error } = await db.from("panel_checks").upsert(
          {
            location_id: locationId,
            member_id: args.memberId,
            subject_type: args.subjectType,
            subject_id: args.subjectId,
            freq: args.freq,
            period_key: args.periodKey,
            done_qty: args.doneQty ?? null,
          },
          { onConflict: "member_id,subject_type,subject_id,period_key" }
        );
        if (error) throw error;
      } else {
        const { error } = await db.from("panel_checks")
          .delete()
          .eq("member_id", args.memberId)
          .eq("subject_type", args.subjectType)
          .eq("subject_id", args.subjectId)
          .eq("period_key", args.periodKey);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["panel-checks"] }),
  });
}

/** Vínculos com o pipeline — a lista completa, inclusive o que falta atribuir. */
export function usePanelMaps(locationId: string) {
  return useQuery({
    queryKey: ["panel-maps", locationId],
    enabled: !!locationId,
    queryFn: async () => {
      const [pessoa, source] = await Promise.all([
        db.from("panel_pessoa_map").select("*").eq("location_id", locationId).order("pipeline_pessoa"),
        db.from("panel_source_map").select("*").eq("location_id", locationId).order("pipeline_source"),
      ]);
      if (pessoa.error || source.error) throw pessoa.error || source.error;
      return {
        pessoas: (pessoa.data ?? []) as PessoaMapRow[],
        sources: (source.data ?? []) as SourceMapRow[],
      };
    },
  });
}

export function useSaveMap(locationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { kind: "pessoa" | "source"; id: string; targetId: string | null }) => {
      const table = args.kind === "pessoa" ? "panel_pessoa_map" : "panel_source_map";
      const column = args.kind === "pessoa" ? "member_id" : "channel_id";
      const { error } = await db
        .from(table)
        .update({ [column]: args.targetId, updated_at: new Date().toISOString() })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["panel-maps"] });
      qc.invalidateQueries({ queryKey: ["panel-realizado"] });
    },
  });
}

/**
 * CRUD da estrutura — só os heads chegam aqui pela interface.
 * Um hook só para todas as tabelas: a operação é sempre a mesma, muda a tabela.
 */
type PanelTable = "panel_channels" | "panel_members" | "panel_roles" | "panel_tasks" | "panel_quotas";

export function usePanelMutation(locationId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["panel-structure"] });
    qc.invalidateQueries({ queryKey: ["panel-maps"] });
    qc.invalidateQueries({ queryKey: ["panel-realizado"] });
  };

  const create = useMutation({
    mutationFn: async ({ table, values }: { table: PanelTable; values: Record<string, any> }) => {
      const { error } = await db.from(table).insert({ ...values, location_id: locationId });
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: async ({ table, id, values }: { table: PanelTable; id: string; values: Record<string, any> }) => {
      const { error } = await db.from(table).update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async ({ table, id }: { table: PanelTable; id: string }) => {
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return { create, update, remove };
}

export interface RealizadoRow {
  key: string;
  opps: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  faturamento: number;
}

/**
 * Realizado do mês, direto do pipeline e agregado por canal e por pessoa.
 * Puxa só as colunas necessárias e soma no cliente — o volume por mês é
 * pequeno o bastante (poucos milhares) e evita depender de view no banco.
 */
export function useRealizado(locationId: string, month: string) {
  return useQuery({
    queryKey: ["panel-realizado", locationId, month],
    enabled: !!locationId && !!month,
    queryFn: async () => {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

      const [opps, maps] = await Promise.all([
        db
          .from("ghl_pipeline_opportunities")
          .select("source,pessoa,stage,monetary_value")
          .eq("location_id", locationId)
          .gte("last_stage_change_at", start)
          .lt("last_stage_change_at", nextMonth),
        Promise.all([
          db.from("panel_source_map").select("pipeline_source,channel_id").eq("location_id", locationId),
          db.from("panel_pessoa_map").select("pipeline_pessoa,member_id").eq("location_id", locationId),
        ]),
      ]);
      if (opps.error) throw opps.error;
      const [srcMap, pesMap] = maps;
      if (srcMap.error || pesMap.error) throw srcMap.error || pesMap.error;

      const byChannel = new Map<string, RealizadoRow>();
      const byMember = new Map<string, RealizadoRow>();
      const srcTo = new Map<string, string | null>(
        (srcMap.data ?? []).map((r: { pipeline_source: string; channel_id: string | null }) => [r.pipeline_source, r.channel_id])
      );
      const pesTo = new Map<string, string | null>(
        (pesMap.data ?? []).map((r: { pipeline_pessoa: string; member_id: string | null }) => [r.pipeline_pessoa, r.member_id])
      );

      const bump = (bucket: Map<string, RealizadoRow>, key: string | null, stage: string, value: number) => {
        if (!key) return;
        const row = bucket.get(key) ?? { key, opps: 0, reunioes: 0, propostas: 0, vendas: 0, faturamento: 0 };
        row.opps++;
        if (stage === "Reuniao Realizada") row.reunioes++;
        if (stage === "Proposta em Analise") row.propostas++;
        if (stage === "Venda Fechada") {
          row.vendas++;
          row.faturamento += value || 0;
        }
        bucket.set(key, row);
      };

      let semVinculoCanal = 0;
      let semVinculoPessoa = 0;
      for (const o of opps.data ?? []) {
        const chId = o.source ? srcTo.get(o.source) ?? null : null;
        const mbId = o.pessoa ? pesTo.get(o.pessoa) ?? null : null;
        if (!chId) semVinculoCanal++;
        if (!mbId) semVinculoPessoa++;
        bump(byChannel, chId, o.stage, Number(o.monetary_value));
        bump(byMember, mbId, o.stage, Number(o.monetary_value));
      }
      return {
        byChannel,
        byMember,
        total: (opps.data ?? []).length,
        semVinculoCanal,
        semVinculoPessoa,
      };
    },
  });
}
