import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/context/TenantContext';
import {
  listClients,
  listChannels,
  getMonthlyMetrics,
  getAggregatedMetricsAllMonths,
  getFunnelForPeriod,
  upsertMetrics,
  deleteChannelMetrics,
  ensureChannelByName,
  getAvailableChannels,
  type Client,
  type Channel,
  type ChannelWithMetrics,
  type AcquisitionMetrics
} from '@/data/acquisition';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export interface ClientData extends Client {
  responsible: string;
  project_type: string;
  status: 'active' | 'warning' | 'critical';
  channels?: ChannelWithMetrics[];
  monthlyData?: any[];
}

interface KPIData {
  contatos: number;
  leads: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  faturamento: number;
  previousContatos?: number;
  previousLeads?: number;
  previousReunioes?: number;
  previousPropostas?: number;
  previousVendas?: number;
  previousFaturamento?: number;
}

interface DashboardContextType {
  // State
  clients: ClientData[];
  selectedClient: string;
  selectedPeriod: string;
  isAllMonthsPeriod: boolean;
  kpiData: KPIData;
  channelData: ChannelWithMetrics[];
  loading: boolean;
  error: string | null;
  
  // Filter state (for compatibility with existing components)
  selectedPeriodFilter: string;
  selectedClientFilter: string;
  startDate: string;
  endDate: string;
  filteredClients: ClientData[];
  
  // Actions
  setSelectedClient: (clientId: string) => void;
  setSelectedPeriod: (period: string) => void;
  refreshData: () => Promise<void>;
  
  // Filter actions
  setPeriodFilter: (period: string) => void;
  setClientFilter: (clientId: string) => void;
  setDateRange: (start: string, end: string) => void;
  
  // Channel operations
  addChannelToClient: (clientId: string, channelData: any) => Promise<void>;
  updateChannelField: (channelId: string, field: string, value: any) => Promise<void>;
  deleteChannel: (clientId: string, channelId: string) => Promise<void>;
  getAvailableChannelsForClient: (clientId: string, competencia: string) => Promise<Channel[]>;
  
  // Supabase operations (for compatibility)
  addSupabaseChannel: (clientId: string, channelData: any) => Promise<void>;
  addSupabaseClient: (clientData: any) => Promise<ClientData>;
  updateClientField: (clientId: string, field: string, value: any) => Promise<void>;
  
  // Additional properties for compatibility
  supabaseClients: ClientData[];
  getClientDynamicRevenueData: (clientId: string) => any[];
  getClientDynamicFunnelData: (clientId: string) => any;
  updateSupabaseChannel: (channelId: string, updates: any) => Promise<void>;
  updateMonthlyData: (clientId: string, month: string, data: any) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Generate months dynamically: from current month back 24 months (most recent first)
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function generateMonths(): { label: string; value: string }[] {
  const now = new Date();
  const months: { label: string; value: string }[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    months.push({ label, value });
  }
  return months;
}

const MONTHS_2025 = generateMonths();

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const locationId = tenant.ghlLocationId;

  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentMonth());
  const [kpiData, setKpiData] = useState<KPIData>({
    contatos: 0,
    leads: 0,
    reunioes: 0,
    propostas: 0,
    vendas: 0,
    faturamento: 0
  });
  const [channelData, setChannelData] = useState<ChannelWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state for compatibility
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>("all");
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const isAllMonthsPeriod = selectedPeriod === "all";

  // Load initial data
  useEffect(() => {
    if (locationId) loadClients();
  }, [locationId]);

  // Refresh data when filters change
  useEffect(() => {
    if (clients.length > 0) {
      refreshData();
    }
  }, [selectedClient, selectedPeriod, clients.length]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await listClients(locationId);
      
      // Convert to ClientData format - get real data from Supabase
      const clientsWithMetadata: ClientData[] = clientsData.map(client => ({
        ...client,
        responsible: client.responsible || 'Admin',
        project_type: client.project_type || 'Digital Marketing',
        status: (client.status as 'active' | 'warning' | 'critical') || 'active'
      }));
      
      setClients(clientsWithMetadata);
      setError(null);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Erro ao carregar clientes');
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      
      if (selectedClient === "all") {
        // When "all clients" is selected, we need to aggregate data from all clients
        await loadAggregatedData();
      } else {
        // Load data for specific client
        await loadClientData(selectedClient);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Erro ao carregar dados');
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadClientData = async (clientId: string) => {
    try {
      let channelsData: ChannelWithMetrics[] = [];
      let funnelData = { contatos: 0, leads: 0, reunioes: 0, propostas: 0, vendas: 0, faturamento: 0 };
      let previousFunnelData = { contatos: 0, leads: 0, reunioes: 0, propostas: 0, vendas: 0, faturamento: 0 };

      if (isAllMonthsPeriod) {
        // Load aggregated data for all months
        channelsData = await getAggregatedMetricsAllMonths(clientId, locationId);
        funnelData = await getFunnelForPeriod(clientId, locationId);
      } else {
        // Load data for specific month
        channelsData = await getMonthlyMetrics(clientId, selectedPeriod, locationId);
        funnelData = await getFunnelForPeriod(clientId, locationId, selectedPeriod);

        // Load previous month data for comparison (only for specific months)
        const currentDate = new Date(selectedPeriod + '-01');
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const previousPeriod = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

        try {
          previousFunnelData = await getFunnelForPeriod(clientId, locationId, previousPeriod);
        } catch (prevErr) {
          console.warn('Previous month data not available:', prevErr);
        }
      }

      setChannelData(channelsData);
      setKpiData({
        contatos: funnelData.contatos,
        leads: funnelData.leads,
        reunioes: funnelData.reunioes,
        propostas: funnelData.propostas,
        vendas: funnelData.vendas,
        faturamento: funnelData.faturamento,
        previousContatos: !isAllMonthsPeriod ? previousFunnelData.contatos : undefined,
        previousLeads: !isAllMonthsPeriod ? previousFunnelData.leads : undefined,
        previousReunioes: !isAllMonthsPeriod ? previousFunnelData.reunioes : undefined,
        previousPropostas: !isAllMonthsPeriod ? previousFunnelData.propostas : undefined,
        previousVendas: !isAllMonthsPeriod ? previousFunnelData.vendas : undefined,
        previousFaturamento: !isAllMonthsPeriod ? previousFunnelData.faturamento : undefined,
      });
    } catch (err) {
      console.error('Error loading client data:', err);
      throw err;
    }
  };

  const loadAggregatedData = async () => {
    try {
      // Aggregate data from all clients
      const allClients = clients;
      let aggregatedChannels: Map<string, ChannelWithMetrics> = new Map();
      let totalFunnelData = { contatos: 0, leads: 0, reunioes: 0, propostas: 0, vendas: 0, faturamento: 0 };

      for (const client of allClients) {
        let clientChannels: ChannelWithMetrics[] = [];
        let clientFunnel = { contatos: 0, leads: 0, reunioes: 0, propostas: 0, vendas: 0, faturamento: 0 };

        try {
          if (isAllMonthsPeriod) {
            clientChannels = await getAggregatedMetricsAllMonths(client.id, locationId);
            clientFunnel = await getFunnelForPeriod(client.id, locationId);
          } else {
            clientChannels = await getMonthlyMetrics(client.id, selectedPeriod, locationId);
            clientFunnel = await getFunnelForPeriod(client.id, locationId, selectedPeriod);
          }
        } catch (clientError) {
          console.warn(`Error loading data for client ${client.id}:`, clientError);
          // Continue with empty data for this client
          continue;
        }

        // Aggregate channels
        clientChannels.forEach(channel => {
          if (aggregatedChannels.has(channel.name)) {
            const existing = aggregatedChannels.get(channel.name)!;
            existing.contatos += channel.contatos;
            existing.leads += channel.leads;
            existing.reunioes += channel.reunioes;
            existing.propostas += channel.propostas;
            existing.vendas += channel.vendas;
            existing.faturamento += channel.faturamento;
          } else {
            aggregatedChannels.set(channel.name, { ...channel });
          }
        });

        // Aggregate funnel
        totalFunnelData.contatos += clientFunnel.contatos;
        totalFunnelData.leads += clientFunnel.leads;
        totalFunnelData.reunioes += clientFunnel.reunioes;
        totalFunnelData.propostas += clientFunnel.propostas;
        totalFunnelData.vendas += clientFunnel.vendas;
        totalFunnelData.faturamento += clientFunnel.faturamento;
      }

      // Calculate conversion percentages for aggregated channels
      const channelsArray = Array.from(aggregatedChannels.values()).map(channel => ({
        ...channel,
        conversion_percent: channel.leads > 0 ? (channel.vendas / channel.leads) * 100 : 0
      }));

      setChannelData(channelsArray);
      setKpiData({
        ...totalFunnelData,
        // No previous data for "all clients" view
        previousContatos: undefined,
        previousLeads: undefined,
        previousReunioes: undefined,
        previousPropostas: undefined,
        previousVendas: undefined,
        previousFaturamento: undefined,
      });
    } catch (err) {
      console.error('Error loading aggregated data:', err);
      throw err;
    }
  };

  const addChannelToClient = async (clientId: string, channelData: any) => {
    try {
      // Ensure channel exists
      const channelId = await ensureChannelByName(channelData.name, locationId);

      // Create metrics record
      const metricsData: AcquisitionMetrics & { location_id: string } = {
        client_id: clientId,
        channel_id: channelId,
        competencia: channelData.month,
        location_id: locationId,
        contatos: channelData.contacts || 0,
        leads: channelData.qualified_leads || 0,
        reunioes: channelData.meetings || 0,
        propostas: channelData.proposals || 0,
        vendas: channelData.sales || 0,
        faturamento: channelData.revenue || 0
      };

      await upsertMetrics(metricsData);
      await refreshData();
      toast.success('Canal adicionado com sucesso!');
    } catch (err) {
      console.error('Error adding channel:', err);
      toast.error('Erro ao adicionar canal');
      throw err;
    }
  };

  const updateChannelField = async (channelId: string, field: string, value: any) => {
    try {
      if (selectedClient === "all") {
        toast.error('Não é possível editar quando "Todos os clientes" está selecionado');
        return;
      }

      if (isAllMonthsPeriod) {
        toast.error('Não é possível editar quando "Todos os meses" está selecionado');
        return;
      }

      // Find the channel metrics to update
      const channelMetrics = channelData.find(c => c.id === channelId);
      if (!channelMetrics) {
        toast.error('Canal não encontrado');
        return;
      }

      // Map field names from UI to database
      const fieldMap: Record<string, string> = {
        'contacts': 'contatos',
        'qualified_leads': 'leads',
        'meetings': 'reunioes',
        'proposals': 'propostas',
        'sales': 'vendas',
        'revenue': 'faturamento'
      };

      const dbField = fieldMap[field] || field;

      // Create updated metrics
      const updatedMetrics: AcquisitionMetrics & { location_id: string } = {
        client_id: selectedClient,
        channel_id: channelId,
        competencia: selectedPeriod,
        location_id: locationId,
        contatos: dbField === 'contatos' ? value : channelMetrics.contatos,
        leads: dbField === 'leads' ? value : channelMetrics.leads,
        reunioes: dbField === 'reunioes' ? value : channelMetrics.reunioes,
        propostas: dbField === 'propostas' ? value : channelMetrics.propostas,
        vendas: dbField === 'vendas' ? value : channelMetrics.vendas,
        faturamento: dbField === 'faturamento' ? value : channelMetrics.faturamento
      };

      await upsertMetrics(updatedMetrics);
      await refreshData();
      toast.success('Campo atualizado com sucesso!');
    } catch (err) {
      console.error('Error updating channel field:', err);
      toast.error('Erro ao atualizar campo');
      throw err;
    }
  };

  const deleteChannel = async (clientId: string, channelId: string) => {
    try {
      await deleteChannelMetrics(clientId, channelId, locationId);
      await refreshData();
      toast.success('Canal excluído com sucesso!');
    } catch (err) {
      console.error('Error deleting channel:', err);
      toast.error('Erro ao excluir canal');
      throw err;
    }
  };

  const getAvailableChannelsForClient = async (clientId: string, competencia: string): Promise<Channel[]> => {
    try {
      return await getAvailableChannels(clientId, competencia, locationId);
    } catch (err) {
      console.error('Error getting available channels:', err);
      return [];
    }
  };

  // Additional functions for compatibility
  const addSupabaseChannel = async (clientId: string, channelData: any) => {
    return addChannelToClient(clientId, channelData);
  };


  const addSupabaseClient = async (clientData: any): Promise<ClientData> => {
    try {
      // Get current user for user_id
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name,
          responsible: clientData.responsible,
          project_type: clientData.project_type,
          status: clientData.status || 'active',
          user_id: user?.id,
          location_id: locationId
        })
        .select()
        .single();

      if (error) throw error;

      const newClient: ClientData = {
        id: data.id,
        name: data.name,
        created_at: data.created_at,
        responsible: data.responsible,
        project_type: data.project_type,
        status: data.status as 'active' | 'warning' | 'critical',
        channels: []
      };

      // Update local state
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (error) {
      console.error('Error adding client to Supabase:', error);
      throw error;
    }
  };

  const updateClientField = async (clientId: string, field: string, value: any) => {
    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, [field]: value } : client
    ));
  };

  const getClientDynamicRevenueData = (clientId: string) => {
    // This function is deprecated - use getHistoricalDataForClient from acquisition.ts instead
    return [];
  };
  
  const getClientDynamicFunnelData = (clientId: string) => {
    // This function is deprecated - use getFunnelForPeriod from acquisition.ts instead
    return { contatos: 0, leads: 0, reunioes: 0, propostas: 0, vendas: 0, faturamento: 0 };
  };

  const updateSupabaseChannel = async (channelId: string, updates: any) => {
    return updateChannelField(channelId, 'data', updates);
  };

  const updateMonthlyData = async (clientId: string, month: string, data: any) => {
    // Implementation for monthly data updates - this should interact with Supabase
    console.log('Updating monthly data:', clientId, month, data);
  };

  // Filter functions for compatibility
  const setPeriodFilter = (period: string) => {
    setSelectedPeriodFilter(period);
    setSelectedPeriod(period);
  };

  const setClientFilter = (clientId: string) => {
    setSelectedClientFilter(clientId);
    setSelectedClient(clientId);
  };

  const setDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const value: DashboardContextType = {
    // State
    clients,
    selectedClient,
    selectedPeriod,
    isAllMonthsPeriod,
    kpiData,
    channelData,
    loading,
    error,
    
    // Filter state
    selectedPeriodFilter,
    selectedClientFilter,
    startDate,
    endDate,
    filteredClients: clients,
    
    // Actions
    setSelectedClient,
    setSelectedPeriod,
    refreshData,
    
    // Filter actions
    setPeriodFilter,
    setClientFilter,
    setDateRange,
    
    // Channel operations
    addChannelToClient,
    updateChannelField,
    deleteChannel,
    getAvailableChannelsForClient,
    
    // Supabase operations
    addSupabaseChannel,
    addSupabaseClient,
    updateClientField,
    
    // Additional properties
    supabaseClients: clients,
    getClientDynamicRevenueData,
    getClientDynamicFunnelData,
    updateSupabaseChannel,
    updateMonthlyData
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export { MONTHS_2025 };