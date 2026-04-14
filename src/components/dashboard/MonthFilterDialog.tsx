import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
}

export function MonthFilterDialog({ 
  open, 
  onOpenChange, 
  selectedMonth, 
  onMonthSelect 
}: MonthFilterDialogProps) {
  const [tempMonth, setTempMonth] = useState(selectedMonth);

  // Generate months dynamically - include 2025, 2026, and future years
  const currentYear = new Date().getFullYear();
  const baseYears = [2025, 2026];
  const futureYears = Array.from({ length: 3 }, (_, i) => currentYear + i + 1).filter(y => y > 2026);
  const years = [...new Set([...baseYears, currentYear, ...futureYears])].sort((a, b) => a - b);
  
  const monthsData = [
    ...years.flatMap(year => [
      { value: `${year}-01`, label: `Jan/${year}` },
      { value: `${year}-02`, label: `Fev/${year}` },
      { value: `${year}-03`, label: `Mar/${year}` },
      { value: `${year}-04`, label: `Abr/${year}` },
      { value: `${year}-05`, label: `Mai/${year}` },
      { value: `${year}-06`, label: `Jun/${year}` },
      { value: `${year}-07`, label: `Jul/${year}` },
      { value: `${year}-08`, label: `Ago/${year}` },
      { value: `${year}-09`, label: `Set/${year}` },
      { value: `${year}-10`, label: `Out/${year}` },
      { value: `${year}-11`, label: `Nov/${year}` },
      { value: `${year}-12`, label: `Dez/${year}` },
    ])
  ];

  const handleApplyFilter = () => {
    onMonthSelect(tempMonth);
    onOpenChange(false);
  };

  const handleClearFilter = () => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    setTempMonth(currentMonth);
    onMonthSelect(currentMonth);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Filtrar por Mês</DialogTitle>
          <DialogDescription>
            Selecione um mês específico para visualizar os dados
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="month-filter">Mês</Label>
            <Select value={tempMonth} onValueChange={setTempMonth}>
              <SelectTrigger id="month-filter">
                <SelectValue placeholder="Selecione um mês" />
              </SelectTrigger>
              <SelectContent>
                {monthsData.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="outline" onClick={handleClearFilter}>
            Mês Atual
          </Button>
          <Button type="button" onClick={handleApplyFilter}>
            Aplicar Filtro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}