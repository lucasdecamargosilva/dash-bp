-- Renomear colunas da tabela pipeline_prospec_minoru para nomes mais descritivos
ALTER TABLE public.pipeline_prospec_minoru 
RENAME COLUMN mensagem_er TO mensagem_enviada;

ALTER TABLE public.pipeline_prospec_minoru 
RENAME COLUMN whatsapp_obt TO whatsapp_obtido;

ALTER TABLE public.pipeline_prospec_minoru 
RENAME COLUMN reuniao_agend TO reuniao_agendada;

ALTER TABLE public.pipeline_prospec_minoru 
RENAME COLUMN reuniao_realiz TO reuniao_realizada;