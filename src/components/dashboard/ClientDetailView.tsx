import { useState, useEffect } from "react";
import { KPICard } from "./KPICard";
import { FunnelChart } from "./FunnelChart";
import { RevenueChart } from "./RevenueChart";
import { AddChannelDialog } from "./AddChannelDialog";

import { MonthlyChannelEditor } from "./MonthlyChannelEditor";
import { LeadsVsSalesChart } from "./LeadsVsSalesChart";
import { MonthFilterDialog } from "./MonthFilterDialog";

import { ChannelsTable } from "./ChannelsTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditableInput } from "@/components/ui/editable-input";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/hooks/useAuth";
import { useMonthlyChannels } from "@/hooks/useMonthlyChannels";
import { 
  Users, 
  Target, 
  Calendar, 
  FileText, 
  TrendingUp, 
  DollarSign,
  ArrowLeft,
  Edit,
  Plus,
  Download,
  Filter,
  Trash2,
  BarChart3,
  TrendingDown
} from "lucide-react";
import { Client, Channel } from "@/data/mockData";
import { ClientExportDialog } from "./ClientExportDialog";
import { DeleteChannelDialog } from "./DeleteChannelDialog";

interface ClientDetailViewProps {
  client: Client;
  onBack: () => void;
}

export function ClientDetailView({ client, onBack }: ClientDetailViewProps) {
  const { user } = useAuth();
  const [showAddChannelDialog, setShowAddChannelDialog] = useState(false);
  const [showMonthFilterDialog, setShowMonthFilterDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteChannelDialog, setShowDeleteChannelDialog] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const { 
    updateClientField, 
    updateChannelField, 
    deleteChannel,
    getClientDynamicRevenueData, 
    getClientDynamicFunnelData,
    supabaseClients,
    updateSupabaseChannel,
    updateMonthlyData,
    loading: dashboardLoading
  } = useDashboard();
  
  // Use monthly channels hook for month-specific data isolation
  const {
    monthlyChannels,
    loading: channelsLoading,
    addChannel: addMonthlyChannel,
    addChannelWithData,
    updateChannel: updateMonthlyChannel,
    deleteChannel: deleteMonthlyChannel,
    getAggregatedData
  } = useMonthlyChannels(client.id, selectedMonth);
  
  // Use Supabase data if user is authenticated, otherwise use mock data
  const supabaseClient = user ? supabaseClients.find(c => c.id === client.id) : null;
  
  // Get monthly data for selected month - now uses isolated channel data
  const getMonthlyDataForMonth = (month: string) => {
    if (user && month === selectedMonth) {
      // For current selected month, use aggregated data from monthly channels
      return getAggregatedData();
    } else if (user && supabaseClient) {
      // For other months, use stored monthly data
      return supabaseClient.monthlyData.find(md => md.month === month) || {
        contacts: 0,
        qualified_leads: 0,
        meetings: 0,
        proposals: 0,
        sales: 0,
        revenue: 0
      };
    }
    return {
      contacts: 0,
      qualified_leads: 0,
      meetings: 0,
      proposals: 0,
      sales: 0,
      revenue: 0
    };
  };

  
  // Get previous month data for comparison
  const getPreviousMonthData = (currentMonth: string) => {
    const [year, month] = currentMonth.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    const data = getMonthlyDataForMonth(prevMonthStr);
    
    // Check if we actually have historical data (not just fallback zeros)
    const hasRealData = user && supabaseClient ? 
      supabaseClient.monthlyData.some(md => md.month === prevMonthStr) : false;
    
    return { data, hasRealData };
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number, hasData: boolean = true) => {
    console.log('calculateChange:', { current, previous, hasData });
    
    // If we don't have historical data, don't show comparison
    if (!hasData) return undefined;
    
    // Both values are 0
    if (previous === 0 && current === 0) return 0;
    
    // Previous was 0, now we have value - 100% increase
    if (previous === 0 && current > 0) return 100;
    
    // Calculate normal percentage change
    const change = ((current - previous) / previous) * 100;
    console.log('Change calculated:', change);
    return change;
  };
  
  // Get current and previous month data
  const currentMonthData = getMonthlyDataForMonth(selectedMonth);
  const previousMonthResult = getPreviousMonthData(selectedMonth);
  const previousMonthData = previousMonthResult.data;
  const hasHistoricalData = previousMonthResult.hasRealData;

  console.log('Month comparison data:', {
    selectedMonth,
    currentMonthData,
    previousMonthData,
    hasHistoricalData,
    client: client.name
  });

  // Calculate changes for KPIs - only show if we have historical data
  const contactsChange = calculateChange(currentMonthData.contacts, previousMonthData.contacts, hasHistoricalData);
  const leadsChange = calculateChange(currentMonthData.qualified_leads, previousMonthData.qualified_leads, hasHistoricalData);
  const meetingsChange = calculateChange(currentMonthData.meetings, previousMonthData.meetings, hasHistoricalData);
  const proposalsChange = calculateChange(currentMonthData.proposals, previousMonthData.proposals, hasHistoricalData);
  const salesChange = calculateChange(currentMonthData.sales, previousMonthData.sales, hasHistoricalData);
  const revenueChange = calculateChange(currentMonthData.revenue, previousMonthData.revenue, hasHistoricalData);

  // Generate data for charts using only months that have real data
  const [historicalData, setHistoricalData] = useState<{
    month: string;
    revenue: number;
    leads: number;
    sales: number;
  }[]>([]);

  useEffect(() => {
    const loadHistoricalData = async () => {
      if (user) {
        try {
          const { getHistoricalDataForClient } = await import('@/data/acquisition');
          const data = await getHistoricalDataForClient(client.id);
          setHistoricalData(data);
        } catch (error) {
          console.error('Error loading historical data:', error);
          setHistoricalData([]);
        }
      }
    };

    loadHistoricalData();
  }, [client.id, user, selectedMonth]);

  const revenueData = historicalData;
  
  // Create funnel data from current month
  const funnelData = [
    { name: "Contatos", value: currentMonthData.contacts, conversionRate: 100 },
    { 
      name: "Leads Qualificados", 
      value: currentMonthData.qualified_leads, 
      conversionRate: currentMonthData.contacts > 0 ? (currentMonthData.qualified_leads / currentMonthData.contacts) * 100 : 0 
    },
    { 
      name: "Reuniões", 
      value: currentMonthData.meetings, 
      conversionRate: currentMonthData.qualified_leads > 0 ? (currentMonthData.meetings / currentMonthData.qualified_leads) * 100 : 0 
    },
    { 
      name: "Propostas", 
      value: currentMonthData.proposals, 
      conversionRate: currentMonthData.meetings > 0 ? (currentMonthData.proposals / currentMonthData.meetings) * 100 : 0 
    },
    { 
      name: "Vendas", 
      value: currentMonthData.sales, 
      conversionRate: currentMonthData.proposals > 0 ? (currentMonthData.sales / currentMonthData.proposals) * 100 : 0 
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = () => {
    switch (client.status) {
      case "active":
        return "bg-success text-success-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      case "critical":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = () => {
    switch (client.status) {
      case "active":
        return "Ativo";
      case "warning":
        return "Atenção";
      case "critical":
        return "Crítico";
      default:
        return "Indefinido";
    }
  };



  const handleChannelUpdate = (channelId: string, field: string, value: string | number) => {
    if (user && supabaseClient) {
      const updateData: any = {};
      if (field === 'qualifiedLeads' || field === 'qualified_leads') {
        updateData.qualified_leads = Number(value);
      } else {
        updateData[field] = value;
      }
      updateSupabaseChannel(channelId, updateData);
    } else {
      updateChannelField(channelId, field, value);
    }
  };

  const handleDeleteChannel = (channelId: string, channelName: string) => {
    // Find the full channel object
    const channel = monthlyChannels.find(c => c.id === channelId);
    if (channel) {
      setChannelToDelete(channel);
      setShowDeleteChannelDialog(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <EditableInput
                value={client.name}
                onSave={(value) => updateClientField(client.id, 'name', value)}
                type="text"
                displayClassName="text-3xl font-bold text-foreground"
              />
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Responsável: <EditableInput
                value={client.responsible}
                onSave={(value) => updateClientField(client.id, 'responsible', value)}
                type="text"
                displayClassName="inline font-medium text-foreground"
              /></span>
              <span>•</span>
              <span>Serviço: <EditableInput
                value={client.projectType}
                onSave={(value) => updateClientField(client.id, 'projectType', value)}
                type="text"
                displayClassName="inline font-medium text-foreground"
              /></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowMonthFilterDialog(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrar por Mês
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>


      {/* KPIs Grid - Responsive grid that doesn't break */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        <KPICard
          title="Contatos"
          value={currentMonthData.contacts}
          icon={Users}
          variant="primary"
          editable={true}
          change={contactsChange}
          loading={dashboardLoading || channelsLoading}
          onValueChange={async (value) => {
            // Update through channels - this will automatically reflect in KPIs
            // For now, we'll store the total in monthly data for historical tracking
            await updateMonthlyData(client.id, selectedMonth, {
              ...currentMonthData,
              contacts: Number(value)
            });
          }}
        />
        <KPICard
          title="Leads Qualificados"
          value={currentMonthData.qualified_leads}
          icon={Target}
          variant="success"
          editable={true}
          change={leadsChange}
          loading={dashboardLoading || channelsLoading}
          onValueChange={async (value) => {
            await updateMonthlyData(client.id, selectedMonth, {
              ...currentMonthData,
              qualified_leads: Number(value)
            });
          }}
        />
        <KPICard
          title="Reuniões"
          value={currentMonthData.meetings}
          icon={Calendar}
          variant="warning"
          editable={true}
          change={meetingsChange}
          loading={dashboardLoading || channelsLoading}
          onValueChange={async (value) => {
            await updateMonthlyData(client.id, selectedMonth, {
              ...currentMonthData,
              meetings: Number(value)
            });
          }}
        />
        <KPICard
          title="Propostas"
          value={currentMonthData.proposals}
          icon={FileText}
          variant="primary"
          editable={true}
          change={proposalsChange}
          loading={dashboardLoading || channelsLoading}
          onValueChange={async (value) => {
            await updateMonthlyData(client.id, selectedMonth, {
              ...currentMonthData,
              proposals: Number(value)
            });
          }}
        />
        <KPICard
          title="Vendas"
          value={currentMonthData.sales}
          icon={TrendingUp}
          variant="success"
          editable={true}
          change={salesChange}
          loading={dashboardLoading || channelsLoading}
          onValueChange={async (value) => {
            await updateMonthlyData(client.id, selectedMonth, {
              ...currentMonthData,
              sales: Number(value)
            });
          }}
        />
        <KPICard
          title="Faturamento"
          value={currentMonthData.revenue}
          icon={DollarSign}
          variant="success"
          editable={true}
          change={revenueChange}
          loading={dashboardLoading || channelsLoading}
          onValueChange={async (value) => {
            await updateMonthlyData(client.id, selectedMonth, {
              ...currentMonthData,
              revenue: Number(value)
            });
          }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          data={revenueData}
          title={`Faturamento Mensal - ${client.name}`}
          showComparison={false}
        />
        <LeadsVsSalesChart
          data={revenueData.map(d => ({ 
            month: d.month, 
            leads: d.leads || 0, 
            sales: d.sales || 0 
          }))}
          title="Leads vs Vendas por Mês"
        />
      </div>

      {/* Client Funnel */}
      <FunnelChart
        stages={funnelData}
        title={`Funil de Conversão - ${client.name}`}
      />

      {/* Monthly Channel Editor for current month - using isolated monthly data */}
      {user && (
        <MonthlyChannelEditor
          channels={monthlyChannels}
          selectedMonth={selectedMonth}
          onUpdateChannel={(channelId: string, field: string, value: string | number) => {
            // Find channel by ID and update by name for monthly isolation
            const channel = monthlyChannels.find(c => c.id === channelId);
            if (channel) {
              updateMonthlyChannel(channel.name, field, value);
            }
          }}
          onAddChannel={() => {
            setShowAddChannelDialog(true);
          }}
          onDeleteChannel={(channelId: string, channelName: string) => {
            deleteMonthlyChannel(channelName);
          }}
        />
      )}


      {/* Add Channel Dialog */}
      <AddChannelDialog 
        open={showAddChannelDialog} 
        onOpenChange={setShowAddChannelDialog}
        clientId={client.id}
        month={selectedMonth}
        onAddChannel={async (channelData) => {
          await addChannelWithData(channelData.name, channelData);
        }}
      />

      {/* Month Filter Dialog */}
      <MonthFilterDialog
        open={showMonthFilterDialog}
        onOpenChange={setShowMonthFilterDialog}
        selectedMonth={selectedMonth}
        onMonthSelect={setSelectedMonth}
      />

      {/* Export Dialog */}
      <ClientExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        client={client}
      />

      {/* Delete Channel Dialog */}
      <DeleteChannelDialog
        open={showDeleteChannelDialog}
        onOpenChange={setShowDeleteChannelDialog}
        channel={channelToDelete}
        clientId={client.id}
      />
    </div>
  );
}