import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Rocket } from "lucide-react";

interface EditMonthlyGoalsDialogProps {
  clienteName: string;
  selectedMonth: string;
  lastRecordId?: number;
  currentGoals: {
    meta_mensagens_enviadas: number;
    meta_reunioes_agendadas: number;
    meta_reunioes_realizadas: number;
  };
  onGoalsUpdated: () => void;
  isWeeklyView?: boolean;
  selectedWeek?: number;
}

const getTableName = (clienteName: string) => {
  const tableMap: Record<string, string> = {
    "Elyano": "pipeline_prospec_elyano",
    "Elam Lima": "pipeline_prospec_elam",
    "PR1ME ROI": "pipeline_prospec_prime",
  };
  return tableMap[clienteName] || "pipeline_prospec_elyano";
};

export const EditMonthlyGoalsDialog = ({
  clienteName,
  selectedMonth,
  lastRecordId,
  currentGoals,
  onGoalsUpdated,
  isWeeklyView = false,
  selectedWeek = 1,
}: EditMonthlyGoalsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState(currentGoals);

  useEffect(() => {
    setGoals(currentGoals);
  }, [currentGoals]);

  const handleSave = async () => {
    const tableName = getTableName(clienteName);

    // Se for visão semanal, buscar o registro pela semana
    if (isWeeklyView) {
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

      // Buscar o registro pela semana
      const { data: weekRecord, error: fetchError } = await supabase
        .from(tableName as any)
        .select("id")
        .eq("data_inicio", dataInicio)
        .eq("data_fim", dataFim)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !weekRecord) {
        toast({
          title: "Erro",
          description: "Nenhum registro encontrado para esta semana",
          variant: "destructive",
        });
        return;
      }

      const recordId = (weekRecord as any).id;

      const { error } = await supabase
        .from(tableName as any)
        .update({
          meta_mensagens_enviadas: goals.meta_mensagens_enviadas,
          meta_reunioes_agendadas: goals.meta_reunioes_agendadas,
          meta_reunioes_realizadas: goals.meta_reunioes_realizadas,
        })
        .eq("data_inicio", dataInicio)
        .eq("data_fim", dataFim);

      if (error) {
        toast({
          title: "Erro ao atualizar metas",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Metas atualizadas",
        description: `Metas da semana ${selectedWeek} foram atualizadas com sucesso`,
      });
    } else {
      // Visão mensal - atualizar TODOS os registros mensais do período
      const [year, month] = selectedMonth.split("-");
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const { error } = await supabase
        .from(tableName as any)
        .update({
          meta_mensagens_enviadas: goals.meta_mensagens_enviadas,
          meta_reunioes_agendadas: goals.meta_reunioes_agendadas,
          meta_reunioes_realizadas: goals.meta_reunioes_realizadas,
        })
        .is("data_inicio", null)
        .is("data_fim", null)
        .gte("created_at", firstDay)
        .lte("created_at", `${lastDayStr}T23:59:59.999Z`);

      if (error) {
        toast({
          title: "Erro ao atualizar metas",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Metas atualizadas",
        description: `Metas do mês foram atualizadas com sucesso`,
      });
    }
    
    setOpen(false);
    onGoalsUpdated();
  };

  const [year, month] = selectedMonth.split("-");
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const monthName = monthNames[parseInt(month) - 1];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Rocket className="mr-2 h-4 w-4" />
          Editar Metas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Metas - {monthName} de {year}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="mensagens">Mensagens Enviadas</Label>
            <Input
              id="mensagens"
              type="number"
              value={goals.meta_mensagens_enviadas}
              onChange={(e) =>
                setGoals({ ...goals, meta_mensagens_enviadas: parseInt(e.target.value) || 0 })
              }
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agendadas">Reuniões Agendadas</Label>
            <Input
              id="agendadas"
              type="number"
              value={goals.meta_reunioes_agendadas}
              onChange={(e) =>
                setGoals({ ...goals, meta_reunioes_agendadas: parseInt(e.target.value) || 0 })
              }
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="realizadas">Reuniões Realizadas</Label>
            <Input
              id="realizadas"
              type="number"
              value={goals.meta_reunioes_realizadas}
              onChange={(e) =>
                setGoals({ ...goals, meta_reunioes_realizadas: parseInt(e.target.value) || 0 })
              }
              min="0"
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            Salvar Metas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
