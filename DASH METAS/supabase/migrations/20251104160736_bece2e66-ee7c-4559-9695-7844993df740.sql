-- Criar tabela de vendas para Elam Lima
CREATE TABLE public.pipeline_elam_yay (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  interessado INTEGER DEFAULT 0,
  em_contato INTEGER DEFAULT 0,
  qualificado INTEGER DEFAULT 0,
  proposta_em_analise INTEGER DEFAULT 0,
  fechado INTEGER DEFAULT 0,
  perdido INTEGER DEFAULT 0,
  faturamento NUMERIC DEFAULT 0,
  data_atualizacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta_propostas_em_analise INTEGER DEFAULT 0,
  meta_vendas INTEGER DEFAULT 0,
  data_inicio DATE,
  data_fim DATE
);

-- Habilitar RLS
ALTER TABLE public.pipeline_elam_yay ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (acesso público como outras tabelas)
CREATE POLICY "Allow public select" ON public.pipeline_elam_yay
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.pipeline_elam_yay
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_elam_yay
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON public.pipeline_elam_yay
  FOR DELETE USING (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_pipeline_elam_yay_updated_at
  BEFORE UPDATE ON public.pipeline_elam_yay
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar trigger para copiar metas automaticamente
CREATE TRIGGER copy_sales_goals_trigger
  BEFORE INSERT ON public.pipeline_elam_yay
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_sales_goals();