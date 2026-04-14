import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface SalesPipelineData {
  id: number;
  proposta_em_analise: number;
  fechado: number;
  data_atualizacao: string;
  updated_at: string;
}

interface DateFilter {
  startDate?: Date;
  endDate?: Date;
}

// Hook para buscar dados da tabela pipeline_elyano_high_profile
const useHighProfileData = (dateFilter?: DateFilter) => {
  return useQuery({
    queryKey: ["sales-pipeline-high-profile", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("pipeline_elyano_high_profile")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateFilter?.startDate) {
        query = query.gte("created_at", dateFilter.startDate.toISOString().split('T')[0]);
      }
      if (dateFilter?.endDate) {
        query = query.lte("created_at", dateFilter.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SalesPipelineData[];
    },
    refetchInterval: 30000,
  });
};

// Hook para buscar dados da tabela pipeline_elyano_higher
const useHigherData = (dateFilter?: DateFilter) => {
  return useQuery({
    queryKey: ["sales-pipeline-higher", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("pipeline_elyano_higher")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateFilter?.startDate) {
        query = query.gte("created_at", dateFilter.startDate.toISOString().split('T')[0]);
      }
      if (dateFilter?.endDate) {
        query = query.lte("created_at", dateFilter.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SalesPipelineData[];
    },
    refetchInterval: 30000,
  });
};

// Hook para buscar dados da tabela pipeline_elyano_high_one
const useHighOneData = (dateFilter?: DateFilter) => {
  return useQuery({
    queryKey: ["sales-pipeline-high-one", dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("pipeline_elyano_high_one")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateFilter?.startDate) {
        query = query.gte("created_at", dateFilter.startDate.toISOString().split('T')[0]);
      }
      if (dateFilter?.endDate) {
        query = query.lte("created_at", dateFilter.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SalesPipelineData[];
    },
    refetchInterval: 30000,
  });
};

// Hook principal que combina os dados de todas as tabelas
export const useSalesPipelineMetrics = (dateFilter?: DateFilter) => {
  const { data: highProfileData, isLoading: isLoadingHighProfile, error: errorHighProfile } = useHighProfileData(dateFilter);
  const { data: higherData, isLoading: isLoadingHigher, error: errorHigher } = useHigherData(dateFilter);
  const { data: highOneData, isLoading: isLoadingHighOne, error: errorHighOne } = useHighOneData(dateFilter);

  const isLoading = isLoadingHighProfile || isLoadingHigher || isLoadingHighOne;
  const error = errorHighProfile || errorHigher || errorHighOne;

  const metrics = useMemo(() => {
    if (!highProfileData || !higherData || !highOneData) {
      return {
        totalReunioes: 0,
        totalVendas: 0,
      };
    }

    // Para cada tabela, pegar apenas o último registro (mais recente)
    const latestHighProfile = highProfileData[0];
    const latestHigher = higherData[0];
    const latestHighOne = highOneData[0];

    const totalReunioes = 
      (latestHighProfile?.proposta_em_analise || 0) +
      (latestHigher?.proposta_em_analise || 0) +
      (latestHighOne?.proposta_em_analise || 0);

    const totalVendas = 
      (latestHighProfile?.fechado || 0) +
      (latestHigher?.fechado || 0) +
      (latestHighOne?.fechado || 0);

    return {
      totalReunioes,
      totalVendas,
    };
  }, [highProfileData, higherData, highOneData]);

  return {
    metrics,
    isLoading,
    error,
  };
};
