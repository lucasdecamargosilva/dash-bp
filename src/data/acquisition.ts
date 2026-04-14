import { supabase } from "@/integrations/supabase/client";

export type Channel = { 
  id: string; 
  name: string; 
  created_at: string; 
};

export type Client = { 
  id: string; 
  name: string; 
  created_at: string;
  responsible?: string;
  project_type?: string;
  status?: string;
};

export type AcquisitionMetrics = {
  id?: string;
  client_id: string;
  channel_id: string;
  competencia: string;           // 'YYYY-MM'
  contatos: number;
  leads: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  faturamento: number;           // decimal
  created_at?: string;
  updated_at?: string;
};

export type ChannelWithMetrics = {
  id: string;
  name: string;
  contatos: number;
  leads: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  faturamento: number;
  conversion_percent: number;
  month?: string;
  // Compatibility aliases for old interface
  contacts?: number;
  qualifiedLeads?: number;
  meetings?: number;
  proposals?: number;
  sales?: number;
  revenue?: number;
};

// Ensure channel exists by name, create if doesn't exist
export async function ensureChannelByName(name: string): Promise<string> {
  // First try to find existing channel
  const { data: existing, error: findError } = await supabase
    .from('channels')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  
  if (findError) throw findError;
  
  if (existing) {
    return existing.id;
  }
  
  // Create new channel
  const { data: newChannel, error: createError } = await supabase
    .from('channels')
    .insert({ name })
    .select('id')
    .single();
  
  if (createError) throw createError;
  
  return newChannel.id;
}

// List all channels
export async function listChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('name');
  
  if (error) throw error;
  
  return data || [];
}

// List all clients
export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  
  if (error) throw error;
  
  return data || [];
}

// Upsert metrics by client_id + channel_id + competencia
export async function upsertMetrics(payload: AcquisitionMetrics): Promise<AcquisitionMetrics> {
  const { data, error } = await supabase
    .from('acquisition_channel_metrics')
    .upsert({
      client_id: payload.client_id,
      channel_id: payload.channel_id,
      competencia: payload.competencia,
      contatos: payload.contatos || 0,
      leads: payload.leads || 0,
      reunioes: payload.reunioes || 0,
      propostas: payload.propostas || 0,
      vendas: payload.vendas || 0,
      faturamento: payload.faturamento || 0
    }, {
      onConflict: 'client_id,channel_id,competencia',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) throw error;
  
  return data;
}

// Delete metrics
export async function deleteMetrics(clientId: string, channelId: string, competencia: string): Promise<void> {
  const { error } = await supabase
    .from('acquisition_channel_metrics')
    .delete()
    .eq('client_id', clientId)
    .eq('channel_id', channelId)
    .eq('competencia', competencia);

  if (error) throw error;
}

// Delete all metrics for a channel across all months for a client
export async function deleteChannelMetrics(clientId: string, channelId: string): Promise<void> {
  const { error } = await supabase
    .from('acquisition_channel_metrics')
    .delete()
    .eq('client_id', clientId)
    .eq('channel_id', channelId);

  if (error) throw error;
}

// Get monthly metrics for specific client and month
export async function getMonthlyMetrics(clientId: string, competencia: string): Promise<ChannelWithMetrics[]> {
  const { data, error } = await supabase
    .from('acquisition_channel_metrics')
    .select(`
      *,
      channels!inner(id, name)
    `)
    .eq('client_id', clientId)
    .eq('competencia', competencia)
    .order('channels(name)');

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.channel_id,
    name: item.channels.name,
    contatos: item.contatos,
    leads: item.leads,
    reunioes: item.reunioes,
    propostas: item.propostas,
    vendas: item.vendas,
    faturamento: item.faturamento,
    conversion_percent: item.leads > 0 ? (item.vendas / item.leads) * 100 : 0
  }));
}

// Get aggregated metrics for all months for a client
export async function getAggregatedMetricsAllMonths(clientId: string): Promise<ChannelWithMetrics[]> {
  const { data, error } = await supabase
    .from('acquisition_channel_metrics')
    .select(`
      channel_id,
      channels!inner(id, name),
      contatos,
      leads,
      reunioes,
      propostas,
      vendas,
      faturamento
    `)
    .eq('client_id', clientId);

  if (error) throw error;

  // Group by channel and sum metrics
  const channelMap = new Map<string, ChannelWithMetrics>();
  
  (data || []).forEach(item => {
    const channelId = item.channel_id;
    const channelName = item.channels.name;
    
    if (channelMap.has(channelId)) {
      const existing = channelMap.get(channelId)!;
      existing.contatos += item.contatos;
      existing.leads += item.leads;
      existing.reunioes += item.reunioes;
      existing.propostas += item.propostas;
      existing.vendas += item.vendas;
      existing.faturamento += Number(item.faturamento);
    } else {
      channelMap.set(channelId, {
        id: channelId,
        name: channelName,
        contatos: item.contatos,
        leads: item.leads,
        reunioes: item.reunioes,
        propostas: item.propostas,
        vendas: item.vendas,
        faturamento: Number(item.faturamento),
        conversion_percent: 0 // Will be calculated below
      });
    }
  });

  // Calculate conversion percentages
  const result = Array.from(channelMap.values()).map(channel => ({
    ...channel,
    conversion_percent: channel.leads > 0 ? (channel.vendas / channel.leads) * 100 : 0
  }));

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

// Get funnel totals for period
export async function getFunnelForPeriod(clientId: string, competencia?: string): Promise<{
  contatos: number;
  leads: number;
  reunioes: number;
  propostas: number;
  vendas: number;
  faturamento: number;
}> {
  let query = supabase
    .from('acquisition_channel_metrics')
    .select('contatos, leads, reunioes, propostas, vendas, faturamento')
    .eq('client_id', clientId);

  if (competencia) {
    query = query.eq('competencia', competencia);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Sum all metrics
  const totals = (data || []).reduce((acc, item) => ({
    contatos: acc.contatos + item.contatos,
    leads: acc.leads + item.leads,
    reunioes: acc.reunioes + item.reunioes,
    propostas: acc.propostas + item.propostas,
    vendas: acc.vendas + item.vendas,
    faturamento: acc.faturamento + Number(item.faturamento)
  }), {
    contatos: 0,
    leads: 0,
    reunioes: 0,
    propostas: 0,
    vendas: 0,
    faturamento: 0
  });

  return totals;
}

// Get historical data for charts (only months with actual data)
export async function getHistoricalDataForClient(clientId: string): Promise<{
  month: string;
  revenue: number;
  leads: number;
  sales: number;
}[]> {
  const { data, error } = await supabase
    .from('acquisition_channel_metrics')
    .select('competencia, faturamento, leads, vendas')
    .eq('client_id', clientId)
    .order('competencia');

  if (error) throw error;

  // Group by month and sum metrics
  const monthMap = new Map<string, { revenue: number; leads: number; sales: number }>();
  
  (data || []).forEach(item => {
    const month = item.competencia;
    
    if (monthMap.has(month)) {
      const existing = monthMap.get(month)!;
      existing.revenue += Number(item.faturamento);
      existing.leads += item.leads;
      existing.sales += item.vendas;
    } else {
      monthMap.set(month, {
        revenue: Number(item.faturamento),
        leads: item.leads,
        sales: item.vendas
      });
    }
  });

  // Convert to array and sort by month
  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      ...data
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Get available channels for a client/month (excluding already used ones)
export async function getAvailableChannels(clientId: string, competencia: string): Promise<Channel[]> {
  // Get all channels
  const allChannels = await listChannels();
  
  // Get channels already used for this client/month
  const { data: usedChannels, error } = await supabase
    .from('acquisition_channel_metrics')
    .select('channel_id')
    .eq('client_id', clientId)
    .eq('competencia', competencia);

  if (error) throw error;

  const usedChannelIds = new Set((usedChannels || []).map(item => item.channel_id));
  
  return allChannels.filter(channel => !usedChannelIds.has(channel.id));
}