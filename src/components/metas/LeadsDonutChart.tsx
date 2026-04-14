import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface LeadsDonutChartProps {
  data: {
    totalContatos: number;
    totalMensagensEnviadas: number;
    totalReunioesAgendadas: number;
    totalReunioesRealizadas: number;
  };
  clienteName: string;
}

export const LeadsDonutChart = ({ data, clienteName }: LeadsDonutChartProps) => {
  const chartData = [
    {
      name: "Mensagem Enviada",
      value: data.totalMensagensEnviadas,
      color: "#3b82f6"
    },
    {
      name: "Reunião Agendada",
      value: data.totalReunioesAgendadas,
      color: "#a78bfa"
    },
    {
      name: "Reunião Realizada",
      value: data.totalReunioesRealizadas,
      color: "#67e8f9"
    }
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomizedLabel = (entry: any) => {
    const RADIAN = Math.PI / 180;
    const radius = entry.outerRadius + 30;
    const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
    const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="black" 
        textAnchor={x > entry.cx ? "start" : "end"} 
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {entry.value}
      </text>
    );
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-col space-y-2 ml-8">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.value} - {chartData.find(item => item.name === entry.value)?.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Leads {clienteName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="40%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend 
                content={<CustomLegend />}
                verticalAlign="middle"
                align="right"
                layout="vertical"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};