import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ViewToggleProps {
  isWeeklyView: boolean;
  onToggle: (checked: boolean) => void;
}

export const ViewToggle = ({ isWeeklyView, onToggle }: ViewToggleProps) => {
  return (
    <div className="flex items-center space-x-2 bg-card border rounded-lg px-4 py-2">
      <Label htmlFor="view-toggle" className="text-sm font-medium cursor-pointer">
        Visão Mensal
      </Label>
      <Switch 
        id="view-toggle" 
        checked={isWeeklyView}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="view-toggle" className="text-sm font-medium cursor-pointer">
        Visão Semanal
      </Label>
    </div>
  );
};
