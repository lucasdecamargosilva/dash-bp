-- Criar triggers para copiar metas automaticamente em todas as tabelas

-- Triggers para tabelas de PROSPECÇÃO
CREATE TRIGGER copy_goals_before_insert
  BEFORE INSERT ON pipeline_prospec_elyano
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER copy_goals_before_insert
  BEFORE INSERT ON pipeline_prospec_minoru
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER copy_goals_before_insert
  BEFORE INSERT ON pipeline_prospec_marcos_rossi
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER copy_goals_before_insert
  BEFORE INSERT ON pipeline_prospec_bp_results
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

-- Triggers para tabelas de VENDAS
CREATE TRIGGER copy_goals_before_insert
  BEFORE INSERT ON pipeline_elyano_high_profile
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();

CREATE TRIGGER copy_goals_before_insert
  BEFORE INSERT ON pipeline_elyano_higher
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();

CREATE TRIGGER copy_goals_before_insert
  BEFORE INSERT ON pipeline_elyano_high_one
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();