-- Add data_inicio and data_fim columns to pipeline_elyano_high_profile
ALTER TABLE pipeline_elyano_high_profile
ADD COLUMN data_inicio date,
ADD COLUMN data_fim date;

-- Add data_inicio and data_fim columns to pipeline_elyano_higher
ALTER TABLE pipeline_elyano_higher
ADD COLUMN data_inicio date,
ADD COLUMN data_fim date;

-- Add data_inicio and data_fim columns to pipeline_elyano_high_one
ALTER TABLE pipeline_elyano_high_one
ADD COLUMN data_inicio date,
ADD COLUMN data_fim date;