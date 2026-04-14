import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
}

export function DateRangePicker({ startDate, endDate, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<{
    from?: Date;
    to?: Date;
  }>({
    from: startDate,
    to: endDate,
  });

  React.useEffect(() => {
    setSelectedRange({
      from: startDate,
      to: endDate,
    });
  }, [startDate, endDate]);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setSelectedRange({});
      onDateChange(undefined, undefined);
      return;
    }

    setSelectedRange(range);
    
    if (range.from && range.to) {
      onDateChange(range.from, range.to);
      setIsOpen(false);
    } else if (range.from && !range.to) {
      // Single date selection
      onDateChange(range.from, range.from);
    }
  };

  const clearDates = () => {
    setSelectedRange({});
    onDateChange(undefined, undefined);
  };

  const formatDateRange = () => {
    if (selectedRange.from && selectedRange.to) {
      if (selectedRange.from.getTime() === selectedRange.to.getTime()) {
        return format(selectedRange.from, "dd/MM/yyyy", { locale: ptBR });
      }
      return `${format(selectedRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(selectedRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (selectedRange.from) {
      return format(selectedRange.from, "dd/MM/yyyy", { locale: ptBR });
    }
    return "Selecionar data";
  };

  const hasSelection = selectedRange.from || selectedRange.to;

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !hasSelection && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={selectedRange.from}
            selected={selectedRange.from && selectedRange.to ? {
              from: selectedRange.from,
              to: selectedRange.to
            } : selectedRange.from ? {
              from: selectedRange.from,
              to: selectedRange.from
            } : undefined}
            onSelect={handleSelect}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      {hasSelection && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearDates}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {hasSelection && (
        <Badge variant="secondary" className="text-xs">
          {selectedRange.from && selectedRange.to 
            ? selectedRange.from.getTime() === selectedRange.to.getTime()
              ? "Dia específico"
              : "Período"
            : "Data selecionada"
          }
        </Badge>
      )}
    </div>
  );
}