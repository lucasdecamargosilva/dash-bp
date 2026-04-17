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
  inboundRecordId?: number;
  outboundRecordId?: number;
}

export const useMonthlyElamCombinedData = (selectedMonth: string) => {
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId;

  return useQuery({
    queryKey: ["monthly-elam-combined", selectedMonth, locationId],
    queryFn: async () => {
      // Parse selected month (format: "2025-10")
      const [year, month] = selectedMonth.split("-");

      // Get first and last day of the month
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${lastDay}`;

      // Fetch from pipeline_elam_inbound
      const inboundResult = await supabase
        .from("pipeline_elam_inbound" as any)
        .select("*")
        .gte("created_at", firstDay)
        .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
        .is("data_inicio", null)
        .is("data_fim", null)
        .eq("location_id", locationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inboundResult.error) throw inboundResult.error;
      const inboundData = inboundResult.data as any;

      // Fetch from pipeline_elam_outbound
      const outboundResult = await supabase
        .from("pipeline_elam_outbound" as any)
        .select("*")
        .gte("created_at", firstDay)
        .lte("created_at", `${lastDayStr}T23:59:59.999Z`)
        .is("data_inicio", null)
        .is("data_fim", null)
        .eq("location_id", locationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (outboundResult.error) throw outboundResult.error;
      const outboundData = outboundResult.data as any;

      // If both are null, return null
      if (!inboundData && !outboundData) return null;

      // Sum the data from both tables
      const combined: MonthlyPipelineData = {
        id: inboundData?.id || outboundData?.id || 0,
        contato: (inboundData?.contato || 0) + (outboundData?.contato || 0),
        mensagem_enviada: (inboundData?.mensagem_enviada || 0) + (outboundData?.mensagem_enviada || 0),
        conexao: (inboundData?.conexao || 0) + (outboundData?.conexao || 0),
        whatsapp_obtido: (inboundData?.whatsapp_obtido || 0) + (outboundData?.whatsapp_obtido || 0),
        reuniao_agendada: (inboundData?.reuniao_agendada || 0) + (outboundData?.reuniao_agendada || 0),
        reuniao_realizada: (inboundData?.reuniao_realizada || 0) + (outboundData?.reuniao_realizada || 0),
        meta_mensagens_enviadas: outboundData?.meta_mensagens_enviadas || 0,
        meta_reunioes_agendadas: outboundData?.meta_reunioes_agendadas || 0,
        meta_reunioes_realizadas: outboundData?.meta_reunioes_realizadas || 0,
        created_at: inboundData?.created_at || outboundData?.created_at || new Date().toISOString(),
        inboundRecordId: inboundData?.id,
        outboundRecordId: outboundData?.id,
      };

      return combined;
    },
    refetchInterval: 30000,
  });
};
