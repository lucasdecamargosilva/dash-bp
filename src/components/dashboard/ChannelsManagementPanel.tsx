import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Plus, Trash2, Search } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";
import { ChannelFormDialog } from "./ChannelFormDialog";
import { DeleteChannelDialog } from "./DeleteChannelDialog";
import { cn } from "@/lib/utils";

interface ChannelsManagementPanelProps {
  clientId: string;
  selectedMonth: string | null;
  isAllMonthsPeriod: boolean;
}

export function ChannelsManagementPanel({
  clientId,
  selectedMonth,
  isAllMonthsPeriod
}: ChannelsManagementPanelProps) {
  const { clients, channelData } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  const getClientChannels = () => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return [];

    let channels = channelData || [];
    if (searchTerm.trim()) {
      channels = channels.filter(channel => channel.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    const compatibleChannels = channels.map(channel => ({
      ...channel,
      contacts: channel.contatos || 0,
      qualifiedLeads: channel.leads || 0,
      meetings: channel.reunioes || 0,
      proposals: channel.propostas || 0,
      sales: channel.vendas || 0,
      revenue: channel.faturamento || 0,
      month: selectedMonth
    }));

    compatibleChannels.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    return compatibleChannels;
  };

  const displayChannels = useMemo(() => getClientChannels(), [clients, clientId, channelData, searchTerm, sortBy, sortOrder, selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = (channel: any) => {
    setSelectedChannel(channel);
    setShowDeleteDialog(true);
  };

  const SortHeader = ({ field, children, align = "right" }: { field: string; children: React.ReactNode; align?: "left" | "right" }) => (
    <th
      className={cn(
        "px-4 py-3 text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground cursor-pointer hover:text-navy-800 dark:hover:text-foreground transition-colors select-none",
        align === "left" ? "text-left" : "text-right"
      )}
      onClick={() => handleSort(field)}
    >
      <div className={cn("flex items-center gap-1", align === "right" && "justify-end")}>
        {children}
        <ArrowUpDown className={cn("h-3 w-3", sortBy === field ? "text-sky-500" : "text-steel-300 dark:text-steel-600")} />
      </div>
    </th>
  );

  return (
    <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden animate-fade-up delay-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-steel-100 dark:border-border">
        <div>
          <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">
            Canais de Aquisicao
          </h3>
          {!isAllMonthsPeriod && selectedMonth && (
            <p className="text-xs font-body text-steel-400 mt-0.5">{selectedMonth}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel-300" />
            <Input
              placeholder="Buscar canal..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-8 w-48 text-xs font-body"
            />
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            className="bg-navy-900 hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-body text-xs gap-1.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bp-scroll">
        <table className="w-full">
          <thead>
            <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
              <SortHeader field="name" align="left">Canal</SortHeader>
              <SortHeader field="contacts">Contatos</SortHeader>
              <SortHeader field="qualifiedLeads">Leads</SortHeader>
              <SortHeader field="meetings">Reunioes</SortHeader>
              <SortHeader field="proposals">Propostas</SortHeader>
              <SortHeader field="sales">Vendas</SortHeader>
              <SortHeader field="revenue">Faturamento</SortHeader>
              <SortHeader field="conversion_percent">Conv.</SortHeader>
              <th className="px-4 py-3 text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 text-center">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {displayChannels.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-sm font-body text-steel-400">
                  {searchTerm ? 'Nenhum canal encontrado' : 'Nenhum canal cadastrado'}
                </td>
              </tr>
            ) : displayChannels.map((channel) => {
              const leadsConversion = channel.contacts > 0 ? (channel.qualifiedLeads / channel.contacts) * 100 : 0;
              const meetingsConversion = channel.qualifiedLeads > 0 ? (channel.meetings / channel.qualifiedLeads) * 100 : 0;
              const proposalsConversion = channel.meetings > 0 ? (channel.proposals / channel.meetings) * 100 : 0;
              const salesConversion = channel.proposals > 0 ? (channel.sales / channel.proposals) * 100 : 0;

              return (
                <tr key={channel.id} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors group">
                  <td className="px-4 py-3 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{channel.name}</td>
                  <td className="px-4 py-3 text-right font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{channel.contacts.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{channel.qualifiedLeads.toLocaleString()}</div>
                    <div className="text-[10px] font-body text-steel-400">{formatPercentage(leadsConversion)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{channel.meetings.toLocaleString()}</div>
                    <div className="text-[10px] font-body text-steel-400">{formatPercentage(meetingsConversion)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{channel.proposals.toLocaleString()}</div>
                    <div className="text-[10px] font-body text-steel-400">{formatPercentage(proposalsConversion)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-body text-sm text-navy-800 dark:text-foreground/80 tabular-nums">{channel.sales.toLocaleString()}</div>
                    <div className="text-[10px] font-body text-steel-400">{formatPercentage(salesConversion)}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-body text-sm text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">{formatCurrency(channel.revenue)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[10px] font-body font-bold",
                      (channel.conversion_percent || 0) >= 10
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : (channel.conversion_percent || 0) >= 5
                          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-steel-100 dark:bg-secondary text-steel-500 dark:text-muted-foreground"
                    )}>
                      {formatPercentage(channel.conversion_percent || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(channel)}
                      className="h-7 w-7 p-0 text-steel-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ChannelFormDialog open={showAddDialog} onOpenChange={setShowAddDialog} clientId={clientId} selectedMonth={selectedMonth} isAllMonthsPeriod={isAllMonthsPeriod} mode="create" />
      <ChannelFormDialog open={showEditDialog} onOpenChange={setShowEditDialog} clientId={clientId} selectedMonth={selectedMonth} isAllMonthsPeriod={isAllMonthsPeriod} mode="edit" channel={selectedChannel} />
      <DeleteChannelDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} channel={selectedChannel} clientId={clientId} />
    </div>
  );
}
