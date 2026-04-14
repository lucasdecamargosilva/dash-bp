import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileDown, Calendar } from "lucide-react";
import { generateClientReport } from "@/lib/reportGenerator";
import { Client } from "@/data/mockData";

interface ClientExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export function ClientExportDialog({ open, onOpenChange, client }: ClientExportDialogProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      await generateClientReport(client, selectedPeriod);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setIsGenerating(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar Relatório - {client.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Cliente:</strong> {client.name}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Responsável:</strong> {client.responsible}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Projeto:</strong> {client.projectType}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período do Relatório
            </Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal (2025)</SelectItem>
                <SelectItem value="quarterly">Trimestral (2025)</SelectItem>
                <SelectItem value="yearly">Anual (2025)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground bg-primary/5 p-4 rounded-lg">
            <p><strong>O relatório incluirá:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Dados de CRM por etapa do funil</li>
              <li>Faturamento mensal de 2025</li>
              <li>Conversões por etapa</li>
              <li>Análise dos canais de aquisição</li>
              <li>Gráficos e métricas detalhadas</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Gerando..." : "Exportar PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}