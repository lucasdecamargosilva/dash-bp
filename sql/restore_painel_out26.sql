-- Restauração do Painel de Canais — estado de outubro/26
-- Usado em 19/out/26, quando a migração do banco para o volume data_v2
-- zerou todas as tabelas panel_* (o esquema e as funções sobreviveram).
-- Idempotente. Logins religados por E-MAIL (ids do auth mudam entre volumes).

DO $$
DECLARE loc TEXT := 'Fv53xady7VzauTiZY4kJ';
BEGIN
INSERT INTO panel_channels (id, location_id, name, layer, is_presales, is_draft, active, meta, sort_order) VALUES
  (gen_random_uuid(), loc, 'Network',            'quentes',    FALSE, FALSE, TRUE,  '50 leads/mês',         1),
  ('4b394cd6-3884-46df-9566-cf8e1b063311', loc, 'Referidos', 'quentes', FALSE, FALSE, TRUE, '30/mês',       2),
  (gen_random_uuid(), loc, 'SHP e Leo',          'quentes',    FALSE, FALSE, TRUE,  '10 contatos/mês',      3),
  (gen_random_uuid(), loc, 'SS Raiz',            'volume',     TRUE,  FALSE, TRUE,  '40/mês',               4),
  (gen_random_uuid(), loc, 'Outbound',           'volume',     TRUE,  FALSE, TRUE,  '3.400 msgs/mês',       5),
  ('f49b902d-27ce-4d07-88f9-7f3e0b3f8f92', loc, 'Claude',    'volume', FALSE, FALSE, TRUE, NULL,            6),
  (gen_random_uuid(), loc, 'Cold Call',          'construcao', TRUE,  FALSE, TRUE,  'Conforme lista ativa', 7),
  (gen_random_uuid(), loc, 'Parceiros',          'construcao', FALSE, FALSE, TRUE,  '20 indicações',        8),
  (gen_random_uuid(), loc, 'Feiras e Eventos',   'construcao', FALSE, FALSE, TRUE,  NULL,                   9),
  (gen_random_uuid(), loc, 'Renovação e Upsell', 'construcao', FALSE, FALSE, TRUE,  'Carteira',            10),
  (gen_random_uuid(), loc, 'Disparo de Listas',  'construcao', TRUE,  TRUE,  TRUE,  '~1.000 disparos',     11),
  (gen_random_uuid(), loc, 'Tráfego',            'construcao', FALSE, FALSE, TRUE,  NULL,                  12),
  (gen_random_uuid(), loc, 'Instagram Bio',      'construcao', FALSE, FALSE, TRUE,  NULL,                  13),
  (gen_random_uuid(), loc, 'SS IA',              'volume',     FALSE, FALSE, FALSE, NULL,                  14),
  (gen_random_uuid(), loc, 'Redrive',            'volume',     FALSE, FALSE, FALSE, NULL,                  15)
ON CONFLICT (location_id, name) DO NOTHING;

INSERT INTO panel_members (id, location_id, name, is_head, hue) VALUES
  ('da610799-5a23-4649-ab2d-f4ccd413b81a', loc, 'Raphael',     TRUE,  212),
  ('75b60bea-bb80-44fa-afb4-55c081255f49', loc, 'Thiago',      TRUE,  258),
  ('28551709-367c-4bea-854f-934d5b85180b', loc, 'Marcelo Oda', TRUE,  266),
  ('2067044f-3f32-43d0-b85a-4ed14eeda7eb', loc, 'Caon',        TRUE,  168),
  ('3ef98f93-4849-4245-a43b-ea95bf41f92f', loc, 'Aline',       FALSE, 330),
  ('342bf4e4-bfd7-4e7d-b51b-0518a10e6547', loc, 'Carol',       FALSE,  96),
  ('99410852-5217-4c94-92a7-725d505052a8', loc, 'Sacra',       FALSE, 194),
  ('7c78a28a-3033-471e-878c-a730885267fa', loc, 'Alexandre',   FALSE,  18)
ON CONFLICT (location_id, name) DO NOTHING;

UPDATE panel_members m SET profile_id = v.pid::uuid
FROM (VALUES
  ('Raphael',     '0a38cc66-62d0-483e-a74e-e4a9cb131f38'),
  ('Thiago',      'da443a06-d37a-413a-a2dc-5509cd060b2b'),
  ('Marcelo Oda', 'c5a1172c-c3ce-41ef-bea8-ca42e84c6065'),
  ('Caon',        '285c4381-534f-496c-a63b-b21bc2675583'),
  ('Aline',       'eddd66d0-ed05-47a2-8b03-0cf3e8bdc268'),
  ('Carol',       'b2438a95-5855-4902-99b2-26c2ba3bd13c'),
  ('Sacra',       '853fe947-0a92-4c03-94dd-238071361070'),
  ('Alexandre',   'e0bc9e0d-265d-4b11-96c2-06cfae580d57')
) AS v(nome, pid)
WHERE m.location_id = loc AND m.name = v.nome
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v.pid::uuid);
END $$;
SELECT (SELECT count(*) FROM panel_channels) AS canais,
       (SELECT count(*) FROM panel_members)  AS pessoas,
       (SELECT count(*) FROM panel_members WHERE profile_id IS NOT NULL) AS logins_vinculados;

DO $$
DECLARE loc TEXT := 'Fv53xady7VzauTiZY4kJ';
BEGIN
-- religa logins por e-mail (ids novos do auth)
UPDATE panel_members m SET profile_id = u.id
FROM (VALUES
  ('Raphael',     'raphaelacioli@bpgroupbr.com.br'),
  ('Marcelo Oda', 'odamarcelokenji@gmail.com'),
  ('Caon',        'felipecaon@bpgroupbr.com.br'),
  ('Sacra',       'thiagosacramento@bpgroupbr.com.br'),
  ('Alexandre',   'alexandre@bpgroupbr.com.br'),
  ('Aline',       'alineautoral@bpgroupbr.com.br'),
  ('Carol',       'carolinesantana@bpgroupbr.com.br')
) AS v(nome, mail)
JOIN auth.users u ON u.email = v.mail
WHERE m.location_id = loc AND m.name = v.nome;

-- papeis (estado de outubro, reconstruido das observacoes)
INSERT INTO panel_roles (location_id, member_id, channel_id, role)
SELECT loc, m.id, c.id, v.role
FROM (VALUES
  ('Raphael','Network','dono'),            ('Thiago','Network','aux'),
  ('Raphael','Network','super'),
  ('Aline','Referidos','dono'),            ('Carol','Referidos','aux'),
  ('Raphael','Referidos','super'),         ('Aline','Referidos','super'),
  ('Thiago','SHP e Leo','dono'),           ('Raphael','SHP e Leo','aux'),
  ('Thiago','SHP e Leo','super'),
  ('Caon','SS Raiz','dono'),               ('Alexandre','SS Raiz','aux'),  ('Sacra','SS Raiz','aux'),
  ('Thiago','SS Raiz','super'),
  ('Alexandre','Outbound','dono'),         ('Carol','Outbound','dono'),    ('Sacra','Outbound','dono'),
  ('Marcelo Oda','Outbound','dono'),       ('Caon','Outbound','aux'),
  ('Marcelo Oda','Outbound','super'),
  ('Sacra','Cold Call','dono'),            ('Alexandre','Cold Call','dono'),
  ('Marcelo Oda','Cold Call','super'),
  ('Carol','Parceiros','dono'),            ('Thiago','Parceiros','super'),
  ('Alexandre','Feiras e Eventos','dono'), ('Thiago','Feiras e Eventos','super'),
  ('Raphael','Renovação e Upsell','dono'), ('Thiago','Renovação e Upsell','dono'),
  ('Raphael','Renovação e Upsell','super'),
  ('Marcelo Oda','Disparo de Listas','dono'), ('Marcelo Oda','Disparo de Listas','super'),
  ('Caon','Tráfego','dono'),               ('Caon','Instagram Bio','dono'),
  ('Caon','Claude','dono'),                ('Aline','Claude','aux'),
  ('Caon','Claude','super')
) AS v(member_name, channel_name, role)
JOIN panel_members  m ON m.location_id = loc AND m.name = v.member_name
JOIN panel_channels c ON c.location_id = loc AND c.name = v.channel_name
ON CONFLICT (member_id, channel_id, role) DO NOTHING;

-- cotas vigentes (como estavam em outubro)
INSERT INTO panel_quotas (location_id, member_id, channel_id, account, qty, freq)
SELECT loc, m.id, c.id, v.account, v.qty, v.freq
FROM (VALUES
  ('Sacra','Outbound','Instagram Canina 30 mensagens manuais',30,'d'),
  ('Alexandre','SS Raiz','Instagram Acioli',10,'s'),
  ('Sacra','SS Raiz','Instagram Canina',10,'s'),
  ('Sacra','Cold Call','Lista',60,'s'),
  ('Alexandre','Cold Call','Lista',60,'s')
) AS v(member_name, channel_name, account, qty, freq)
JOIN panel_members  m ON m.location_id = loc AND m.name = v.member_name
JOIN panel_channels c ON c.location_id = loc AND c.name = v.channel_name
WHERE NOT EXISTS (SELECT 1 FROM panel_quotas q WHERE q.member_id = m.id AND q.channel_id = c.id AND q.account = v.account);
END $$;
SELECT (SELECT count(*) FROM panel_members WHERE profile_id IS NOT NULL) AS logins,
       (SELECT count(*) FROM panel_roles) AS papeis,
       (SELECT count(*) FROM panel_quotas) AS cotas;

DO $$
DECLARE loc TEXT := 'Fv53xady7VzauTiZY4kJ';
BEGIN
INSERT INTO panel_tasks (location_id, channel_id, freq, title, sort_order, audience)
SELECT loc, c.id, v.freq, v.title, v.ord, 'operacao'
FROM (VALUES
  ('Network','m','Revisar e ampliar as listas (100)',1),
  ('Network','s','Blitz de 1h na agenda, todos presentes',2),
  ('Network','s','Mensurar ao final o número do que foi feito',3),
  ('Network','s','Testar 2ª blitz na semana só com o time comercial',4),
  ('Network','s','Campanhas pra network (+1% ou algo do tipo)',5),
  ('Referidos','d','Pedir indicação no privado após resultado de mentorado',1),
  ('Referidos','s','Estratégia “boa-tarde” com 10 referidos que não compraram',2),
  ('Referidos','s','Contato com clientes novos, no meio e em pico de resultado',3),
  ('Referidos','s','Mensurar nº de contatos total e por cliente',4),
  ('Referidos','s','Caon passar overview de oportunidades para a Aline',5),
  ('Referidos','s','CRM para controle dos touchs',6),
  ('Referidos','m','Campanha de cashback ou reconexão',7),
  ('Referidos','m','Criar campanha do próximo mês',8),
  ('Referidos','m','Reconhecer os tops indicadores',9),
  ('SHP e Leo','d','Follow-up das indicações abertas',1),
  ('SHP e Leo','s','Presença nos encontros SHP (1º e último do mês)',2),
  ('SHP e Leo','s','SHP agenda a reunião direto — não passa só o contato',3),
  ('SHP e Leo','s','Touchs com o time SHP',4),
  ('SHP e Leo','m','Masterclass ou treinamento do time SHP',5),
  ('SHP e Leo','m','Revisar meta de indicações com o Leo',6),
  ('SHP e Leo','m','Reforçar com o Leo',7),
  ('SHP e Leo','m','Posts no perfil do Leo',8),
  ('SHP e Leo','m','Campanhas específicas',9),
  ('SS Raiz','d','Abordagens manuais em novos seguidores, enquetes etc.',1),
  ('SS Raiz','d','Post(s) do dia seguindo os CTAs semanais (inclui perfil do Leo)',2),
  ('SS Raiz','d','Ver e atualizar o CRM',3),
  ('SS Raiz','s','5 a 10 conteúdos publicados nos perfis (estratégia Alfredo)',4),
  ('SS Raiz','s','Revisar respostas e puxar para o WhatsApp',5),
  ('SS Raiz','s','Gravar e mandar conteúdo',6),
  ('SS Raiz','m','Análise de conversão do canal',7),
  ('SS Raiz','m','Revisar CTA e leads gerados · definir comissão da Vivi',8),
  ('SS Raiz','m','Aumentar gravações de conteúdo',9),
  ('SS Raiz','m','Materiais isca (materiais, masterclass, tutoriais)',10),
  ('SS Raiz','m','Raphael e Thiago postarem mais nos stories',11),
  ('Outbound','d','20 a 30 abordagens por pessoa',1),
  ('Outbound','d','Touchs da cadência',2),
  ('Outbound','d','Atualizar etapas — WhatsApp e Agendada',3),
  ('Outbound','d','Cadência das reuniões agendadas',4),
  ('Outbound','d','CRM atualizado',5),
  ('Outbound','s','Revisar scripts e taxa por etapa do funil',6),
  ('Outbound','s','Calibrar prompts e listas',7),
  ('Outbound','m','Nova lista segmentada por ICP',8),
  ('Outbound','m','Fazer testes A/B (msgs, público, cadência etc.)',9),
  ('Cold Call','d','10 ligações',1),
  ('Cold Call','s','Higienizar lista e registrar aprendizados',2),
  ('Cold Call','m','Gerar próxima lista',3),
  ('Parceiros','s','X contatos novos de parceria',1),
  ('Parceiros','s','Ações com parceiros — live, aulas, masterclass, blitz, evento',2),
  ('Parceiros','s','Novos contatos',3),
  ('Parceiros','m','1 palestra ou ação com parceiro (ex.: Agnus com rev-share)',4),
  ('Parceiros','m','Eventos/treinamentos para engajar os parceiros',5),
  ('Feiras e Eventos','s','Mapear feira/evento do trimestre e público-alvo',1),
  ('Feiras e Eventos','s','Novos contatos de expositores/parceiros de evento',2),
  ('Feiras e Eventos','m','1 ativação ou presença em evento',3),
  ('Renovação e Upsell','s','Revisar Análise de Temperatura e sinalizar renovações a 60 dias',1),
  ('Renovação e Upsell','m','2 ofertas de upgrade (Elevate → Legacy com cashback)',2),
  ('Disparo de Listas','m','Definir lista (HOF, base do CRM, Listas do Leo)',1),
  ('Disparo de Listas','m','Definir número de contatos e disparos',2),
  ('Disparo de Listas','m','Aprimorar copy',3)
) AS v(channel_name, freq, title, ord)
JOIN panel_channels c ON c.location_id = loc AND c.name = v.channel_name
WHERE NOT EXISTS (SELECT 1 FROM panel_tasks t WHERE t.channel_id = c.id AND t.freq = v.freq AND t.title = v.title);
END $$;
SELECT count(*) AS atividades FROM panel_tasks;

DO $$
DECLARE loc TEXT := 'Fv53xady7VzauTiZY4kJ';
BEGIN
INSERT INTO panel_goals (location_id, channel_id, competencia, contatos, reunioes, propostas, vendas, faturamento)
SELECT loc, c.id, v.comp, v.ct, v.re, v.pr, v.vd, v.fat
FROM (VALUES
  ('Outbound','2026-08',600,8,5,1,NULL::numeric), ('SS Raiz','2026-08',19,8,6,0,NULL),
  ('Cold Call','2026-08',200,10,8,1,NULL),        ('Network','2026-08',35,20,12,1,NULL),
  ('Referidos','2026-08',30,20,15,2,NULL),        ('Tráfego','2026-08',30,8,5,1,NULL),
  ('SHP e Leo','2026-08',15,10,8,1,NULL),         ('Parceiros','2026-08',30,12,8,1,NULL),
  ('Feiras e Eventos','2026-08',20,8,6,0,NULL),   ('Disparo de Listas','2026-08',1000,5,3,0,NULL),
  ('Claude','2026-08',2600,26,16,1,NULL),         ('Instagram Bio','2026-08',2,1,1,0,NULL),
  ('Renovação e Upsell','2026-09',4,4,4,2,35000), ('Network','2026-09',30,20,12,2,69998),
  ('Referidos','2026-09',20,15,10,2,70000),       ('Parceiros','2026-09',10,6,4,NULL::int,NULL),
  ('SS Raiz','2026-09',30,15,8,1,70000),          ('Outbound','2026-09',2400,24,16,1,70000)
) AS v(canal, comp, ct, re, pr, vd, fat)
JOIN panel_channels c ON c.location_id = loc AND c.name = v.canal
ON CONFLICT (channel_id, competencia) DO NOTHING;

INSERT INTO panel_source_map (location_id, pipeline_source, channel_id)
SELECT DISTINCT loc, o.source, NULL::uuid FROM ghl_pipeline_opportunities o
WHERE o.location_id = loc AND o.source IS NOT NULL AND o.source <> ''
ON CONFLICT DO NOTHING;
INSERT INTO panel_pessoa_map (location_id, pipeline_pessoa, member_id)
SELECT DISTINCT loc, o.pessoa, NULL::uuid FROM ghl_pipeline_opportunities o
WHERE o.location_id = loc AND o.pessoa IS NOT NULL AND o.pessoa <> ''
ON CONFLICT DO NOTHING;

UPDATE panel_source_map sm
SET channel_id = (SELECT c.id FROM panel_channels c WHERE c.location_id = loc AND c.name = v.canal)
FROM (VALUES
  ('Network','Network'), ('Referidos','Referidos'), ('referidos','Referidos'), ('Ind. Leo','Referidos'),
  ('SHP','SHP e Leo'), ('Lista SHP','SHP e Leo'),
  ('SS Raiz','SS Raiz'), ('Outbound','Outbound'), ('Outbound Acioli','Outbound'), ('Outbound Aicioli','Outbound'), ('Outbound Aicoli','Outbound'),
  ('Cold Call','Cold Call'), ('Claude','Claude'), ('Trafego','Tráfego'), ('Tráfego','Tráfego'),
  ('Renovação','Renovação e Upsell'), ('Renovacao','Renovação e Upsell'),
  ('Lista HOF - Msg','Disparo de Listas'), ('Instagram Bio','Instagram Bio'),
  ('SS IA','SS IA'), ('Social Selling IA','SS IA'), ('Social Selling Ia','SS IA'), ('Social Selling AI','SS IA'),
  ('Social Selling Ai','SS IA'), ('Social selling IA','SS IA'), ('Lista Ai','SS IA'),
  ('Social Selling AI Acioli','SS IA'), ('Social Selling Ai Canina','SS IA'), ('SS IA / Elyano','SS IA'),
  ('Redrive','Redrive'), ('redrive','Redrive')
) AS v(src, canal)
WHERE sm.location_id = loc AND sm.pipeline_source = v.src;

UPDATE panel_pessoa_map pm
SET member_id = (SELECT m.id FROM panel_members m WHERE m.location_id = loc AND m.name = v.nome)
FROM (VALUES
  ('Acioli','Alexandre'), ('Aline','Aline'), ('Canina','Thiago'), ('Caon','Caon'),
  ('Carol','Carol'), ('Oda','Marcelo Oda'), ('Sacra','Sacra'), ('Sacramento','Sacra'), ('Raphael','Raphael')
) AS v(pes, nome)
WHERE pm.location_id = loc AND pm.pipeline_pessoa = v.pes;
END $$;
SELECT (SELECT count(*) FROM panel_goals) AS metas,
       (SELECT count(*) FROM panel_source_map) AS fontes,
       (SELECT count(*) FROM panel_source_map WHERE channel_id IS NOT NULL) AS fontes_ligadas,
       (SELECT count(*) FROM panel_pessoa_map) AS pessoas_crm,
       (SELECT count(*) FROM panel_pessoa_map WHERE member_id IS NOT NULL) AS pessoas_ligadas;
