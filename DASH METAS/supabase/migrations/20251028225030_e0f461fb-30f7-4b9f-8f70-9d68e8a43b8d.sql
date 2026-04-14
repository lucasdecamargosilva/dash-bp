-- Add meta columns to pipeline_prospec_minoru table
ALTER TABLE public.pipeline_prospec_minoru
ADD COLUMN meta_mensagens_enviadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_agendadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_realizadas integer DEFAULT 0;

-- Add meta columns to pipeline_prospec_marcos_rossi table
ALTER TABLE public.pipeline_prospec_marcos_rossi
ADD COLUMN meta_mensagens_enviadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_agendadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_realizadas integer DEFAULT 0;

-- Add meta columns to pipeline_prospec_bp_results table
ALTER TABLE public.pipeline_prospec_bp_results
ADD COLUMN meta_mensagens_enviadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_agendadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_realizadas integer DEFAULT 0;