import { useEffect, useRef, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";

// Página do Agente Comercial PR1ME — chat que comanda o CRM GoHighLevel.
// Backend: serviço próprio (FastAPI) — mesmo login Supabase do dash, token vai no Authorization.
const API =
  (import.meta.env.VITE_AGENTE_API_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:8000" : "https://agente.bpgroupbr.com.br");

const TOOL_LABELS: Record<string, string> = {
  buscar_lead: "buscando lead",
  buscar_oportunidades: "lendo cards",
  buscar_funil: "lendo o funil",
  criar_contato: "criando contato",
  criar_oportunidade: "criando card",
  atualizar_oportunidade: "atualizando card",
  atualizar_contato: "atualizando contato",
  criar_nota: "gravando nota",
};

const SUGESTOES = [
  "Como está o funil?",
  "Quais propostas estão paradas?",
  "Quem é ICP A em Reunião Agendada?",
];

type Msg = { tipo: "user" | "bot" | "erro"; texto: string };

function esc(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function md(t: string) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^- /gm, "· ");
}

const Wordmark = ({ className }: { className?: string }) => (
  <svg viewBox="-8 -8 651 116" className={className} role="img" aria-label="PR1ME ROI">
    <g fill="none" stroke="currentColor" strokeWidth="11.5" strokeLinecap="butt">
      <path d="M0.2 5.75 H37 Q60.8 5.75 60.8 30 Q60.8 54.3 37 54.3 H5.75 V100" />
      <path d="M82.5 5.75 H119.3 Q143.1 5.75 143.1 30 Q143.1 54.3 119.3 54.3 H88.05 V100" />
      <path d="M130.1 54.3 L147.5 100" />
      <path d="M160.8 3 L179.7 0 L179.7 12 L160.8 11.5 Z" fill="currentColor" stroke="none" />
      <path d="M185 0 V100" />
      <path d="M217.1 0 V100" />
      <path d="M301.2 0 V100" />
      <path d="M211.4 0 L226.1 0 L259.2 56.2 L292.3 0 L307 0 L259.2 73.4 Z" fill="currentColor" stroke="none" />
      <path d="M382.9 5.75 H332.3 V94.3 H382.9" />
      <path d="M332.3 50 H380.3" />
      <path d="M437.5 5.75 H474.3 Q498.1 5.75 498.1 30 Q498.1 54.3 474.3 54.3 H443.05 V100" />
      <path d="M485.1 54.3 L502.5 100" />
      <ellipse cx="561.7" cy="50" rx="39.4" ry="44.3" />
      <path d="M629.1 0 V100" />
    </g>
  </svg>
);

export default function Agente() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [pensando, setPensando] = useState(false);
  const [entrada, setEntrada] = useState("");
  const [nome, setNome] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const convRef = useRef<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const enviandoRef = useRef(false);

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token ?? "";

  useEffect(() => {
    (async () => {
      const r = await fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${await token()}` } });
      if (r.status === 403) { setBloqueado(true); return; }
      if (!r.ok) return;
      const me = await r.json();
      setNome(me.nome);
      setMsgs([{ tipo: "bot", texto: `Oi, ${me.nome.split(" ")[0]}. Me diz o que aconteceu com um lead — ou pergunta algo do funil — que eu atualizo o CRM.` }]);
    })();
  }, []);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, chips, pensando]);

  async function enviar(textoLivre?: string) {
    const texto = (textoLivre ?? entrada).trim();
    if (!texto || enviandoRef.current) return;
    enviandoRef.current = true;
    setEntrada("");
    setMsgs((m) => [...m, { tipo: "user", texto }]);
    setPensando(true);
    setChips([]);
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ message: texto, conversation_id: convRef.current }),
      });
      if (!r.ok || !r.body) {
        setMsgs((m) => [...m, { tipo: "erro", texto: `O agente não respondeu (erro ${r.status}). Tente de novo.` }]);
        return;
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const linha = buf.slice(0, i).trim();
          buf = buf.slice(i + 2);
          if (!linha.startsWith("data: ")) continue;
          const ev = JSON.parse(linha.slice(6));
          if (ev.type === "conversation") convRef.current = ev.id;
          else if (ev.type === "tool") setChips((c) => [...c, TOOL_LABELS[ev.name] ?? ev.name]);
          else if (ev.type === "text") { setMsgs((m) => [...m, { tipo: "bot", texto: ev.text }]); setChips([]); }
          else if (ev.type === "error") { setMsgs((m) => [...m, { tipo: "erro", texto: ev.text }]); setChips([]); }
        }
      }
    } catch {
      setMsgs((m) => [...m, { tipo: "erro", texto: "Sem conexão com o agente. Verifique se o serviço está no ar." }]);
    } finally {
      setPensando(false);
      setChips([]);
      enviandoRef.current = false;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0908] text-[#CFC9BF] font-light">
      <DashboardHeader />
      <style>{`@keyframes agente-surgir{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes agente-pulso{0%,100%{opacity:.25}50%{opacity:1}}
        @media (prefers-reduced-motion:reduce){.agente-anim{animation:none!important}}`}</style>

      <div className="flex-1 flex flex-col max-w-[880px] w-full mx-auto min-h-0">
        {/* faixa de identidade da página */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-[#2E2A22]">
          <Wordmark className="w-24 text-white" />
          <div className="w-px h-5 bg-[#2E2A22]" />
          <span className="text-[10.5px] tracking-[0.28em] uppercase text-[#C9A96A]">Agente Comercial · CRM</span>
          {nome && <span className="ml-auto text-[13px] text-[#9A937F]">{nome}</span>}
        </div>

        {bloqueado ? (
          <div className="m-5 p-5 bg-[#100E0B] border border-[#2E2A22] border-l-2 border-l-[#C96A6A] text-[#C96A6A]">
            Seu login é válido, mas seu email ainda não está liberado no agente. Fale com o Raphael.
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
              {msgs.map((m, i) =>
                m.tipo === "user" ? (
                  <div key={i} className="agente-anim self-end max-w-[76%] px-4 py-3 whitespace-pre-wrap bg-[#16130E] border border-[#2E2A22]" style={{ animation: "agente-surgir .24s ease-out" }}>
                    {m.texto}
                  </div>
                ) : (
                  <div
                    key={i}
                    className={`agente-anim self-start max-w-[76%] px-4 py-3 whitespace-pre-wrap bg-[#100E0B] border border-[#2E2A22] border-l-2 ${m.tipo === "erro" ? "border-l-[#C96A6A] text-[#C96A6A]" : "border-l-[#C9A96A]"} [&_b]:text-[#D8BE8E] [&_b]:font-normal`}
                    style={{ animation: "agente-surgir .24s ease-out" }}
                    dangerouslySetInnerHTML={{ __html: md(m.texto) }}
                  />
                )
              )}
              {chips.length > 0 && (
                <div className="self-start flex gap-4 flex-wrap pl-0.5">
                  {chips.map((c, i) => (
                    <span key={i} className={`text-[10px] tracking-[0.24em] uppercase ${i === chips.length - 1 ? "text-[#D8BE8E]" : "text-[#9A937F]"}`}>
                      [ {c} ]
                    </span>
                  ))}
                </div>
              )}
              {pensando && (
                <div className="self-start text-[13px] italic text-[#9A937F] pl-0.5">
                  consultando o CRM
                  <span className="agente-anim inline-block w-[5px] h-[5px] rounded-full bg-[#C9A96A] ml-2 align-middle" style={{ animation: "agente-pulso 1.1s ease-in-out infinite" }} />
                </div>
              )}
              <div ref={fimRef} />
            </div>

            {msgs.length <= 1 && (
              <div className="flex gap-2.5 flex-wrap px-5 pb-3">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="bg-transparent border border-[#2E2A22] text-[#9A937F] text-[10.5px] tracking-[0.16em] uppercase px-3.5 py-2 hover:text-[#D8BE8E] hover:border-[#C9A96A] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 px-5 py-4 border-t border-[#2E2A22]">
              <textarea
                rows={1}
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                placeholder="Ex.: Dra. Marina marcou reunião pra sexta"
                className="flex-1 resize-none bg-[#100E0B] border border-[#2E2A22] focus:border-[#C9A96A] px-4 py-3 text-[#CFC9BF] placeholder:text-[#9A937F] outline-none rounded-none max-h-36 font-light"
              />
              <button
                onClick={() => enviar()}
                className="bg-[#C9A96A] hover:bg-[#D8BE8E] text-[#0A0908] px-6 text-xs tracking-[0.24em] uppercase transition-colors"
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
