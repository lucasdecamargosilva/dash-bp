import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp, TrendingDown, Building2, Trash2 } from "lucide-react";
import { EditableInput } from "@/components/ui/editable-input";
import { useDashboard } from "@/context/DashboardContext";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  responsible: string;
  projectType: string;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueChange: number;
  conversionRate: number;
  status: "active" | "warning" | "critical";
}

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  onDelete?: (clientId: string) => void;
  className?: string;
}

export function ClientCard({ client, onClick, onDelete, className }: ClientCardProps) {
  const { updateClientField } = useDashboard();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = () => {
    switch (client.status) {
      case "active":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "critical":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = () => {
    switch (client.status) {
      case "active":
        return "Ativo";
      case "warning":
        return "Atenção";
      case "critical":
        return "Crítico";
      default:
        return "Indefinido";
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(client.id);
    }
  };

  return (
    <Card className={cn(
      "p-6 shadow-card bg-gradient-card transition-all duration-300 hover:shadow-hover cursor-pointer",
      className
    )} onClick={onClick}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <EditableInput
                value={client.name}
                onSave={(value) => updateClientField(client.id, 'name', value)}
                type="text"
                displayClassName="font-semibold text-foreground"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              Responsável: <EditableInput
                value={client.responsible}
                onSave={(value) => updateClientField(client.id, 'responsible', value)}
                type="text"
                displayClassName="inline"
              />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Project Type */}
        <div>
          <Badge variant="outline" className="text-xs">
            <EditableInput
              value={client.projectType}
              onSave={(value) => updateClientField(client.id, 'projectType', value)}
              type="text"
              displayClassName="inline text-xs"
            />
          </Badge>
        </div>

        {/* Revenue Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-muted-foreground">Faturamento Total</span>
            <div>
              <EditableInput
                value={client.totalRevenue}
                onSave={(value) => updateClientField(client.id, 'totalRevenue', Number(value))}
                type="currency"
                displayClassName="text-lg font-bold text-foreground"
                min={0}
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Este Mês</span>
            <div>
              <EditableInput
                value={client.monthlyRevenue}
                onSave={(value) => updateClientField(client.id, 'monthlyRevenue', Number(value))}
                type="currency"
                displayClassName="text-lg font-bold text-foreground"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {client.revenueChange > 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={cn(
                "text-sm font-medium",
                client.revenueChange > 0 ? "text-success" : "text-destructive"
              )}>
                {client.revenueChange > 0 ? "+" : ""}{client.revenueChange}%
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Conv: {client.conversionRate.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover shrink-0 self-start sm:self-center">
            Ver Detalhes
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}