import { useState, useEffect, useMemo } from "react";
import { GoalsChart } from "@/components/metas/GoalsChart";
import { MonthFilter } from "@/components/metas/MonthFilter";
import { WeekFilter } from "@/components/metas/WeekFilter";
import { ViewToggle } from "@/components/metas/ViewToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { SalesChart } from "@/components/metas/SalesChart";
import { ProspectionComparisonChart } from "@/components/metas/ProspectionComparisonChart";
import { SalesComparisonChart } from "@/components/metas/SalesComparisonChart";
import { AIInsights } from "@/components/metas/AIInsights";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const Metas = () => {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState("Elam Lima");
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "MM"));
  const [selectedYear, setSelectedYear] = useState(format(currentDate, "yyyy"));
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const clients = ["Elyano", "Elam Lima", "PR1ME ROI"];
  const fullSelectedMonth = `${selectedYear}-${selectedMonth}`;

  const { data, metrics, isLoading, error } = usePipelineMetrics(selectedClient);

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

  const dateFilter = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return { startDate, endDate };
  }, [selectedMonth, selectedYear]);

  const { metrics: salesMetrics, isLoading: isLoadingSales, error: errorSales } = useSalesPipelineMetrics(dateFilter);

  const { data: monthlySalesData, isLoading: isLoadingMonthlySales, refetch: refetchSalesGoals } = useMonthlySalesPipelineData(fullSelectedMonth, !isWeeklyView);
  const { data: weeklySalesData, isLoading: isLoadingWeeklySales, refetch: refetchWeeklySalesGoals } = useWeeklySalesPipelineData(fullSelectedMonth, selectedWeek, isWeeklyView && selectedClient === "Elyano");
  const { data: monthlySalesElamData, isLoading: isLoadingMonthlySalesElam, refetch: refetchSalesGoalsElam } = useMonthlySalesElamData(fullSelectedMonth, !isWeeklyView && selectedClient === "Elam Lima");
  const { data: weeklySalesElamData, isLoading: isLoadingWeeklySalesElam, refetch: refetchWeeklySalesGoalsElam } = useWeeklySalesElamData(fullSelectedMonth, selectedWeek, isWeeklyView && selectedClient === "Elam Lima");
  const { data: monthlySalesPrimeData, isLoading: isLoadingMonthlySalesPrime, refetch: refetchSalesGoalsPrime } = useMonthlySalesPrimeData(fullSelectedMonth, !isWeeklyView && selectedClient === "PR1ME ROI");
  const { data: weeklySalesPrimeData, isLoading: isLoadingWeeklySalesPrime, refetch: refetchWeeklySalesGoalsPrime } = useWeeklySalesPrimeData(fullSelectedMonth, selectedWeek, isWeeklyView && selectedClient === "PR1ME ROI");

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["monthly-sales-pipeline"] });
    queryClient.invalidateQueries({ queryKey: ["weekly-sales-pipeline"] });
  }, [isWeeklyView, queryClient]);

  const anyLoading = isLoading || isLoadingMonthly || isLoadingWeeklyPipeline || isLoadingSales || isLoadingMonthlySales || isLoadingWeeklySales || isLoadingMonthlySalesElam || isLoadingWeeklySalesElam || isLoadingMonthlySalesPrime || isLoadingWeeklySalesPrime;

  if (anyLoading) {
    return (
      <div className="min-h-screen bg-background bp-scroll">
        <DashboardHeader />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background bp-scroll">
        <DashboardHeader />
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive font-display">Erro ao carregar dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-body text-sm">
                Nao foi possivel carregar os dados. Tente novamente.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const lastUpdate = data && data.length > 0 ? new Date(data[0].updated_at).toLocaleString('pt-BR') : 'Nao disponivel';

  // Helper to get current sales data based on client and view
  const getSalesData = () => {
    if (selectedClient === "Elyano") {
      return isWeeklyView ? weeklySalesData : monthlySalesData;
    } else if (selectedClient === "Elam Lima") {
      return isWeeklyView ? weeklySalesElamData : monthlySalesElamData;
    } else {
      return isWeeklyView ? weeklySalesPrimeData : monthlySalesPrimeData;
    }
  };

  const getSalesRefetch = () => {
    if (selectedClient === "Elyano") {
      return isWeeklyView ? refetchWeeklySalesGoals : refetchSalesGoals;
    } else if (selectedClient === "Elam Lima") {
      return isWeeklyView ? refetchWeeklySalesGoalsElam : refetchSalesGoalsElam;
    } else {
      return isWeeklyView ? refetchWeeklySalesGoalsPrime : refetchSalesGoalsPrime;
    }
  };

  const currentPipelineData = isWeeklyView ? weeklyPipelineData : monthlyData;
  const currentSalesData = getSalesData();
  const currentSalesRefetch = getSalesRefetch();

  return (
    <div className="min-h-screen bg-background bp-scroll">
      <DashboardHeader />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        <div className="space-y-6">
          {/* Page header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 animate-fade-up">
            <div>
              <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-foreground">
                Prospeccao e Metas
              </h1>
              <p className="text-sm font-body text-steel-400 dark:text-muted-foreground mt-0.5 flex items-center gap-2">
                Ultima atualizacao:
                <Badge variant="secondary" className="text-xs">
                  {lastUpdate}
                </Badge>
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 animate-fade-up delay-1">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-44 h-9 text-sm font-body bg-white dark:bg-card border-steel-200 dark:border-border">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <MonthFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />

            <ViewToggle isWeeklyView={isWeeklyView} onToggle={setIsWeeklyView} />

            {isWeeklyView && (
              <WeekFilter selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
            )}
          </div>

          {/* Prospection Goals + Comparison */}
          {currentPipelineData && (
            <div className="space-y-6 animate-fade-up delay-2">
              <GoalsChart
                data={{
                  totalMensagensEnviadas: (currentPipelineData.mensagem_enviada || 0) + (currentPipelineData.conexao || 0) + (currentPipelineData.whatsapp_obtido || 0) + (currentPipelineData.reuniao_agendada || 0) + (currentPipelineData.reuniao_realizada || 0),
                  totalReunioesAgendadas: (currentPipelineData.reuniao_agendada || 0) + (currentPipelineData.reuniao_realizada || 0),
                  totalReunioesRealizadas: currentPipelineData.reuniao_realizada || 0
                }}
                monthlyGoals={{
                  meta_mensagens_enviadas: currentPipelineData.meta_mensagens_enviadas,
                  meta_reunioes_agendadas: currentPipelineData.meta_reunioes_agendadas,
                  meta_reunioes_realizadas: currentPipelineData.meta_reunioes_realizadas
                }}
                clienteName={selectedClient}
                selectedMonth={fullSelectedMonth}
                lastRecordId={currentPipelineData?.id}
                onGoalsUpdated={isWeeklyView ? refetchWeeklyPipeline : refetchMonthly}
                isWeeklyView={isWeeklyView}
                selectedWeek={isWeeklyView ? selectedWeek : undefined}
                inboundRecordId={(currentPipelineData as any)?.inboundRecordId}
                outboundRecordId={(currentPipelineData as any)?.outboundRecordId}
              />
              <ProspectionComparisonChart
                data={{
                  totalMensagensEnviadas: (currentPipelineData.mensagem_enviada || 0) + (currentPipelineData.conexao || 0) + (currentPipelineData.whatsapp_obtido || 0) + (currentPipelineData.reuniao_agendada || 0) + (currentPipelineData.reuniao_realizada || 0),
                  totalReunioesAgendadas: (currentPipelineData.reuniao_agendada || 0) + (currentPipelineData.reuniao_realizada || 0),
                  totalReunioesRealizadas: currentPipelineData.reuniao_realizada || 0
                }}
                goals={{
                  meta_mensagens_enviadas: currentPipelineData.meta_mensagens_enviadas,
                  meta_reunioes_agendadas: currentPipelineData.meta_reunioes_agendadas,
                  meta_reunioes_realizadas: currentPipelineData.meta_reunioes_realizadas
                }}
                isWeeklyView={isWeeklyView}
                selectedWeek={isWeeklyView ? selectedWeek : undefined}
              />
            </div>
          )}

          {/* Sales */}
          {currentSalesData && (
            <div className="space-y-6 animate-fade-up delay-3">
              <SalesChart
                data={{
                  totalPropostasEmAnalise: currentSalesData.totalPropostasEmAnalise,
                  totalVendas: currentSalesData.totalVendas,
                  metaPropostasEmAnalise: currentSalesData.metaPropostasEmAnalise,
                  metaVendas: currentSalesData.metaVendas,
                }}
                selectedMonth={fullSelectedMonth}
                onGoalsUpdated={currentSalesRefetch}
                isWeeklyView={isWeeklyView}
                selectedWeek={isWeeklyView ? selectedWeek : undefined}
                clienteName={selectedClient}
              />
              <SalesComparisonChart
                data={{
                  totalPropostasEmAnalise: currentSalesData.totalPropostasEmAnalise,
                  totalVendas: currentSalesData.totalVendas,
                  metaPropostasEmAnalise: currentSalesData.metaPropostasEmAnalise,
                  metaVendas: currentSalesData.metaVendas,
                }}
                isWeeklyView={isWeeklyView}
                selectedWeek={isWeeklyView ? selectedWeek : undefined}
              />
            </div>
          )}

          {/* AI Insights */}
          <div className="animate-fade-up delay-4">
            <AIInsights
              clientName={selectedClient}
              period={fullSelectedMonth}
              isWeeklyView={isWeeklyView}
              selectedWeek={selectedWeek}
              prospectionData={{
                totalMensagensEnviadas: (currentPipelineData?.mensagem_enviada || 0) + (currentPipelineData?.conexao || 0) + (currentPipelineData?.whatsapp_obtido || 0) + (currentPipelineData?.reuniao_agendada || 0) + (currentPipelineData?.reuniao_realizada || 0),
                totalReunioesAgendadas: (currentPipelineData?.reuniao_agendada || 0) + (currentPipelineData?.reuniao_realizada || 0),
                totalReunioesRealizadas: currentPipelineData?.reuniao_realizada || 0,
                metaMensagensEnviadas: currentPipelineData?.meta_mensagens_enviadas || 0,
                metaReunioesAgendadas: currentPipelineData?.meta_reunioes_agendadas || 0,
                metaReunioesRealizadas: currentPipelineData?.meta_reunioes_realizadas || 0,
              }}
              salesData={{
                totalPropostasEmAnalise: currentSalesData?.totalPropostasEmAnalise || 0,
                totalVendas: currentSalesData?.totalVendas || 0,
                metaPropostasEmAnalise: currentSalesData?.metaPropostasEmAnalise || 0,
                metaVendas: currentSalesData?.metaVendas || 0,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Metas;
