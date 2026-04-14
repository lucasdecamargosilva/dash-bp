-- Criar tabela de prospecção para PR1ME ROI
CREATE TABLE public.pipeline_prospec_prime (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contato smallint DEFAULT 0,
  mensagem_enviada smallint DEFAULT 0,
  conexao smallint DEFAULT 0,
  whatsapp_obtido smallint DEFAULT 0,
  reuniao_agendada smallint DEFAULT 0,
  reuniao_realizada smallint DEFAULT 0,
  data_atualizacao date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  meta_mensagens_enviadas integer DEFAULT 0,
  meta_reunioes_agendadas integer DEFAULT 0,
  meta_reunioes_realizadas integer DEFAULT 0,
  data_inicio date,
  data_fim date
);

-- Criar tabela de vendas pipeline_prime_elevate
CREATE TABLE public.pipeline_prime_elevate (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  interessado integer DEFAULT 0,
  em_contato integer DEFAULT 0,
  qualificado integer DEFAULT 0,
  proposta_em_analise integer DEFAULT 0,
  fechado integer DEFAULT 0,
  perdido integer DEFAULT 0,
  faturamento numeric DEFAULT 0,
  data_atualizacao date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  meta_propostas_em_analise integer DEFAULT 0,
  meta_vendas integer DEFAULT 0,
  data_inicio date,
  data_fim date
);

-- Criar tabela de vendas pipeline_prime_ignite
CREATE TABLE public.pipeline_prime_ignite (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  interessado integer DEFAULT 0,
  em_contato integer DEFAULT 0,
  qualificado integer DEFAULT 0,
  proposta_em_analise integer DEFAULT 0,
  fechado integer DEFAULT 0,
  perdido integer DEFAULT 0,
  faturamento numeric DEFAULT 0,
  data_atualizacao date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  meta_propostas_em_analise integer DEFAULT 0,
  meta_vendas integer DEFAULT 0,
  data_inicio date,
  data_fim date
);

-- Criar tabela de vendas pipeline_prime_legacy
CREATE TABLE public.pipeline_prime_legacy (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  interessado integer DEFAULT 0,
  em_contato integer DEFAULT 0,
  qualificado integer DEFAULT 0,
  proposta_em_analise integer DEFAULT 0,
  fechado integer DEFAULT 0,
  perdido integer DEFAULT 0,
  faturamento numeric DEFAULT 0,
  data_atualizacao date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  meta_propostas_em_analise integer DEFAULT 0,
  meta_vendas integer DEFAULT 0,
  data_inicio date,
  data_fim date
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.pipeline_prospec_prime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_prime_elevate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_prime_ignite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_prime_legacy ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para acesso público
CREATE POLICY "Allow public select" ON public.pipeline_prospec_prime FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.pipeline_prospec_prime FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.pipeline_prospec_prime FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.pipeline_prospec_prime FOR DELETE USING (true);

CREATE POLICY "Allow public select" ON public.pipeline_prime_elevate FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.pipeline_prime_elevate FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.pipeline_prime_elevate FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.pipeline_prime_elevate FOR DELETE USING (true);

CREATE POLICY "Allow public select" ON public.pipeline_prime_ignite FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.pipeline_prime_ignite FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.pipeline_prime_ignite FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.pipeline_prime_ignite FOR DELETE USING (true);

CREATE POLICY "Allow public select" ON public.pipeline_prime_legacy FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.pipeline_prime_legacy FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.pipeline_prime_legacy FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.pipeline_prime_legacy FOR DELETE USING (true);

-- Criar triggers para copiar metas de prospecção
CREATE TRIGGER copy_prospecting_goals_prime
  BEFORE INSERT ON public.pipeline_prospec_prime
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_prospecting_goals();

-- Criar triggers para copiar metas de vendas
CREATE TRIGGER copy_sales_goals_prime_elevate
  BEFORE INSERT ON public.pipeline_prime_elevate
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_sales_goals();

CREATE TRIGGER copy_sales_goals_prime_ignite
  BEFORE INSERT ON public.pipeline_prime_ignite
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_sales_goals();

CREATE TRIGGER copy_sales_goals_prime_legacy
  BEFORE INSERT ON public.pipeline_prime_legacy
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_sales_goals();