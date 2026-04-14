import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface ConversionChartProps {
  data: Array<{
    etapa: string;
    taxa: number;
    valor: number;
  }>;
}

export const ConversionChart = ({ data }: ConversionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conversão por Etapa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="etapa" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                const numValue = Number(value);
                const displayValue = isFinite(numValue) && !isNaN(numValue)
                  ? `${numValue.toFixed(1)}%`
                  : 'Sem dados';
                return [displayValue, name === 'taxa' ? 'Taxa de Conversão' : 'Valor'];
              }}
            />
            <Legend />
            <Bar 
              dataKey="taxa" 
              fill="hsl(var(--primary))" 
              name="Taxa de Conversão"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};