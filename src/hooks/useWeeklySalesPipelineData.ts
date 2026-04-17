import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

interface WeeklySalesPipelineData {
  id: number;
  proposta_em_analise: number;
  fechado: number;
  meta_propostas_em_analise: number;
  meta_vendas: number;
  created_at: string;
  data_inicio: string;
  data_fim: string;
}

export const useWeeklySalesPipelineData = (selectedMonth: string, selectedWeek: number, enabled: boolean = true) => {
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId;

  return useQuery({
    queryKey: ["weekly-sales-pipeline", selectedMonth, selectedWeek, locationId],
    enabled,
    queryFn: async () => {
      // Parse selected month (format: "2025-10")
      const [year, month] = selectedMonth.split("-");
      
      // Calculate week ranges based on the week number
      let startDay: number;
      let endDay: number;
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      
      switch (selectedWeek) {
        case 1:
          startDay = 1;
          endDay = 8;
          break;
        case 2:
          startDay = 7;
          endDay = 15;
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
          endDay = 8;
      }

      const dataInicio = `${year}-${month}-${String(startDay).padStart(2, '0')}`;
      const dataFim = `${year}-${month}-${String(endDay).padStart(2, '0')}`;

      // Query all three tables for the specific week using exact date matching
      const [highProfileResult, higherResult, highOneResult] = await Promise.all([
        supabase
          .from("pipeline_elyano_high_profile")
          .select("*")
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_elyano_higher")
          .select("*")
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_elyano_high_one")
          .select("*")
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (highProfileResult.error) throw highProfileResult.error;
      if (higherResult.error) throw higherResult.error;
      if (highOneResult.error) throw highOneResult.error;

      const highProfile = highProfileResult.data as WeeklySalesPipelineData | null;
      const higher = higherResult.data as WeeklySalesPipelineData | null;
      const highOne = highOneResult.data as WeeklySalesPipelineData | null;

      // Sum up the metrics from all three tables
      const totalPropostasEmAnalise = 
        (highProfile?.proposta_em_analise || 0) +
        (higher?.proposta_em_analise || 0) +
        (highOne?.proposta_em_analise || 0);

      const totalVendas = 
        (highProfile?.fechado || 0) +
        (higher?.fechado || 0) +
        (highOne?.fechado || 0);

      // For goals, use the values from high_profile as reference
      const metaPropostasEmAnalise = highProfile?.meta_propostas_em_analise || 0;
      const metaVendas = highProfile?.meta_vendas || 0;

      return {
        totalPropostasEmAnalise,
        totalVendas,
        metaPropostasEmAnalise,
        metaVendas,
        highProfileData: highProfile,
        higherData: higher,
        highOneData: highOne,
      };
    },
    refetchInterval: 30000,
  });
};
