import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoalsChart } from "@/components/dashboard/GoalsChart";
import { MonthFilter } from "@/components/dashboard/MonthFilter";
import { WeekFilter } from "@/components/dashboard/WeekFilter";
import { ViewToggle } from "@/components/dashboard/ViewToggle";
import { EditMonthlyGoalsDialog } from "@/components/dashboard/EditMonthlyGoalsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { usePipelineMetrics } from "@/hooks/usePipelineData";
import { useMonthlyPipelineData } from "@/hooks/useMonthlyPipelineData";
import { useWeeklyPipelineData } from "@/hooks/useWeeklyPipelineData";
import { useMonthlyElamCombinedData } from "@/hooks/useMonthlyElamCombinedData";
import { useWeeklyElamCombinedData } from "@/hooks/useWeeklyElamCombinedData";
import { useSalesPipelineMetrics } from "@/hooks/useSalesPipelineData";
import { useMonthlySalesPipelineData } from "@/hooks/useMonthlySalesPipelineData";
import { useWeeklySalesPipelineData } from "@/hooks/useWeeklySalesPipelineData";
import { useMonthlySalesElamData } from "@/hooks/useMonthlySalesElamData";
import { useWeeklySalesElamData } from "@/hooks/useWeeklySalesElamData";
import { useMonthlySalesPrimeData } from "@/hooks/useMonthlySalesPrimeData";
import { useWeeklySalesPrimeData } from "@/hooks/useWeeklySalesPrimeData";
import { supabase } from "@/integrations/supabase/client";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { EditSalesGoalsDialog } from "@/components/dashboard/EditSalesGoalsDialog";
import { ProspectionComparisonChart } from "@/components/dashboard/ProspectionComparisonChart";
import { SalesComparisonChart } from "@/components/dashboard/SalesComparisonChart";
import { AIInsights } from "@/components/dashboard/AIInsights";
import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import logo from "@/assets/logo_bp_group.png";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedClient, setSelectedClient] = useState("Elam Lima");
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "MM"));
  const [selectedYear, setSelectedYear] = useState(format(currentDate, "yyyy"));
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const clients = ["Elyano", "Elam Lima", "PR1ME ROI"];
  const fullSelectedMonth = `${selectedYear}-${selectedMonth}`;
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const {
    data,
    metrics,
    isLoading,
    error
  } = usePipelineMetrics(selectedClient);
  // Use combined hooks for Elam Lima, regular hooks for others
  const {
    data: monthlyData,
    isLoading: isLoadingMonthly,
    refetch: refetchMonthly
  } = selectedClient === "Elam Lima" 
    ? useMonthlyElamCombinedData(fullSelectedMonth)
    : useMonthlyPipelineData(selectedClient, fullSelectedMonth);

  const {
    data: weeklyPipelineData,
    isLoading: isLoadingWeeklyPipeline,
    refetch: refetchWeeklyPipeline
  } = selectedClient === "Elam Lima"
    ? useWeeklyElamCombinedData(fullSelectedMonth, selectedWeek, isWeeklyView)
    : useWeeklyPipelineData(selectedClient, fullSelectedMonth, selectedWeek, isWeeklyView && (selectedClient === "Elyano" || selectedClient === "PR1ME ROI"));

  // Calcular dateFilter para o mês selecionado
  const dateFilter = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // último dia do mês
    return { startDate, endDate };
  }, [selectedMonth, selectedYear]);

  const {
    metrics: salesMetrics,
    isLoading: isLoadingSales,
    error: errorSales
  } = useSalesPipelineMetrics(dateFilter);
  
  const {
    data: monthlySalesData,
    isLoading: isLoadingMonthlySales,
    refetch: refetchSalesGoals
  } = useMonthlySalesPipelineData(fullSelectedMonth, !isWeeklyView);

  const {
    data: weeklySalesData,
    isLoading: isLoadingWeeklySales,
    refetch: refetchWeeklySalesGoals
  } = useWeeklySalesPipelineData(fullSelectedMonth, selectedWeek, isWeeklyView && selectedClient === "Elyano");

  const {
    data: monthlySalesElamData,
    isLoading: isLoadingMonthlySalesElam,
    refetch: refetchSalesGoalsElam
  } = useMonthlySalesElamData(fullSelectedMonth, !isWeeklyView && selectedClient === "Elam Lima");

  const {
    data: weeklySalesElamData,
    isLoading: isLoadingWeeklySalesElam,
    refetch: refetchWeeklySalesGoalsElam
  } = useWeeklySalesElamData(fullSelectedMonth, selectedWeek, isWeeklyView && selectedClient === "Elam Lima");

  const {
    data: monthlySalesPrimeData,
    isLoading: isLoadingMonthlySalesPrime,
    refetch: refetchSalesGoalsPrime
  } = useMonthlySalesPrimeData(fullSelectedMonth, !isWeeklyView && selectedClient === "PR1ME ROI");

  const {
    data: weeklySalesPrimeData,
    isLoading: isLoadingWeeklySalesPrime,
    refetch: refetchWeeklySalesGoalsPrime
  } = useWeeklySalesPrimeData(fullSelectedMonth, selectedWeek, isWeeklyView && selectedClient === "PR1ME ROI");

  // Invalidate cache when switching views
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["monthly-sales-pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-sales-pipeline"] });
  }, [isWeeklyView, queryClient]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
    navigate('/auth');
  };
  if (!session) {
    return null;
  }
  if (isLoading || isLoadingMonthly || isLoadingWeeklyPipeline || isLoadingSales || isLoadingMonthlySales || isLoadingWeeklySales || isLoadingMonthlySalesElam || isLoadingWeeklySalesElam || isLoadingMonthlySalesPrime || isLoadingWeeklySalesPrime) {
    return <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-96" />
        </div>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Erro ao carregar dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Não foi possível carregar os dados do pipeline. Tente novamente em alguns instantes.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Erro: {error?.message}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  const lastUpdate = data && data.length > 0 ? new Date(data[0].updated_at).toLocaleString('pt-BR') : 'Não disponível';
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden bg-black py-8 px-6 mb-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Dashboard Prospecção e Vendas

            </h1>
              <p className="text-white/80 text-sm flex items-center gap-2">
                Última atualização: 
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {lastUpdate}
                </Badge>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
              <img src={logo} alt="BP Group Logo" className="h-16 md:h-20" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 px-6 pb-6">

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="client-select" className="text-sm font-medium">
              Cliente:
            </label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger id="client-select" className="w-48">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <MonthFilter selectedMonth={selectedMonth} selectedYear={selectedYear} onMonthChange={setSelectedMonth} onYearChange={setSelectedYear} />
          
          {(selectedClient === "Elyano" || selectedClient === "Elam Lima" || selectedClient === "PR1ME ROI") && (
            <>
              <ViewToggle isWeeklyView={isWeeklyView} onToggle={setIsWeeklyView} />
              {isWeeklyView && (
                <WeekFilter selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
              )}
            </>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {isWeeklyView && (selectedClient === "Elyano" || selectedClient === "Elam Lima" || selectedClient === "PR1ME ROI") ? (
            weeklyPipelineData && (
              <>
                <GoalsChart
                  data={{
                    totalMensagensEnviadas: (weeklyPipelineData.mensagem_enviada || 0) + (weeklyPipelineData.conexao || 0) + (weeklyPipelineData.whatsapp_obtido || 0) + (weeklyPipelineData.reuniao_agendada || 0) + (weeklyPipelineData.reuniao_realizada || 0),
                    totalReunioesAgendadas: (weeklyPipelineData.reuniao_agendada || 0) + (weeklyPipelineData.reuniao_realizada || 0),
                    totalReunioesRealizadas: weeklyPipelineData.reuniao_realizada || 0
                  }}
                  monthlyGoals={{
                    meta_mensagens_enviadas: weeklyPipelineData.meta_mensagens_enviadas,
                    meta_reunioes_agendadas: weeklyPipelineData.meta_reunioes_agendadas,
                    meta_reunioes_realizadas: weeklyPipelineData.meta_reunioes_realizadas
                  }}
                  clienteName={selectedClient}
                  selectedMonth={fullSelectedMonth}
                  lastRecordId={weeklyPipelineData?.id}
                  onGoalsUpdated={refetchWeeklyPipeline}
                  isWeeklyView={true}
                  selectedWeek={selectedWeek}
                  inboundRecordId={(weeklyPipelineData as any)?.inboundRecordId}
                  outboundRecordId={(weeklyPipelineData as any)?.outboundRecordId}
                />
                <ProspectionComparisonChart
                  data={{
                    totalMensagensEnviadas: (weeklyPipelineData.mensagem_enviada || 0) + (weeklyPipelineData.conexao || 0) + (weeklyPipelineData.whatsapp_obtido || 0) + (weeklyPipelineData.reuniao_agendada || 0) + (weeklyPipelineData.reuniao_realizada || 0),
                    totalReunioesAgendadas: (weeklyPipelineData.reuniao_agendada || 0) + (weeklyPipelineData.reuniao_realizada || 0),
                    totalReunioesRealizadas: weeklyPipelineData.reuniao_realizada || 0
                  }}
                  goals={{
                    meta_mensagens_enviadas: weeklyPipelineData.meta_mensagens_enviadas,
                    meta_reunioes_agendadas: weeklyPipelineData.meta_reunioes_agendadas,
                    meta_reunioes_realizadas: weeklyPipelineData.meta_reunioes_realizadas
                  }}
                  isWeeklyView={true}
                  selectedWeek={selectedWeek}
                />
              </>
            )
          ) : (
            monthlyData && (
              <>
                <GoalsChart
                  data={{
                    totalMensagensEnviadas: (monthlyData.mensagem_enviada || 0) + (monthlyData.conexao || 0) + (monthlyData.whatsapp_obtido || 0) + (monthlyData.reuniao_agendada || 0) + (monthlyData.reuniao_realizada || 0),
                    totalReunioesAgendadas: (monthlyData.reuniao_agendada || 0) + (monthlyData.reuniao_realizada || 0),
                    totalReunioesRealizadas: monthlyData.reuniao_realizada || 0
                  }}
                  monthlyGoals={{
                    meta_mensagens_enviadas: monthlyData.meta_mensagens_enviadas,
                    meta_reunioes_agendadas: monthlyData.meta_reunioes_agendadas,
                    meta_reunioes_realizadas: monthlyData.meta_reunioes_realizadas
                  }}
                  clienteName={selectedClient}
                  selectedMonth={fullSelectedMonth}
                  lastRecordId={monthlyData?.id}
                  onGoalsUpdated={refetchMonthly}
                  inboundRecordId={(monthlyData as any)?.inboundRecordId}
                  outboundRecordId={(monthlyData as any)?.outboundRecordId}
                />
                <ProspectionComparisonChart
                  data={{
                    totalMensagensEnviadas: (monthlyData.mensagem_enviada || 0) + (monthlyData.conexao || 0) + (monthlyData.whatsapp_obtido || 0) + (monthlyData.reuniao_agendada || 0) + (monthlyData.reuniao_realizada || 0),
                    totalReunioesAgendadas: (monthlyData.reuniao_agendada || 0) + (monthlyData.reuniao_realizada || 0),
                    totalReunioesRealizadas: monthlyData.reuniao_realizada || 0
                  }}
                  goals={{
                    meta_mensagens_enviadas: monthlyData.meta_mensagens_enviadas,
                    meta_reunioes_agendadas: monthlyData.meta_reunioes_agendadas,
                    meta_reunioes_realizadas: monthlyData.meta_reunioes_realizadas
                  }}
                  isWeeklyView={false}
                />
              </>
            )
          )}

      {selectedClient === "Elyano" && !isWeeklyView && monthlySalesData && (
        <>
          <SalesChart 
            data={{
              totalPropostasEmAnalise: monthlySalesData.totalPropostasEmAnalise,
              totalVendas: monthlySalesData.totalVendas,
              metaPropostasEmAnalise: monthlySalesData.metaPropostasEmAnalise,
              metaVendas: monthlySalesData.metaVendas,
            }} 
            selectedMonth={fullSelectedMonth} 
            onGoalsUpdated={refetchSalesGoals} 
            isWeeklyView={false}
            clienteName="Elyano"
          />
          <SalesComparisonChart 
            data={{
              totalPropostasEmAnalise: monthlySalesData.totalPropostasEmAnalise,
              totalVendas: monthlySalesData.totalVendas,
              metaPropostasEmAnalise: monthlySalesData.metaPropostasEmAnalise,
              metaVendas: monthlySalesData.metaVendas,
            }}
            isWeeklyView={false}
          />
        </>
      )}

      {selectedClient === "Elyano" && isWeeklyView && weeklySalesData && (
        <>
          <SalesChart 
            data={{
              totalPropostasEmAnalise: weeklySalesData.totalPropostasEmAnalise,
              totalVendas: weeklySalesData.totalVendas,
              metaPropostasEmAnalise: weeklySalesData.metaPropostasEmAnalise,
              metaVendas: weeklySalesData.metaVendas,
            }} 
            selectedMonth={fullSelectedMonth} 
            onGoalsUpdated={refetchWeeklySalesGoals} 
            isWeeklyView={true} 
            selectedWeek={selectedWeek}
            clienteName="Elyano"
          />
          <SalesComparisonChart 
            data={{
              totalPropostasEmAnalise: weeklySalesData.totalPropostasEmAnalise,
              totalVendas: weeklySalesData.totalVendas,
              metaPropostasEmAnalise: weeklySalesData.metaPropostasEmAnalise,
              metaVendas: weeklySalesData.metaVendas,
            }}
            isWeeklyView={true}
            selectedWeek={selectedWeek}
          />
        </>
      )}

      {selectedClient === "Elam Lima" && !isWeeklyView && monthlySalesElamData && (
        <>
          <SalesChart 
            data={{
              totalPropostasEmAnalise: monthlySalesElamData.totalPropostasEmAnalise,
              totalVendas: monthlySalesElamData.totalVendas,
              metaPropostasEmAnalise: monthlySalesElamData.metaPropostasEmAnalise,
              metaVendas: monthlySalesElamData.metaVendas,
            }} 
            selectedMonth={fullSelectedMonth} 
            onGoalsUpdated={refetchSalesGoalsElam} 
            isWeeklyView={false}
            clienteName="Elam Lima"
          />
          <SalesComparisonChart 
            data={{
              totalPropostasEmAnalise: monthlySalesElamData.totalPropostasEmAnalise,
              totalVendas: monthlySalesElamData.totalVendas,
              metaPropostasEmAnalise: monthlySalesElamData.metaPropostasEmAnalise,
              metaVendas: monthlySalesElamData.metaVendas,
            }}
            isWeeklyView={false}
          />
        </>
      )}

      {selectedClient === "Elam Lima" && isWeeklyView && weeklySalesElamData && (
        <>
          <SalesChart 
            data={{
              totalPropostasEmAnalise: weeklySalesElamData.totalPropostasEmAnalise,
              totalVendas: weeklySalesElamData.totalVendas,
              metaPropostasEmAnalise: weeklySalesElamData.metaPropostasEmAnalise,
              metaVendas: weeklySalesElamData.metaVendas,
            }} 
            selectedMonth={fullSelectedMonth} 
            onGoalsUpdated={refetchWeeklySalesGoalsElam} 
            isWeeklyView={true} 
            selectedWeek={selectedWeek}
            clienteName="Elam Lima"
          />
          <SalesComparisonChart 
            data={{
              totalPropostasEmAnalise: weeklySalesElamData.totalPropostasEmAnalise,
              totalVendas: weeklySalesElamData.totalVendas,
              metaPropostasEmAnalise: weeklySalesElamData.metaPropostasEmAnalise,
              metaVendas: weeklySalesElamData.metaVendas,
            }}
            isWeeklyView={true}
            selectedWeek={selectedWeek}
          />
        </>
      )}

      {selectedClient === "PR1ME ROI" && !isWeeklyView && monthlySalesPrimeData && (
        <>
          <SalesChart 
            data={{
              totalPropostasEmAnalise: monthlySalesPrimeData.totalPropostasEmAnalise,
              totalVendas: monthlySalesPrimeData.totalVendas,
              metaPropostasEmAnalise: monthlySalesPrimeData.metaPropostasEmAnalise,
              metaVendas: monthlySalesPrimeData.metaVendas,
            }} 
            selectedMonth={fullSelectedMonth} 
            onGoalsUpdated={refetchSalesGoalsPrime} 
            isWeeklyView={false}
            clienteName="PR1ME ROI"
          />
          <SalesComparisonChart 
            data={{
              totalPropostasEmAnalise: monthlySalesPrimeData.totalPropostasEmAnalise,
              totalVendas: monthlySalesPrimeData.totalVendas,
              metaPropostasEmAnalise: monthlySalesPrimeData.metaPropostasEmAnalise,
              metaVendas: monthlySalesPrimeData.metaVendas,
            }}
            isWeeklyView={false}
          />
        </>
      )}

      {selectedClient === "PR1ME ROI" && isWeeklyView && weeklySalesPrimeData && (
        <>
          <SalesChart 
            data={{
              totalPropostasEmAnalise: weeklySalesPrimeData.totalPropostasEmAnalise,
              totalVendas: weeklySalesPrimeData.totalVendas,
              metaPropostasEmAnalise: weeklySalesPrimeData.metaPropostasEmAnalise,
              metaVendas: weeklySalesPrimeData.metaVendas,
            }} 
            selectedMonth={fullSelectedMonth} 
            onGoalsUpdated={refetchWeeklySalesGoalsPrime} 
            isWeeklyView={true} 
            selectedWeek={selectedWeek}
            clienteName="PR1ME ROI"
          />
          <SalesComparisonChart 
            data={{
              totalPropostasEmAnalise: weeklySalesPrimeData.totalPropostasEmAnalise,
              totalVendas: weeklySalesPrimeData.totalVendas,
              metaPropostasEmAnalise: weeklySalesPrimeData.metaPropostasEmAnalise,
              metaVendas: weeklySalesPrimeData.metaVendas,
            }}
            isWeeklyView={true}
            selectedWeek={selectedWeek}
          />
        </>
      )}

          {/* AI Insights Section */}
          <AIInsights
            clientName={selectedClient}
            period={fullSelectedMonth}
            isWeeklyView={isWeeklyView}
            selectedWeek={selectedWeek}
            prospectionData={{
              totalMensagensEnviadas: isWeeklyView 
                ? ((weeklyPipelineData?.mensagem_enviada || 0) + (weeklyPipelineData?.conexao || 0) + (weeklyPipelineData?.whatsapp_obtido || 0) + (weeklyPipelineData?.reuniao_agendada || 0) + (weeklyPipelineData?.reuniao_realizada || 0))
                : ((monthlyData?.mensagem_enviada || 0) + (monthlyData?.conexao || 0) + (monthlyData?.whatsapp_obtido || 0) + (monthlyData?.reuniao_agendada || 0) + (monthlyData?.reuniao_realizada || 0)),
              totalReunioesAgendadas: isWeeklyView 
                ? ((weeklyPipelineData?.reuniao_agendada || 0) + (weeklyPipelineData?.reuniao_realizada || 0))
                : ((monthlyData?.reuniao_agendada || 0) + (monthlyData?.reuniao_realizada || 0)),
              totalReunioesRealizadas: isWeeklyView 
                ? (weeklyPipelineData?.reuniao_realizada || 0)
                : (monthlyData?.reuniao_realizada || 0),
              metaMensagensEnviadas: isWeeklyView 
                ? (weeklyPipelineData?.meta_mensagens_enviadas || 0)
                : (monthlyData?.meta_mensagens_enviadas || 0),
              metaReunioesAgendadas: isWeeklyView 
                ? (weeklyPipelineData?.meta_reunioes_agendadas || 0)
                : (monthlyData?.meta_reunioes_agendadas || 0),
              metaReunioesRealizadas: isWeeklyView 
                ? (weeklyPipelineData?.meta_reunioes_realizadas || 0)
                : (monthlyData?.meta_reunioes_realizadas || 0),
            }}
            salesData={{
              totalPropostasEmAnalise: selectedClient === "Elyano" 
                ? (isWeeklyView ? (weeklySalesData?.totalPropostasEmAnalise || 0) : (monthlySalesData?.totalPropostasEmAnalise || 0))
                : selectedClient === "Elam Lima"
                ? (isWeeklyView ? (weeklySalesElamData?.totalPropostasEmAnalise || 0) : (monthlySalesElamData?.totalPropostasEmAnalise || 0))
                : (isWeeklyView ? (weeklySalesPrimeData?.totalPropostasEmAnalise || 0) : (monthlySalesPrimeData?.totalPropostasEmAnalise || 0)),
              totalVendas: selectedClient === "Elyano"
                ? (isWeeklyView ? (weeklySalesData?.totalVendas || 0) : (monthlySalesData?.totalVendas || 0))
                : selectedClient === "Elam Lima"
                ? (isWeeklyView ? (weeklySalesElamData?.totalVendas || 0) : (monthlySalesElamData?.totalVendas || 0))
                : (isWeeklyView ? (weeklySalesPrimeData?.totalVendas || 0) : (monthlySalesPrimeData?.totalVendas || 0)),
              metaPropostasEmAnalise: selectedClient === "Elyano"
                ? (isWeeklyView ? (weeklySalesData?.metaPropostasEmAnalise || 0) : (monthlySalesData?.metaPropostasEmAnalise || 0))
                : selectedClient === "Elam Lima"
                ? (isWeeklyView ? (weeklySalesElamData?.metaPropostasEmAnalise || 0) : (monthlySalesElamData?.metaPropostasEmAnalise || 0))
                : (isWeeklyView ? (weeklySalesPrimeData?.metaPropostasEmAnalise || 0) : (monthlySalesPrimeData?.metaPropostasEmAnalise || 0)),
              metaVendas: selectedClient === "Elyano"
                ? (isWeeklyView ? (weeklySalesData?.metaVendas || 0) : (monthlySalesData?.metaVendas || 0))
                : selectedClient === "Elam Lima"
                ? (isWeeklyView ? (weeklySalesElamData?.metaVendas || 0) : (monthlySalesElamData?.metaVendas || 0))
                : (isWeeklyView ? (weeklySalesPrimeData?.metaVendas || 0) : (monthlySalesPrimeData?.metaVendas || 0)),
            }}
          />
        </div>
      </div>
    </div>;
};
export default Index;