import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDashboard } from "@/context/DashboardContext";
import { Client } from "@/data/mockData";
import { FileDown, Calendar, User } from "lucide-react";
import { generateClientReport } from "@/lib/reportGenerator";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  defaultPeriod?: string;
}

export function ExportDialog({ open, onOpenChange, defaultClientId, defaultPeriod }: ExportDialogProps) {
  const { filteredClients } = useDashboard();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [isGenerating, setIsGenerating] = useState(false);

  // Set default values when dialog opens
  useEffect(() => {
    if (open) {
      if (defaultClientId && defaultClientId !== "all") {
        setSelectedClient(defaultClientId);
      }
      if (defaultPeriod && defaultPeriod !== "all") {
        // Convert period format to export format
        if (defaultPeriod.match(/^\d{4}-\d{2}$/)) {
          setSelectedPeriod("monthly");
        } else {
          setSelectedPeriod("monthly");
        }
      }
    }
  }, [open, defaultClientId, defaultPeriod]);

  const handleExport = async () => {
    if (!selectedClient) return;
    
    setIsGenerating(true);
    try {
      const client = filteredClients.find(c => c.id === selectedClient);
      if (client && client.channels) {
        // Filter channels based on selected period
        let filteredChannels = client.channels;
        
        if (selectedPeriod !== "all") {
          if (selectedPeriod === "monthly") {
            // For monthly reports, use the specific month selected in dashboard
            if (defaultPeriod && defaultPeriod !== "all" && defaultPeriod.match(/^\d{4}-\d{2}$/)) {
              filteredChannels = client.channels.filter(ch => ch.month === defaultPeriod);
            } else {
              // Fallback to current month if no specific month is selected
              const currentMonth = new Date().toISOString().slice(0, 7);
              filteredChannels = client.channels.filter(ch => ch.month === currentMonth);
            }
          } else if (selectedPeriod === "quarterly") {
            // Get last 3 months
            const now = new Date();
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 7);
            filteredChannels = client.channels.filter(ch => ch.month >= threeMonthsAgo);
          } else if (selectedPeriod === "yearly") {
            // Get current year
            const currentYear = new Date().getFullYear().toString();
            filteredChannels = client.channels.filter(ch => ch.month?.startsWith(currentYear));
          }
        }

        // Convert ClientData to Client format for report generation
        const clientForReport: Client = {
          id: client.id,
          name: client.name,
          responsible: client.responsible || 'N/A',
          projectType: client.project_type || 'N/A',
          status: client.status || 'active',
          totalRevenue: filteredChannels.reduce((sum, ch) => sum + (ch.faturamento || 0), 0),
          monthlyRevenue: 0,
          revenueChange: 0,
          conversionRate: 0,
          channels: filteredChannels.map(ch => ({
            id: ch.id,
            name: ch.name,
            contacts: ch.contatos || 0,
            qualifiedLeads: ch.leads || 0,
            meetings: ch.reunioes || 0,
            proposals: ch.propostas || 0,
            sales: ch.vendas || 0,
            revenue: ch.faturamento || 0,
            month: ch.month
          }))
        };
        await generateClientReport(clientForReport, selectedPeriod);
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
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
            Exportar Relatório
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={!selectedClient || isGenerating}
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