import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { EditMonthlyGoalsDialog } from "./EditMonthlyGoalsDialog";
import { EditElamGoalsDialog } from "./EditElamGoalsDialog";

interface GoalsChartProps {
  data: {
    totalMensagensEnviadas: number;
    totalReunioesAgendadas: number;
    totalReunioesRealizadas: number;
  };
  monthlyGoals: {
    meta_mensagens_enviadas: number;
    meta_reunioes_agendadas: number;
    meta_reunioes_realizadas: number;
  };
  clienteName: string;
  selectedMonth: string;
  lastRecordId?: number;
  onGoalsUpdated: () => void;
  isWeeklyView?: boolean;
  selectedWeek?: number;
  inboundRecordId?: number;
  outboundRecordId?: number;
}
const COLORS = ["#3b82f6", "#06b6d4", "#a78bfa", "#8b5cf6", "#67e8f9"];
export const GoalsChart = ({
  data,
  monthlyGoals,
  clienteName,
  selectedMonth,
  lastRecordId,
  onGoalsUpdated,
  isWeeklyView = false,
  selectedWeek = 1,
  inboundRecordId,
  outboundRecordId,
}: GoalsChartProps) => {
  const goals = [{
    name: "Mensagens Enviadas",
    meta: monthlyGoals.meta_mensagens_enviadas,
    realizado: data.totalMensagensEnviadas,
    color: COLORS[0]
  }, {
    name: "Reuniões Agendadas",
    meta: monthlyGoals.meta_reunioes_agendadas,
    realizado: data.totalReunioesAgendadas,
    color: COLORS[3]
  }, {
    name: "Reuniões Realizadas",
    meta: monthlyGoals.meta_reunioes_realizadas,
    realizado: data.totalReunioesRealizadas,
    color: COLORS[4]
  }];
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>KPIs Outbound & Social Selling</CardTitle>
          {clienteName === "Elam Lima" ? (
            <EditElamGoalsDialog
              selectedMonth={selectedMonth}
              inboundRecordId={inboundRecordId}
              outboundRecordId={outboundRecordId}
              currentGoals={monthlyGoals}
              onGoalsUpdated={onGoalsUpdated}
              isWeeklyView={isWeeklyView}
              selectedWeek={selectedWeek}
            />
          ) : (
            <EditMonthlyGoalsDialog
              clienteName={clienteName}
              selectedMonth={selectedMonth}
              lastRecordId={lastRecordId}
              currentGoals={monthlyGoals}
              onGoalsUpdated={onGoalsUpdated}
              isWeeklyView={isWeeklyView}
              selectedWeek={selectedWeek}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {goals.map((goal, index) => {
          const percentage = (goal.meta > 0 && isFinite(goal.realizado)) 
            ? Math.min(goal.realizado / goal.meta * 100, 100) 
            : 0;
          const chartData = [{
            name: 'Realizado',
            value: percentage
          }, {
            name: 'Restante',
            value: 100 - percentage
          }];
          return <div key={index} className="flex flex-col items-center space-y-3">
                <h4 className="text-sm font-medium text-center">
                  {goal.name} <span style={{
                color: goal.color
              }}>({goal.realizado})</span>
                </h4>
                <div className="relative">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value">
                        <Cell fill={goal.color} />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{
                    color: goal.color
                  }}>
                        {goal.meta > 0 ? `${percentage.toFixed(0)}%` : "Sem meta"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full text-center space-y-1">
                  <div className="bg-muted/50 rounded-md p-2">
                    <div className="text-xs text-muted-foreground">Meta</div>
                    <div className="font-semibold text-lg">{goal.meta}</div>
                  </div>
                  {goal.name === "Reuniões Realizadas" && <p className="text-xs text-muted-foreground italic">
                      *Consideração de 10% de No Show
                    </p>}
                </div>
              </div>;
        })}
        </div>
      </CardContent>
    </Card>;
};