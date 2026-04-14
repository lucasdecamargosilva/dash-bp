-- Adicionar colunas de metas nas tabelas de vendas do Elyano
ALTER TABLE pipeline_elyano_high_profile
ADD COLUMN meta_propostas_em_analise INTEGER DEFAULT 0,
ADD COLUMN meta_vendas INTEGER DEFAULT 0;

ALTER TABLE pipeline_elyano_higher
ADD COLUMN meta_propostas_em_analise INTEGER DEFAULT 0,
ADD COLUMN meta_vendas INTEGER DEFAULT 0;

ALTER TABLE pipeline_elyano_high_one
ADD COLUMN meta_propostas_em_analise INTEGER DEFAULT 0,
ADD COLUMN meta_vendas INTEGER DEFAULT 0;