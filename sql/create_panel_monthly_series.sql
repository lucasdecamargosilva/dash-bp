-- Serie mensal do funil, agregada no banco.
--
-- O grafico "Faturamento Mensal" lia ghl_pipeline_summary com
-- view_type='total' e month<>'all', SEM filtrar location_id. As unicas linhas
-- que casam com isso pertencem a outro tenant — entao o dashboard do PR1ME
-- vinha mostrando o faturamento de outro cliente. E o PR1ME so tem linhas
-- month='all' naquela tabela, ou seja, nunca teria serie mensal propria.
--
-- Aqui a serie sai das oportunidades, mesma fonte do funil e dos KPIs, ja
-- escopada por location_id. A agregacao fica no Postgres porque sao ~20 mil
-- linhas no periodo: trazer tudo para somar no navegador seria desperdicio.
CREATE OR REPLACE FUNCTION panel_monthly_series(loc TEXT, meses INT DEFAULT 6)
RETURNS TABLE (
  mes TEXT, canal TEXT, contatos BIGINT, reunioes BIGINT,
  propostas BIGINT, vendas BIGINT, faturamento NUMERIC
)
LANGUAGE sql STABLE AS $fn$
  SELECT to_char(o.last_stage_change_at, 'YYYY-MM') AS mes,
         COALESCE(c.name, NULLIF(o.source, ''), 'Sem canal') AS canal,
         -- a etapa 'Contato' e fila de espera; contato trabalhado comeca em
         -- Msg Enviada. Mesmo criterio do resto do dash.
         count(*) FILTER (WHERE o.stage <> 'Contato'),
         -- funil acumulado: quem chegou em Venda passou por reuniao e proposta
         -- antes. Mesmo criterio do dash Comercial (ghl-supabase.ts).
         count(*) FILTER (WHERE o.stage IN ('Reuniao Realizada', 'Proposta em Analise', 'Venda Fechada')),
         count(*) FILTER (WHERE o.stage IN ('Proposta em Analise', 'Venda Fechada')),
         count(*) FILTER (WHERE o.stage = 'Venda Fechada'),
         COALESCE(sum(o.monetary_value) FILTER (WHERE o.stage = 'Venda Fechada'), 0)
  FROM ghl_pipeline_opportunities o
  LEFT JOIN panel_source_map sm
         ON sm.location_id = o.location_id AND sm.pipeline_source = o.source
  LEFT JOIN panel_channels c ON c.id = sm.channel_id
  WHERE o.location_id = loc
    AND o.last_stage_change_at >= date_trunc('month', now()) - (meses || ' months')::interval
  GROUP BY 1, 2
  ORDER BY 1, 3 DESC;
$fn$;

GRANT EXECUTE ON FUNCTION panel_monthly_series(TEXT, INT) TO anon, authenticated;
