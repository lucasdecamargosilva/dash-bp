import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Série mensal do funil, agregada no banco pela função panel_monthly_series.
 *
 * Substitui a leitura de ghl_pipeline_summary, que tinha dois problemas:
 * não filtrava location_id — e acabava mostrando os números de outro cliente —
 * e, para o PR1ME, só existiam linhas month='all', sem série mensal nenhuma.
 *
 * A agregação fica no Postgres de propósito: são ~20 mil oportunidades no
 * período, e trazer tudo para somar no navegador seria desperdício.
 */

export type Metrica = "faturamento" | "contatos" | "reunioes" | "propostas" | "vendas";

export const METRICAS: { id: Metrica; label: string; moeda?: boolean }[] = [
  { id: "faturamento", label: "Faturamento", moeda: true },
  { id: "contatos", label: "Contatos" },
  { id: "reunioes", label: "Reuniões" },
  { id: "propostas", label: "Propostas" },
  { id: "vendas", label: "Vendas" },
];

interface LinhaSerie {
  mes: string;
  canal: string;
  contatos: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  faturamento: number;
}

const MES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const rotuloMes = (mes: string) => {
  const [y, m] = mes.split("-");
  return `${MES_LABEL[+m - 1]}/${y.slice(2)}`;
};

export function useMonthlySeries(locationId: string, meses = 6) {
  return useQuery({
    queryKey: ["monthly-series", locationId, meses],
    enabled: !!locationId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("panel_monthly_series", {
        loc: locationId,
        meses,
      });
      if (error) throw error;
      const linhas = ((data ?? []) as any[]).map((r) => ({
        mes: r.mes,
        canal: r.canal,
        contatos: Number(r.contatos),
        reunioes: Number(r.reunioes),
        propostas: Number(r.propostas),
        vendas: Number(r.vendas),
        faturamento: Number(r.faturamento),
      })) as LinhaSerie[];

      const meses_ = [...new Set(linhas.map((l) => l.mes))].sort();
      const canais = [...new Set(linhas.map((l) => l.canal))];

      /** Uma linha por mês com o total — o que o gráfico mostra por padrão. */
      const total = meses_.map((mes) => {
        const doMes = linhas.filter((l) => l.mes === mes);
        return {
          mes,
          label: rotuloMes(mes),
          contatos: doMes.reduce((a, l) => a + l.contatos, 0),
          reunioes: doMes.reduce((a, l) => a + l.reunioes, 0),
          propostas: doMes.reduce((a, l) => a + l.propostas, 0),
          vendas: doMes.reduce((a, l) => a + l.vendas, 0),
          faturamento: doMes.reduce((a, l) => a + l.faturamento, 0),
        };
      });

      /** Volume acumulado por canal — usado para escolher quais linhas plotar. */
      const pesoCanal = new Map<string, number>();
      for (const l of linhas) pesoCanal.set(l.canal, (pesoCanal.get(l.canal) ?? 0) + l.contatos);

      return { linhas, meses: meses_, canais, total, pesoCanal };
    },
  });
}

/** Monta os pontos do gráfico quebrados por canal, para a métrica escolhida. */
export function seriePorCanal(
  dados: { linhas: LinhaSerie[]; meses: string[]; pesoCanal: Map<string, number> } | undefined,
  metrica: Metrica,
  topN = 5
) {
  if (!dados) return { pontos: [], canais: [] as string[] };
  // só os canais que realmente pesam: o resto vira ruído visual
  const canais = [...dados.pesoCanal.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([c]) => c);
  const pontos = dados.meses.map((mes) => {
    const ponto: Record<string, any> = { mes, label: rotuloMes(mes) };
    for (const canal of canais) {
      ponto[canal] = dados.linhas.find((l) => l.mes === mes && l.canal === canal)?.[metrica] ?? 0;
    }
    return ponto;
  });
  return { pontos, canais };
}
