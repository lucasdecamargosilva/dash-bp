-- Cota por semana e por mes, nao so por dia.
--
-- A cota nasceu diaria: 'per_day' era a quantidade e o painel so mostrava
-- cota quando a frequencia selecionada era "dia". Mas nem todo canal funciona
-- assim — Social Selling Raiz e Cold Call nao tem numero diario, tem um minimo
-- na semana. Quem opera esses canais nunca via cota nenhuma.
--
-- Duas mudancas:
--   per_day -> qty   o nome mentia assim que a cota deixasse de ser diaria
--   + freq           'd' | 's' | 'm', igual ao das atividades
--
-- O default 'd' preserva o que existe: toda cota cadastrada ate hoje continua
-- diaria, com a mesma quantidade.

-- rename protegido: rodar duas vezes nao quebra
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'panel_quotas' AND column_name = 'per_day'
  ) THEN
    ALTER TABLE panel_quotas RENAME COLUMN per_day TO qty;
  END IF;
END $$;

ALTER TABLE panel_quotas
  ADD COLUMN IF NOT EXISTS freq text NOT NULL DEFAULT 'd';

ALTER TABLE panel_quotas
  DROP CONSTRAINT IF EXISTS panel_quotas_freq_check;

ALTER TABLE panel_quotas
  ADD CONSTRAINT panel_quotas_freq_check CHECK (freq IN ('d', 's', 'm'));

CREATE INDEX IF NOT EXISTS panel_quotas_channel_freq_idx
  ON panel_quotas (channel_id, freq);

NOTIFY pgrst, 'reload schema';
