-- Add monthly goal columns to pipeline_prospec_elyano
ALTER TABLE pipeline_prospec_elyano
ADD COLUMN meta_mensagens_enviadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_agendadas integer DEFAULT 0,
ADD COLUMN meta_reunioes_realizadas integer DEFAULT 0;