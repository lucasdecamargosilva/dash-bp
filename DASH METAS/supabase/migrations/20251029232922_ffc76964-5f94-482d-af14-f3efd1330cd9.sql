-- Atualizar função de prospecção com search_path seguro
CREATE OR REPLACE FUNCTION copy_prospecting_goals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;

-- Atualizar função de vendas com search_path seguro
CREATE OR REPLACE FUNCTION copy_sales_goals()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;