BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS acquisition_channel_metrics CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.acquisition_channel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,

  competencia text NOT NULL,

  competencia_date date GENERATED ALWAYS AS (
    to_date(competencia || '-01', 'YYYY-MM-DD')
  ) STORED,

  contatos int NOT NULL DEFAULT 0,
  leads int NOT NULL DEFAULT 0,
  reunioes int NOT NULL DEFAULT 0,
  propostas int NOT NULL DEFAULT 0,
  vendas int NOT NULL DEFAULT 0,
  faturamento numeric(12,2) NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ck_competencia_format 
    CHECK (competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

CREATE UNIQUE INDEX uniq_metrics_client_channel_comp
  ON public.acquisition_channel_metrics (client_id, channel_id, competencia);

CREATE INDEX idx_metrics_client_comp_date
  ON public.acquisition_channel_metrics (client_id, competencia_date);

CREATE INDEX idx_metrics_channel
  ON public.acquisition_channel_metrics (channel_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON public.acquisition_channel_metrics;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON public.acquisition_channel_metrics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

-- Canais iniciais
INSERT INTO public.channels(name) VALUES
 ('Instagram'),
 ('Orgânico'),
 ('Social Selling'),
 ('Tráfego Pago'),
 ('YouTube')
ON CONFLICT (name) DO NOTHING;

-- Clientes iniciais
INSERT INTO public.clients(name) VALUES
 ('Marcos Rossi'),
 ('Ana Silva'),
 ('João Santos')
ON CONFLICT (name) DO NOTHING;