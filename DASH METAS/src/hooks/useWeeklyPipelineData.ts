import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyPipelineData {
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
  data_inicio: string;
  data_fim: string;
}

const getTableName = (clienteName: string) => {
  const tableMap: Record<string, string> = {
    "Elyano": "pipeline_prospec_elyano",
    "Elam Lima": "pipeline_prospec_elam",
    "PR1ME ROI": "pipeline_prospec_prime",
  };
  return tableMap[clienteName] || "pipeline_prospec_elyano";
};

export const useWeeklyPipelineData = (
  clienteName: string,
  selectedMonth: string,
  selectedWeek: number,
  enabled: boolean = true
) => {
  const tableName = getTableName(clienteName);

  return useQuery({
    queryKey: ["weekly-pipeline", clienteName, selectedMonth, selectedWeek],
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

      // Query using exact date matching for weekly records
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("data_inicio", dataInicio)
        .eq("data_fim", dataFim)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      return data as unknown as WeeklyPipelineData | null;
    },
    refetchInterval: 30000,
  });
};
