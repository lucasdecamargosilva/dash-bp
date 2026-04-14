const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

const STAGE_ORDER = [
  "Contato",
  "Msg Enviada",
  "Conexao",
  "WhatsApp Obtido",
  "Reuniao Agendada",
  "Reuniao Realizada",
  "Proposta em Analise",
  "Venda Fechada",
];

// Config passed dynamically per tenant
export interface GHLConfig {
  locationId: string;
  pipelineId: string;
  token: string;
  pessoaFieldId: string;
  stageMap: Record<string, string>;
}

// Default config (PR1ME ROI) — used as fallback
export const DEFAULT_GHL_CONFIG: GHLConfig = {
  locationId: "Fv53xady7VzauTiZY4kJ",
  pipelineId: "ni6Jby8x5qChm1wthLpk",
  token: "pit-9ae2be8a-eee7-47a3-85b9-97e3fb36d4cc",
  pessoaFieldId: "ZlEZlOCfiVom6suGmlGe",
  stageMap: {
    "919e7abb-740b-4152-aefb-d49a542997a3": "Contato",
    "ecd03656-bb21-4658-802f-b1d446b02030": "Msg Enviada",
    "e165377b-8d2a-4a40-81f2-9c20771da1c7": "Conexao",
    "dc5538ca-cf3c-415c-b8b5-b23ed3dcc962": "WhatsApp Obtido",
    "7ecfbf7f-b86a-485a-81aa-4d921bbc9cef": "Reuniao Agendada",
    "82fb8199-ed43-449a-9fec-cb051b3805d3": "Reuniao Realizada",
    "1c76360f-dcf8-43b7-a370-937535c9f9b1": "Proposta em Analise",
    "d36edf84-84a2-43a2-982d-d22c49f226d2": "Venda Fechada",
  },
};

export interface GHLOpportunity {
  id: string;
  name: string;
  source: string | null;
  stage: string;
  stageId: string;
  pessoa: string;
  monetaryValue: number;
  createdAt: string;
  lastStageChangeAt: string;
  status: string;
}

export interface ChannelMetrics {
  canal: string;
  pessoa: string;
  contato: number;
  msgEnviada: number;
  conexao: number;
  whatsappObtido: number;
  reuniaoAgendada: number;
  reuniaoRealizada: number;
  propostaEmAnalise: number;
  vendaFechada: number;
  faturamento: number;
  total: number;
}

export interface VendaFechada {
  name: string;
  monetaryValue: number;
  source: string;
  pessoa: string;
  date: string;
}

export interface GHLSummary {
  byCanal: ChannelMetrics[];
  byPessoa: ChannelMetrics[];
  byCanalPessoa: ChannelMetrics[];
  totals: ChannelMetrics;
  totalOpportunities: number;
  vendas?: VendaFechada[];
}

function extractFieldValue(f: any): string {
  if (f.fieldValueString) return f.fieldValueString;
  if (typeof f.fieldValue === "string") return f.fieldValue;
  if (Array.isArray(f.fieldValue) && f.fieldValue.length > 0) return f.fieldValue[0];
  if (typeof f.value === "string") return f.value;
  if (Array.isArray(f.value) && f.value.length > 0) return f.value[0];
  return "";
}

function parseOpportunity(raw: any, config: GHLConfig): GHLOpportunity {
  let pessoa = "";

  for (const f of raw.customFields || []) {
    if (f.id === config.pessoaFieldId || f.key === config.pessoaFieldId) {
      pessoa = extractFieldValue(f);
    }
  }

  if (!pessoa && raw.contact?.customFields) {
    for (const f of raw.contact.customFields) {
      if (f.id === config.pessoaFieldId || f.key === config.pessoaFieldId) {
        pessoa = extractFieldValue(f);
      }
    }
  }

  if (!pessoa && raw.assignedTo) {
    pessoa = raw.assignedTo;
  }

  return {
    id: raw.id,
    name: raw.name || "",
    source: raw.source || null,
    stage: config.stageMap[raw.pipelineStageId] || "Outro",
    stageId: raw.pipelineStageId,
    pessoa,
    monetaryValue: parseFloat(raw.monetaryValue) || 0,
    createdAt: raw.createdAt || "",
    lastStageChangeAt: raw.lastStageChangeAt || "",
    status: raw.status || "",
  };
}

function emptyMetrics(canal: string, pessoa: string): ChannelMetrics {
  return {
    canal, pessoa,
    contato: 0, msgEnviada: 0, conexao: 0, whatsappObtido: 0,
    reuniaoAgendada: 0, reuniaoRealizada: 0, propostaEmAnalise: 0,
    vendaFechada: 0, faturamento: 0, total: 0,
  };
}

function addToMetrics(m: ChannelMetrics, stage: string, monetaryValue: number = 0) {
  m.total++;
  if (stage === "Venda Fechada") m.faturamento += monetaryValue;
  switch (stage) {
    case "Contato": m.contato++; break;
    case "Msg Enviada": m.msgEnviada++; break;
    case "Conexao": m.conexao++; break;
    case "WhatsApp Obtido": m.whatsappObtido++; break;
    case "Reuniao Agendada": m.reuniaoAgendada++; break;
    case "Reuniao Realizada": m.reuniaoRealizada++; break;
    case "Proposta em Analise": m.propostaEmAnalise++; break;
    case "Venda Fechada": m.vendaFechada++; break;
  }
}

// Fetch ALL opps for a single stage using cursor-based pagination
async function fetchAllForStage(stageId: string, config: GHLConfig): Promise<GHLOpportunity[]> {
  const opps: GHLOpportunity[] = [];
  const seen = new Set<string>();
  let cursorAfter: string | null = null;
  let cursorAfterId: string | null = null;

  while (true) {
    let url = `${GHL_API}/opportunities/search?location_id=${config.locationId}&pipeline_id=${config.pipelineId}&limit=100&pipeline_stage_id=${stageId}`;
    if (cursorAfter) url += `&startAfter=${cursorAfter}&startAfterId=${cursorAfterId}`;

    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${config.token}`, Version: GHL_VERSION } });
      if (!res.ok) break;
      const data = await res.json();
      const raw = data.opportunities || [];
      if (raw.length === 0) break;

      for (const r of raw) {
        const parsed = parseOpportunity(r, config);
        if (!seen.has(parsed.id)) {
          seen.add(parsed.id);
          opps.push(parsed);
        }
      }

      const nextUrl = data.meta?.nextPageUrl;
      if (!nextUrl) break;
      const params = new URL(nextUrl).searchParams;
      cursorAfter = params.get("startAfter");
      cursorAfterId = params.get("startAfterId");
      if (!cursorAfter || !cursorAfterId) break;
    } catch {
      break;
    }
  }
  return opps;
}

export async function fetchGHLPipelineData(config: GHLConfig = DEFAULT_GHL_CONFIG): Promise<GHLSummary> {
  const allOpps: GHLOpportunity[] = [];
  for (const stageId of Object.keys(config.stageMap)) {
    const stageOpps = await fetchAllForStage(stageId, config);
    allOpps.push(...stageOpps);
  }
  const dedupMap = new Map<string, GHLOpportunity>();
  for (const o of allOpps) dedupMap.set(o.id, o);

  const opps = Array.from(dedupMap.values());

  const canalMap = new Map<string, ChannelMetrics>();
  const pessoaMap = new Map<string, ChannelMetrics>();
  const comboMap = new Map<string, ChannelMetrics>();
  const totals = emptyMetrics("Total", "Total");

  for (const opp of opps) {
    const canal = opp.source || "Sem canal";
    const pessoa = opp.pessoa || "Sem pessoa";
    const combo = `${canal} | ${pessoa}`;

    if (!canalMap.has(canal)) canalMap.set(canal, emptyMetrics(canal, ""));
    addToMetrics(canalMap.get(canal)!, opp.stage, opp.monetaryValue);

    if (!pessoaMap.has(pessoa)) pessoaMap.set(pessoa, emptyMetrics("", pessoa));
    addToMetrics(pessoaMap.get(pessoa)!, opp.stage, opp.monetaryValue);

    if (!comboMap.has(combo)) comboMap.set(combo, emptyMetrics(canal, pessoa));
    addToMetrics(comboMap.get(combo)!, opp.stage, opp.monetaryValue);

    addToMetrics(totals, opp.stage, opp.monetaryValue);
  }

  return {
    byCanal: Array.from(canalMap.values()).sort((a, b) => b.total - a.total),
    byPessoa: Array.from(pessoaMap.values()).sort((a, b) => b.total - a.total),
    byCanalPessoa: Array.from(comboMap.values()).sort((a, b) => b.total - a.total),
    totals,
    totalOpportunities: opps.length,
  };
}

export { STAGE_ORDER };
