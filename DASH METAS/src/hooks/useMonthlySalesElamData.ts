import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlySalesElamData {
  id: number;
  proposta_em_analise: number;
  fechado: number;
  meta_propostas_em_analise: number;
  meta_vendas: number;
  created_at: string;
}

export const useMonthlySalesElamData = (selectedMonth: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["monthly-sales-elam", selectedMonth],
    enabled,
    queryFn: async () => {
      const [year, month] = selectedMonth.split("-");
      
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${lastDay}`;

      const { data, error } = await supabase
        .from("pipeline_elam_vida_plena")
        .select("*")
        .gte("created_at", firstDay)
        .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
        .is("data_inicio", null)
        .is("data_fim", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      return {
        totalPropostasEmAnalise: data?.proposta_em_analise || 0,
        totalVendas: data?.fechado || 0,
        metaPropostasEmAnalise: data?.meta_propostas_em_analise || 0,
        metaVendas: data?.meta_vendas || 0,
        yayData: data as unknown as MonthlySalesElamData | null,
      };
    },
    refetchInterval: 30000,
  });
};
