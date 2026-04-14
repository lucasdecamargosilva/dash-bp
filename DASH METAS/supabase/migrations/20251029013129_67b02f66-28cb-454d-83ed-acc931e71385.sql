-- Create pipeline_elyano_high_one table
CREATE TABLE public.pipeline_elyano_high_one (
  id BIGSERIAL PRIMARY KEY,
  interessado INTEGER DEFAULT 0,
  em_contato INTEGER DEFAULT 0,
  qualificado INTEGER DEFAULT 0,
  proposta_em_analise INTEGER DEFAULT 0,
  fechado INTEGER DEFAULT 0,
  perdido INTEGER DEFAULT 0,
  faturamento NUMERIC(12, 2) DEFAULT 0,
  data_atualizacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pipeline_elyano_high_one
ALTER TABLE public.pipeline_elyano_high_one ENABLE ROW LEVEL SECURITY;

-- Create policies for pipeline_elyano_high_one
CREATE POLICY "Allow public select" ON public.pipeline_elyano_high_one
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.pipeline_elyano_high_one
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_elyano_high_one
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON public.pipeline_elyano_high_one
  FOR DELETE USING (true);

-- Create pipeline_elyano_high_profile table
CREATE TABLE public.pipeline_elyano_high_profile (
  id BIGSERIAL PRIMARY KEY,
  interessado INTEGER DEFAULT 0,
  em_contato INTEGER DEFAULT 0,
  qualificado INTEGER DEFAULT 0,
  proposta_em_analise INTEGER DEFAULT 0,
  fechado INTEGER DEFAULT 0,
  perdido INTEGER DEFAULT 0,
  faturamento NUMERIC(12, 2) DEFAULT 0,
  data_atualizacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pipeline_elyano_high_profile
ALTER TABLE public.pipeline_elyano_high_profile ENABLE ROW LEVEL SECURITY;

-- Create policies for pipeline_elyano_high_profile
CREATE POLICY "Allow public select" ON public.pipeline_elyano_high_profile
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.pipeline_elyano_high_profile
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_elyano_high_profile
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON public.pipeline_elyano_high_profile
  FOR DELETE USING (true);

-- Create pipeline_elyano_higher table
CREATE TABLE public.pipeline_elyano_higher (
  id BIGSERIAL PRIMARY KEY,
  interessado INTEGER DEFAULT 0,
  em_contato INTEGER DEFAULT 0,
  qualificado INTEGER DEFAULT 0,
  proposta_em_analise INTEGER DEFAULT 0,
  fechado INTEGER DEFAULT 0,
  perdido INTEGER DEFAULT 0,
  faturamento NUMERIC(12, 2) DEFAULT 0,
  data_atualizacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pipeline_elyano_higher
ALTER TABLE public.pipeline_elyano_higher ENABLE ROW LEVEL SECURITY;

-- Create policies for pipeline_elyano_higher
CREATE POLICY "Allow public select" ON public.pipeline_elyano_higher
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.pipeline_elyano_higher
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_elyano_higher
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON public.pipeline_elyano_higher
  FOR DELETE USING (true);