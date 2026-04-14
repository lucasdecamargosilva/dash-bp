import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlySalesPrimeData {
  id: number;
  proposta_em_analise: number;
  fechado: number;
  meta_propostas_em_analise: number;
  meta_vendas: number;
  created_at: string;
}

export const useMonthlySalesPrimeData = (selectedMonth: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["monthly-sales-prime", selectedMonth],
    enabled,
    queryFn: async () => {
      const [year, month] = selectedMonth.split("-");
      
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${lastDay}`;

      const [elevateResult, igniteResult, legacyResult] = await Promise.all([
        supabase
          .from("pipeline_prime_elevate")
          .select("*")
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
          .is("data_inicio", null)
          .is("data_fim", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_prime_ignite")
          .select("*")
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
          .is("data_inicio", null)
          .is("data_fim", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_prime_legacy")
          .select("*")
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
          .is("data_inicio", null)
          .is("data_fim", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (elevateResult.error) throw elevateResult.error;
      if (igniteResult.error) throw igniteResult.error;
      if (legacyResult.error) throw legacyResult.error;

      const elevate = elevateResult.data as MonthlySalesPrimeData | null;
      const ignite = igniteResult.data as MonthlySalesPrimeData | null;
      const legacy = legacyResult.data as MonthlySalesPrimeData | null;

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
