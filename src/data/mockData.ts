export interface Client {
  id: string;
  name: string;
  responsible: string;
  projectType: string;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueChange: number;
  conversionRate: number;
  status: "active" | "warning" | "critical";
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  contacts: number;
  qualifiedLeads: number;
  meetings: number;
  proposals: number;
  sales: number;
  revenue: number;
  month?: string;
  // Compatibility with ChannelWithMetrics
  contatos?: number;
  leads?: number;
  reunioes?: number;
  propostas?: number;
  vendas?: number;
  faturamento?: number;
  conversion_percent?: number;
}

export interface FunnelStage {
  name: string;
  value: number;
  conversionRate?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  leads?: number;
  sales?: number;
}

export const mockClients: Client[] = [
  {
    id: "1",
    name: "TechStart Innovations",
    responsible: "Ana Silva",
    projectType: "CaaS - Customer as a Service",
    totalRevenue: 850000,
    monthlyRevenue: 125000,
    revenueChange: 15.3,
    conversionRate: 12.5,
    status: "active",
    channels: [
      {
        id: "c1",
        name: "Instagram Orgânico",
        contacts: 450,
        qualifiedLeads: 89,
        meetings: 34,
        proposals: 18,
        sales: 8,
        revenue: 45000
      },
      {
        id: "c2",
        name: "Tráfego Pago",
        contacts: 320,
        qualifiedLeads: 76,
        meetings: 42,
        proposals: 25,
        sales: 12,
        revenue: 80000
      },
      {
        id: "c3",
        name: "Indicações",
        contacts: 180,
        qualifiedLeads: 95,
        meetings: 58,
        proposals: 32,
        sales: 15,
        revenue: 120000
      }
    ]
  },
  {
    id: "2",
    name: "EcoSolutions Brasil",
    responsible: "Carlos Mendes",
    projectType: "Aceleração de Vendas",
    totalRevenue: 650000,
    monthlyRevenue: 98000,
    revenueChange: -5.2,
    conversionRate: 8.3,
    status: "warning",
    channels: [
      {
        id: "c4",
        name: "LinkedIn Outbound",
        contacts: 280,
        qualifiedLeads: 45,
        meetings: 22,
        proposals: 12,
        sales: 4,
        revenue: 35000
      },
      {
        id: "c5",
        name: "Email Marketing",
        contacts: 520,
        qualifiedLeads: 78,
        meetings: 31,
        proposals: 15,
        sales: 6,
        revenue: 63000
      }
    ]
  },
  {
    id: "3",
    name: "FinanceFlow Systems",
    responsible: "Marina Costa",
    projectType: "Consultoria Estratégica",
    totalRevenue: 1200000,
    monthlyRevenue: 180000,
    revenueChange: 22.8,
    conversionRate: 18.7,
    status: "active",
    channels: [
      {
        id: "c6",
        name: "Networking Presencial",
        contacts: 120,
        qualifiedLeads: 68,
        meetings: 45,
        proposals: 32,
        sales: 18,
        revenue: 180000
      }
    ]
  },
  {
    id: "4",
    name: "RetailMax Group",
    responsible: "Pedro Santos",
    projectType: "CaaS - Customer as a Service",
    totalRevenue: 420000,
    monthlyRevenue: 45000,
    revenueChange: -12.5,
    conversionRate: 5.2,
    status: "critical",
    channels: [
      {
        id: "c7",
        name: "Google Ads",
        contacts: 680,
        qualifiedLeads: 45,
        meetings: 18,
        proposals: 8,
        sales: 3,
        revenue: 45000
      }
    ]
  }
];

export const globalKPIs = {
  contacts: 2550,
  qualifiedLeads: 451,
  meetings: 244,
  proposals: 142,
  sales: 66,
  revenue: 568000
};

export const globalFunnelData: FunnelStage[] = [
  { name: "Contatos", value: 2550, conversionRate: 17.7 },
  { name: "Leads Qualificados", value: 451, conversionRate: 54.1 },
  { name: "Reuniões", value: 244, conversionRate: 58.2 },
  { name: "Propostas", value: 142, conversionRate: 46.5 },
  { name: "Vendas", value: 66 },
  { name: "Faturamento", value: 568000 }
];

export const globalRevenueData: RevenueData[] = [
  { month: "Jan", revenue: 450000, leads: 380, sales: 52 },
  { month: "Fev", revenue: 520000, leads: 420, sales: 58 },
  { month: "Mar", revenue: 485000, leads: 390, sales: 48 },
  { month: "Abr", revenue: 600000, leads: 450, sales: 65 },
  { month: "Mai", revenue: 680000, leads: 480, sales: 72 },
  { month: "Jun", revenue: 568000, leads: 451, sales: 66 }
];

export const getClientRevenueData = (clientId: string): RevenueData[] => {
  const baseData = [
    { month: "Jan", revenue: 85000, leads: 85, sales: 12 },
    { month: "Fev", revenue: 92000, leads: 95, sales: 14 },
    { month: "Mar", revenue: 78000, leads: 72, sales: 10 },
    { month: "Abr", revenue: 110000, leads: 108, sales: 16 },
    { month: "Mai", revenue: 125000, leads: 118, sales: 18 },
    { month: "Jun", revenue: 125000, leads: 120, sales: 18 }
  ];
  
  // Simular dados diferentes para cada cliente
  return baseData.map(item => ({
    ...item,
    revenue: Math.floor(item.revenue * (1 + Math.random() * 0.4 - 0.2)),
    leads: Math.floor(item.leads * (1 + Math.random() * 0.3 - 0.15)),
    sales: Math.floor(item.sales * (1 + Math.random() * 0.3 - 0.15))
  }));
};

export const getClientFunnelData = (client: Client): FunnelStage[] => {
  const totalContacts = client.channels.reduce((sum, ch) => sum + ch.contacts, 0);
  const totalLeads = client.channels.reduce((sum, ch) => sum + ch.qualifiedLeads, 0);
  const totalMeetings = client.channels.reduce((sum, ch) => sum + ch.meetings, 0);
  const totalProposals = client.channels.reduce((sum, ch) => sum + ch.proposals, 0);
  const totalSales = client.channels.reduce((sum, ch) => sum + ch.sales, 0);
  const totalRevenue = client.channels.reduce((sum, ch) => sum + ch.revenue, 0);

  return [
    { 
      name: "Contatos", 
      value: totalContacts, 
      conversionRate: Math.round((totalLeads / totalContacts) * 100) 
    },
    { 
      name: "Leads Qualificados", 
      value: totalLeads, 
      conversionRate: Math.round((totalMeetings / totalLeads) * 100) 
    },
    { 
      name: "Reuniões", 
      value: totalMeetings, 
      conversionRate: Math.round((totalProposals / totalMeetings) * 100) 
    },
    { 
      name: "Propostas", 
      value: totalProposals, 
      conversionRate: Math.round((totalSales / totalProposals) * 100) 
    },
    { name: "Vendas", value: totalSales },
    { name: "Faturamento", value: totalRevenue }
  ];
};