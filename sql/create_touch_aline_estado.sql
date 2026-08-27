-- Espelho do Touch-Aline: o que esta acontecendo no robo de prospeccao da maquina
-- Windows, publicado de la pelo publicar_estado.py (repositorio bp-prospector-windows)
-- e lido no celular pela pagina /prospeccao do dash.
--
-- Direcao unica: a maquina Windows ESCREVE, o dash so LE. Nada aqui comanda o robo.
--
-- Duas tabelas:
--   touch_aline_estado  -- uma linha por conta, sobrescrita a cada publicacao (o retrato agora)
--   touch_aline_dia     -- uma linha por conta/dia, para a serie dos ultimos dias

-- ---------------------------------------------------------------- retrato ao vivo
CREATE TABLE IF NOT EXISTS touch_aline_estado (
  conta         TEXT PRIMARY KEY,          -- 'Aline'
  host          TEXT,                      -- maquina que publicou, para pegar espelho de PC errado
  publicado_em  TIMESTAMPTZ,               -- quando o retrato foi tirado; o dash marca como velho
  dia           DATE,
  lista_do_dia  JSONB DEFAULT '{}'::jsonb, -- {arquivo, existe, total}
  rodadas       JSONB DEFAULT '[]'::jsonb, -- um item por lote: contagem, situacao, erros
  eventos       JSONB DEFAULT '[]'::jsonb, -- cauda de mudancas por lead (ate 80)
  funil         JSONB,                     -- contagem por Touch no GHL, quando publicada
  logs          JSONB DEFAULT '{}'::jsonb, -- fim dos logs de disparo, geracao e agente
  alertas       JSONB DEFAULT '[]'::jsonb, -- lista do dia faltando, rodada parada, erros
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------- serie diaria
CREATE TABLE IF NOT EXISTS touch_aline_dia (
  conta         TEXT NOT NULL,
  dia           DATE NOT NULL,
  enviados      INTEGER NOT NULL DEFAULT 0,
  erros         INTEGER NOT NULL DEFAULT 0,
  respostas     INTEGER NOT NULL DEFAULT 0,
  descartados   INTEGER NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conta, dia)
);

CREATE INDEX IF NOT EXISTS idx_touch_aline_dia ON touch_aline_dia(conta, dia DESC);

-- ---------------------------------------------------------------- RLS
ALTER TABLE touch_aline_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE touch_aline_dia    ENABLE ROW LEVEL SECURITY;

-- Leitura liberada, igual as tabelas ghl_pipeline_* que o dash ja consome.
DROP POLICY IF EXISTS "touch_aline_estado read" ON touch_aline_estado;
DROP POLICY IF EXISTS "touch_aline_dia read"    ON touch_aline_dia;
CREATE POLICY "touch_aline_estado read" ON touch_aline_estado FOR SELECT USING (true);
CREATE POLICY "touch_aline_dia read"    ON touch_aline_dia    FOR SELECT USING (true);

-- ESCRITA: quem publica e um script rodando sozinho no Windows, sem sessao de usuario.
--
-- Opcao A (recomendada) — o script usa a SERVICE ROLE KEY, que passa por cima da RLS.
-- Nao crie policy de escrita nenhuma: so o service role escreve, e a chave fica so na
-- maquina Windows (variavel BP_SUPABASE_KEY ou supabase_estado.json, fora do Git).
-- Esta e a opcao ativa por padrao: sem policy de INSERT/UPDATE, a anon key nao escreve.
--
-- Opcao B — o script usa a ANON KEY (a mesma que ja esta no bundle do dash, publica).
-- Descomente o bloco abaixo. Repare no custo: qualquer pessoa com a chave publica pode
-- sobrescrever o espelho. Como o espelho e so informativo e nao comanda o robo, o dano
-- se limita a mostrar numero errado no celular — mas e um caminho de escrita aberto.
--
-- DROP POLICY IF EXISTS "touch_aline_estado write" ON touch_aline_estado;
-- DROP POLICY IF EXISTS "touch_aline_dia write"    ON touch_aline_dia;
-- CREATE POLICY "touch_aline_estado write" ON touch_aline_estado FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "touch_aline_dia write"    ON touch_aline_dia    FOR ALL USING (true) WITH CHECK (true);
