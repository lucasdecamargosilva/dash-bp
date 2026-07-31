-- Atividades de head, separadas das atividades de operacao.
--
-- Ate aqui uma atividade pertencia ao canal e pronto: quem operava o canal
-- (dono/aux) via a lista, e quem apenas acompanhava (super) nao via nada na
-- propria rotina — so o progresso do time. Na pratica o head tambem tem
-- rotina: revisar cadencia, ouvir ligacao, cobrar CRM.
--
-- 'audience' diz para quem a atividade e:
--   operacao -> aparece para dono e aux do canal   (comportamento antigo)
--   head     -> aparece para quem supervisiona o canal
--
-- O default preserva o que ja existe: toda atividade cadastrada ate hoje
-- continua sendo da operacao.

ALTER TABLE panel_tasks
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'operacao';

ALTER TABLE panel_tasks
  DROP CONSTRAINT IF EXISTS panel_tasks_audience_check;

ALTER TABLE panel_tasks
  ADD CONSTRAINT panel_tasks_audience_check
  CHECK (audience IN ('operacao', 'head'));

-- a rotina e lida sempre por canal + frequencia; audience entra junto
CREATE INDEX IF NOT EXISTS panel_tasks_channel_freq_audience_idx
  ON panel_tasks (channel_id, freq, audience);
