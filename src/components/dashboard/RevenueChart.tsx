import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RevenueData {
  month: string;
  revenue: number;
  leads?: number;
  sales?: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  title: string;
  showComparison?: boolean;
  className?: string;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => setIsDark(document.documentElement.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export function RevenueChart({
  data,
  title,
  showComparison = false,
  className
}: RevenueChartProps) {
  const isDark = useIsDark();

  const colors = {
    grid: isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
    axis: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8',
    line: isDark ? '#38a8f9' : '#0d1a30',
    activeDotStroke: '#38a8f9',
    activeDotFill: isDark ? '#141a24' : 'white',
    tooltipBg: isDark ? '#1c2230' : 'white',
    tooltipBorder: isDark ? '#2a3040' : '#e5e7eb',
    tooltipLabel: isDark ? '#8894aa' : '#6a778f',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis dataKey="month" stroke={colors.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} dy={8} />
            <YAxis stroke={colors.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} dx={-4}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            {showComparison && (
              <YAxis yAxisId="right" orientation="right" stroke={colors.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ background: colors.tooltipBg, borderColor: colors.tooltipBorder }} className="rounded-lg px-4 py-3 shadow-hover border">
                      <p style={{ color: colors.tooltipLabel }} className="font-body text-xs mb-1.5 font-semibold">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-body font-semibold" style={{ color: entry.color }}>
                          {entry.name}: {entry.dataKey === 'revenue' ? formatCurrency(entry.value as number) : entry.value?.toLocaleString('pt-BR')}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line type="monotone" dataKey="revenue" stroke={colors.line} strokeWidth={2.5}
              dot={{ fill: colors.line, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: colors.activeDotStroke, strokeWidth: 2, fill: colors.activeDotFill }}
              name="Faturamento"
            />
            {showComparison && (
              <>
                <Line type="monotone" dataKey="leads" stroke="#38a8f9" strokeWidth={1.5} dot={{ fill: "#38a8f9", strokeWidth: 0, r: 2 }} name="Leads" yAxisId="right" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={1.5} dot={{ fill: "#10b981", strokeWidth: 0, r: 2 }} name="Vendas" yAxisId="right" strokeDasharray="4 4" />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
