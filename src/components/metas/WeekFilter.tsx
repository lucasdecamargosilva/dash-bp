import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WeekFilterProps {
  selectedWeek: number;
  onWeekChange: (week: number) => void;
}

export const WeekFilter = ({ selectedWeek, onWeekChange }: WeekFilterProps) => {
  const weeks = [
    { value: 1, label: "Semana 1 (Dia 1-7)" },
    { value: 2, label: "Semana 2 (Dia 7-14)" },
    { value: 3, label: "Semana 3 (Dia 14-21)" },
    { value: 4, label: "Semana 4 (Dia 21-Fim)" },
  ];

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="week-select" className="text-sm font-medium">
        Semana:
      </label>
      <Select 
        value={selectedWeek.toString()} 
        onValueChange={(value) => onWeekChange(parseInt(value))}
      >
        <SelectTrigger id="week-select" className="w-52">
          <SelectValue placeholder="Selecione a semana" />
        </SelectTrigger>
        <SelectContent>
          {weeks.map((week) => (
            <SelectItem key={week.value} value={week.value.toString()}>
              {week.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
