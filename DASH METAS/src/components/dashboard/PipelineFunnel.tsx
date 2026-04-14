import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface FunnelStep {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface PipelineFunnelProps {
  steps: FunnelStep[];
}

export const PipelineFunnel = ({ steps }: PipelineFunnelProps) => {
  const maxValue = Math.max(...steps.map(step => step.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {step.value.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({isFinite(step.percentage) && !isNaN(step.percentage) 
                    ? `${step.percentage.toFixed(1)}%` 
                    : "Sem dados"})
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={(step.value / maxValue) * 100} 
                className="h-3"
                style={{
                  '--progress-foreground': step.color,
                } as React.CSSProperties}
              />
              {index < steps.length - 1 && (
                <div className="absolute -bottom-3 left-0 w-full flex justify-center">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-muted" />
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};