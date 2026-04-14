import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { useAuth } from './useAuth';

export function useMonthlyChannels(clientId: string, selectedMonth: string) {
  const { user } = useAuth();
  const { 
    getChannelsForMonth, 
    upsertChannelMonthlyData, 
    addChannelForMonth, 
    deleteChannelForMonth 
  } = useSupabaseData();
  
  const [monthlyChannels, setMonthlyChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef<string>('');

  // Memoized load function to prevent infinite re-renders
  const loadMonthlyChannels = useCallback(async () => {
    if (!user || !clientId || !selectedMonth) {
      setLoading(false);
      return;
    }
    
    const fetchKey = `${clientId}-${selectedMonth}`;
    if (lastFetchRef.current === fetchKey) {
      console.log('useMonthlyChannels: Skipping duplicate fetch for', fetchKey);
      return;
    }
    
    console.log('useMonthlyChannels: Loading channels for', fetchKey);
    setLoading(true);
    lastFetchRef.current = fetchKey;
    
    try {
      const channels = await getChannelsForMonth(clientId, selectedMonth);
      console.log('useMonthlyChannels: Loaded', channels?.length || 0, 'channels');
      setMonthlyChannels(channels || []);
    } catch (error) {
      console.error('useMonthlyChannels: Error loading channels:', error);
      setMonthlyChannels([]);
    } finally {
      setLoading(false);
    }
  }, [user, clientId, selectedMonth, getChannelsForMonth]);

  // Load channels when dependencies change
  useEffect(() => {
    loadMonthlyChannels();
  }, [loadMonthlyChannels]);

  // Add a new channel for the current month
  const addChannel = async (channelName: string) => {
    if (!user) return;
    
    try {
      await addChannelForMonth(clientId, selectedMonth, channelName);
      // Force reload by clearing last fetch key
      lastFetchRef.current = '';
      await loadMonthlyChannels();
    } catch (error) {
      console.error('Error adding channel:', error);
      throw error;
    }
  };

  // Add a new channel with data for the current month
  const addChannelWithData = async (channelName: string, channelData: any) => {
    if (!user) return;
    
    try {
      await upsertChannelMonthlyData(clientId, selectedMonth, channelName, channelData);
      // Force reload by clearing last fetch key
      lastFetchRef.current = '';
      await loadMonthlyChannels();
    } catch (error) {
      console.error('Error adding channel with data:', error);
      throw error;
    }
  };

  // Update channel data for the current month
  const updateChannel = async (channelName: string, field: string, value: string | number) => {
    if (!user) return;
    
    try {
      const existingChannel = monthlyChannels.find(c => c.name === channelName);
      const updatedData = { 
        ...existingChannel,
        [field]: value 
      };
      
      await upsertChannelMonthlyData(clientId, selectedMonth, channelName, updatedData);
      
      // Update local state immediately
      setMonthlyChannels(prev => prev.map(channel => 
        channel.name === channelName 
          ? { ...channel, [field]: value }
          : channel
      ));
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  };

  // Delete a channel for the current month
  const deleteChannel = async (channelName: string) => {
    if (!user) return;
    
    try {
      await deleteChannelForMonth(clientId, selectedMonth, channelName);
      setMonthlyChannels(prev => prev.filter(channel => channel.name !== channelName));
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    }
  };

  // Get aggregated data for the current month
  const getAggregatedData = () => {
    return monthlyChannels.reduce((acc, channel) => {
      acc.contacts += channel.contacts || 0;
      acc.qualified_leads += channel.qualified_leads || 0;
      acc.meetings += channel.meetings || 0;
      acc.proposals += channel.proposals || 0;
      acc.sales += channel.sales || 0;
      acc.revenue += channel.revenue || 0;
      return acc;
    }, {
      contacts: 0,
      qualified_leads: 0,
      meetings: 0,
      proposals: 0,
      sales: 0,
      revenue: 0
    });
  };

  return {
    monthlyChannels,
    loading,
    addChannel,
    addChannelWithData,
    updateChannel,
    deleteChannel,
    getAggregatedData
  };
}