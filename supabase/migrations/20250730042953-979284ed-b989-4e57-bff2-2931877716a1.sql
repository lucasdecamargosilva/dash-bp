-- Atualizar dados para Marcos Rossi (Maio 2025)
UPDATE monthly_data 
SET 
  contacts = 38,
  qualified_leads = 20,
  meetings = 11,
  proposals = 20,
  sales = 4
WHERE client_id IN (
  SELECT id FROM clients WHERE name ILIKE '%Marcos Rossi%'
) AND month = '2025-05';

-- Atualizar dados para Minoru (Julho 2025)
UPDATE monthly_data 
SET 
  contacts = 122,
  qualified_leads = 37,
  meetings = 15,
  proposals = 4,
  sales = 3
WHERE client_id IN (
  SELECT id FROM clients WHERE name ILIKE '%Minoru%'
) AND month = '2025-07';