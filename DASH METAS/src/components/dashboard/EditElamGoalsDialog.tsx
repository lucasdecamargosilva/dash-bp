import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Rocket } from "lucide-react";

interface EditElamGoalsDialogProps {
  selectedMonth: string;
  inboundRecordId?: number;
  outboundRecordId?: number;
  currentGoals: {
    meta_mensagens_enviadas: number;
    meta_reunioes_agendadas: number;
    meta_reunioes_realizadas: number;
  };
  onGoalsUpdated: () => void;
  isWeeklyView?: boolean;
  selectedWeek?: number;
}

export const EditElamGoalsDialog = ({
  selectedMonth,
  inboundRecordId,
  outboundRecordId,
  currentGoals,
  onGoalsUpdated,
  isWeeklyView = false,
  selectedWeek = 1,
}: EditElamGoalsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [goals, setGoals] = useState(currentGoals);

  useEffect(() => {
    setGoals(currentGoals);
  }, [currentGoals]);

  const handleSave = async () => {
    try {
      const [year, month] = selectedMonth.split("-");

      if (isWeeklyView) {
        // Visão semanal - atualizar TODOS os registros da semana
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

        // Atualizar TODOS os registros inbound da semana
        const { error: inboundError } = await supabase
          .from("pipeline_elam_inbound" as any)
          .update({
            meta_mensagens_enviadas: goals.meta_mensagens_enviadas,
            meta_reunioes_agendadas: goals.meta_reunioes_agendadas,
            meta_reunioes_realizadas: goals.meta_reunioes_realizadas,
          })
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim);

        if (inboundError) throw inboundError;

        // Atualizar TODOS os registros outbound da semana
        const { error: outboundError } = await supabase
          .from("pipeline_elam_outbound" as any)
          .update({
            meta_mensagens_enviadas: goals.meta_mensagens_enviadas,
            meta_reunioes_agendadas: goals.meta_reunioes_agendadas,
            meta_reunioes_realizadas: goals.meta_reunioes_realizadas,
          })
          .eq("data_inicio", dataInicio)
          .eq("data_fim", dataFim);

        if (outboundError) throw outboundError;

      } else {
        // Visão mensal - atualizar TODOS os registros mensais
        const firstDay = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

        // Atualizar TODOS os registros inbound mensais
        const { error: inboundError } = await supabase
          .from("pipeline_elam_inbound" as any)
          .update({
            meta_mensagens_enviadas: goals.meta_mensagens_enviadas,
            meta_reunioes_agendadas: goals.meta_reunioes_agendadas,
            meta_reunioes_realizadas: goals.meta_reunioes_realizadas,
          })
          .is("data_inicio", null)
          .is("data_fim", null)
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`);

        if (inboundError) throw inboundError;

        // Atualizar TODOS os registros outbound mensais
        const { error: outboundError } = await supabase
          .from("pipeline_elam_outbound" as any)
          .update({
            meta_mensagens_enviadas: goals.meta_mensagens_enviadas,
            meta_reunioes_agendadas: goals.meta_reunioes_agendadas,
            meta_reunioes_realizadas: goals.meta_reunioes_realizadas,
          })
          .is("data_inicio", null)
          .is("data_fim", null)
          .gte("created_at", firstDay)
          .lte("created_at", `${lastDayStr}T23:59:59.999Z`);

        if (outboundError) throw outboundError;
      }

      toast({
        title: "Metas atualizadas",
        description: isWeeklyView 
          ? `Metas da semana ${selectedWeek} foram atualizadas com sucesso`
          : "Metas mensais foram atualizadas com sucesso",
      });

      setOpen(false);
      onGoalsUpdated();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar metas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Rocket className="h-4 w-4" />
          Editar Metas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Editar Metas de Prospecção - Elam Lima
            {isWeeklyView && ` (Semana ${selectedWeek})`}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="mensagens">Meta de Mensagens Enviadas</Label>
            <Input
              id="mensagens"
              type="number"
              value={goals.meta_mensagens_enviadas}
              onChange={(e) =>
                setGoals({ ...goals, meta_mensagens_enviadas: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agendadas">Meta de Reuniões Agendadas</Label>
            <Input
              id="agendadas"
              type="number"
              value={goals.meta_reunioes_agendadas}
              onChange={(e) =>
                setGoals({ ...goals, meta_reunioes_agendadas: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="realizadas">Meta de Reuniões Realizadas</Label>
            <Input
              id="realizadas"
              type="number"
              value={goals.meta_reunioes_realizadas}
              onChange={(e) =>
                setGoals({ ...goals, meta_reunioes_realizadas: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};