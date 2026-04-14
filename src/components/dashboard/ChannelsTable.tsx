import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditableInput } from "@/components/ui/editable-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Channel } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface ChannelsTableProps {
  channels: Channel[];
  onUpdateChannel: (channelId: string, field: keyof Channel, value: string | number) => void;
  onAddChannel: () => void;
  onDeleteChannel: (channelId: string, channelName: string) => void;
  className?: string;
}

export function ChannelsTable({ 
  channels, 
  onUpdateChannel, 
  onAddChannel, 
  onDeleteChannel,
  className 
}: ChannelsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getConversionRate = (channel: Channel) => {
    if (channel.contacts === 0) return 0;
    return ((channel.sales / channel.contacts) * 100);
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 15) return "text-success";
    if (rate >= 10) return "text-warning";
    return "text-destructive";
  };

  const getTrendIcon = (rate: number) => {
    if (rate >= 15) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  return (
    <Card className={cn("p-6 shadow-card bg-gradient-card", className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">
            Canais de Aquisição
          </h3>
          <Button variant="outline" size="sm" onClick={onAddChannel}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Canal
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="font-semibold text-foreground">Canal</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Contatos</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Leads</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Reuniões</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Propostas</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Vendas</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Faturamento</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Conv. %</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.length > 0 ? channels.map((channel) => {
                const conversionRate = getConversionRate(channel);
                return (
                  <TableRow key={channel.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <EditableInput
                        value={channel.name}
                        onSave={(value) => onUpdateChannel(channel.id, 'name', String(value))}
                        type="text"
                        displayClassName="font-medium text-foreground"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableInput
                        value={channel.contacts}
                        onSave={(value) => onUpdateChannel(channel.id, 'contacts', Number(value))}
                        type="number"
                        min={0}
                        displayClassName="text-right text-foreground"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableInput
                        value={channel.qualifiedLeads}
                        onSave={(value) => onUpdateChannel(channel.id, 'qualifiedLeads', Number(value))}
                        type="number"
                        min={0}
                        displayClassName="text-right text-foreground"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableInput
                        value={channel.meetings}
                        onSave={(value) => onUpdateChannel(channel.id, 'meetings', Number(value))}
                        type="number"
                        min={0}
                        displayClassName="text-right text-foreground"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableInput
                        value={channel.proposals}
                        onSave={(value) => onUpdateChannel(channel.id, 'proposals', Number(value))}
                        type="number"
                        min={0}
                        displayClassName="text-right text-foreground"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <EditableInput
                        value={channel.sales}
                        onSave={(value) => onUpdateChannel(channel.id, 'sales', Number(value))}
                        type="number"
                        min={0}
                        displayClassName="text-right text-foreground"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <EditableInput
                        value={channel.revenue}
                        onSave={(value) => onUpdateChannel(channel.id, 'revenue', Number(value))}
                        type="currency"
                        min={0}
                        displayClassName="text-right font-semibold text-foreground"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={cn(
                        "flex items-center justify-end gap-1 font-medium",
                        getConversionColor(conversionRate)
                      )}>
                        {getTrendIcon(conversionRate)}
                        {conversionRate.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteChannel(channel.id, channel.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum canal encontrado. Adicione um canal para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {channels.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {channels.reduce((sum, ch) => sum + ch.contacts, 0).toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground">Total Contatos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {channels.reduce((sum, ch) => sum + ch.sales, 0).toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground">Total Vendas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(channels.reduce((sum, ch) => sum + ch.revenue, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Faturamento Total</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                getConversionColor(
                  channels.reduce((sum, ch) => sum + ch.contacts, 0) > 0 
                    ? (channels.reduce((sum, ch) => sum + ch.sales, 0) / channels.reduce((sum, ch) => sum + ch.contacts, 0)) * 100
                    : 0
                )
              )}>
                {channels.reduce((sum, ch) => sum + ch.contacts, 0) > 0 
                  ? ((channels.reduce((sum, ch) => sum + ch.sales, 0) / channels.reduce((sum, ch) => sum + ch.contacts, 0)) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Conv. Geral</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}