"""Tools do GHL para o agente — definicoes (schema Anthropic) e executor HTTP."""
import os
import httpx

GHL_BASE = "https://services.leadconnectorhq.com"
LOCATION_ID = "Fv53xady7VzauTiZY4kJ"          # subconta Prime ROI
PIPELINE_AQUISICAO = "ni6Jby8x5qChm1wthLpk"   # Funil de Aquisição


def _headers():
    return {
        "Authorization": "Bearer " + os.environ["GHL_PIT"],
        "Version": "2021-07-28",
        "Accept": "application/json",
    }


TOOLS = [
    {
        "name": "buscar_lead",
        "description": (
            "Busca contatos no CRM GoHighLevel pelo nome, telefone ou email. Use SEMPRE antes de "
            "qualquer outra operacao. Retorna lista de contatos com id, nome, telefone, email e tags."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"busca": {"type": "string", "description": "Nome, telefone ou email do lead"}},
            "required": ["busca"],
        },
    },
    {
        "name": "buscar_oportunidades",
        "description": (
            "Lista as oportunidades (cards) de um contato. Use para achar o id da oportunidade antes de "
            "atualizar. Retorna id, pipelineId, pipelineStageId, status, monetaryValue e datas."
        ),
        "input_schema": {
            "type": "object",
            "properties": {"contact_id": {"type": "string", "description": "Id do contato (de buscar_lead)"}},
            "required": ["contact_id"],
        },
    },
    {
        "name": "buscar_funil",
        "description": (
            "Busca oportunidades por pipeline/estagio no CRM (visao do funil). Use para consultas como "
            "'como esta o funil', 'quais propostas estao paradas', 'quem esta em Reuniao Agendada'. "
            "Retorna ate 100 cards por pagina com nome, estagio, valor, status e datas."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "pipeline_stage_id": {"type": "string", "description": "Opcional: filtra por um estagio"},
                "status": {"type": "string", "description": "open, won, lost ou all (padrao: open)"},
                "q": {"type": "string", "description": "Opcional: filtro de texto no nome do card"},
                "page": {"type": "integer", "description": "Pagina (1 em diante)"},
            },
        },
    },
    {
        "name": "criar_contato",
        "description": "Cria um contato novo no CRM. So use depois de buscar_lead confirmar que nao existe.",
        "input_schema": {
            "type": "object",
            "properties": {
                "firstName": {"type": "string"},
                "lastName": {"type": "string"},
                "phone": {"type": "string", "description": "Formato +55DDDNUMERO. Omita se nao informado."},
                "email": {"type": "string"},
                "source": {"type": "string", "description": "Canal da taxonomia oficial"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": 'Ex.: ["saude","icp-a"]'},
            },
            "required": ["firstName"],
        },
    },
    {
        "name": "criar_oportunidade",
        "description": "Cria uma oportunidade (card) no Funil de Aquisicao para um contato existente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Formato 'Nome (@instagram)' quando houver Instagram"},
                "contactId": {"type": "string"},
                "pipelineStageId": {"type": "string"},
                "status": {"type": "string", "description": "Normalmente 'open'"},
                "source": {"type": "string"},
                "monetaryValue": {"type": "number"},
                "customFields": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {"id": {"type": "string"}, "field_value": {"type": "string"}},
                        "required": ["id", "field_value"],
                    },
                },
            },
            "required": ["name", "contactId", "pipelineStageId"],
        },
    },
    {
        "name": "atualizar_oportunidade",
        "description": (
            "Atualiza uma oportunidade: estagio, valor, status, vendedor, Touch, FUP. Envie apenas as "
            "chaves a alterar. Para mudar de pipeline envie pipelineId junto."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "opportunityId": {"type": "string"},
                "corpo": {
                    "type": "object",
                    "description": (
                        "Chaves possiveis: pipelineId, pipelineStageId, status (open/won/lost), "
                        "monetaryValue (numero), assignedTo, name, customFields (array de {id, field_value})"
                    ),
                },
            },
            "required": ["opportunityId", "corpo"],
        },
    },
    {
        "name": "atualizar_contato",
        "description": "Atualiza um contato: telefone, email, tags (array completo), source.",
        "input_schema": {
            "type": "object",
            "properties": {
                "contactId": {"type": "string"},
                "corpo": {"type": "object", "description": "Chaves a alterar: phone, email, tags, source"},
            },
            "required": ["contactId", "corpo"],
        },
    },
    {
        "name": "criar_nota",
        "description": "Adiciona uma nota de texto ao contato (pos-reuniao, contexto de proposta).",
        "input_schema": {
            "type": "object",
            "properties": {
                "contactId": {"type": "string"},
                "texto": {"type": "string"},
            },
            "required": ["contactId", "texto"],
        },
    },
]


async def execute_tool(name: str, args: dict) -> dict:
    """Executa a tool contra a API do GHL e retorna o JSON da resposta (ou o erro)."""
    async with httpx.AsyncClient(timeout=30) as c:
        try:
            if name == "buscar_lead":
                r = await c.get(
                    f"{GHL_BASE}/contacts/",
                    params={"locationId": LOCATION_ID, "query": args["busca"], "limit": 10},
                    headers=_headers(),
                )
            elif name == "buscar_oportunidades":
                r = await c.get(
                    f"{GHL_BASE}/opportunities/search",
                    params={"location_id": LOCATION_ID, "contact_id": args["contact_id"]},
                    headers=_headers(),
                )
            elif name == "buscar_funil":
                params = {
                    "location_id": LOCATION_ID,
                    "pipeline_id": PIPELINE_AQUISICAO,
                    "limit": 100,
                    "status": args.get("status") or "open",
                    "page": args.get("page") or 1,
                }
                if args.get("pipeline_stage_id"):
                    params["pipeline_stage_id"] = args["pipeline_stage_id"]
                if args.get("q"):
                    params["q"] = args["q"]
                r = await c.get(f"{GHL_BASE}/opportunities/search", params=params, headers=_headers())
            elif name == "criar_contato":
                body = {k: v for k, v in args.items() if v not in (None, "", [])}
                body["locationId"] = LOCATION_ID
                r = await c.post(f"{GHL_BASE}/contacts/", json=body, headers=_headers())
            elif name == "criar_oportunidade":
                body = {k: v for k, v in args.items() if v not in (None, "", [])}
                body["locationId"] = LOCATION_ID
                body.setdefault("pipelineId", PIPELINE_AQUISICAO)
                body.setdefault("status", "open")
                r = await c.post(f"{GHL_BASE}/opportunities/", json=body, headers=_headers())
            elif name == "atualizar_oportunidade":
                r = await c.put(
                    f"{GHL_BASE}/opportunities/{args['opportunityId']}",
                    json=args["corpo"], headers=_headers(),
                )
            elif name == "atualizar_contato":
                r = await c.put(
                    f"{GHL_BASE}/contacts/{args['contactId']}",
                    json=args["corpo"], headers=_headers(),
                )
            elif name == "criar_nota":
                r = await c.post(
                    f"{GHL_BASE}/contacts/{args['contactId']}/notes",
                    json={"body": args["texto"]}, headers=_headers(),
                )
            else:
                return {"erro": f"tool desconhecida: {name}"}
        except httpx.HTTPError as e:
            return {"erro": f"falha de rede ao chamar o GHL: {e}"}

    if r.status_code >= 400:
        return {"erro": f"GHL respondeu {r.status_code}", "detalhe": r.text[:800]}
    try:
        return r.json()
    except ValueError:
        return {"ok": True, "status": r.status_code}
