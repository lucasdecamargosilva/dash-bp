-- Tabela de configuração multi-tenant
-- Cada usuario/empresa tem sua config de GHL

CREATE TABLE IF NOT EXISTS tenant_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  ghl_location_id TEXT NOT NULL,
  ghl_pipeline_id TEXT NOT NULL,
  ghl_token TEXT NOT NULL,
  pessoa_field_id TEXT DEFAULT '',
  stage_map JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_config_user ON tenant_config(user_id);

-- Enable RLS
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;

-- Users can only read their own config
CREATE POLICY "Users read own tenant config" ON tenant_config
  FOR SELECT USING (auth.uid() = user_id);

-- Admin can do everything (using service role or specific admin check)
CREATE POLICY "Allow all tenant_config" ON tenant_config
  FOR ALL USING (true);
