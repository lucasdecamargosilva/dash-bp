import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProspectionComparisonChartProps {
  data: {
    totalMensagensEnviadas: number;
    totalReunioesAgendadas: number;
    totalReunioesRealizadas: number;
  };
  goals: {
    meta_mensagens_enviadas: number;
    meta_reunioes_agendadas: number;
    meta_reunioes_realizadas: number;
  };
  isWeeklyView: boolean;
  selectedWeek?: number;
}

export const ProspectionComparisonChart = ({ 
  data, 
  goals,
  isWeeklyView,
  selectedWeek 
}: ProspectionComparisonChartProps) => {
  const metrics = [
    {
      name: 'Mensagens Enviadas',
      realizado: data.totalMensagensEnviadas,
      meta: goals.meta_mensagens_enviadas,
    },
    {
      name: 'Reuniões Agendadas',
      realizado: data.totalReunioesAgendadas,
      meta: goals.meta_reunioes_agendadas,
    },
    {
      name: 'Reuniões Realizadas',
      realizado: data.totalReunioesRealizadas,
      meta: goals.meta_reunioes_realizadas,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Comparação: Realizado vs Meta {isWeeklyView ? `(Semana ${selectedWeek})` : '(Mensal)'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const chartData = [
            {
              name: 'Realizado',
              value: metric.realizado,
              fill: 'hsl(142, 71%, 45%)',
            },
            {
              name: 'Meta',
              value: metric.meta,
              fill: 'hsl(var(--muted-foreground))',
            },
          ];

          return (
            <Card key={metric.name}>
              <CardHeader>
                <CardTitle className="text-base">{metric.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar 
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
