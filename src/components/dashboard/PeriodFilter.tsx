import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, X } from "lucide-react";
import { DatePicker } from "./DatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PeriodFilterProps {
  onPeriodChange: (startDate: Date | null, endDate: Date | null, preset?: string) => void;
  selectedPeriod?: { start: Date | null; end: Date | null; preset?: string };
  className?: string;
}

export function PeriodFilter({ onPeriodChange, selectedPeriod, className }: PeriodFilterProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(selectedPeriod?.start || undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(selectedPeriod?.end || undefined);
  const [preset, setPreset] = useState<string>(selectedPeriod?.preset || "");

  const presets = [
    { value: "thisMonth", label: "Este mês" },
    { value: "lastMonth", label: "Mês passado" },
    { value: "last3Months", label: "Últimos 3 meses" },
    { value: "last6Months", label: "Últimos 6 meses" },
    { value: "thisYear", label: "Este ano" },
    { value: "custom", label: "Período personalizado" }
  ];

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const today = new Date();
    
    switch (value) {
      case "thisMonth":
        const thisMonthStart = startOfMonth(today);
        const thisMonthEnd = endOfMonth(today);
        setStartDate(thisMonthStart);
        setEndDate(thisMonthEnd);
        onPeriodChange(thisMonthStart, thisMonthEnd, value);
        break;
      case "lastMonth":
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        const lastMonthEnd = endOfMonth(subMonths(today, 1));
        setStartDate(lastMonthStart);
        setEndDate(lastMonthEnd);
        onPeriodChange(lastMonthStart, lastMonthEnd, value);
        break;
      case "last3Months":
        const last3MonthsStart = startOfMonth(subMonths(today, 3));
        setStartDate(last3MonthsStart);
        setEndDate(endOfMonth(today));
        onPeriodChange(last3MonthsStart, endOfMonth(today), value);
        break;
      case "last6Months":
        const last6MonthsStart = startOfMonth(subMonths(today, 6));
        setStartDate(last6MonthsStart);
        setEndDate(endOfMonth(today));
        onPeriodChange(last6MonthsStart, endOfMonth(today), value);
        break;
      case "thisYear":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        setStartDate(yearStart);
        setEndDate(yearEnd);
        onPeriodChange(yearStart, yearEnd, value);
        break;
      case "custom":
        // Don't change dates, let user pick
        break;
      default:
        setStartDate(undefined);
        setEndDate(undefined);
        onPeriodChange(null, null);
    }
  };

  const handleCustomDatesApply = () => {
    if (preset === "custom") {
      onPeriodChange(startDate || null, endDate || null, "custom");
    }
  };

  const clearFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setPreset("");
    onPeriodChange(null, null);
  };

  const hasActiveFilter = startDate || endDate || preset;

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Filtro de Período</span>
        </div>
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Período rápido:
          </label>
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Data inicial:
              </label>
              <DatePicker
                selected={startDate}
                onSelect={setStartDate}
                placeholder="Início"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Data final:
              </label>
              <DatePicker
                selected={endDate}
                onSelect={setEndDate}
                placeholder="Fim"
              />
            </div>
          </div>
        )}

        {preset === "custom" && (startDate || endDate) && (
          <Button onClick={handleCustomDatesApply} className="w-full">
            Aplicar Filtro
          </Button>
        )}
      </div>

      {hasActiveFilter && (
        <div className="flex flex-wrap gap-2">
          {preset && preset !== "custom" && (
            <Badge variant="secondary">
              {presets.find(p => p.value === preset)?.label}
            </Badge>
          )}
          {preset === "custom" && startDate && (
            <Badge variant="secondary">
              Início: {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          )}
          {preset === "custom" && endDate && (
            <Badge variant="secondary">
              Fim: {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}