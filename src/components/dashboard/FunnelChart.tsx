import { cn } from "@/lib/utils";

interface FunnelStage {
  name: string;
  value: number;
  conversionRate?: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  title: string;
  className?: string;
}

export function FunnelChart({ stages, title, className }: FunnelChartProps) {
  const maxValue = Math.max(...stages.map(stage => stage.value));

  const getStageWidth = (value: number) => {
    if (maxValue === 0) return 0;
    return Math.max((value / maxValue) * 100, 4);
  };

  const stageColors = [
    "bg-navy-800 dark:bg-sky-700",
    "bg-navy-600 dark:bg-sky-600",
    "bg-sky-600 dark:bg-sky-500",
    "bg-sky-500 dark:bg-sky-400",
    "bg-emerald-500 dark:bg-emerald-400",
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {stages.map((stage, index) => {
        const width = getStageWidth(stage.value);

        return (
          <div key={stage.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-body font-medium text-navy-800 dark:text-foreground/80">
                {stage.name}
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-display font-bold text-navy-900 dark:text-foreground tabular-nums">
                  {stage.value.toLocaleString('pt-BR')}
                </span>
                {index > 0 && stage.conversionRate !== undefined && (
                  <span className={cn(
                    "text-[10px] font-body font-bold px-1.5 py-0.5 rounded",
                    stage.conversionRate >= 50 ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                    stage.conversionRate >= 25 ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                    "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
                  )}>
                    {stage.conversionRate}%
                  </span>
                )}
              </div>
            </div>

            <div className="relative h-6 bg-steel-100 dark:bg-secondary rounded overflow-hidden">
              <div
                className={cn(
                  "h-full rounded transition-all duration-700 ease-out",
                  stageColors[index] || stageColors[0]
                )}
                style={{ width: `${width}%` }}
              />
            </div>

            {index < stages.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className="w-px h-2 bg-steel-200 dark:bg-border" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
