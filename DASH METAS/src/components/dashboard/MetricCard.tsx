import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  icon: LucideIcon;
  format?: "number" | "percentage";
  variant?: "default" | "success" | "warning" | "destructive";
}

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  format = "number",
  variant = "default" 
}: MetricCardProps) => {
  const formatValue = (val: number) => {
    if (!isFinite(val) || isNaN(val)) {
      return "Sem dados";
    }
    if (format === "percentage") {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString();
  };

  const getVariantColor = () => {
    switch (variant) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "destructive":
        return "text-red-600";
      default:
        return "text-primary";
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getVariantColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {change !== undefined && isFinite(change) && !isNaN(change) && (
            <Badge variant={change >= 0 ? "default" : "destructive"}>
              {change >= 0 ? "+" : ""}{change.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};