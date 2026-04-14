-- Tabela de cache do pipeline GHL
-- Armazena cada oportunidade do GHL para consulta rapida no frontend

CREATE TABLE IF NOT EXISTS ghl_pipeline_opportunities (
  id TEXT PRIMARY KEY,                    -- GHL opportunity ID
  name TEXT,                              -- Contact name
  source TEXT,                            -- Canal (Outbound, Network, etc)
  stage TEXT NOT NULL,                    -- Stage name (Contato, Msg Enviada, etc)
  stage_id TEXT,                          -- GHL stage ID
  pessoa TEXT,                            -- Custom field Pessoa
  monetary_value NUMERIC DEFAULT 0,       -- Value in BRL (already /100)
  created_at TIMESTAMPTZ,                 -- GHL createdAt
  last_stage_change_at TIMESTAMPTZ,       -- When moved to current stage
  status TEXT,                            -- won, open, lost, etc
  synced_at TIMESTAMPTZ DEFAULT NOW()     -- When this record was last synced
);

-- Index for fast stage queries
CREATE INDEX IF NOT EXISTS idx_ghl_pipeline_stage ON ghl_pipeline_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_ghl_pipeline_source ON ghl_pipeline_opportunities(source);
CREATE INDEX IF NOT EXISTS idx_ghl_pipeline_pessoa ON ghl_pipeline_opportunities(pessoa);
CREATE INDEX IF NOT EXISTS idx_ghl_pipeline_last_stage ON ghl_pipeline_opportunities(last_stage_change_at);

-- Tabela de totais pre-calculados por mes/canal/pessoa
CREATE TABLE IF NOT EXISTS ghl_pipeline_summary (
  id SERIAL PRIMARY KEY,
  month TEXT,                             -- YYYY-MM or 'all'
  view_type TEXT NOT NULL,                -- 'canal', 'pessoa', 'combo', 'total'
  canal TEXT DEFAULT '',
  pessoa TEXT DEFAULT '',
  contato INTEGER DEFAULT 0,
  msg_enviada INTEGER DEFAULT 0,
  conexao INTEGER DEFAULT 0,
  whatsapp_obtido INTEGER DEFAULT 0,
  reuniao_agendada INTEGER DEFAULT 0,
  reuniao_realizada INTEGER DEFAULT 0,
  proposta_em_analise INTEGER DEFAULT 0,
  venda_fechada INTEGER DEFAULT 0,
  faturamento NUMERIC DEFAULT 0,
  total INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, view_type, canal, pessoa)
);

CREATE INDEX IF NOT EXISTS idx_ghl_summary_month ON ghl_pipeline_summary(month);
CREATE INDEX IF NOT EXISTS idx_ghl_summary_view ON ghl_pipeline_summary(view_type);

-- Enable RLS
ALTER TABLE ghl_pipeline_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_pipeline_summary ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated and anon
CREATE POLICY "Allow read ghl_pipeline_opportunities" ON ghl_pipeline_opportunities FOR SELECT USING (true);
CREATE POLICY "Allow all ghl_pipeline_opportunities" ON ghl_pipeline_opportunities FOR ALL USING (true);
CREATE POLICY "Allow read ghl_pipeline_summary" ON ghl_pipeline_summary FOR SELECT USING (true);
CREATE POLICY "Allow all ghl_pipeline_summary" ON ghl_pipeline_summary FOR ALL USING (true);
