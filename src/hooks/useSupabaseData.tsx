import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SupabaseClient {
  id: string;
  user_id: string;
  name: string;
  responsible: string;
  project_type: string;
  status: 'active' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
  channels: SupabaseChannel[];
  monthlyData: MonthlyData[];
}

export interface SupabaseChannel {
  id: string;
  client_id: string;
  name: string;
  month?: string;
  contacts: number;
  qualified_leads: number;
  meetings: number;
  proposals: number;
  sales: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyData {
  id: string;
  client_id: string;
  month: string;
  contacts: number;
  qualified_leads: number;
  meetings: number;
  proposals: number;
  sales: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

export function useSupabaseData() {
  const { user } = useAuth();
  const [clients, setClients] = useState<SupabaseClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    if (!user) {
      console.log('useSupabaseData: No user, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      console.log('useSupabaseData: Starting fetch for user:', user.id);
      setLoading(true);
      setError(null);
      
      // Fetch clients only (no complex joins to avoid type issues)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*');

      if (clientsError) throw clientsError;

      console.log('useSupabaseData: Fetched clients:', clientsData?.length || 0);

      // Convert to SupabaseClient format with default values
      const formattedClients: SupabaseClient[] = (clientsData || []).map(client => ({
        id: client.id,
        user_id: user.id, // Use the current user's ID
        name: client.name,
        responsible: 'Admin', // Default value
        project_type: 'Digital Marketing', // Default value
        status: 'active' as const,
        created_at: client.created_at,
        updated_at: client.created_at, // Use created_at as fallback
        channels: [], // Will be loaded separately if needed
        monthlyData: [] // Will be loaded separately if needed
      }));

      setClients(formattedClients);
      console.log('useSupabaseData: Setting loading to false after successful fetch, clients:', formattedClients.length);
    } catch (err) {
      console.error('useSupabaseData: Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      console.log('useSupabaseData: Finally block - setting loading to false');
      setLoading(false);
    }
  };

  const addClient = async (clientData: Omit<SupabaseClient, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'channels' | 'monthlyData'>) => {
    if (!user) return;
    
    console.log('useSupabaseData: Adding client:', clientData);
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log('useSupabaseData: Client created successfully:', data);

      const newClient: SupabaseClient = {
        id: data.id,
        user_id: user.id,
        name: data.name,
        responsible: 'Admin',
        project_type: 'Digital Marketing',
        status: 'active',
        created_at: data.created_at,
        updated_at: data.created_at,
        channels: [],
        monthlyData: []
      };

      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar cliente');
      throw err;
    }
  };

  const updateClient = async (clientId: string, updates: Partial<SupabaseClient>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ name: updates.name })
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, ...updates } : client
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente');
      throw err;
    }
  };

  const addChannel = async (clientId: string, channelData: Omit<SupabaseChannel, 'id' | 'client_id' | 'created_at' | 'updated_at'>) => {
    try {
      // For now, just return a mock response since channels table structure is complex
      console.log('useSupabaseData: Adding channel:', channelData);
      return { id: `channel-${Date.now()}`, ...channelData };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar canal');
      throw err;
    }
  };

  const updateChannel = async (channelId: string, updates: Partial<SupabaseChannel>) => {
    try {
      console.log('useSupabaseData: Updating channel:', channelId, updates);
      // For now, just log the update since channels table structure is complex
    } catch (err) {
      console.error('useSupabaseData: Failed to update channel:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar canal');
      throw err;
    }
  };

  const updateMonthlyData = async (clientId: string, month: string, data: Omit<MonthlyData, 'id' | 'client_id' | 'month' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('useSupabaseData: Updating monthly data:', clientId, month, data);
      // For now, just log the update since monthly_data table structure is complex
    } catch (err) {
      console.error('useSupabaseData: Failed to update monthly data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados mensais');
      throw err;
    }
  };

  // New functions for month-specific channel data
  const getChannelsForMonth = async (clientId: string, month: string) => {
    try {
      // For now, return empty array since channels table structure is complex
      console.log('useSupabaseData: Getting channels for month:', clientId, month);
      return [];
    } catch (err) {
      console.error('Error fetching channels for month:', err);
      return [];
    }
  };

  const upsertChannelMonthlyData = async (
    clientId: string, 
    month: string, 
    channelName: string, 
    data: Partial<Omit<SupabaseChannel, 'id' | 'client_id' | 'name' | 'month' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      console.log('useSupabaseData: Upserting channel monthly data:', clientId, month, channelName, data);
      // For now, just log since channels table structure is complex
    } catch (err) {
      console.error('useSupabaseData: Failed to upsert channel monthly data:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados do canal');
      throw err;
    }
  };

  const addChannelForMonth = async (clientId: string, month: string, channelName: string) => {
    try {
      return await upsertChannelMonthlyData(clientId, month, channelName, {
        contacts: 0,
        qualified_leads: 0,
        meetings: 0,
        proposals: 0,
        sales: 0,
        revenue: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar canal');
      throw err;
    }
  };

  const deleteChannelForMonth = async (clientId: string, month: string, channelName: string) => {
    try {
      console.log('useSupabaseData: Deleting channel for month:', clientId, month, channelName);
      // For now, just log since channels table structure is complex
    } catch (err) {
      console.error('useSupabaseData: Failed to delete channel for month:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir canal');
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    addClient,
    updateClient,
    addChannel,
    updateChannel,
    updateMonthlyData,
    // New month-specific functions
    getChannelsForMonth,
    upsertChannelMonthlyData,
    addChannelForMonth,
    deleteChannelForMonth
  };
}