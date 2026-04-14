import { useState } from "react";
import { Card } from "@/components/ui/card";
import { EditableInput } from "@/components/ui/editable-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { SupabaseChannel } from "@/hooks/useSupabaseData";

interface MonthlyChannelEditorProps {
  channels: SupabaseChannel[];
  selectedMonth: string;
  onUpdateChannel: (channelId: string, field: string, value: string | number) => void;
  onAddChannel: () => void;
  onDeleteChannel: (channelId: string, channelName: string) => void;
}

export function MonthlyChannelEditor({
  channels,
  selectedMonth,
  onUpdateChannel,
  onAddChannel,
  onDeleteChannel
}: MonthlyChannelEditorProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (leads: number, sales: number) => {
    if (leads === 0) return "0,00%";
    return `${((sales / leads) * 100).toFixed(2)}%`;
  };

  const getMonthLabel = (monthStr: string) => {
    if (!monthStr || typeof monthStr !== 'string') {
      console.error('getMonthLabel received invalid monthStr:', monthStr);
      return 'Mês inválido';
    }
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={onAddChannel} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Canal
        </Button>
      </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Canal</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Contatos</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Leads</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Reuniões</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Propostas</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Vendas</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Faturamento</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Conv.%</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4">
                    <EditableInput
                      value={channel.name}
                      onSave={(value) => onUpdateChannel(channel.id, 'name', value)}
                      type="text"
                      displayClassName="font-medium text-foreground"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableInput
                      value={channel.contacts}
                      onSave={(value) => onUpdateChannel(channel.id, 'contacts', Number(value))}
                      type="number"
                      min={0}
                      displayClassName="text-right"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableInput
                      value={channel.qualified_leads}
                      onSave={(value) => onUpdateChannel(channel.id, 'qualified_leads', Number(value))}
                      type="number"
                      min={0}
                      displayClassName="text-right"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableInput
                      value={channel.meetings}
                      onSave={(value) => onUpdateChannel(channel.id, 'meetings', Number(value))}
                      type="number"
                      min={0}
                      displayClassName="text-right"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableInput
                      value={channel.proposals}
                      onSave={(value) => onUpdateChannel(channel.id, 'proposals', Number(value))}
                      type="number"
                      min={0}
                      displayClassName="text-right"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableInput
                      value={channel.sales}
                      onSave={(value) => onUpdateChannel(channel.id, 'sales', Number(value))}
                      type="number"
                      min={0}
                      displayClassName="text-right"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableInput
                      value={channel.revenue}
                      onSave={(value) => onUpdateChannel(channel.id, 'revenue', Number(value))}
                      type="currency"
                      min={0}
                      displayClassName="text-right font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge variant="outline" className="text-xs">
                      {formatPercentage(channel.qualified_leads, channel.sales)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o canal "{channel.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteChannel(channel.id, channel.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
          <p className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <strong>Instruções:</strong> Clique em qualquer valor para editá-lo. Os dados são salvos automaticamente para o mês selecionado ({getMonthLabel(selectedMonth)}). Conv.% = Vendas/Leads Qualificados.
          </p>
        </div>
    </div>
  );
}