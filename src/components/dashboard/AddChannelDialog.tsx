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
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/hooks/useAuth";
import { Channel } from "@/data/mockData";
import { toast } from "sonner";

interface AddChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  month?: string;
  onAddChannel?: (channelData: any) => Promise<void>;
}

export function AddChannelDialog({ open, onOpenChange, clientId, month, onAddChannel }: AddChannelDialogProps) {
  const { addChannelToClient, addSupabaseChannel } = useDashboard();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    contacts: "",
    qualifiedLeads: "",
    meetings: "",
    proposals: "",
    sales: "",
    revenue: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Nome do canal é obrigatório");
      return;
    }

    try {
      const channelData = {
        name: formData.name,
        contacts: parseInt(formData.contacts) || 0,
        qualified_leads: parseInt(formData.qualifiedLeads) || 0,
        meetings: parseInt(formData.meetings) || 0,
        proposals: parseInt(formData.proposals) || 0,
        sales: parseInt(formData.sales) || 0,
        revenue: parseInt(formData.revenue) || 0
      };

      if (onAddChannel) {
        // Use custom handler when provided (for monthly data)
        await onAddChannel(channelData);
      } else if (user) {
        // Use Supabase for authenticated users
        await addSupabaseChannel(clientId, channelData);
      } else {
        // Use mock data for non-authenticated users
        const newChannel: Channel = {
          id: `channel-${Date.now()}`,
          ...channelData,
          qualifiedLeads: channelData.qualified_leads
        };

        addChannelToClient(clientId, newChannel);
      }
      
      toast.success("Canal adicionado com sucesso!");
      
      // Reset form
      setFormData({
        name: "",
        contacts: "",
        qualifiedLeads: "",
        meetings: "",
        proposals: "",
        sales: "",
        revenue: ""
      });
      
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao adicionar canal");
      console.error("Error adding channel:", error);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Canal</DialogTitle>
          <DialogDescription>
            Preencha as informações do canal de aquisição
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Nome do Canal *</Label>
            <Input
              id="channel-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Instagram Orgânico, LinkedIn Outbound, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacts">Contatos</Label>
              <Input
                id="contacts"
                type="number"
                min="0"
                value={formData.contacts}
                onChange={(e) => handleInputChange("contacts", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualified-leads">Leads Qualificados</Label>
              <Input
                id="qualified-leads"
                type="number"
                min="0"
                value={formData.qualifiedLeads}
                onChange={(e) => handleInputChange("qualifiedLeads", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetings">Reuniões</Label>
              <Input
                id="meetings"
                type="number"
                min="0"
                value={formData.meetings}
                onChange={(e) => handleInputChange("meetings", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposals">Propostas</Label>
              <Input
                id="proposals"
                type="number"
                min="0"
                value={formData.proposals}
                onChange={(e) => handleInputChange("proposals", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales">Vendas</Label>
              <Input
                id="sales"
                type="number"
                min="0"
                value={formData.sales}
                onChange={(e) => handleInputChange("sales", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue">Faturamento (R$)</Label>
              <Input
                id="revenue"
                type="number"
                min="0"
                value={formData.revenue}
                onChange={(e) => handleInputChange("revenue", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar Canal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}