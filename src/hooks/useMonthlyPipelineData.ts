import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";

interface MonthlyPipelineData {
  id: number;
  contato: number;
  mensagem_enviada: number;
  conexao: number;
  whatsapp_obtido: number;
  reuniao_agendada: number;
  reuniao_realizada: number;
  meta_mensagens_enviadas: number;
  meta_reunioes_agendadas: number;
  meta_reunioes_realizadas: number;
  created_at: string;
}

const getTableName = (clienteName: string) => {
  const tableMap: Record<string, string> = {
    "Elyano": "pipeline_prospec_elyano",
    "Elam Lima": "pipeline_prospec_elam",
    "PR1ME ROI": "pipeline_prospec_prime",
  };
  return tableMap[clienteName] || "pipeline_prospec_elyano";
};

export const useMonthlyPipelineData = (clienteName: string, selectedMonth: string) => {
  const tableName = getTableName(clienteName);
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId;

  return useQuery({
    queryKey: ["monthly-pipeline", clienteName, selectedMonth, locationId],
    queryFn: async () => {
      // Parse selected month (format: "2025-10")
      const [year, month] = selectedMonth.split("-");

      // Get first and last day of the month
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${lastDay}`;

      // Query to get the last record of the month based on created_at
      // IMPORTANT: Exclude weekly records (data_inicio/data_fim must be null for monthly view)
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .gte("created_at", firstDay)
        .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
        .is("data_inicio", null)
        .is("data_fim", null)
        .eq("location_id", locationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      return data as unknown as MonthlyPipelineData | null;
    },
    refetchInterval: 30000,
  });
};
