import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditSalesGoalsDialogProps {
  selectedMonth: string;
  currentGoals: {
    metaPropostasEmAnalise: number;
    metaVendas: number;
  };
  onGoalsUpdated: () => void;
  isWeeklyView?: boolean;
  selectedWeek?: number;
  clienteName?: string;
}

export const EditSalesGoalsDialog = ({
  selectedMonth,
  currentGoals,
  onGoalsUpdated,
  isWeeklyView = false,
  selectedWeek = 1,
  clienteName = "Elyano",
}: EditSalesGoalsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [metaPropostasEmAnalise, setMetaPropostasEmAnalise] = useState(
    currentGoals.metaPropostasEmAnalise
  );
  const [metaVendas, setMetaVendas] = useState(currentGoals.metaVendas);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const [year, month] = selectedMonth.split("-");
      
      if (clienteName === "Elam Lima") {
        // Lógica para Elam Lima - atualizar TODOS os registros do período
        if (isWeeklyView && selectedWeek) {
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

          const { error } = await supabase
            .from("pipeline_elam_vida_plena")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .eq("data_inicio", dataInicio)
            .eq("data_fim", dataFim);

          if (error) throw error;
        } else {
          const firstDay = `${year}-${month}-01`;
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

          const { error } = await supabase
            .from("pipeline_elam_vida_plena")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .is("data_inicio", null)
            .is("data_fim", null)
            .gte("created_at", firstDay)
            .lte("created_at", `${lastDayStr}T23:59:59.999Z`);

          if (error) throw error;
        }

        toast({
          title: "Sucesso",
          description: "Metas atualizadas com sucesso",
        });

        setOpen(false);
        onGoalsUpdated();
        setIsLoading(false);
        return;
      }

      // Lógica para PR1ME ROI - atualizar TODOS os registros do período nas 3 tabelas
      if (clienteName === "PR1ME ROI") {
        if (isWeeklyView && selectedWeek) {
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

          const [elevateResult, igniteResult, legacyResult] = await Promise.all([
            supabase
              .from("pipeline_prime_elevate")
              .update({
                meta_propostas_em_analise: metaPropostasEmAnalise,
                meta_vendas: metaVendas,
              })
              .eq("data_inicio", dataInicio)
              .eq("data_fim", dataFim),
            supabase
              .from("pipeline_prime_ignite")
              .update({
                meta_propostas_em_analise: metaPropostasEmAnalise,
                meta_vendas: metaVendas,
              })
              .eq("data_inicio", dataInicio)
              .eq("data_fim", dataFim),
            supabase
              .from("pipeline_prime_legacy")
              .update({
                meta_propostas_em_analise: metaPropostasEmAnalise,
                meta_vendas: metaVendas,
              })
              .eq("data_inicio", dataInicio)
              .eq("data_fim", dataFim),
          ]);

          const errors = [elevateResult, igniteResult, legacyResult].filter(r => r.error);
          if (errors.length > 0) {
            throw new Error("Erro ao atualizar metas");
          }
        } else {
          const firstDay = `${year}-${month}-01`;
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

          const [elevateResult, igniteResult, legacyResult] = await Promise.all([
            supabase
              .from("pipeline_prime_elevate")
              .update({
                meta_propostas_em_analise: metaPropostasEmAnalise,
                meta_vendas: metaVendas,
              })
              .is("data_inicio", null)
              .is("data_fim", null)
              .gte("created_at", firstDay)
              .lte("created_at", `${lastDayStr}T23:59:59.999Z`),
            supabase
              .from("pipeline_prime_ignite")
              .update({
                meta_propostas_em_analise: metaPropostasEmAnalise,
                meta_vendas: metaVendas,
              })
              .is("data_inicio", null)
              .is("data_fim", null)
              .gte("created_at", firstDay)
              .lte("created_at", `${lastDayStr}T23:59:59.999Z`),
            supabase
              .from("pipeline_prime_legacy")
              .update({
                meta_propostas_em_analise: metaPropostasEmAnalise,
                meta_vendas: metaVendas,
              })
              .is("data_inicio", null)
              .is("data_fim", null)
              .gte("created_at", firstDay)
              .lte("created_at", `${lastDayStr}T23:59:59.999Z`),
          ]);

          const errors = [elevateResult, igniteResult, legacyResult].filter(r => r.error);
          if (errors.length > 0) {
            throw new Error("Erro ao atualizar metas");
          }
        }

        toast({
          title: "Sucesso",
          description: "Metas atualizadas com sucesso",
        });

        setOpen(false);
        onGoalsUpdated();
        setIsLoading(false);
        return;
      }

      // Lógica para Elyano - atualizar TODOS os registros do período nas 3 tabelas
      if (isWeeklyView && selectedWeek) {
        let startDay: number;
        let endDay: number;
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        
        switch (selectedWeek) {
          case 1:
            startDay = 1;
            endDay = 8;
            break;
          case 2:
            startDay = 7;
            endDay = 15;
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
            endDay = 8;
        }

        const dataInicio = `${year}-${month}-${String(startDay).padStart(2, '0')}`;
        const dataFim = `${year}-${month}-${String(endDay).padStart(2, '0')}`;

        const [highProfileResult, higherResult, highOneResult] = await Promise.all([
          supabase
            .from("pipeline_elyano_high_profile")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .eq("data_inicio", dataInicio)
            .eq("data_fim", dataFim),
          supabase
            .from("pipeline_elyano_higher")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .eq("data_inicio", dataInicio)
            .eq("data_fim", dataFim),
          supabase
            .from("pipeline_elyano_high_one")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .eq("data_inicio", dataInicio)
            .eq("data_fim", dataFim),
        ]);

        const errors = [highProfileResult, higherResult, highOneResult].filter(r => r.error);
        if (errors.length > 0) {
          throw new Error("Erro ao atualizar metas");
        }
      } else {
        const firstDay = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

        const [highProfileResult, higherResult, highOneResult] = await Promise.all([
          supabase
            .from("pipeline_elyano_high_profile")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .is("data_inicio", null)
            .is("data_fim", null)
            .gte("created_at", firstDay)
            .lte("created_at", `${lastDayStr}T23:59:59.999Z`),
          supabase
            .from("pipeline_elyano_higher")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .is("data_inicio", null)
            .is("data_fim", null)
            .gte("created_at", firstDay)
            .lte("created_at", `${lastDayStr}T23:59:59.999Z`),
          supabase
            .from("pipeline_elyano_high_one")
            .update({
              meta_propostas_em_analise: metaPropostasEmAnalise,
              meta_vendas: metaVendas,
            })
            .is("data_inicio", null)
            .is("data_fim", null)
            .gte("created_at", firstDay)
            .lte("created_at", `${lastDayStr}T23:59:59.999Z`),
        ]);

        const errors = [highProfileResult, higherResult, highOneResult].filter(r => r.error);
        if (errors.length > 0) {
          throw new Error("Erro ao atualizar metas");
        }
      }

      toast({
        title: "Sucesso",
        description: "Metas atualizadas com sucesso",
      });

      setOpen(false);
      onGoalsUpdated();
    } catch (error) {
      console.error("Erro ao salvar metas:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar metas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Rocket className="mr-2 h-4 w-4" />
          Editar Metas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Metas de Vendas</DialogTitle>
          <DialogDescription>
            Defina as metas para o período selecionado. As metas serão aplicadas a todos os pipelines.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="meta-propostas" className="text-right">
              Propostas em Análise
            </Label>
            <Input
              id="meta-propostas"
              type="number"
              value={metaPropostasEmAnalise}
              onChange={(e) => setMetaPropostasEmAnalise(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="meta-vendas" className="text-right">
              Vendas
            </Label>
            <Input
              id="meta-vendas"
              type="number"
              value={metaVendas}
              onChange={(e) => setMetaVendas(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Metas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
