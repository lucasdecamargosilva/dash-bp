import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, subDays, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

const PRESETS = [
  {
    label: "Este mes",
    getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }),
  },
  {
    label: "Mes passado",
    getValue: () => {
      const prev = subMonths(new Date(), 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    },
  },
  {
    label: "Ultimos 7 dias",
    getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "Ultimos 30 dias",
    getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "Ultimos 90 dias",
    getValue: () => ({ from: subDays(new Date(), 89), to: new Date() }),
  },
  {
    label: "Este ano",
    getValue: () => ({ from: startOfYear(new Date()), to: new Date() }),
  },
  {
    label: "Todos",
    getValue: () => undefined as DateRange | undefined,
  },
];

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatLabel = () => {
    if (!dateRange?.from) return "Todos os periodos";
    if (!dateRange.to) return format(dateRange.from, "dd MMM yyyy", { locale: ptBR });
    // Check if it's a full month
    const fromMonth = startOfMonth(dateRange.from);
    const toMonth = endOfMonth(dateRange.from);
    if (dateRange.from.getTime() === fromMonth.getTime() && dateRange.to.getTime() === toMonth.getTime()) {
      return format(dateRange.from, "MMMM yyyy", { locale: ptBR });
    }
    return `${format(dateRange.from, "dd MMM", { locale: ptBR })} - ${format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start text-left text-sm font-body gap-2 bg-white dark:bg-card border-steel-200 dark:border-border",
            !dateRange?.from && "text-steel-400 dark:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-steel-400" />
          <span className="capitalize">{formatLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex">
          {/* Presets */}
          <div className="flex flex-col gap-0.5 p-2 border-r border-steel-100 dark:border-border">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onDateRangeChange(preset.getValue());
                  setOpen(false);
                }}
                className="px-3 py-1.5 text-[11px] font-body font-medium text-steel-600 dark:text-muted-foreground hover:bg-sky-50 dark:hover:bg-secondary hover:text-navy-900 dark:hover:text-foreground rounded-md transition-colors text-left whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Calendar */}
          <div className="p-2">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from || new Date()}
              selected={dateRange}
              onSelect={(range) => {
                onDateRangeChange(range);
                if (range?.from && range?.to) setOpen(false);
              }}
              numberOfMonths={1}
              locale={ptBR}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
