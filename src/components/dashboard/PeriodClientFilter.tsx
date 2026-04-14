import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "./DatePicker";
import { useDashboard } from "@/context/DashboardContext";
import { CalendarIcon, Users, Filter } from "lucide-react";

export function PeriodClientFilter() {
  const { 
    selectedPeriodFilter, 
    selectedClientFilter,
    startDate,
    endDate,
    setPeriodFilter, 
    setClientFilter,
    setDateRange,
    clients
  } = useDashboard();

  const handlePeriodChange = (value: string) => {
    setPeriodFilter(value === "all" ? null : value);
    
    // Auto-set date ranges based on period selection
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (value) {
      case "last-month":
        const lastMonth = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0);
        setDateRange(lastMonth.toISOString().split('T')[0], lastMonthEnd.toISOString().split('T')[0]);
        break;
      case "current-month":
        const currentMonthStart = new Date(currentYear, currentMonth, 1);
        const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
        setDateRange(currentMonthStart.toISOString().split('T')[0], currentMonthEnd.toISOString().split('T')[0]);
        break;
      case "last-3-months":
        const last3MonthsStart = new Date(currentYear, currentMonth - 3, 1);
        setDateRange(last3MonthsStart.toISOString().split('T')[0], now.toISOString().split('T')[0]);
        break;
      case "last-6-months":
        const last6MonthsStart = new Date(currentYear, currentMonth - 6, 1);
        setDateRange(last6MonthsStart.toISOString().split('T')[0], now.toISOString().split('T')[0]);
        break;
      case "year-to-date":
        const yearStart = new Date(currentYear, 0, 1);
        setDateRange(yearStart.toISOString().split('T')[0], now.toISOString().split('T')[0]);
        break;
      case "custom":
        // Don't auto-set dates for custom
        break;
      default:
        setDateRange('', '');
    }
  };

  const handleClientChange = (value: string) => {
    setClientFilter(value === "all" ? null : value);
  };

  const handleCustomDateChange = (start: Date | null, end: Date | null) => {
    setDateRange(
      start ? start.toISOString().split('T')[0] : '', 
      end ? end.toISOString().split('T')[0] : ''
    );
    if (start && end) {
      setPeriodFilter("custom");
    }
  };

  const clearFilters = () => {
    setPeriodFilter(null);
    setClientFilter(null);
    setDateRange('', '');
  };

  return (
    <Card className="p-3 shadow-sm bg-gradient-card mb-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-base font-medium text-foreground">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Period Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Período</label>
            <Select value={selectedPeriodFilter || "all"} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <CalendarIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="current-month">Mês atual</SelectItem>
                <SelectItem value="last-month">Mês passado</SelectItem>
                <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                <SelectItem value="year-to-date">Ano atual</SelectItem>
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cliente</label>
            <Select value={selectedClientFilter || "all"} onValueChange={handleClientChange}>
              <SelectTrigger>
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range - Show only when custom period is selected */}
          {selectedPeriodFilter === "custom" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data Inicial</label>
                <DatePicker
                  selected={startDate ? new Date(startDate) : undefined}
                  onSelect={(date) => handleCustomDateChange(date || null, endDate ? new Date(endDate) : null)}
                  placeholder="Selecionar data inicial"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data Final</label>
                <DatePicker
                  selected={endDate ? new Date(endDate) : undefined}
                  onSelect={(date) => handleCustomDateChange(startDate ? new Date(startDate) : null, date || null)}
                  placeholder="Selecionar data final"
                />
              </div>
            </>
          )}

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(selectedPeriodFilter || selectedClientFilter) && (
          <div className="pt-3 border-t border-border">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {selectedPeriodFilter && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  Período: {selectedPeriodFilter === "custom" ? "Personalizado" : selectedPeriodFilter}
                </span>
              )}
              {selectedClientFilter && (
                <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-md">
                  Cliente: {clients.find(c => c.id === selectedClientFilter)?.name || selectedClientFilter}
                </span>
              )}
              {startDate && endDate && (
                <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">
                  {new Date(startDate).toLocaleDateString('pt-BR')} - {new Date(endDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}