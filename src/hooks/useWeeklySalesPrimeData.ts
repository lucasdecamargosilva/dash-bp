import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

interface WeeklySalesPrimeData {
  id: number;
  proposta_em_analise: number;
  fechado: number;
  meta_propostas_em_analise: number;
  meta_vendas: number;
  created_at: string;
  data_inicio: string;
  data_fim: string;
}

export const useWeeklySalesPrimeData = (
  selectedMonth: string,
  selectedWeek: number,
  enabled: boolean = true
) => {
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId;

  return useQuery({
    queryKey: ["weekly-sales-prime", selectedMonth, selectedWeek, locationId],
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

      const [elevateResult, igniteResult, legacyResult] = await Promise.all([
        supabase
          .from("pipeline_prime_elevate")
          .select("*")
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_prime_ignite")
          .select("*")
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_prime_legacy")
          .select("*")
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (elevateResult.error) throw elevateResult.error;
      if (igniteResult.error) throw igniteResult.error;
      if (legacyResult.error) throw legacyResult.error;

      const elevate = elevateResult.data as WeeklySalesPrimeData | null;
      const ignite = igniteResult.data as WeeklySalesPrimeData | null;
      const legacy = legacyResult.data as WeeklySalesPrimeData | null;

      const totalPropostasEmAnalise = 
        (elevate?.proposta_em_analise || 0) +
        (ignite?.proposta_em_analise || 0) +
        (legacy?.proposta_em_analise || 0);

      const totalVendas = 
        (elevate?.fechado || 0) +
        (ignite?.fechado || 0) +
        (legacy?.fechado || 0);

      const metaPropostasEmAnalise = elevate?.meta_propostas_em_analise || 0;
      const metaVendas = elevate?.meta_vendas || 0;

      return {
        totalPropostasEmAnalise,
        totalVendas,
        metaPropostasEmAnalise,
        metaVendas,
        elevateData: elevate,
        igniteData: ignite,
        legacyData: legacy,
      };
    },
    refetchInterval: 30000,
  });
};
