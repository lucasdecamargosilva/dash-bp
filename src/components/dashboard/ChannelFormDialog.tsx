import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { Channel } from "@/data/mockData";
import { toast } from "sonner";

interface ChannelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  selectedMonth: string | null;
  isAllMonthsPeriod: boolean;
  mode: "create" | "edit";
  channel?: Channel | null;
}

export function ChannelFormDialog({
  open,
  onOpenChange,
  clientId,
  selectedMonth,
  isAllMonthsPeriod,
  mode,
  channel,
}: ChannelFormDialogProps) {
  const { addChannelToClient, addSupabaseChannel, updateChannelField, clients } = useDashboard();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    contacts: "",
    qualifiedLeads: "",
    meetings: "",
    proposals: "",
    sales: "",
    revenue: "",
    month: selectedMonth || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate month options for current year (2025)
  const monthOptions = [
    { value: "2025-01", label: "Janeiro 2025" },
    { value: "2025-02", label: "Fevereiro 2025" },
    { value: "2025-03", label: "Março 2025" },
    { value: "2025-04", label: "Abril 2025" },
    { value: "2025-05", label: "Maio 2025" },
    { value: "2025-06", label: "Junho 2025" },
    { value: "2025-07", label: "Julho 2025" },
    { value: "2025-08", label: "Agosto 2025" },
    { value: "2025-09", label: "Setembro 2025" },
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-11", label: "Novembro 2025" },
    { value: "2025-12", label: "Dezembro 2025" },
  ];

  // Reset form when dialog opens/closes or channel changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && channel) {
        setFormData({
          name: channel.name,
          contacts: channel.contacts.toString(),
          qualifiedLeads: channel.qualifiedLeads.toString(),
          meetings: channel.meetings.toString(),
          proposals: channel.proposals.toString(),
          sales: channel.sales.toString(),
          revenue: channel.revenue.toString(),
          month: channel.month || selectedMonth || "",
        });
      } else {
        setFormData({
          name: "",
          contacts: "",
          qualifiedLeads: "",
          meetings: "",
          proposals: "",
          sales: "",
          revenue: "",
          month: selectedMonth || "",
        });
      }
    }
  }, [open, mode, channel, selectedMonth]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Nome do canal é obrigatório");
      return false;
    }

    if (formData.name.trim().length < 2) {
      toast.error("Nome do canal deve ter pelo menos 2 caracteres");
      return false;
    }

    if (isAllMonthsPeriod && !formData.month) {
      toast.error("Mês de referência é obrigatório quando período 'Todos os meses' está selecionado");
      return false;
    }

    // Check for duplicate channel name (case-insensitive)
    const client = clients.find(c => c.id === clientId);
    if (client && client.channels) {
      const existingChannel = client.channels.find(c => 
        c.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        c.id !== channel?.id // Allow same name for current channel in edit mode
      );
      
      if (existingChannel) {
        toast.error("Já existe um canal com este nome para este cliente");
        return false;
      }
    }

    // Validate numeric fields
    const numericFields = ['contacts', 'qualifiedLeads', 'meetings', 'proposals', 'sales', 'revenue'];
    for (const field of numericFields) {
      const value = formData[field as keyof typeof formData];
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        toast.error(`${field} deve ser um número igual ou maior que zero`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const targetMonth = formData.month || selectedMonth;
      
      const channelData = {
        name: formData.name.trim(),
        contacts: parseInt(formData.contacts) || 0,
        qualified_leads: parseInt(formData.qualifiedLeads) || 0,
        meetings: parseInt(formData.meetings) || 0,
        proposals: parseInt(formData.proposals) || 0,
        sales: parseInt(formData.sales) || 0,
        revenue: parseInt(formData.revenue) || 0,
        month: targetMonth,
      };

      if (mode === "edit" && channel) {
        // Update existing channel
        if (user) {
          // Update each field individually for Supabase
          await updateChannelField(channel.id, 'name', channelData.name);
          await updateChannelField(channel.id, 'contacts', channelData.contacts);
          await updateChannelField(channel.id, 'qualifiedLeads', channelData.qualified_leads);
          await updateChannelField(channel.id, 'meetings', channelData.meetings);
          await updateChannelField(channel.id, 'proposals', channelData.proposals);
          await updateChannelField(channel.id, 'sales', channelData.sales);
          await updateChannelField(channel.id, 'revenue', channelData.revenue);
          if (targetMonth) {
            await updateChannelField(channel.id, 'month', targetMonth);
          }
        } else {
          // Update mock data
          const updatedChannel: Channel = {
            ...channel,
            name: channelData.name,
            contacts: channelData.contacts,
            qualifiedLeads: channelData.qualified_leads,
            meetings: channelData.meetings,
            proposals: channelData.proposals,
            sales: channelData.sales,
            revenue: channelData.revenue,
            month: targetMonth,
          };
          // This would need to be implemented in the context
        }
        
        toast.success("Canal atualizado com sucesso!");
      } else {
        // Create new channel
        if (user) {
          await addSupabaseChannel(clientId, channelData);
        } else {
          const newChannel: Channel = {
            id: `channel-${Date.now()}`,
            name: channelData.name,
            contacts: channelData.contacts,
            qualifiedLeads: channelData.qualified_leads,
            meetings: channelData.meetings,
            proposals: channelData.proposals,
            sales: channelData.sales,
            revenue: channelData.revenue,
            month: targetMonth,
          };
          addChannelToClient(clientId, newChannel);
        }
        
        toast.success("Canal adicionado com sucesso!");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving channel:", error);
      toast.error(mode === "edit" ? "Erro ao atualizar canal" : "Erro ao adicionar canal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Editar Canal" : "Adicionar Novo Canal"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Atualize as informações do canal de aquisição"
              : "Preencha as informações do canal de aquisição"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Nome do Canal */}
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

          {/* Mês de referência */}
          {isAllMonthsPeriod ? (
            <div className="space-y-2">
              <Label htmlFor="month">Mês de Referência *</Label>
              <Select
                value={formData.month}
                onValueChange={(value) => handleInputChange("month", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            selectedMonth && (
              <div className="space-y-2">
                <Label htmlFor="month">Mês de Referência</Label>
                <Input
                  value={monthOptions.find(opt => opt.value === selectedMonth)?.label || selectedMonth}
                  disabled
                  className="bg-muted"
                />
              </div>
            )
          )}

          {/* Métricas */}
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
                step="0.01"
                value={formData.revenue}
                onChange={(e) => handleInputChange("revenue", e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (isAllMonthsPeriod && !formData.month)}
            >
              {isSubmitting 
                ? (mode === "edit" ? "Atualizando..." : "Adicionando...")
                : (mode === "edit" ? "Atualizar Canal" : "Adicionar Canal")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}