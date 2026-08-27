-- Fila de comandos do Touch-Aline: o controle remoto da maquina Windows.
--
-- A maquina nao tem porta aberta pra internet, entao quem alcanca quem se inverte:
-- o agente_remoto.py (repositorio bp-prospector-windows) fica PERGUNTANDO por comando
-- aqui a cada poucos segundos, executa, e devolve a saida na mesma linha.
--
--   quem manda  --INSERT-->  touch_aline_comandos  <--SELECT--  agente no Windows
--               <--SELECT--                        --UPDATE-->  (saida, status)
--
-- O que pode ser executado NAO esta aqui: o catalogo e uma constante do agente_remoto.py,
-- que so aceita subcomandos do touch_aline.py com parametros validados. Uma linha nesta
-- tabela e um PEDIDO, nunca uma linha de shell — quem decide o que roda e a maquina.

CREATE TABLE IF NOT EXISTS touch_aline_comandos (
  id           BIGSERIAL PRIMARY KEY,
  conta        TEXT NOT NULL DEFAULT 'Aline',
  host         TEXT,                       -- maquina alvo; NULL = qualquer agente da conta
  comando      TEXT NOT NULL,              -- chave do catalogo, ex.: 'disparar', 'status'
  parametros   JSONB NOT NULL DEFAULT '{}'::jsonb,
  envia_dm     BOOLEAN NOT NULL DEFAULT FALSE,  -- declarado por quem pede; o agente reconfere
  pedido_por   TEXT,                       -- de onde veio, ex.: 'conversa-claude'
  status       TEXT NOT NULL DEFAULT 'pendente',
  -- pendente  -> esperando o agente pegar
  -- rodando   -> agente executando; saida vai sendo atualizada durante a execucao
  -- concluido -> terminou com codigo 0
  -- erro      -> terminou com codigo != 0, estourou o tempo, ou o agente caiu
  -- recusado  -> o agente nao aceitou (fora do catalogo, parametro invalido, envio bloqueado)
  -- cancelar  -> pedido de parada; o agente mata o processo e passa pra cancelado
  -- cancelado -> parada confirmada pelo agente
  saida        TEXT NOT NULL DEFAULT '',   -- cauda do stdout+stderr, atualizada durante a execucao
  codigo       INTEGER,                    -- exit code do processo
  motivo       TEXT,                       -- por que foi recusado, quando for o caso
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pego_em      TIMESTAMPTZ,
  terminado_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT touch_aline_comandos_status_chk CHECK (status IN
    ('pendente','rodando','concluido','erro','recusado','cancelar','cancelado'))
);

-- consulta mais quente: "o que esta pendente pra mim, mais antigo primeiro"
CREATE INDEX IF NOT EXISTS idx_touch_cmd_fila
  ON touch_aline_comandos(conta, status, criado_em);
CREATE INDEX IF NOT EXISTS idx_touch_cmd_recentes
  ON touch_aline_comandos(conta, criado_em DESC);

ALTER TABLE touch_aline_comandos ENABLE ROW LEVEL SECURITY;

-- Leitura liberada, como nas outras tabelas que o dash consome.
DROP POLICY IF EXISTS "touch_aline_comandos read" ON touch_aline_comandos;
CREATE POLICY "touch_aline_comandos read" ON touch_aline_comandos FOR SELECT USING (true);

-- ESCRITA: quem enfileira e quem executa usam a SERVICE ROLE KEY, que passa por cima da
-- RLS. Nenhuma policy de INSERT/UPDATE aqui, de proposito — com a anon key (que e publica,
-- vai no bundle do dash) qualquer pessoa poderia enfileirar um disparo de DM na sua conta
-- de Instagram. Diferente do espelho, onde o pior caso era numero errado na tela.
--
-- Se algum dia o dash precisar enfileirar comando pela interface, a escrita deve passar
-- por 'TO authenticated' e o agente exigir --permitir-envio, nunca por policy aberta.
