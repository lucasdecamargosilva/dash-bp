import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { z } from "zod";
import { useTenant } from "@/context/TenantContext";

const ClientSchema = z.enum(['Elyano', 'Elam Lima', 'PR1ME ROI']);

const DateFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: "Data inicial deve ser anterior à data final" }
);

export interface PipelineData {
  id: number;
  contato: number | null;
  mensagem_enviada: number | null;
  conexao: number | null;
  reuniao_agendada: number | null;
  reuniao_realizada: number | null;
  data_atualizacao: string | null;
  created_at: string;
  updated_at: string;
}

interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

export const usePipelineData = (cliente: string, dateFilter?: DateFilter) => {
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId;

  return useQuery({
    queryKey: ["pipeline-data", cliente, dateFilter, locationId],
    queryFn: async () => {
      try {
        // Validate inputs
        const validatedClient = ClientSchema.parse(cliente);
        if (dateFilter) {
          DateFilterSchema.parse(dateFilter);
        }

        const tableMap: Record<string, string> = {
          'Elyano': 'pipeline_prospec_elyano',
          'Elam Lima': 'pipeline_prospec_elam',
          'PR1ME ROI': 'pipeline_prospec_prime'
        };

        const tableName = tableMap[validatedClient];
        let query;

        // Create query based on table name
        switch (tableName) {
          case 'pipeline_prospec_elyano':
            query = supabase.from('pipeline_prospec_elyano').select("*").eq('location_id', locationId);
            break;
          case 'pipeline_prospec_elam':
            query = supabase.from('pipeline_prospec_elam').select("*").eq('location_id', locationId);
            break;
          case 'pipeline_prospec_prime':
            query = supabase.from('pipeline_prospec_prime').select("*").eq('location_id', locationId);
            break;
          default:
            query = supabase.from('pipeline_prospec_elyano').select("*").eq('location_id', locationId);
        }

        // Apply date filters if provided
        if (dateFilter?.startDate) {
          const startDateStr = dateFilter.startDate.toISOString().split('T')[0];
          query = query.gte('data_atualizacao', startDateStr);
        }
        
        if (dateFilter?.endDate) {
          const endDateStr = dateFilter.endDate.toISOString().split('T')[0];
          query = query.lte('data_atualizacao', endDateStr);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        return (data || []) as PipelineData[];
      } catch (err) {
        console.error('Error fetching pipeline data:', err);
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const usePipelineMetrics = (cliente: string, dateFilter?: DateFilter) => {
  const { data: pipelineData, ...queryResult } = usePipelineData(cliente, dateFilter);

  const metrics = useMemo(() => {
    if (!pipelineData || pipelineData.length === 0) {
      return {
        totalContatos: 0,
        totalMensagensEnviadas: 0,
        totalReunioesAgendadas: 0,
        totalReunioesRealizadas: 0,
        taxaConversaoMensagem: 0,
        taxaConversaoReuniao: 0,
        taxaConversaoFinal: 0,
      };
    }

    // If there's a date filter, get the latest record from the period
    if (dateFilter?.startDate || dateFilter?.endDate) {
      const latest = pipelineData[0];
      
      const totalContatos = latest?.contato || 0;
      const totalMensagensEnviadas = latest?.mensagem_enviada || 0;
      const totalReunioesAgendadas = (latest?.reuniao_agendada || 0) + (latest?.reuniao_realizada || 0);
      const totalReunioesRealizadas = latest?.reuniao_realizada || 0;

      // Calculate conversion rates
      const taxaConversaoMensagem = totalContatos > 0 ? (totalMensagensEnviadas / totalContatos) * 100 : 0;
      const taxaConversaoReuniao = totalMensagensEnviadas > 0 ? (totalReunioesAgendadas / totalMensagensEnviadas) * 100 : 0;
      const taxaConversaoFinal = totalMensagensEnviadas > 0 ? (totalReunioesRealizadas / totalMensagensEnviadas) * 100 : 0;

      return {
        totalContatos,
        totalMensagensEnviadas,
        totalReunioesAgendadas,
        totalReunioesRealizadas,
        taxaConversaoMensagem,
        taxaConversaoReuniao,
        taxaConversaoFinal,
      };
    }

    // Get the latest record for current metrics (no date filter)
    const latest = pipelineData[0];

    const totalContatos = latest.contato || 0;
    const totalMensagensEnviadas = latest.mensagem_enviada || 0;
    const totalReunioesAgendadas = (latest.reuniao_agendada || 0) + (latest.reuniao_realizada || 0);
    const totalReunioesRealizadas = latest.reuniao_realizada || 0;

    // Calculate conversion rates
    const taxaConversaoMensagem = totalContatos > 0 ? (totalMensagensEnviadas / totalContatos) * 100 : 0;
    const taxaConversaoReuniao = totalMensagensEnviadas > 0 ? (totalReunioesAgendadas / totalMensagensEnviadas) * 100 : 0;
    const taxaConversaoFinal = totalMensagensEnviadas > 0 ? (totalReunioesRealizadas / totalMensagensEnviadas) * 100 : 0;

    return {
      totalContatos,
      totalMensagensEnviadas,
      totalReunioesAgendadas,
      totalReunioesRealizadas,
      taxaConversaoMensagem,
      taxaConversaoReuniao,
      taxaConversaoFinal,
    };
  }, [pipelineData, dateFilter]);

  return {
    ...queryResult,
    data: pipelineData,
    metrics,
  };
};