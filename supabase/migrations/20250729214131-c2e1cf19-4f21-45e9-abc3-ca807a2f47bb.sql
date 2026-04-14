-- Adicionar dados específicos para Marcos Rossi (maio) e Minoru (julho)
-- Primeiro, vamos identificar os clientes por nome e configurar os dados

-- Para Marcos Rossi - Maio (2025-05)
INSERT INTO monthly_data (client_id, month, revenue, qualified_leads, sales, contacts, meetings, proposals)
SELECT 
  c.id as client_id,
  '2025-05' as month,
  150000 as revenue,
  25 as qualified_leads,
  8 as sales,
  120 as contacts,
  35 as meetings,
  18 as proposals
FROM clients c 
WHERE c.name ILIKE '%Marcos Rossi%'
ON CONFLICT (client_id, month) 
DO UPDATE SET 
  revenue = EXCLUDED.revenue,
  qualified_leads = EXCLUDED.qualified_leads,
  sales = EXCLUDED.sales,
  contacts = EXCLUDED.contacts,
  meetings = EXCLUDED.meetings,
  proposals = EXCLUDED.proposals;

-- Para Minoru - Julho (2025-07)
INSERT INTO monthly_data (client_id, month, revenue, qualified_leads, sales, contacts, meetings, proposals)
SELECT 
  c.id as client_id,
  '2025-07' as month,
  200000 as revenue,
  35 as qualified_leads,
  12 as sales,
  180 as contacts,
  50 as meetings,
  25 as proposals
FROM clients c 
WHERE c.name ILIKE '%Minoru%'
ON CONFLICT (client_id, month) 
DO UPDATE SET 
  revenue = EXCLUDED.revenue,
  qualified_leads = EXCLUDED.qualified_leads,
  sales = EXCLUDED.sales,
  contacts = EXCLUDED.contacts,
  meetings = EXCLUDED.meetings,
  proposals = EXCLUDED.proposals;

-- Adicionar dados zerados para outros meses para Marcos Rossi (manter apenas maio com dados)
INSERT INTO monthly_data (client_id, month, revenue, qualified_leads, sales, contacts, meetings, proposals)
SELECT 
  c.id as client_id,
  month_series.month,
  0 as revenue,
  0 as qualified_leads,
  0 as sales,
  0 as contacts,
  0 as meetings,
  0 as proposals
FROM clients c 
CROSS JOIN (
  VALUES 
    ('2025-01'), ('2025-02'), ('2025-03'), ('2025-04'), 
    ('2025-06'), ('2025-07'), ('2025-08'), ('2025-09'), 
    ('2025-10'), ('2025-11'), ('2025-12'),
    ('2026-01'), ('2026-02'), ('2026-03'), ('2026-04'), ('2026-05'), ('2026-06'),
    ('2026-07'), ('2026-08'), ('2026-09'), ('2026-10'), ('2026-11'), ('2026-12'),
    ('2027-01'), ('2027-02'), ('2027-03'), ('2027-04'), ('2027-05'), ('2027-06'),
    ('2027-07'), ('2027-08'), ('2027-09'), ('2027-10'), ('2027-11'), ('2027-12'),
    ('2028-01'), ('2028-02'), ('2028-03'), ('2028-04'), ('2028-05'), ('2028-06'),
    ('2028-07'), ('2028-08'), ('2028-09'), ('2028-10'), ('2028-11'), ('2028-12')
) AS month_series(month)
WHERE c.name ILIKE '%Marcos Rossi%'
ON CONFLICT (client_id, month) DO NOTHING;

-- Adicionar dados zerados para outros meses para Minoru (manter apenas julho com dados)
INSERT INTO monthly_data (client_id, month, revenue, qualified_leads, sales, contacts, meetings, proposals)
SELECT 
  c.id as client_id,
  month_series.month,
  0 as revenue,
  0 as qualified_leads,
  0 as sales,
  0 as contacts,
  0 as meetings,
  0 as proposals
FROM clients c 
CROSS JOIN (
  VALUES 
    ('2025-01'), ('2025-02'), ('2025-03'), ('2025-04'), ('2025-05'), ('2025-06'),
    ('2025-08'), ('2025-09'), ('2025-10'), ('2025-11'), ('2025-12'),
    ('2026-01'), ('2026-02'), ('2026-03'), ('2026-04'), ('2026-05'), ('2026-06'),
    ('2026-07'), ('2026-08'), ('2026-09'), ('2026-10'), ('2026-11'), ('2026-12'),
    ('2027-01'), ('2027-02'), ('2027-03'), ('2027-04'), ('2027-05'), ('2027-06'),
    ('2027-07'), ('2027-08'), ('2027-09'), ('2027-10'), ('2027-11'), ('2027-12'),
    ('2028-01'), ('2028-02'), ('2028-03'), ('2028-04'), ('2028-05'), ('2028-06'),
    ('2028-07'), ('2028-08'), ('2028-09'), ('2028-10'), ('2028-11'), ('2028-12')
) AS month_series(month)
WHERE c.name ILIKE '%Minoru%'
ON CONFLICT (client_id, month) DO NOTHING;