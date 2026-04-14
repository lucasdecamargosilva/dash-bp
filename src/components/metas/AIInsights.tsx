import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AIInsightsProps {
  clientName: string;
  period: string;
  isWeeklyView: boolean;
  selectedWeek?: number;
  prospectionData: {
    totalMensagensEnviadas: number;
    totalReunioesAgendadas: number;
    totalReunioesRealizadas: number;
    metaMensagensEnviadas: number;
    metaReunioesAgendadas: number;
    metaReunioesRealizadas: number;
  };
  salesData: {
    totalPropostasEmAnalise: number;
    totalVendas: number;
    metaPropostasEmAnalise: number;
    metaVendas: number;
  };
}

export const AIInsights = ({
  clientName,
  period,
  isWeeklyView,
  selectedWeek,
  prospectionData,
  salesData,
}: AIInsightsProps) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const periodLabel = isWeeklyView 
        ? `${period} - Semana ${selectedWeek}` 
        : period;

      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {
          dashboardData: {
            prospection: prospectionData,
            sales: salesData,
          },
          clientName,
          period: periodLabel,
          isWeeklyView,
        },
      });

      if (error) throw error;

      setInsights(data.insights);
      toast({
        title: "Insights gerados",
        description: "Os insights foram gerados com sucesso!",
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Erro ao gerar insights",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights com IA
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateInsights}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {insights ? "Atualizar" : "Gerar Insights"}
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : insights ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div 
                  className="text-sm text-muted-foreground whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: insights
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />')
                      .replace(/#{1,3}\s(.*?)(?=<br|$)/g, '<h4 class="font-semibold text-foreground mt-4 mb-2">$1</h4>')
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Clique em "Gerar Insights" para obter análises inteligentes baseadas nos dados do dashboard.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
