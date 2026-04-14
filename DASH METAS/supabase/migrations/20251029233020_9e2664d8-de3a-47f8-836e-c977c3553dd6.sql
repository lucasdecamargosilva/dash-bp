-- Remover triggers existentes
DROP TRIGGER IF EXISTS copy_goals_on_insert_elyano ON pipeline_prospec_elyano;
DROP TRIGGER IF EXISTS copy_goals_on_insert_minoru ON pipeline_prospec_minoru;
DROP TRIGGER IF EXISTS copy_goals_on_insert_marcos_rossi ON pipeline_prospec_marcos_rossi;
DROP TRIGGER IF EXISTS copy_goals_on_insert_bp_results ON pipeline_prospec_bp_results;
DROP TRIGGER IF EXISTS copy_goals_on_insert_high_profile ON pipeline_elyano_high_profile;
DROP TRIGGER IF EXISTS copy_goals_on_insert_higher ON pipeline_elyano_higher;
DROP TRIGGER IF EXISTS copy_goals_on_insert_high_one ON pipeline_elyano_high_one;

-- Remover funções existentes
DROP FUNCTION IF EXISTS copy_prospecting_goals();
DROP FUNCTION IF EXISTS copy_sales_goals();

-- Função para copiar metas das tabelas de prospecção
CREATE OR REPLACE FUNCTION copy_prospecting_goals()
RETURNS TRIGGER AS $$
DECLARE
  v_last_record RECORD;
BEGIN
  -- Verificar se é registro mensal ou semanal
  IF NEW.data_inicio IS NULL AND NEW.data_fim IS NULL THEN
    -- Buscar último registro MENSAL (sem data_inicio/data_fim)
    EXECUTE format(
      'SELECT meta_mensagens_enviadas, meta_reunioes_agendadas, meta_reunioes_realizadas
       FROM %I
       WHERE data_inicio IS NULL AND data_fim IS NULL AND id != $1
       ORDER BY created_at DESC
       LIMIT 1',
      TG_TABLE_NAME
    ) INTO v_last_record USING NEW.id;
  ELSE
    -- Buscar último registro SEMANAL (com data_inicio/data_fim)
    EXECUTE format(
      'SELECT meta_mensagens_enviadas, meta_reunioes_agendadas, meta_reunioes_realizadas
       FROM %I
       WHERE data_inicio IS NOT NULL AND data_fim IS NOT NULL AND id != $1
       ORDER BY created_at DESC
       LIMIT 1',
      TG_TABLE_NAME
    ) INTO v_last_record USING NEW.id;
  END IF;
  
  -- Se encontrou registro anterior, copiar as metas
  IF FOUND THEN
    NEW.meta_mensagens_enviadas := COALESCE(v_last_record.meta_mensagens_enviadas, 0);
    NEW.meta_reunioes_agendadas := COALESCE(v_last_record.meta_reunioes_agendadas, 0);
    NEW.meta_reunioes_realizadas := COALESCE(v_last_record.meta_reunioes_realizadas, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para copiar metas das tabelas de vendas
CREATE OR REPLACE FUNCTION copy_sales_goals()
RETURNS TRIGGER AS $$
DECLARE
  v_last_record RECORD;
BEGIN
  -- Verificar se é registro mensal ou semanal
  IF NEW.data_inicio IS NULL AND NEW.data_fim IS NULL THEN
    -- Buscar último registro MENSAL
    EXECUTE format(
      'SELECT meta_propostas_em_analise, meta_vendas
       FROM %I
       WHERE data_inicio IS NULL AND data_fim IS NULL AND id != $1
       ORDER BY created_at DESC
       LIMIT 1',
      TG_TABLE_NAME
    ) INTO v_last_record USING NEW.id;
  ELSE
    -- Buscar último registro SEMANAL
    EXECUTE format(
      'SELECT meta_propostas_em_analise, meta_vendas
       FROM %I
       WHERE data_inicio IS NOT NULL AND data_fim IS NOT NULL AND id != $1
       ORDER BY created_at DESC
       LIMIT 1',
      TG_TABLE_NAME
    ) INTO v_last_record USING NEW.id;
  END IF;
  
  -- Se encontrou registro anterior, copiar as metas
  IF FOUND THEN
    NEW.meta_propostas_em_analise := COALESCE(v_last_record.meta_propostas_em_analise, 0);
    NEW.meta_vendas := COALESCE(v_last_record.meta_vendas, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tabelas de prospecção
CREATE TRIGGER copy_goals_on_insert_elyano
  BEFORE INSERT ON pipeline_prospec_elyano
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER copy_goals_on_insert_minoru
  BEFORE INSERT ON pipeline_prospec_minoru
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER copy_goals_on_insert_marcos_rossi
  BEFORE INSERT ON pipeline_prospec_marcos_rossi
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER copy_goals_on_insert_bp_results
  BEFORE INSERT ON pipeline_prospec_bp_results
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

-- Triggers para tabelas de vendas
CREATE TRIGGER copy_goals_on_insert_high_profile
  BEFORE INSERT ON pipeline_elyano_high_profile
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();

CREATE TRIGGER copy_goals_on_insert_higher
  BEFORE INSERT ON pipeline_elyano_higher
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();

CREATE TRIGGER copy_goals_on_insert_high_one
  BEFORE INSERT ON pipeline_elyano_high_one
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();