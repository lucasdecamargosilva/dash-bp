-- Criar tabela pipeline_prospec_minoru para métricas do pipeline de vendas
CREATE TABLE public.pipeline_prospec_minoru (
  id BIGSERIAL PRIMARY KEY,
  contato SMALLINT,
  mensagem_er SMALLINT,
  conexao SMALLINT,
  whatsapp_obt SMALLINT,
  reuniao_agend SMALLINT,
  reuniao_realiz SMALLINT,
  data_atualizacao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.pipeline_prospec_minoru ENABLE ROW LEVEL SECURITY;

-- Criar política para acesso público de leitura (para integração n8n)
CREATE POLICY "Permitir leitura pública de métricas" 
ON public.pipeline_prospec_minoru 
FOR SELECT 
USING (true);

-- Criar política para inserção pública (para integração n8n)
CREATE POLICY "Permitir inserção pública de métricas" 
ON public.pipeline_prospec_minoru 
FOR INSERT 
WITH CHECK (true);

-- Criar política para atualização pública (para integração n8n)
CREATE POLICY "Permitir atualização pública de métricas" 
ON public.pipeline_prospec_minoru 
FOR UPDATE 
USING (true);

-- Criar função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualização automática do timestamp
CREATE TRIGGER update_pipeline_prospec_minoru_updated_at
  BEFORE UPDATE ON public.pipeline_prospec_minoru
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_prospec_minoru;