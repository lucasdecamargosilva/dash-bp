"""Agente CRM PR1ME — backend web.

Chat multiusuario que comanda o CRM GoHighLevel via Claude com tool use.
Login: Supabase (mesmas contas do Dash BP). Cada resposta e streamada por SSE.
"""
import json
import os
import time
import uuid
import pathlib
from typing import Optional

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from anthropic import AsyncAnthropic
from ghl_tools import TOOLS, execute_tool

BASE = pathlib.Path(__file__).parent
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://dash-bp-supabase.o3zr34.easypanel.host")
SUPABASE_ANON = os.environ.get("SUPABASE_ANON_KEY", "")
MODEL = os.environ.get("MODEL", "claude-sonnet-5")
MAX_ITER = 15
DEV_NO_AUTH = os.environ.get("DEV_NO_AUTH") == "1"   # so para teste local

SYSTEM_PROMPT = (BASE / "system_prompt.md").read_text()
EQUIPE = json.loads((BASE / "equipe.json").read_text())  # email -> {nome, pessoa_conta}

app = FastAPI(title="Agente CRM PR1ME")
anthropic = AsyncAnthropic()  # ANTHROPIC_API_KEY do ambiente

# conversas em memoria: {conv_key: {"messages": [...], "ts": epoch}}
_conversas = {}
CONV_TTL = 24 * 3600
CONV_MAX_MSGS = 60


def _limpar_conversas():
    agora = time.time()
    for k in [k for k, v in _conversas.items() if agora - v["ts"] > CONV_TTL]:
        del _conversas[k]


async def _usuario(authorization: Optional[str]) -> dict:
    """Valida o JWT no Supabase e devolve {email, nome, pessoa_conta}."""
    if DEV_NO_AUTH:
        return {"email": "dev@pr1me", "nome": "Dev", "pessoa_conta": "Acioli"}
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "sem token")
    token = authorization.removeprefix("Bearer ")
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={"apikey": SUPABASE_ANON, "Authorization": f"Bearer {token}"},
        )
    if r.status_code != 200:
        raise HTTPException(401, "token invalido ou expirado")
    email = (r.json().get("email") or "").lower()
    membro = EQUIPE.get(email)
    if not membro:
        raise HTTPException(403, f"{email} nao esta na lista do time (equipe.json)")
    return {"email": email, **membro}


def _auditar(evento: dict):
    evento["ts"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(BASE / "logs" / "audit.jsonl", "a") as f:
        f.write(json.dumps(evento, ensure_ascii=False) + "\n")


@app.get("/api/me")
async def me(authorization: Optional[str] = Header(default=None)):
    u = await _usuario(authorization)
    return {"email": u["email"], "nome": u["nome"], "pessoa_conta": u["pessoa_conta"], "model": MODEL}


@app.post("/api/chat")
async def chat(req: Request, authorization: Optional[str] = Header(default=None)):
    u = await _usuario(authorization)
    body = await req.json()
    texto = (body.get("message") or "").strip()
    if not texto:
        raise HTTPException(400, "mensagem vazia")
    conv_id = body.get("conversation_id") or str(uuid.uuid4())
    conv_key = f"{u['email']}:{conv_id}"

    _limpar_conversas()
    conv = _conversas.setdefault(conv_key, {"messages": [], "ts": time.time()})
    conv["ts"] = time.time()
    conv["messages"].append({"role": "user", "content": texto})
    conv["messages"][:] = conv["messages"][-CONV_MAX_MSGS:]

    system = (
        SYSTEM_PROMPT
        + f"\n\n## USUÁRIO LOGADO\nNome: {u['nome']} · Email: {u['email']} · "
        + f"Valor de \"Pessoa ou conta\" quando se referir a si: {u['pessoa_conta']}"
    )

    async def gerar():
        yield _sse({"type": "conversation", "id": conv_id})
        tools_usadas = []
        try:
            for _ in range(MAX_ITER):
                resposta = await anthropic.messages.create(
                    model=MODEL, max_tokens=2048, system=system,
                    tools=TOOLS, messages=conv["messages"],
                )
                conv["messages"].append({"role": "assistant", "content": resposta.content})
                if resposta.stop_reason != "tool_use":
                    texto_final = "".join(b.text for b in resposta.content if b.type == "text")
                    yield _sse({"type": "text", "text": texto_final})
                    break
                resultados = []
                for bloco in resposta.content:
                    if bloco.type != "tool_use":
                        continue
                    yield _sse({"type": "tool", "name": bloco.name})
                    tools_usadas.append(bloco.name)
                    saida = await execute_tool(bloco.name, bloco.input)
                    resultados.append({
                        "type": "tool_result", "tool_use_id": bloco.id,
                        "content": json.dumps(saida, ensure_ascii=False)[:12000],
                    })
                conv["messages"].append({"role": "user", "content": resultados})
            else:
                yield _sse({"type": "text", "text": "Parei: excedi o limite de passos. Reformule ou divida o pedido."})
        except Exception as e:  # noqa: BLE001 — erro vai para o usuario e para o log
            yield _sse({"type": "error", "text": f"Erro no agente: {e}"})
        _auditar({"user": u["email"], "conv": conv_id, "msg": texto, "tools": tools_usadas})
        yield _sse({"type": "done"})

    return StreamingResponse(gerar(), media_type="text/event-stream")


def _sse(obj: dict) -> str:
    return "data: " + json.dumps(obj, ensure_ascii=False) + "\n\n"


@app.get("/api/config")
async def config():
    """Config publica para o front (URL e anon key do Supabase sao publicas por design)."""
    return {"supabase_url": SUPABASE_URL, "supabase_anon_key": SUPABASE_ANON}


@app.get("/")
async def index():
    return FileResponse(BASE / "static" / "index.html")


app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")
