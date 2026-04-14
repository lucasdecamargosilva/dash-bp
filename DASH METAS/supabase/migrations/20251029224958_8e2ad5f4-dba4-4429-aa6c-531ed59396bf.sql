-- Adicionar colunas data_inicio e data_fim nas tabelas de prospecção para suportar visão semanal
ALTER TABLE pipeline_prospec_elyano 
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date;

ALTER TABLE pipeline_prospec_minoru
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date;

ALTER TABLE pipeline_prospec_marcos_rossi
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date;

ALTER TABLE pipeline_prospec_bp_results
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date;