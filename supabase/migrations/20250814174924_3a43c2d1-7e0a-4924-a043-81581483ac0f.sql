-- Zerar todos os dados de faturamento, vendas, etc. mantendo os clientes
-- Zerar dados da tabela channels
UPDATE public.channels SET
  contacts = 0,
  qualified_leads = 0,
  meetings = 0,
  proposals = 0,
  sales = 0,
  revenue = 0;

-- Zerar dados da tabela monthly_data  
UPDATE public.monthly_data SET
  contacts = 0,
  qualified_leads = 0,
  meetings = 0,
  proposals = 0,
  sales = 0,
  revenue = 0;