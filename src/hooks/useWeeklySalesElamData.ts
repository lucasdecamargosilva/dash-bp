import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeeklySalesElamData {
  id: number;
  proposta_em_analise: number;
  fechado: number;
  meta_propostas_em_analise: number;
  meta_vendas: number;
  created_at: string;
  data_inicio: string;
  data_fim: string;
}

export const useWeeklySalesElamData = (
  selectedMonth: string,
  selectedWeek: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["weekly-sales-elam", selectedMonth, selectedWeek],
    enabled,
    queryFn: async () => {
      const [year, month] = selectedMonth.split("-");
      
      let startDay: number;
      let endDay: number;
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      
      switch (selectedWeek) {
        case 1:
          startDay = 1;
          endDay = 7;
          break;
        case 2:
          startDay = 7;
          endDay = 14;
          break;
        case 3:
          startDay = 14;
          endDay = 21;
          break;
        case 4:
          startDay = 21;
          endDay = lastDayOfMonth;
          break;
        default:
          startDay = 1;
          endDay = 7;
      }

      const dataInicio = `${year}-${month}-${String(startDay).padStart(2, '0')}`;
      const dataFim = `${year}-${month}-${String(endDay).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from("pipeline_elam_vida_plena")
        .select("*")
        .eq("data_inicio", dataInicio)
        .eq("data_fim", dataFim)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      return {
        totalPropostasEmAnalise: data?.proposta_em_analise || 0,
        totalVendas: data?.fechado || 0,
        metaPropostasEmAnalise: data?.meta_propostas_em_analise || 0,
        metaVendas: data?.meta_vendas || 0,
        yayData: data as unknown as WeeklySalesElamData | null,
      };
    },
    refetchInterval: 30000,
  });
};
