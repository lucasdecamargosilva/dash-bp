import { supabase } from "@/integrations/supabase/client";
import { type ChannelMetrics, type GHLSummary, type VendaFechada, type GHLConfig, DEFAULT_GHL_CONFIG } from "./ghl";

interface DateRange {
  from?: Date;
  to?: Date;
}

function emptyMetrics(canal: string, pessoa: string): ChannelMetrics {
  return {
    canal, pessoa,
    contato: 0, msgEnviada: 0, conexao: 0, whatsappObtido: 0,
    reuniaoAgendada: 0, reuniaoRealizada: 0, propostaEmAnalise: 0,
    vendaFechada: 0, faturamento: 0, total: 0,
  };
}

const STAGE_KEY: Record<string, keyof ChannelMetrics> = {
  "Contato": "contato",
  "Msg Enviada": "msgEnviada",
  "Conexao": "conexao",
  "WhatsApp Obtido": "whatsappObtido",
  "Reuniao Agendada": "reuniaoAgendada",
  "Reuniao Realizada": "reuniaoRealizada",
  "Proposta em Analise": "propostaEmAnalise",
  "Venda Fechada": "vendaFechada",
};

function addToMetrics(m: ChannelMetrics, stage: string, monetaryValue: number) {
  m.total++;
  if (stage === "Venda Fechada") m.faturamento += monetaryValue;
  const key = STAGE_KEY[stage];
  if (key && typeof m[key] === "number") {
    (m as any)[key]++;
  }
}

/**
 * Read pipeline data from Supabase cache.
 * Supports multi-tenant via tenantId filter on ghl_pipeline_opportunities.
 */
export async function getGHLPipelineFromCache(dateRange?: DateRange, _config?: GHLConfig): Promise<GHLSummary> {
  try {
    // If no date range, use pre-computed summary for "all"
    if (!dateRange?.from) {
      const { data: rows, error } = await (supabase as any)
        .from("ghl_pipeline_summary")
        .select("*")
        .eq("month", "all");

      if (error || !rows || rows.length === 0) {
        return fallbackEmpty();
      }

      // Also fetch individual vendas
      const { data: vendasRows } = await (supabase as any)
        .from("ghl_pipeline_opportunities")
        .select("name,monetary_value,source,pessoa,last_stage_change_at,created_at")
        .eq("stage", "Venda Fechada")
        .order("monetary_value", { ascending: false });

      const vendas: VendaFechada[] = (vendasRows || []).map((o: any) => ({
        name: o.name || "",
        monetaryValue: parseFloat(o.monetary_value) || 0,
        source: o.source || "",
        pessoa: o.pessoa || "",
        date: o.last_stage_change_at || o.created_at || "",
      }));

      const result = parseSummaryRows(rows);
      return { ...result, vendas };
    }

    // With date range: query individual opportunities and aggregate
    // Use Brazil timezone (UTC-3) to match GHL filter behavior
    // "1 abril 00:00 BR" = "1 abril 03:00 UTC"
    const fromBR = new Date(dateRange.from);
    fromBR.setHours(0, 0, 0, 0);
    // Convert from local (BR) to UTC by adding 3 hours
    const fromUTC = new Date(fromBR.getTime() + 3 * 60 * 60 * 1000);

    let query = (supabase as any)
      .from("ghl_pipeline_opportunities")
      .select("*")
      .gte("last_stage_change_at", fromUTC.toISOString());

    if (dateRange.to) {
      const toBR = new Date(dateRange.to);
      toBR.setHours(23, 59, 59, 999);
      // "16 abril 23:59 BR" = "17 abril 02:59 UTC"
      const toUTC = new Date(toBR.getTime() + 3 * 60 * 60 * 1000);
      query = query.lte("last_stage_change_at", toUTC.toISOString());
    }

    const { data: opps, error } = await query;

    if (error || !opps || opps.length === 0) {
      return fallbackEmpty();
    }

    // Aggregate
    const canalMap = new Map<string, ChannelMetrics>();
    const pessoaMap = new Map<string, ChannelMetrics>();
    const comboMap = new Map<string, ChannelMetrics>();
    const totals = emptyMetrics("Total", "Total");

    for (const opp of opps) {
      const canal = opp.source || "Sem canal";
      const pessoa = opp.pessoa || "Sem pessoa";
      const combo = `${canal} | ${pessoa}`;
      const value = parseFloat(opp.monetary_value) || 0;

      if (!canalMap.has(canal)) canalMap.set(canal, emptyMetrics(canal, ""));
      addToMetrics(canalMap.get(canal)!, opp.stage, value);

      if (!pessoaMap.has(pessoa)) pessoaMap.set(pessoa, emptyMetrics("", pessoa));
      addToMetrics(pessoaMap.get(pessoa)!, opp.stage, value);

      if (!comboMap.has(combo)) comboMap.set(combo, emptyMetrics(canal, pessoa));
      addToMetrics(comboMap.get(combo)!, opp.stage, value);

      addToMetrics(totals, opp.stage, value);
    }

    // Extract individual vendas
    const vendas: VendaFechada[] = opps
      .filter((o: any) => o.stage === "Venda Fechada")
      .map((o: any) => ({
        name: o.name || "",
        monetaryValue: parseFloat(o.monetary_value) || 0,
        source: o.source || "",
        pessoa: o.pessoa || "",
        date: o.last_stage_change_at || o.created_at || "",
      }))
      .sort((a: VendaFechada, b: VendaFechada) => b.monetaryValue - a.monetaryValue);

    return {
      byCanal: Array.from(canalMap.values()).sort((a, b) => b.total - a.total),
      byPessoa: Array.from(pessoaMap.values()).sort((a, b) => b.total - a.total),
      byCanalPessoa: Array.from(comboMap.values()).sort((a, b) => b.total - a.total),
      totals,
      totalOpportunities: opps.length,
      vendas,
    };
  } catch (err) {
    console.error("[GHL Cache] Error:", err);
    return fallbackEmpty();
  }
}

function parseSummaryRows(rows: any[]): GHLSummary {
  const byCanal: ChannelMetrics[] = [];
  const byPessoa: ChannelMetrics[] = [];
  const byCanalPessoa: ChannelMetrics[] = [];
  let totals = emptyMetrics("Total", "Total");

  for (const row of rows) {
    const metrics: ChannelMetrics = {
      canal: row.canal || "",
      pessoa: row.pessoa || "",
      contato: row.contato || 0,
      msgEnviada: row.msg_enviada || 0,
      conexao: row.conexao || 0,
      whatsappObtido: row.whatsapp_obtido || 0,
      reuniaoAgendada: row.reuniao_agendada || 0,
      reuniaoRealizada: row.reuniao_realizada || 0,
      propostaEmAnalise: row.proposta_em_analise || 0,
      vendaFechada: row.venda_fechada || 0,
      faturamento: row.faturamento || 0,
      total: row.total || 0,
    };
    switch (row.view_type) {
      case "total": totals = metrics; break;
      case "canal": byCanal.push(metrics); break;
      case "pessoa": byPessoa.push(metrics); break;
      case "combo": byCanalPessoa.push(metrics); break;
    }
  }

  return {
    byCanal: byCanal.sort((a, b) => b.total - a.total),
    byPessoa: byPessoa.sort((a, b) => b.total - a.total),
    byCanalPessoa: byCanalPessoa.sort((a, b) => b.total - a.total),
    totals,
    totalOpportunities: totals.total,
  };
}

function fallbackEmpty(): GHLSummary {
  return {
    byCanal: [],
    byPessoa: [],
    byCanalPessoa: [],
    totals: emptyMetrics("Total", "Total"),
    totalOpportunities: 0,
  };
}
