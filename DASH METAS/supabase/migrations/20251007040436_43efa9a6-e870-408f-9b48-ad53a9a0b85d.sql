-- Drop a tabela existente
DROP TABLE IF EXISTS public.pipeline_prospec_bp_results CASCADE;

-- Criar nova tabela pipeline_prospec_bp_results
CREATE TABLE public.pipeline_prospec_bp_results (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  interessado INTEGER,
  qualificado INTEGER,
  reuniao_agendada INTEGER,
  reuniao_realizada INTEGER,
  proposta_em_analise INTEGER,
  fup_medio_prazo INTEGER,
  fechado INTEGER,
  perdido INTEGER,
  cancelado INTEGER,
  data_atualizacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pipeline_prospec_bp_results ENABLE ROW LEVEL SECURITY;

-- Políticas RLS públicas
CREATE POLICY "Permitir leitura pública de métricas" 
ON public.pipeline_prospec_bp_results 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública de métricas" 
ON public.pipeline_prospec_bp_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de métricas" 
ON public.pipeline_prospec_bp_results 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão pública de métricas" 
ON public.pipeline_prospec_bp_results 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pipeline_prospec_bp_results_updated_at
BEFORE UPDATE ON public.pipeline_prospec_bp_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();