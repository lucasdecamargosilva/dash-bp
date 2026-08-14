# Agente CRM PR1ME — painel web do time

Chat web onde cada pessoa da PR1ME loga (mesmo login do Dash BP) e comanda o agente do CRM em linguagem natural: *"Dra. Marina, dentista, veio do Insta do Acioli, marcou reunião pra sexta"* → CRM atualizado, resposta na tela.

## Arquitetura

```
agente.bpgroupbr.com.br  (EasyPanel, 1 container)
 ├─ static/index.html    front: login Supabase + chat (tema PR1ME)
 ├─ app.py               FastAPI: valida JWT no Supabase → loop do agente (Claude + tools) → SSE
 ├─ ghl_tools.py         7 tools contra a API v2 do GHL (subconta Prime ROI fixa)
 ├─ system_prompt.md     o cérebro (mesmo da skill crm-pr1me)
 ├─ equipe.json          quem pode usar: email → nome + "Pessoa ou conta"
 └─ logs/audit.jsonl     trilha: quem pediu o quê, quais tools rodaram
```

- **Login:** reusa as contas do Supabase do Dash BP (`dash-bp-supabase.o3zr34.easypanel.host`). Não cria usuário novo — quem já loga no Dash, loga aqui. O `equipe.json` é a segunda trava: email fora da lista recebe 403.
- **Identidade no CRM:** o backend injeta o usuário logado no prompt — quando a Aline escreve "tive reunião com a Dra. X", o campo *Pessoa ou conta* recebe `Aline`, não `Acioli`.
- **Guardrails** (no prompt): confirma antes de won/lost e lote; nunca deleta; nunca inventa dado; taxonomia fechada de canais.

## Deploy no EasyPanel (~20 min)

1. **Criar o app:** EasyPanel → Create Service → App → Source: subir este diretório via Git (recomendado: repo privado `bp-group/agente-crm-pr1me`) ou upload. Build: Dockerfile (detecta sozinho). Porta: `8000`.
2. **Variáveis de ambiente** (copiar de `.env.example` e preencher):
   - `ANTHROPIC_API_KEY` — console.anthropic.com
   - `GHL_PIT` — Private Integration Token da subconta Prime ROI, escopos `contacts.readonly/write` + `opportunities.readonly/write` (gerar um só para o agente)
   - `SUPABASE_URL` e `SUPABASE_ANON_KEY` — já preenchidos no exemplo (são os do Dash BP; a anon key é pública por design)
   - `MODEL` — `claude-sonnet-5` (padrão)
3. **Domínio:** no serviço → Domains → `agente.bpgroupbr.com.br` (criar o CNAME no DNS apontando para o EasyPanel, igual foi feito para `dash.`). HTTPS automático.
4. **Editar `equipe.json`** com os emails reais do time (os mesmos do login do Dash BP) antes do build.
5. **Persistência do log (opcional):** montar um volume em `/app/logs` para o `audit.jsonl` sobreviver a redeploys.

## Teste local

```
cd agente-crm-pr1me
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # preencher ANTHROPIC_API_KEY e GHL_PIT
set -a; source .env; set +a
.venv/bin/uvicorn app:app --port 8000
```

Abrir http://localhost:8000 e logar com uma conta do Dash BP.

## Critério de aceite (mesmo da Fase 1)

20 atualizações seguidas sem erro de estágio ou canal, feitas por pelo menos 3 pessoas diferentes do time. Até lá, conferir no GHL todo card tocado pelo agente (auditoria de sexta). O `logs/audit.jsonl` diz quem pediu o quê.

## Roadmap curto

- **v1.1** — histórico de conversas persistente (tabela no Supabase em vez de memória), botão "desfazer última ação".
- **v1.2** — consultas analíticas com números do funil direto na tela (cards/estágio vs. benchmarks).
- **v2** — abrir para mentorados (multi-tenant: um `locationId` por cliente — a estrutura já isola isso em `ghl_tools.py`).
