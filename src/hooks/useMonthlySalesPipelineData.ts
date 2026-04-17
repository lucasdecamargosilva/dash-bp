import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

interface MonthlySalesPipelineData {
  id: number;
  proposta_em_analise: number;
  fechado: number;
  meta_propostas_em_analise: number;
  meta_vendas: number;
  created_at: string;
}

export const useMonthlySalesPipelineData = (selectedMonth: string, enabled: boolean = true) => {
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId;

  return useQuery({
    queryKey: ["monthly-sales-pipeline", selectedMonth, locationId],
    enabled,
    queryFn: async () => {
      // Parse selected month (format: "2025-10")
      const [year, month] = selectedMonth.split("-");

      // Get first and last day of the month
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${lastDay}`;

      // Query all three tables for the selected month using created_at
      // IMPORTANT: Exclude weekly records (data_inicio/data_fim must be null for monthly view)
      const [highProfileResult, higherResult, highOneResult] = await Promise.all([
        supabase
          .from("pipeline_elyano_high_profile")
          .select("*")
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
          .is("data_inicio", null)
          .is("data_fim", null)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_elyano_higher")
          .select("*")
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
          .is("data_inicio", null)
          .is("data_fim", null)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pipeline_elyano_high_one")
          .select("*")
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
          .is("data_inicio", null)
          .is("data_fim", null)
          .eq("location_id", locationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (highProfileResult.error) throw highProfileResult.error;
      if (higherResult.error) throw higherResult.error;
      if (highOneResult.error) throw highOneResult.error;

      const highProfile = highProfileResult.data as MonthlySalesPipelineData | null;
      const higher = higherResult.data as MonthlySalesPipelineData | null;
      const highOne = highOneResult.data as MonthlySalesPipelineData | null;

      // Sum up the metrics from all three tables
      const totalPropostasEmAnalise = 
        (highProfile?.proposta_em_analise || 0) +
        (higher?.proposta_em_analise || 0) +
        (highOne?.proposta_em_analise || 0);

      const totalVendas = 
        (highProfile?.fechado || 0) +
        (higher?.fechado || 0) +
        (highOne?.fechado || 0);

      // For goals, we'll use the values from high_profile as the reference
      // (all three tables should have the same goal values after editing)
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
