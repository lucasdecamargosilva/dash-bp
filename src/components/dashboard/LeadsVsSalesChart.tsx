import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface LeadsVsSalesData {
  month: string;
  leads: number;
  sales: number;
}

interface LeadsVsSalesChartProps {
  data: LeadsVsSalesData[];
  title: string;
  className?: string;
}

function useIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function LeadsVsSalesChart({
  data,
  title,
  className
}: LeadsVsSalesChartProps) {
  const isDark = useIsDark();

  const colors = {
    grid: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
    axis: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8',
    barLeads: isDark ? '#38a8f9' : '#1e3660',
    barSales: isDark ? '#34d399' : '#38a8f9',
    cursor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,30,60,0.03)',
    tooltipBg: isDark ? '#1c2230' : 'white',
    tooltipBorder: isDark ? '#2a3040' : '#e5e7eb',
    tooltipLabel: isDark ? '#8894aa' : '#6a778f',
    tooltipValue: isDark ? '#e5e7eb' : '#0d1a30',
    legendColor: isDark ? '#8894aa' : '#6a778f',
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="month" stroke={colors.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} dy={8} />
            <YAxis stroke={colors.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} dx={-4} tickFormatter={formatNumber} />
            <Tooltip
              cursor={{ fill: colors.cursor }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder }} className="rounded-lg px-4 py-3 shadow-hover border">
                      <p style={{ color: colors.tooltipLabel }} className="font-body text-xs mb-2 font-semibold">{label}</p>
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 py-0.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span style={{ color: colors.tooltipLabel }} className="text-xs font-body">{entry.name}</span>
                          </div>
                          <span style={{ color: colors.tooltipValue }} className="text-xs font-body font-bold tabular-nums">
                            {entry.value?.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      ))}
                      <div style={{ borderColor: colors.tooltipBorder }} className="mt-2 pt-2 border-t">
                        <p style={{ color: colors.tooltipLabel }} className="text-[10px] font-body">
                          Conversao: {payload.length === 2 && payload[0].value && payload[1].value ?
                            ((Number(payload[1].value) / Number(payload[0].value)) * 100).toFixed(1) + '%' : 'N/A'}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{
                fontFamily: 'Plus Jakarta Sans',
                fontSize: '11px',
                color: colors.legendColor,
                paddingTop: '12px'
              }}
            />
            <Bar dataKey="leads" name="Leads Qualificados" fill={colors.barLeads} radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="sales" name="Vendas" fill={colors.barSales} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
