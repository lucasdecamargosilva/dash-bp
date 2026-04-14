import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EditableInput } from "@/components/ui/editable-input";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "destructive" | "secondary" | "info";
  className?: string;
  editable?: boolean;
  onValueChange?: (value: string | number) => void;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  icon: Icon,
  variant = "primary",
  className,
  editable = false,
  onValueChange,
  loading = false
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (title.toLowerCase().includes('faturamento') || title.toLowerCase().includes('revenue')) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(val));
    }
    if (typeof val === 'number') {
      return Math.round(val).toLocaleString('pt-BR');
    }
    return val;
  };

  const getIconStyles = () => {
    switch (variant) {
      case "success": return { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400" };
      case "warning": return { bg: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400" };
      case "destructive": return { bg: "bg-red-50 dark:bg-red-500/10", icon: "text-red-600 dark:text-red-400" };
      case "primary": return { bg: "bg-navy-50 dark:bg-sky-500/10", icon: "text-navy-700 dark:text-sky-400" };
      case "secondary": return { bg: "bg-sky-50 dark:bg-sky-500/10", icon: "text-sky-600 dark:text-sky-400" };
      case "info": return { bg: "bg-sky-50 dark:bg-sky-500/10", icon: "text-sky-600 dark:text-sky-400" };
      default: return { bg: "bg-navy-50 dark:bg-sky-500/10", icon: "text-navy-700 dark:text-sky-400" };
    }
  };

  const getChangeColor = () => {
    if (change === undefined || change === null || change === 0) return "text-steel-400";
    return change > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
  };

  const getChangeBg = () => {
    if (change === undefined || change === null || change === 0) return "bg-steel-100 dark:bg-steel-800";
    return change > 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10";
  };

  const formatChange = (changeValue: number | undefined) => {
    if (changeValue === undefined || changeValue === null) return "";
    return `${changeValue > 0 ? "+" : ""}${changeValue.toFixed(1)}%`;
  };

  const ChangeIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus;
  const styles = getIconStyles();

  return (
    <div className={cn(
      "bg-white dark:bg-card rounded-xl p-4 border border-steel-100 dark:border-border shadow-kpi transition-all duration-200 hover:shadow-hover hover:border-steel-200 dark:hover:border-steel-700 h-full",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0 pr-3">
          <p className="text-[10px] font-body font-semibold uppercase tracking-[0.06em] text-steel-400 dark:text-muted-foreground leading-tight">
            {title}
          </p>
          {loading ? (
            <div className="h-7 w-20 rounded bg-steel-100 dark:bg-steel-800 animate-pulse" />
          ) : editable && onValueChange ? (
            <EditableInput
              value={value}
              onSave={onValueChange}
              type={title.toLowerCase().includes('receita') || title.toLowerCase().includes('revenue') || title.toLowerCase().includes('faturamento') ? 'currency' : 'number'}
              displayClassName="text-xl font-display font-bold text-navy-900 dark:text-foreground"
              min={0}
            />
          ) : (
            <p className={cn(
              "font-display font-bold text-navy-900 dark:text-foreground leading-tight",
              (title.toLowerCase().includes('faturamento') || title.toLowerCase().includes('revenue'))
                ? "text-base sm:text-lg"
                : "text-xl"
            )}>
              {formatValue(value)}
            </p>
          )}
          {change !== undefined && change !== null && (
            <div className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-body font-semibold",
              getChangeBg(),
              getChangeColor()
            )}>
              <ChangeIcon className="h-2.5 w-2.5" />
              {formatChange(change)}
            </div>
          )}
        </div>

        <div className={cn("p-2 rounded-lg flex-shrink-0", styles.bg)}>
          <Icon className={cn("h-4 w-4", styles.icon)} />
        </div>
      </div>
    </div>
  );
}
