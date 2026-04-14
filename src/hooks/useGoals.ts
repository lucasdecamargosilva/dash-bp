import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PipelineGoals {
  id: string;
  client_name: string;
  total_mensagens_enviadas: number;
  total_reunioes_agendadas: number;
  total_reunioes_realizadas: number;
}

export const useGoals = (clientName: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals", clientName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_goals")
        .select("*")
        .eq("client_name", clientName)
        .maybeSingle();

      if (error) throw error;
      return data as PipelineGoals | null;
    },
  });

  const updateGoalsMutation = useMutation({
    mutationFn: async (newGoals: Partial<PipelineGoals>) => {
      const { data, error } = await supabase
        .from("pipeline_goals")
        .update(newGoals)
        .eq("client_name", clientName)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", clientName] });
      toast({
        title: "Metas atualizadas",
        description: "As metas foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar metas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    goals,
    isLoading,
    updateGoals: updateGoalsMutation.mutate,
  };
};
