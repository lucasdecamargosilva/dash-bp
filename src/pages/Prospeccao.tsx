import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { cn } from "@/lib/utils";
import {
  ChevronDown, Inbox, Loader2, Radio, RefreshCw, Terminal, TriangleAlert, XCircle,
} from "lucide-react";
import {
  useTouchAlineEstado, useTouchAlineDias, minutosDesde, haQuanto, VELHO_MIN,
  type Rodada, type EstadoLead, type Situacao,
} from "@/hooks/useTouchAline";

// Espelho, no celular, do robo de prospeccao que roda na maquina Windows.
// So leitura: quem publica e o publicar_estado.py, do bp-prospector-windows.
// Esta pagina nao comanda o robo — nenhum botao daqui dispara DM.
//
// A primeira coisa que ela precisa responder e "isto ainda esta vivo?". Por isso
// a idade do retrato vem antes de qualquer numero: espelho velho mostrando 30
// enviados engana mais do que uma tela vazia.

const SITUACAO: Record<Situacao, { texto: string; classe: string }> = {
  rodando: { texto: "rodando", classe: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  parado: { texto: "parado", classe: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  concluido: { texto: "concluído", classe: "bg-steel-100 text-steel-600 dark:bg-secondary dark:text-muted-foreground" },
};

const LEAD: Record<EstadoLead, { texto: string; ponto: string; texto_cor: string }> = {
  enviado: { texto: "enviado", ponto: "bg-sky-500", texto_cor: "text-sky-700 dark:text-sky-300" },
  respondeu: { texto: "respondeu", ponto: "bg-emerald-500", texto_cor: "text-emerald-700 dark:text-emerald-300" },
  descartado: { texto: "descartado", ponto: "bg-steel-300", texto_cor: "text-steel-500 dark:text-muted-foreground" },
  erro: { texto: "erro", ponto: "bg-red-500", texto_cor: "text-red-700 dark:text-red-400" },
  quarentena: { texto: "quarentena", ponto: "bg-amber-500", texto_cor: "text-amber-700 dark:text-amber-400" },
  pendente: { texto: "pendente", ponto: "bg-steel-200", texto_cor: "text-steel-400" },
};

function Cartao({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-steel-100 bg-white shadow-card dark:border-border dark:bg-card", className)}>
      {children}
    </div>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-body text-[10px] font-bold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">
      {children}
    </span>
  );
}

/** Uma barra dividida pelos estados do lote — a leitura de relance do progresso. */
function Barra({ r }: { r: Rodada }) {
  const partes: { chave: EstadoLead; n: number }[] = [
    { chave: "enviado", n: r.contagem.enviado },
    { chave: "respondeu", n: r.contagem.respondeu },
    { chave: "erro", n: r.contagem.erro },
    { chave: "quarentena", n: r.contagem.quarentena },
    { chave: "descartado", n: r.contagem.descartado },
    { chave: "pendente", n: r.contagem.pendente },
  ];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-secondary">
      {partes.filter((p) => p.n > 0).map((p) => (
        <div
          key={p.chave}
          className={LEAD[p.chave].ponto}
          style={{ width: `${(p.n / Math.max(1, r.total)) * 100}%` }}
          title={`${p.n} ${LEAD[p.chave].texto}`}
        />
      ))}
    </div>
  );
}

function Numero({ n, rotulo, cor }: { n: number; rotulo: string; cor?: string }) {
  return (
    <div className="min-w-0">
      <div className={cn("font-display text-xl font-extrabold leading-none tabular-nums", cor ?? "text-navy-900 dark:text-foreground")}>
        {n}
      </div>
      <div className="mt-1 truncate font-body text-[10px] uppercase tracking-wider text-steel-400 dark:text-muted-foreground">
        {rotulo}
      </div>
    </div>
  );
}

function CartaoRodada({ r }: { r: Rodada }) {
  const [abrirErros, setAbrirErros] = useState(false);
  const s = SITUACAO[r.situacao] ?? SITUACAO.parado;
  return (
    <Cartao className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-body text-base font-bold text-navy-900 dark:text-foreground">{r.lote}</h3>
          <p className="mt-0.5 font-body text-xs text-steel-400 dark:text-muted-foreground">
            {r.de} → {r.para} · {r.total} leads
          </p>
        </div>
        <span className={cn("flex-shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide", s.classe)}>
          {s.texto}
        </span>
      </div>

      <div className="mt-3">
        <Barra r={r} />
        <div className="mt-1.5 flex justify-between font-body text-[11px] text-steel-400 dark:text-muted-foreground">
          <span>{r.feitos} de {r.total}</span>
          <span>{r.ultima_atividade_min === null ? "sem log" : `atividade ${haQuanto(Math.round(r.ultima_atividade_min))}`}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Numero n={r.contagem.enviado} rotulo="enviados" cor="text-sky-600 dark:text-sky-400" />
        <Numero n={r.contagem.respondeu} rotulo="respostas" cor="text-emerald-600 dark:text-emerald-400" />
        <Numero n={r.contagem.pendente} rotulo="pendentes" />
        <Numero n={r.contagem.erro} rotulo="erros" cor={r.contagem.erro ? "text-red-600 dark:text-red-400" : undefined} />
        <Numero n={r.contagem.quarentena} rotulo="quarentena" />
        <Numero n={r.contagem.descartado} rotulo="descartados" />
      </div>

      {r.erros.length > 0 && (
        <div className="mt-3 border-t border-steel-100 pt-3 dark:border-border">
          <button
            onClick={() => setAbrirErros((v) => !v)}
            className="flex w-full items-center gap-1.5 font-body text-xs font-semibold text-red-600 dark:text-red-400"
          >
            <XCircle className="h-3.5 w-3.5" />
            {r.erros.length} {r.erros.length === 1 ? "lead com erro" : "leads com erro"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", abrirErros && "rotate-180")} />
          </button>
          {abrirErros && (
            <ul className="mt-2 space-y-1.5">
              {r.erros.map((e) => (
                <li key={e.handle} className="font-body text-xs leading-snug text-steel-500 dark:text-muted-foreground">
                  <span className="font-mono text-[11px] text-navy-900 dark:text-foreground">@{e.handle}</span>
                  <span className="mx-1">·</span>
                  {e.erro}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Cartao>
  );
}

export default function Prospeccao() {
  const estado = useTouchAlineEstado();
  const dias = useTouchAlineDias();
  const [abrirLogs, setAbrirLogs] = useState(false);

  const d = estado.data;
  const idade = minutosDesde(d?.publicado_em);
  const velho = idade !== null && idade > VELHO_MIN;

  // Vem pronto do publicador: sao as transicoes vistas hoje. Somar o total de cada
  // lote daria numero inflado, porque um lote de follow-up pode ser de dias atras.
  const hoje = d?.hoje ?? { enviados: 0, respostas: 0, erros: 0, pendentes: 0, descartados: 0 };

  const maxDia = Math.max(1, ...dias.data?.map((x) => x.enviados) ?? [1]);

  return (
    <div className="min-h-screen bg-steel-50 dark:bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-[900px] px-4 pb-16 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy-900 dark:text-foreground">
              Prospecção · Aline
            </h1>
            <p className="mt-0.5 font-body text-xs text-steel-400 dark:text-muted-foreground">
              Espelho do robô que roda no Windows. Só leitura — nada aqui dispara DM.
            </p>
          </div>
          <button
            onClick={() => { estado.refetch(); dias.refetch(); }}
            disabled={estado.isFetching}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-steel-200 bg-white px-3 py-2 font-body text-xs font-semibold text-steel-600 disabled:opacity-50 dark:border-border dark:bg-card dark:text-muted-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", estado.isFetching && "animate-spin")} />
            Atualizar
          </button>
        </div>

        {/* Idade do retrato: vem antes de qualquer numero, de proposito. */}
        <div
          className={cn(
            "mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3",
            velho
              ? "border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10"
              : "border-steel-100 bg-white dark:border-border dark:bg-card"
          )}
        >
          <Radio className={cn("h-4 w-4 flex-shrink-0", velho ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400")} />
          <div className="min-w-0 flex-1">
            <p className={cn("font-body text-sm font-semibold", velho ? "text-orange-800 dark:text-orange-300" : "text-navy-900 dark:text-foreground")}>
              {estado.isLoading ? "Buscando o espelho…" : velho ? `Espelho parado ${haQuanto(idade)}` : `Atualizado ${haQuanto(idade)}`}
            </p>
            <p className="truncate font-body text-[11px] text-steel-400 dark:text-muted-foreground">
              {d?.host ? `${d.host} · ` : ""}
              {velho
                ? "o publicar_estado.py não está rodando lá, ou a máquina caiu"
                : "o Windows publica a cada 5 min"}
            </p>
          </div>
        </div>

        {estado.isLoading && (
          <div className="mt-6 flex items-center justify-center gap-2 py-12 font-body text-sm text-steel-400">
            <Loader2 className="h-4 w-4 animate-spin" /> carregando
          </div>
        )}

        {estado.isError && (
          <Cartao className="mt-4 border-red-200 p-4 dark:border-red-500/30">
            <p className="font-body text-sm font-semibold text-red-700 dark:text-red-400">Não consegui ler o espelho</p>
            <p className="mt-1 font-body text-xs text-steel-500 dark:text-muted-foreground">
              {(estado.error as Error)?.message}. Se a tabela ainda não existe, rode o
              <span className="font-mono"> sql/create_touch_aline_estado.sql</span> no Supabase.
            </p>
          </Cartao>
        )}

        {!estado.isLoading && !estado.isError && !d && (
          <Cartao className="mt-4 p-6 text-center">
            <Inbox className="mx-auto h-6 w-6 text-steel-300" />
            <p className="mt-2 font-body text-sm font-semibold text-navy-900 dark:text-foreground">Nada publicado ainda</p>
            <p className="mx-auto mt-1 max-w-sm font-body text-xs text-steel-400 dark:text-muted-foreground">
              Rode <span className="font-mono">python publicar_estado.py</span> na máquina Windows para o
              primeiro retrato aparecer aqui.
            </p>
          </Cartao>
        )}

        {d && (
          <>
            {d.alertas.length > 0 && (
              <div className="mt-4 space-y-2">
                {d.alertas.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-500/30 dark:bg-orange-500/10">
                    <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
                    <p className="font-body text-sm leading-snug text-orange-900 dark:text-orange-200">{a}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Resumo do dia */}
            <Cartao className="mt-4 p-4">
              <div className="flex items-baseline justify-between">
                <Rotulo>Hoje</Rotulo>
                <span className="font-body text-[11px] text-steel-400 dark:text-muted-foreground">
                  {d.lista_do_dia?.existe
                    ? `lista com ${d.lista_do_dia.total} leads`
                    : "sem lista do dia"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                <Numero n={hoje.enviados} rotulo="enviados" cor="text-sky-600 dark:text-sky-400" />
                <Numero n={hoje.respostas} rotulo="respostas" cor="text-emerald-600 dark:text-emerald-400" />
                <Numero n={hoje.pendentes} rotulo="pendentes" />
                <Numero n={hoje.erros} rotulo="erros" cor={hoje.erros ? "text-red-600 dark:text-red-400" : undefined} />
              </div>
            </Cartao>

            {/* Lotes */}
            <div className="mt-5">
              <Rotulo>Lotes</Rotulo>
              <div className="mt-2 space-y-3">
                {d.rodadas.length === 0 && (
                  <Cartao className="p-4">
                    <p className="font-body text-sm text-steel-400 dark:text-muted-foreground">
                      Nenhum lote em andamento agora.
                    </p>
                  </Cartao>
                )}
                {d.rodadas.map((r) => <CartaoRodada key={r.lote} r={r} />)}
              </div>
            </div>

            {/* Últimos dias */}
            {(dias.data?.length ?? 0) > 1 && (
              <div className="mt-6">
                <Rotulo>Enviados por dia</Rotulo>
                <Cartao className="mt-2 p-4">
                  <div className="flex h-24 items-end gap-1.5">
                    {dias.data!.map((x) => (
                      <div
                        key={x.dia}
                        className={cn(
                          "min-w-0 flex-1 rounded-t",
                          x.enviados === 0 ? "bg-steel-200 dark:bg-secondary" : "bg-sky-500",
                          x.dia === d.dia && x.enviados > 0 && "bg-sky-600 dark:bg-sky-400"
                        )}
                        style={{ height: `${Math.max(3, (x.enviados / maxDia) * 100)}%` }}
                        title={`${x.dia}: ${x.enviados} enviados`}
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    {dias.data!.map((x) => (
                      <span key={x.dia} className="min-w-0 flex-1 truncate text-center font-body text-[9px] tabular-nums text-steel-400">
                        {x.dia.slice(8)}
                      </span>
                    ))}
                  </div>
                </Cartao>
              </div>
            )}

            {/* Linha do tempo */}
            {d.eventos.length > 0 && (
              <div className="mt-6">
                <Rotulo>O que mudou</Rotulo>
                <Cartao className="mt-2 divide-y divide-steel-100 dark:divide-border">
                  {d.eventos.slice().reverse().slice(0, 25).map((e, i) => {
                    const l = LEAD[e.estado] ?? LEAD.pendente;
                    return (
                      <div key={`${e.em}-${e.handle}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                        <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", l.ponto)} />
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-navy-900 dark:text-foreground">
                          @{e.handle}
                        </span>
                        <span className={cn("flex-shrink-0 font-body text-[11px] font-semibold", l.texto_cor)}>
                          {l.texto}
                        </span>
                        <span className="flex-shrink-0 font-body text-[10px] tabular-nums text-steel-300 dark:text-muted-foreground">
                          {e.em.slice(11, 16)}
                        </span>
                      </div>
                    );
                  })}
                </Cartao>
                <p className="mt-1.5 font-body text-[10px] leading-snug text-steel-400 dark:text-muted-foreground">
                  A hora é a da publicação que viu a mudança, não a do envio — o log do robô não
                  guarda hora por lead.
                </p>
              </div>
            )}

            {/* Funil por Touch, quando publicado */}
            {d.funil?.por_touch && (
              <div className="mt-6">
                <Rotulo>Na fila, por Touch</Rotulo>
                <Cartao className="mt-2 p-4">
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {Object.entries(d.funil.por_touch)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([touch, n]) => <Numero key={touch} n={n} rotulo={touch} />)}
                  </div>
                  <p className="mt-3 font-body text-[10px] text-steel-400 dark:text-muted-foreground">
                    Nova Mensagem Enviada, em aberto · atualizado {haQuanto(minutosDesde(d.funil.atualizado_em))}
                  </p>
                </Cartao>
              </div>
            )}

            {/* Fim dos logs */}
            {d.logs && (
              <div className="mt-6">
                <button
                  onClick={() => setAbrirLogs((v) => !v)}
                  className="flex items-center gap-1.5 font-body text-xs font-bold uppercase tracking-wider text-steel-400 dark:text-muted-foreground"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Fim dos logs
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", abrirLogs && "rotate-180")} />
                </button>
                {abrirLogs && (
                  <div className="mt-2 space-y-3">
                    {Object.entries(d.logs).map(([nome, log]) => (
                      <Cartao key={nome} className="overflow-hidden">
                        <div className="flex items-baseline justify-between border-b border-steel-100 px-4 py-2 dark:border-border">
                          <span className="font-body text-xs font-bold text-navy-900 dark:text-foreground">{nome}</span>
                          <span className="font-body text-[10px] text-steel-400">
                            {log.idade_min === null ? "não existe" : haQuanto(Math.round(log.idade_min))}
                          </span>
                        </div>
                        <pre className="overflow-x-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-steel-600 dark:text-muted-foreground">
{log.linhas.length ? log.linhas.join("\n") : "(vazio)"}
                        </pre>
                      </Cartao>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="mt-8 font-body text-[11px] leading-relaxed text-steel-400 dark:text-muted-foreground">
              Retrato publicado por <span className="font-mono">publicar_estado.py</span> na máquina
              Windows. Para comandar o robô é preciso ir ao terminal de lá — esta página não envia nada.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
