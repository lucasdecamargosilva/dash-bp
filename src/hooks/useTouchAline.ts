import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Espelho do robo de prospeccao (Touch-Aline) que roda na maquina Windows.
// Quem escreve estas tabelas e o publicar_estado.py, no repositorio
// bp-prospector-windows; aqui e so leitura. Ver sql/create_touch_aline_estado.sql.
//
// As tabelas touch_aline_* nao estao em integrations/supabase/types.ts (que e gerado
// a partir do schema conhecido pelo Lovable), entao o construtor de query nao consegue
// tipa-las. Em vez de cair pra `any` como em usePanelData, o recorte abaixo declara so
// os metodos que estes dois hooks chamam — as interfaces exportadas seguem valendo.
interface Filtro<T> {
  eq(coluna: string, valor: string): Filtro<T>;
  order(coluna: string, opcoes: { ascending: boolean }): Filtro<T>;
  limit(n: number): Promise<{ data: T[] | null; error: Error | null }>;
  maybeSingle(): Promise<{ data: T | null; error: Error | null }>;
}
interface Tabela {
  select<T>(colunas: string): Filtro<T>;
}
const db = supabase as unknown as { from(tabela: string): Tabela };

/** De quanto em quanto tempo o celular vai buscar o retrato novo. */
export const INTERVALO_MS = 60_000;
/** Acima disso o espelho e velho: o robo parou, a maquina dormiu ou a rede caiu. */
export const VELHO_MIN = 15;

export type Situacao = "rodando" | "parado" | "concluido";
export type EstadoLead = "enviado" | "respondeu" | "descartado" | "erro" | "quarentena" | "pendente";

export interface Contagem {
  enviado: number;
  respondeu: number;
  descartado: number;
  erro: number;
  quarentena: number;
  pendente: number;
}

export interface Rodada {
  lote: string;
  arquivo: string;
  de: string;
  para: string;
  total: number;
  feitos: number;
  situacao: Situacao;
  ultima_atividade_min: number | null;
  contagem: Contagem;
  erros: { handle: string; erro: string }[];
}

export interface Evento {
  em: string;
  lote: string;
  handle: string;
  estado: EstadoLead;
}

export interface Hoje {
  enviados: number;
  respostas: number;
  erros: number;
  descartados: number;
  pendentes: number;
}

export interface TouchAlineEstado {
  conta: string;
  host: string | null;
  publicado_em: string | null;
  dia: string | null;
  lista_do_dia: { arquivo?: string; existe?: boolean; total?: number } | null;
  /** O que aconteceu HOJE: transicoes contadas pelo publicador, nao o acumulado dos
   *  lotes — um lote de follow-up pode ser de dias atras. */
  hoje: Hoje | null;
  rodadas: Rodada[];
  eventos: Evento[];
  funil: { atualizado_em?: string; por_touch?: Record<string, number>; erro?: string } | null;
  logs: Record<string, { linhas: string[]; idade_min: number | null }> | null;
  alertas: string[];
}

export interface DiaSerie {
  dia: string;
  enviados: number;
  erros: number;
  respostas: number;
  descartados: number;
}

/** O retrato mais recente publicado pela maquina Windows. */
export function useTouchAlineEstado(conta = "Aline") {
  return useQuery({
    queryKey: ["touch-aline-estado", conta],
    refetchInterval: INTERVALO_MS,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<TouchAlineEstado | null> => {
      const { data, error } = await db
        .from("touch_aline_estado")
        .select<TouchAlineEstado>("*")
        .eq("conta", conta)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        rodadas: data.rodadas ?? [],
        eventos: data.eventos ?? [],
        alertas: data.alertas ?? [],
      };
    },
  });
}

/** Serie dos ultimos dias, para ver se hoje esta fora do normal. */
export function useTouchAlineDias(conta = "Aline", dias = 14) {
  return useQuery({
    queryKey: ["touch-aline-dias", conta, dias],
    refetchInterval: INTERVALO_MS,
    queryFn: async (): Promise<DiaSerie[]> => {
      const { data, error } = await db
        .from("touch_aline_dia")
        .select<DiaSerie>("dia, enviados, erros, respostas, descartados")
        .eq("conta", conta)
        .order("dia", { ascending: false })
        .limit(dias);
      if (error) throw error;
      return (data ?? []).slice().reverse();
    },
  });
}

/** Minutos desde um carimbo ISO. null quando nao ha carimbo. */
export function minutosDesde(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

/** "agora", "há 8 min", "há 2h10" — o suficiente para bater o olho no celular. */
export function haQuanto(min: number | null): string {
  if (min === null) return "—";
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `há ${h}h${String(m).padStart(2, "0")}` : `há ${h}h`;
}
