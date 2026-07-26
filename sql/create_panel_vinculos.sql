-- Vinculos entre o painel e o pipeline
--
-- No pipeline, "pessoa" e "source" sao rotulos de CONTA/ORIGEM, nao de gente.
-- Uma pessoa opera varias contas (ex.: Alexandre toca a conta 'Acioli'), e um
-- rotulo pode mudar de nome com o tempo ('Sacramento' virou 'Sacra' em jul/26).
-- Por isso o vinculo e uma tabela propria, N:1 e editavel pela ferramenta —
-- em vez de um campo de texto solto em cada registro.
--
-- Toda origem que existe no pipeline entra aqui automaticamente. O que ainda
-- nao foi atribuido fica com member_id/channel_id NULL e aparece na tela de
-- Configurar pedindo decisao — nada some silenciosamente.

-- ------------------------------------------------- pessoa do pipeline -> membro
CREATE TABLE IF NOT EXISTS panel_pessoa_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  pipeline_pessoa TEXT NOT NULL,               -- valor cru de ghl_pipeline_opportunities.pessoa
  member_id UUID REFERENCES panel_members(id) ON DELETE SET NULL,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, pipeline_pessoa)
);

-- ------------------------------------------------- source do pipeline -> canal
CREATE TABLE IF NOT EXISTS panel_source_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  pipeline_source TEXT NOT NULL,               -- valor cru de ghl_pipeline_opportunities.source
  channel_id UUID REFERENCES panel_channels(id) ON DELETE SET NULL,
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, pipeline_source)
);

CREATE INDEX IF NOT EXISTS idx_panel_pessoa_map_member  ON panel_pessoa_map(member_id);
CREATE INDEX IF NOT EXISTS idx_panel_source_map_channel ON panel_source_map(channel_id);

ALTER TABLE panel_pessoa_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_source_map ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['panel_pessoa_map','panel_source_map']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s read"  ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s write" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s read"  ON %I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s write" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------- povoamento
-- Traz TODA pessoa e TODA origem que aparecem no pipeline.
INSERT INTO panel_pessoa_map (location_id, pipeline_pessoa)
SELECT DISTINCT o.location_id, o.pessoa
FROM ghl_pipeline_opportunities o
WHERE o.location_id = 'Fv53xady7VzauTiZY4kJ'
  AND COALESCE(o.pessoa,'') <> ''
ON CONFLICT (location_id, pipeline_pessoa) DO NOTHING;

INSERT INTO panel_source_map (location_id, pipeline_source)
SELECT DISTINCT o.location_id, o.source
FROM ghl_pipeline_opportunities o
WHERE o.location_id = 'Fv53xady7VzauTiZY4kJ'
  AND COALESCE(o.source,'') <> ''
ON CONFLICT (location_id, pipeline_source) DO NOTHING;

-- ------------------------------------------------------- vinculos de pessoa
-- So o que os dados sustentam. O resto fica NULL para decisao na ferramenta.
UPDATE panel_pessoa_map pm SET member_id = m.id, note = v.note, updated_at = NOW()
FROM (VALUES
  ('Raphael',    'Raphael',     'so Network, com as vendas dele'),
  ('Aline',      'Aline',       NULL),
  ('Caon',       'Caon',        NULL),
  ('Carol',      'Carol',       NULL),
  ('Oda',        'Marcelo Oda', NULL),
  ('Leo',        'Leo',         NULL),
  ('Canina',     'Thiago',      'conta do Thiago Canina'),
  ('Acioli',     'Alexandre',   'conta Insta Acioli — operada pelo Alexandre'),
  ('Prime',      'Leo',         'conta PR1ME — operada pelo Leo'),
  ('Sacra',      'Sacra',       NULL),
  ('Sacramento', 'Sacra',       'rotulo antigo da mesma pessoa')
) AS v(pipeline_pessoa, member_name, note)
JOIN panel_members m ON m.location_id = 'Fv53xady7VzauTiZY4kJ' AND m.name = v.member_name
WHERE pm.pipeline_pessoa = v.pipeline_pessoa
  AND pm.location_id = 'Fv53xady7VzauTiZY4kJ';

-- -------------------------------------------------------- vinculos de canal
UPDATE panel_source_map sm SET channel_id = c.id, note = v.note, updated_at = NOW()
FROM (VALUES
  ('Network',              'Network',                  NULL),
  ('Referidos',            'Referidos',                NULL),
  ('SHP',                  'SHP e Leo',                NULL),
  ('Lista SHP',            'SHP e Leo',                'lista do canal SHP'),
  ('SS Raiz',              'Social Selling Raiz (SM)', NULL),
  ('Outbound',             'Outbound',                 NULL),
  ('SS IA',                'SS IA',                    NULL),
  ('Cold Call',            'Cold Call e Listas',       NULL),
  ('Lista HOF - Cold Call','Cold Call e Listas',       'lista trabalhada por ligacao'),
  ('Lista HOF - Msg',      'Disparo de Listas',        'lista trabalhada por mensagem')
) AS v(pipeline_source, channel_name, note)
JOIN panel_channels c ON c.location_id = 'Fv53xady7VzauTiZY4kJ' AND c.name = v.channel_name
WHERE sm.pipeline_source = v.pipeline_source
  AND sm.location_id = 'Fv53xady7VzauTiZY4kJ';

-- ------------------------------------------------------- canal que faltava
-- Redrive (reativacao de base) responde por ~2 mil oportunidades no pipeline
-- e nao existia na estrutura do Notion.
INSERT INTO panel_channels (location_id, name, layer, is_presales, is_draft, meta, sort_order)
VALUES ('Fv53xady7VzauTiZY4kJ', 'Redrive', 'volume', TRUE, TRUE, NULL, 14)
ON CONFLICT (location_id, name) DO NOTHING;

-- ------------------------------------------- grafias variantes do mesmo canal
-- O CRM aceita texto livre em "source", entao o mesmo canal aparece escrito de
-- varios jeitos (com typo, com o nome da pessoa junto, com caixa diferente).
-- Sem isso, 11,6% do volume ficaria fora da conta.
UPDATE panel_source_map sm SET channel_id = c.id, note = COALESCE(sm.note,'grafia variante'), updated_at = NOW()
FROM (VALUES
  ('Redrive','Redrive'), ('redrive','Redrive'),
  ('Social Selling IA','SS IA'), ('Social Selling Ia','SS IA'), ('Social Selling AI','SS IA'),
  ('Social Selling Ai','SS IA'), ('Social selling IA','SS IA'), ('Social Selling AI Acioli','SS IA'),
  ('Social Selling Ai Canina','SS IA'), ('SS IA / Elyano','SS IA'), ('Lista Ai','SS IA'),
  ('Network Aline','Network'), ('network Aline','Network'), ('Nerwork Aline','Network'),
  ('Network Canina','Network'), ('Network Eric','Network'), ('Network Marcelo Oda','Network'),
  ('Network Sacra','Network'),
  ('Outbound Aicioli','Outbound'), ('Outbound Aicoli','Outbound'), ('Outbound Insta Canina','Outbound'),
  ('Outbound Lista Monalisa','Outbound'), ('Outbound Marcelo Oda','Outbound'),
  ('referidos','Referidos'), ('Ind. Leo','Referidos')
) AS v(pipeline_source, channel_name)
JOIN panel_channels c ON c.location_id = 'Fv53xady7VzauTiZY4kJ' AND c.name = v.channel_name
WHERE sm.pipeline_source = v.pipeline_source
  AND sm.location_id = 'Fv53xady7VzauTiZY4kJ'
  AND sm.channel_id IS NULL;

-- --------------------------------------------- fim do campo de texto solto
-- O vinculo agora mora nas tabelas acima; estas colunas viravam segunda
-- fonte de verdade e saem de cena.
ALTER TABLE panel_channels DROP COLUMN IF EXISTS source_name;
ALTER TABLE panel_members  DROP COLUMN IF EXISTS pessoa_name;
