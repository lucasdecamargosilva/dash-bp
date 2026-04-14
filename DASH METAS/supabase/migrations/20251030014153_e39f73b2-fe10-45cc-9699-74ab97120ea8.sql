-- Remover qualquer trigger existente (limpeza completa)
DROP TRIGGER IF EXISTS copy_goals_before_insert ON pipeline_prospec_elyano;
DROP TRIGGER IF EXISTS copy_goals_before_insert ON pipeline_prospec_minoru;
DROP TRIGGER IF EXISTS copy_goals_before_insert ON pipeline_prospec_marcos_rossi;
DROP TRIGGER IF EXISTS copy_goals_before_insert ON pipeline_prospec_bp_results;
DROP TRIGGER IF EXISTS copy_goals_before_insert ON pipeline_elyano_high_profile;
DROP TRIGGER IF EXISTS copy_goals_before_insert ON pipeline_elyano_higher;
DROP TRIGGER IF EXISTS copy_goals_before_insert ON pipeline_elyano_high_one;

-- Criar triggers com nomes ÚNICOS para tabelas de PROSPECÇÃO
CREATE TRIGGER trg_copy_prospec_goals_elyano
  BEFORE INSERT ON pipeline_prospec_elyano
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER trg_copy_prospec_goals_minoru
  BEFORE INSERT ON pipeline_prospec_minoru
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER trg_copy_prospec_goals_marcos_rossi
  BEFORE INSERT ON pipeline_prospec_marcos_rossi
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

CREATE TRIGGER trg_copy_prospec_goals_bp_results
  BEFORE INSERT ON pipeline_prospec_bp_results
  FOR EACH ROW
  EXECUTE FUNCTION copy_prospecting_goals();

-- Criar triggers com nomes ÚNICOS para tabelas de VENDAS
CREATE TRIGGER trg_copy_sales_goals_high_profile
  BEFORE INSERT ON pipeline_elyano_high_profile
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();

CREATE TRIGGER trg_copy_sales_goals_higher
  BEFORE INSERT ON pipeline_elyano_higher
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();

CREATE TRIGGER trg_copy_sales_goals_high_one
  BEFORE INSERT ON pipeline_elyano_high_one
  FOR EACH ROW
  EXECUTE FUNCTION copy_sales_goals();