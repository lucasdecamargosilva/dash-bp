import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboard } from "@/context/DashboardContext";
import { Client } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: (client: Client) => void;
}

export function AddClientDialog({ open, onOpenChange, onClientAdded }: AddClientDialogProps) {
  const { addSupabaseClient } = useDashboard();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    responsible: "",
    projectType: ""
  });

  const projectTypes = [
    "Comercial as a Service",
    "Automação"
  ];

  const responsibles = [
    "Raphael Acioli",
    "Lucas de Camargo",
    "Thiago Canina", 
    "Armando Neto",
    "Eric Racy"
  ];

  const months = [
    "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
    "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
    "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12"
  ];

  const formatMonthLabel = (monthValue: string) => {
    const [year, month] = monthValue.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    if (!formData.name || !formData.responsible || !formData.projectType) {
      toast.error("Todos os campos são obrigatórios");
      return;
    }

    try {
      // Always add to Supabase (no more mock logic)
      const clientData = await addSupabaseClient({
        name: formData.name,
        responsible: formData.responsible,
        project_type: formData.projectType,
        status: "active"
      });
      
      // Convert to Client format for onClientAdded callback
      const newClient: Client = {
        id: clientData?.id || crypto.randomUUID(),
        name: formData.name,
        responsible: formData.responsible,
        projectType: formData.projectType,
        totalRevenue: 0,
        monthlyRevenue: 0,
        revenueChange: 0,
        conversionRate: 0,
        status: "active",
        channels: []
      };
      
      onClientAdded(newClient);
      toast.success("Cliente criado com sucesso!");
      
      // Reset form
      setFormData({
        name: "",
        responsible: "",
        projectType: ""
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast.error("Erro ao criar cliente");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo cliente. Os canais de aquisição serão criados automaticamente com valores zerados.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Nome do Cliente *</Label>
            <Input
              id="client-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: TechStart Innovations"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsável BP Group *</Label>
            <Select value={formData.responsible} onValueChange={(value) => handleInputChange("responsible", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsibles.map((responsible) => (
                  <SelectItem key={responsible} value={responsible}>
                    {responsible}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-type">Tipo de Projeto *</Label>
            <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de projeto" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}