import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { EditSalesGoalsDialog } from "./EditSalesGoalsDialog";

interface SalesChartProps {
  data: {
    totalPropostasEmAnalise: number;
    totalVendas: number;
    metaPropostasEmAnalise: number;
    metaVendas: number;
  };
  selectedMonth: string;
  onGoalsUpdated: () => void;
  isWeeklyView?: boolean;
  selectedWeek?: number;
  clienteName?: string;
}

export const SalesChart = ({ data, selectedMonth, onGoalsUpdated, isWeeklyView, selectedWeek, clienteName = "Elyano" }: SalesChartProps) => {
  const goals = [
    {
      name: "Propostas em Análise",
      value: data.totalPropostasEmAnalise,
      goal: data.metaPropostasEmAnalise,
      color: "hsl(142, 76%, 36%)", // Verde escuro
    },
    {
      name: "Vendas",
      value: data.totalVendas,
      goal: data.metaVendas,
      color: "hsl(142, 69%, 58%)", // Verde claro
    },
  ];

  const renderGoalChart = (goal: typeof goals[0]) => {
    const percentage = goal.goal > 0 ? Math.round((goal.value / goal.goal) * 100) : 0;
    const chartData = [
      { name: "Realizado", value: percentage },
      { name: "Restante", value: 100 - percentage },
    ];

    return (
      <div key={goal.name} className="flex flex-col items-center space-y-3">
        <h4 className="text-sm font-medium text-center">
          {goal.name} <span style={{ color: goal.color }}>({goal.value})</span>
        </h4>
        <div className="relative">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                <Cell fill={goal.color} />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: goal.color }}>
                {percentage}%
              </div>
            </div>
          </div>
        </div>
        <div className="w-full text-center space-y-1">
          <div className="bg-muted/50 rounded-md p-2">
            <div className="text-xs text-muted-foreground">Meta</div>
            <div className="font-semibold text-lg">{goal.goal}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>KPIs Pipelines de Vendas</CardTitle>
            <CardDescription>Soma de todos os Pipelines de Vendas do Cliente</CardDescription>
          </div>
          <EditSalesGoalsDialog
            selectedMonth={selectedMonth}
            currentGoals={{
              metaPropostasEmAnalise: data.metaPropostasEmAnalise,
              metaVendas: data.metaVendas,
            }}
            onGoalsUpdated={onGoalsUpdated}
            isWeeklyView={isWeeklyView}
            selectedWeek={selectedWeek}
            clienteName={clienteName}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => renderGoalChart(goal))}
        </div>
      </CardContent>
    </Card>
  );
};
