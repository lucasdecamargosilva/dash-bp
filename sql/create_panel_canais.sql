-- Painel de Canais — estrutura operacional do time comercial
--
-- Complementa o pipeline: as tabelas ghl_pipeline_* guardam o QUE ACONTECEU
-- (oportunidades, etapas, vendas). Aqui fica o QUE COMBINAMOS FAZER —
-- pessoas, papeis por canal, rotina de atividades e cotas de prospeccao.
--
-- Ponte entre os dois mundos:
--   panel_channels.source_name  ->  ghl_pipeline_opportunities.source
--   panel_members.pessoa_name   ->  ghl_pipeline_opportunities.pessoa
-- Assim o painel cruza meta x realizado sem duplicar numero nenhum.
--
-- Escopo por location_id (mesmo tenant do pipeline GHL).

-- ---------------------------------------------------------------- canais
CREATE TABLE IF NOT EXISTS panel_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  name TEXT NOT NULL,                          -- como o time chama o canal
  source_name TEXT,                            -- nome no pipeline (source), se houver
  layer TEXT NOT NULL DEFAULT 'volume',        -- quentes | volume | construcao
  is_presales BOOLEAN NOT NULL DEFAULT FALSE,  -- recebe cota de prospeccao
  is_draft BOOLEAN NOT NULL DEFAULT FALSE,     -- canal ainda em construcao
  meta TEXT,                                   -- meta do ciclo, em texto livre
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, name),
  CONSTRAINT panel_channels_layer_chk CHECK (layer IN ('quentes','volume','construcao'))
);

-- ---------------------------------------------------------------- pessoas
CREATE TABLE IF NOT EXISTS panel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  name TEXT NOT NULL,
  pessoa_name TEXT,                            -- nome no pipeline (pessoa), se houver
  profile_id UUID,                             -- usuario do Supabase Auth, quando existir
  is_head BOOLEAN NOT NULL DEFAULT FALSE,      -- ve o time inteiro
  hue SMALLINT NOT NULL DEFAULT 210,           -- cor do avatar
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, name)
);

-- ---------------------------------------------------------------- papeis
-- dono  = opera o canal        (as atividades entram na rotina dele)
-- aux   = apoia o canal        (tambem ve as atividades)
-- super = acompanha o canal    (ganha o painel de time, nao a rotina)
CREATE TABLE IF NOT EXISTS panel_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES panel_members(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES panel_channels(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, channel_id, role),
  CONSTRAINT panel_roles_role_chk CHECK (role IN ('dono','aux','super'))
);

-- ---------------------------------------------------------------- atividades
CREATE TABLE IF NOT EXISTS panel_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  channel_id UUID NOT NULL REFERENCES panel_channels(id) ON DELETE CASCADE,
  freq TEXT NOT NULL,                          -- d = dia | s = semana | m = mes
  title TEXT NOT NULL,
  target TEXT,                                 -- alvo do item, ex.: '170/dia'
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT panel_tasks_freq_chk CHECK (freq IN ('d','s','m'))
);

-- ---------------------------------------------------------------- cotas
-- Cada conta de prospeccao tem uma cota diaria e alimenta um canal.
-- A soma das cotas e o volume diario do time.
CREATE TABLE IF NOT EXISTS panel_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES panel_members(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES panel_channels(id) ON DELETE CASCADE,
  account TEXT NOT NULL,                       -- ex.: 'Insta Acioli'
  per_day INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------- marcacoes
-- Uma linha por item concluido, por pessoa, por periodo.
-- period_key acompanha a frequencia: '2026-07-25' (dia), '2026-W30' (semana),
-- '2026-07' (mes) — e o que faz o check zerar sozinho na virada.
CREATE TABLE IF NOT EXISTS panel_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES panel_members(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,                  -- task | quota
  subject_id UUID NOT NULL,                    -- panel_tasks.id ou panel_quotas.id
  freq TEXT NOT NULL,
  period_key TEXT NOT NULL,
  done_qty INTEGER,                            -- quanto foi feito, quando aplicavel
  done_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  done_by UUID,                                -- auth.uid() de quem marcou
  UNIQUE (member_id, subject_type, subject_id, period_key),
  CONSTRAINT panel_checks_subject_chk CHECK (subject_type IN ('task','quota')),
  CONSTRAINT panel_checks_freq_chk CHECK (freq IN ('d','s','m'))
);

-- ---------------------------------------------------------------- indices
CREATE INDEX IF NOT EXISTS idx_panel_channels_loc  ON panel_channels(location_id);
CREATE INDEX IF NOT EXISTS idx_panel_members_loc   ON panel_members(location_id);
CREATE INDEX IF NOT EXISTS idx_panel_roles_loc     ON panel_roles(location_id);
CREATE INDEX IF NOT EXISTS idx_panel_roles_member  ON panel_roles(member_id);
CREATE INDEX IF NOT EXISTS idx_panel_roles_channel ON panel_roles(channel_id);
CREATE INDEX IF NOT EXISTS idx_panel_tasks_channel ON panel_tasks(channel_id, freq);
CREATE INDEX IF NOT EXISTS idx_panel_quotas_member ON panel_quotas(member_id);
CREATE INDEX IF NOT EXISTS idx_panel_quotas_chan   ON panel_quotas(channel_id);
-- consulta mais quente do painel: "o que fulano fez neste periodo"
CREATE INDEX IF NOT EXISTS idx_panel_checks_lookup ON panel_checks(member_id, period_key);
CREATE INDEX IF NOT EXISTS idx_panel_checks_loc    ON panel_checks(location_id, period_key);

-- ---------------------------------------------------------------- RLS
ALTER TABLE panel_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_roles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_quotas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_checks   ENABLE ROW LEVEL SECURITY;

-- Leitura liberada (mesmo padrao das tabelas de pipeline);
-- escrita apenas para quem esta logado no dash.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['panel_channels','panel_members','panel_roles',
                           'panel_tasks','panel_quotas','panel_checks']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s read"  ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s write" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s read"  ON %I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s write" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
