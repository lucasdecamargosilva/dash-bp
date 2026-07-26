-- Seed do Painel de Canais — PR1ME ROI
-- Origem: Notion "Painel de Canais | Estrategia Comercial" (ciclo Agosto/26)
--         + mapa de time do Miro.
-- Rodar DEPOIS de create_panel_canais.sql. E idempotente: pode rodar de novo.
--
-- ATENCAO — revisar depois de rodar:
--   source_name / pessoa_name sao a ponte com o pipeline (ghl_pipeline_*).
--   Onde o nome do pipeline e ambiguo, deixei NULL de proposito, para nao
--   cruzar numero errado. Os casos estao marcados com "-- REVISAR".

DO $$
DECLARE
  loc TEXT := 'Fv53xady7VzauTiZY4kJ';   -- PR1ME ROI (GHL location)
BEGIN

-- ------------------------------------------------------------------ canais
INSERT INTO panel_channels (location_id, name, source_name, layer, is_presales, is_draft, meta, sort_order) VALUES
  (loc, 'Network',                  'Network',   'quentes',    FALSE, FALSE, '50 leads/mês',        1),
  (loc, 'Referidos',                'Referidos', 'quentes',    FALSE, FALSE, '30/mês',              2),
  (loc, 'SHP e Leo',                'SHP',       'quentes',    FALSE, FALSE, '10 contatos/mês',     3),
  (loc, 'Social Selling Raiz (SM)', 'SS Raiz',   'volume',     TRUE,  FALSE, '40/mês',              4),
  (loc, 'Outbound',                 'Outbound',  'volume',     TRUE,  FALSE, '3.400 msgs/mês',      5),
  (loc, 'SS IA',                    'SS IA',     'volume',     TRUE,  TRUE,  NULL,                  6),
  (loc, 'Gestão de Pré-vendas',     NULL,        'volume',     FALSE, FALSE, '170 msgs/dia batidas',7),
  (loc, 'Cold Call e Listas',       'Cold Call', 'construcao', TRUE,  FALSE, 'Conforme lista ativa',8),
  (loc, 'Parceiros',                NULL,        'construcao', FALSE, FALSE, '20 indicações',       9),
  (loc, 'Feiras e Eventos',         NULL,        'construcao', FALSE, TRUE,  NULL,                 10),
  (loc, 'Renovação e Upsell',       NULL,        'construcao', FALSE, FALSE, 'Carteira',           11),
  (loc, 'Disparo de Listas',        NULL,        'construcao', TRUE,  TRUE,  '~1.000 disparos',    12),  -- REVISAR: seria 'Lista HOF - Msg'?
  (loc, 'Eventos próprios',         NULL,        'construcao', FALSE, FALSE, '1 evento em rota',   13)
ON CONFLICT (location_id, name) DO NOTHING;

-- ----------------------------------------------------------------- pessoas
-- pessoa_name casa com ghl_pipeline_opportunities.pessoa
INSERT INTO panel_members (location_id, name, pessoa_name, is_head, hue) VALUES
  (loc, 'Raphael',     NULL,         TRUE,  212),  -- REVISAR: no pipeline aparece 'Acioli' e 'Raphael'
  (loc, 'Thiago',      'Canina',     TRUE,  258),
  (loc, 'Marcelo Oda', 'Oda',        TRUE,  266),
  (loc, 'Aline',       'Aline',      FALSE, 330),
  (loc, 'Caon',        'Caon',       FALSE, 168),
  (loc, 'Vivi',        NULL,         FALSE,  46),  -- REVISAR: nao aparece no pipeline
  (loc, 'Carol',       'Carol',      FALSE,  96),
  (loc, 'Leo',         'Leo',        FALSE, 140),
  (loc, 'Sacra',       'Sacra',      FALSE, 194),  -- REVISAR: jun aparece como 'Sacramento'
  (loc, 'Alexandre',   NULL,         FALSE,  18),  -- REVISAR: opera a conta 'Insta Acioli'
  (loc, 'Sócios',      NULL,         FALSE,  38)
ON CONFLICT (location_id, name) DO NOTHING;

-- ------------------------------------------------------------------ papeis
INSERT INTO panel_roles (location_id, member_id, channel_id, role)
SELECT loc, m.id, c.id, v.role
FROM (VALUES
  ('Raphael','Network','dono'),         ('Thiago','Network','aux'),        ('Raphael','Network','super'),
  ('Aline','Referidos','dono'),         ('Caon','Referidos','aux'),        ('Sócios','Referidos','aux'),
  ('Raphael','Referidos','super'),
  ('Thiago','SHP e Leo','dono'),        ('Leo','SHP e Leo','aux'),         ('Raphael','SHP e Leo','aux'),
  ('Thiago','SHP e Leo','super'),
  ('Vivi','Social Selling Raiz (SM)','dono'), ('Caon','Social Selling Raiz (SM)','aux'),
  ('Raphael','Social Selling Raiz (SM)','super'),
  ('Alexandre','Outbound','dono'),      ('Carol','Outbound','dono'),       ('Sacra','Outbound','dono'),
  ('Leo','Outbound','dono'),            ('Caon','Outbound','aux'),         ('Marcelo Oda','Outbound','super'),
  ('Marcelo Oda','Gestão de Pré-vendas','dono'), ('Thiago','Gestão de Pré-vendas','super'),
  ('Sacra','Cold Call e Listas','dono'),('Alexandre','Cold Call e Listas','dono'),
  ('Leo','Cold Call e Listas','aux'),   ('Marcelo Oda','Cold Call e Listas','super'),
  ('Carol','Parceiros','dono'),         ('Thiago','Parceiros','super'),
  ('Alexandre','Feiras e Eventos','dono'), ('Thiago','Feiras e Eventos','super'),
  ('Caon','Renovação e Upsell','dono'), ('Aline','Renovação e Upsell','aux'),
  ('Raphael','Renovação e Upsell','super'),
  ('Caon','Disparo de Listas','dono'),  ('Leo','Disparo de Listas','aux'),
  ('Marcelo Oda','Disparo de Listas','super'),
  ('Raphael','Eventos próprios','dono'),('Thiago','Eventos próprios','aux'),
  ('Raphael','Eventos próprios','super')
) AS v(member_name, channel_name, role)
JOIN panel_members  m ON m.location_id = loc AND m.name = v.member_name
JOIN panel_channels c ON c.location_id = loc AND c.name = v.channel_name
ON CONFLICT (member_id, channel_id, role) DO NOTHING;

-- -------------------------------------------------------------- atividades
INSERT INTO panel_tasks (location_id, channel_id, freq, title, sort_order)
SELECT loc, c.id, v.freq, v.title, v.ord
FROM (VALUES
  -- Network
  ('Network','m','Revisar e ampliar as listas (100)',1),
  ('Network','s','Blitz de 1h na agenda, todos presentes',2),
  ('Network','s','Mensurar ao final o número do que foi feito',3),
  ('Network','s','Testar 2ª blitz na semana só com o time comercial',4),
  ('Network','s','Campanhas pra network (+1% ou algo do tipo)',5),
  -- Referidos
  ('Referidos','d','Pedir indicação no privado após resultado de mentorado',1),
  ('Referidos','s','Estratégia “boa-tarde” com 10 referidos que não compraram',2),
  ('Referidos','s','Contato com clientes novos, no meio e em pico de resultado',3),
  ('Referidos','s','Mensurar nº de contatos total e por cliente',4),
  ('Referidos','s','Caon passar overview de oportunidades para a Aline',5),
  ('Referidos','s','CRM para controle dos touchs',6),
  ('Referidos','m','Campanha de cashback ou reconexão',7),
  ('Referidos','m','Criar campanha do próximo mês',8),
  ('Referidos','m','Reconhecer os tops indicadores',9),
  -- SHP e Leo
  ('SHP e Leo','d','Follow-up das indicações abertas',1),
  ('SHP e Leo','s','Presença nos encontros SHP (1º e último do mês)',2),
  ('SHP e Leo','s','SHP agenda a reunião direto — não passa só o contato',3),
  ('SHP e Leo','s','Touchs com o time SHP',4),
  ('SHP e Leo','m','Masterclass ou treinamento do time SHP',5),
  ('SHP e Leo','m','Revisar meta de indicações com o Leo',6),
  ('SHP e Leo','m','Reforçar com o Leo',7),
  ('SHP e Leo','m','Posts no perfil do Leo',8),
  ('SHP e Leo','m','Campanhas específicas',9),
  -- Social Selling Raiz
  ('Social Selling Raiz (SM)','d','Abordagens manuais em novos seguidores, enquetes etc.',1),
  ('Social Selling Raiz (SM)','d','Post(s) do dia seguindo os CTAs semanais (inclui perfil do Leo)',2),
  ('Social Selling Raiz (SM)','d','Ver e atualizar o CRM',3),
  ('Social Selling Raiz (SM)','s','5 a 10 conteúdos publicados nos perfis (estratégia Alfredo)',4),
  ('Social Selling Raiz (SM)','s','Revisar respostas e puxar para o WhatsApp',5),
  ('Social Selling Raiz (SM)','s','Gravar e mandar conteúdo',6),
  ('Social Selling Raiz (SM)','m','Análise de conversão do canal',7),
  ('Social Selling Raiz (SM)','m','Revisar CTA e leads gerados · definir comissão da Vivi',8),
  ('Social Selling Raiz (SM)','m','Aumentar gravações de conteúdo',9),
  ('Social Selling Raiz (SM)','m','Materiais isca (materiais, masterclass, tutoriais)',10),
  ('Social Selling Raiz (SM)','m','Raphael e Thiago postarem mais nos stories',11),
  -- Outbound
  ('Outbound','d','20 a 30 abordagens por pessoa',1),
  ('Outbound','d','Touchs da cadência',2),
  ('Outbound','d','Atualizar etapas — WhatsApp e Agendada',3),
  ('Outbound','d','Cadência das reuniões agendadas',4),
  ('Outbound','d','CRM atualizado',5),
  ('Outbound','s','Revisar scripts e taxa por etapa do funil',6),
  ('Outbound','s','Calibrar prompts e listas',7),
  ('Outbound','m','Nova lista segmentada por ICP',8),
  ('Outbound','m','Fazer testes A/B (msgs, público, cadência etc.)',9),
  -- Gestão de Pré-vendas
  ('Gestão de Pré-vendas','d','Conferir se o time bateu as 170 msgs/dia',1),
  ('Gestão de Pré-vendas','d','Sinalizar quem está abaixo da meta do dia',2),
  ('Gestão de Pré-vendas','s','Revisar taxa por etapa (Outbound + Cold Call)',3),
  ('Gestão de Pré-vendas','s','1:1 rápido com quem ficou abaixo na semana',4),
  ('Gestão de Pré-vendas','m','Rebalancear contas e listas entre os pré-vendas',5),
  -- Cold Call
  ('Cold Call e Listas','d','10 ligações',1),
  ('Cold Call e Listas','s','Higienizar lista e registrar aprendizados',2),
  ('Cold Call e Listas','m','Gerar próxima lista',3),
  -- Parceiros
  ('Parceiros','s','X contatos novos de parceria',1),
  ('Parceiros','s','Ações com parceiros — live, aulas, masterclass, blitz, evento',2),
  ('Parceiros','s','Novos contatos',3),
  ('Parceiros','m','1 palestra ou ação com parceiro (ex.: Agnus com rev-share)',4),
  ('Parceiros','m','Eventos/treinamentos para engajar os parceiros',5),
  -- Feiras e Eventos
  ('Feiras e Eventos','s','Mapear feira/evento do trimestre e público-alvo',1),
  ('Feiras e Eventos','s','Novos contatos de expositores/parceiros de evento',2),
  ('Feiras e Eventos','m','1 ativação ou presença em evento',3),
  -- Renovação e Upsell
  ('Renovação e Upsell','s','Revisar Análise de Temperatura e sinalizar renovações a 60 dias',1),
  ('Renovação e Upsell','m','2 ofertas de upgrade (Elevate → Legacy com cashback)',2),
  -- Disparo de Listas
  ('Disparo de Listas','m','Definir lista (HOF, base do CRM, Listas do Leo)',1),
  ('Disparo de Listas','m','Definir número de contatos e disparos',2),
  ('Disparo de Listas','m','Aprimorar copy',3),
  -- Eventos próprios
  ('Eventos próprios','s','1 avanço no evento de set–out (local, agenda do Caio, convites)',1),
  ('Eventos próprios','m','Definir próximo evento menor (jantar ou sala de guerra)',2)
) AS v(channel_name, freq, title, ord)
JOIN panel_channels c ON c.location_id = loc AND c.name = v.channel_name
WHERE NOT EXISTS (
  SELECT 1 FROM panel_tasks t
  WHERE t.channel_id = c.id AND t.freq = v.freq AND t.title = v.title
);

-- ------------------------------------------------------------------ cotas
-- Motor de pre-vendas: 170 msgs/dia -> 850/semana -> 3.400/mes
INSERT INTO panel_quotas (location_id, member_id, channel_id, account, per_day)
SELECT loc, m.id, c.id, v.account, v.per_day
FROM (VALUES
  ('Alexandre','Outbound','Insta Acioli (10 manual + 20 ferramenta)',30),
  ('Carol','Outbound','Insta Carol Antigo',20),
  ('Carol','Outbound','Insta Carol Novo',20),
  ('Sacra','Outbound','Insta Canina',50),
  ('Leo','Outbound','PR1ME',30),
  ('Caon','Outbound','Insta Caon',20)
) AS v(member_name, channel_name, account, per_day)
JOIN panel_members  m ON m.location_id = loc AND m.name = v.member_name
JOIN panel_channels c ON c.location_id = loc AND c.name = v.channel_name
WHERE NOT EXISTS (
  SELECT 1 FROM panel_quotas q
  WHERE q.member_id = m.id AND q.channel_id = c.id AND q.account = v.account
);

END $$;

-- Conferencia rapida
SELECT 'canais'     AS tabela, COUNT(*) FROM panel_channels WHERE location_id = 'Fv53xady7VzauTiZY4kJ'
UNION ALL SELECT 'pessoas',    COUNT(*) FROM panel_members  WHERE location_id = 'Fv53xady7VzauTiZY4kJ'
UNION ALL SELECT 'papeis',     COUNT(*) FROM panel_roles    WHERE location_id = 'Fv53xady7VzauTiZY4kJ'
UNION ALL SELECT 'atividades', COUNT(*) FROM panel_tasks    WHERE location_id = 'Fv53xady7VzauTiZY4kJ'
UNION ALL SELECT 'cotas',      COUNT(*) FROM panel_quotas   WHERE location_id = 'Fv53xady7VzauTiZY4kJ';
