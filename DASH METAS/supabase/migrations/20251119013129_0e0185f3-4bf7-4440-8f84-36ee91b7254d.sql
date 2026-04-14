-- Create pipeline_elam_inbound table
CREATE TABLE public.pipeline_elam_inbound (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contato SMALLINT DEFAULT NULL,
  mensagem_enviada SMALLINT DEFAULT NULL,
  conexao SMALLINT DEFAULT NULL,
  whatsapp_obtido SMALLINT DEFAULT NULL,
  reuniao_agendada SMALLINT DEFAULT NULL,
  reuniao_realizada SMALLINT DEFAULT NULL,
  data_atualizacao DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta_mensagens_enviadas INTEGER DEFAULT 0,
  meta_reunioes_agendadas INTEGER DEFAULT 0,
  meta_reunioes_realizadas INTEGER DEFAULT 0,
  data_inicio DATE DEFAULT NULL,
  data_fim DATE DEFAULT NULL
);

-- Create pipeline_elam_outbound table
CREATE TABLE public.pipeline_elam_outbound (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contato SMALLINT DEFAULT NULL,
  mensagem_enviada SMALLINT DEFAULT NULL,
  conexao SMALLINT DEFAULT NULL,
  whatsapp_obtido SMALLINT DEFAULT NULL,
  reuniao_agendada SMALLINT DEFAULT NULL,
  reuniao_realizada SMALLINT DEFAULT NULL,
  data_atualizacao DATE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  meta_mensagens_enviadas INTEGER DEFAULT 0,
  meta_reunioes_agendadas INTEGER DEFAULT 0,
  meta_reunioes_realizadas INTEGER DEFAULT 0,
  data_inicio DATE DEFAULT NULL,
  data_fim DATE DEFAULT NULL
);

-- Enable RLS for both tables
ALTER TABLE public.pipeline_elam_inbound ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_elam_outbound ENABLE ROW LEVEL SECURITY;

-- Create public access policies for pipeline_elam_inbound (for n8n integration)
CREATE POLICY "Allow public select" ON public.pipeline_elam_inbound
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.pipeline_elam_inbound
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_elam_inbound
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON public.pipeline_elam_inbound
  FOR DELETE USING (true);

-- Create public access policies for pipeline_elam_outbound (for n8n integration)
CREATE POLICY "Allow public select" ON public.pipeline_elam_outbound
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.pipeline_elam_outbound
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.pipeline_elam_outbound
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON public.pipeline_elam_outbound
  FOR DELETE USING (true);

-- Add triggers to copy prospecting goals from previous records (inbound)
CREATE TRIGGER copy_prospecting_goals_inbound
  BEFORE INSERT ON public.pipeline_elam_inbound
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_prospecting_goals();

-- Add triggers to copy prospecting goals from previous records (outbound)
CREATE TRIGGER copy_prospecting_goals_outbound
  BEFORE INSERT ON public.pipeline_elam_outbound
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_prospecting_goals();

-- Add update timestamp triggers
CREATE TRIGGER update_pipeline_elam_inbound_updated_at
  BEFORE UPDATE ON public.pipeline_elam_inbound
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_elam_outbound_updated_at
  BEFORE UPDATE ON public.pipeline_elam_outbound
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();