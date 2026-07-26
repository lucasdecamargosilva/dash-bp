import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useMonthlySeries, seriePorCanal, METRICAS, type Metrica } from "@/hooks/useMonthlySeries";

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

// paleta fixa por posição — a mesma cor para o mesmo canal em qualquer métrica
const CORES = ["#0ea5e9", "#f97316", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

export function MonthlyTrendChart({ locationId, className }: { locationId: string; className?: string }) {
  const isDark = useIsDark();
  const [metrica, setMetrica] = useState<Metrica>("faturamento");
  const [porCanal, setPorCanal] = useState(false);
  const serie = useMonthlySeries(locationId, 6);

  const cores = {
    grid: isDark ? "rgba(255,255,255,0.06)" : "#e5e7eb",
    axis: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8",
    linha: isDark ? "#38a8f9" : "#0d1a30",
    dotFill: isDark ? "#141a24" : "white",
    tipBg: isDark ? "#1c2230" : "white",
    tipBorda: isDark ? "#2a3040" : "#e5e7eb",
    tipLabel: isDark ? "#8894aa" : "#6a778f",
  };

  const info = METRICAS.find((m) => m.id === metrica)!;
  const fmt = (v: number) => (info.moeda ? brl(v) : v.toLocaleString("pt-BR"));

  const { pontos, canais } = useMemo(
    () => seriePorCanal(serie.data, metrica, 5),
    [serie.data, metrica]
  );
  const dados = porCanal ? pontos : (serie.data?.total ?? []);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-steel-100 bg-steel-50 p-0.5 dark:border-border dark:bg-secondary/40">
          {METRICAS.map((m) => (
            <button key={m.id} onClick={() => setMetrica(m.id)}
              className={cn("rounded-md px-2.5 py-1 font-body text-[11px] font-semibold transition-colors",
                metrica === m.id
                  ? "bg-white text-navy-900 shadow-sm dark:bg-card dark:text-foreground"
                  : "text-steel-400 hover:text-navy-900 dark:text-muted-foreground dark:hover:text-foreground")}>
              {m.label}
            </button>
          ))}
        </div>
        <button onClick={() => setPorCanal(!porCanal)}
          className={cn("rounded-lg border px-2.5 py-1.5 font-body text-[11px] font-semibold transition-colors",
            porCanal
              ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300"
              : "border-steel-100 bg-white text-steel-400 hover:text-navy-900 dark:border-border dark:bg-card dark:hover:text-foreground")}>
          {porCanal ? "Por canal" : "Total"}
        </button>
      </div>

      {serie.isLoading ? (
        <div className="flex h-72 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-steel-400" /></div>
      ) : serie.error ? (
        <div className="flex h-72 items-center justify-center font-body text-sm text-steel-400">
          Não consegui carregar a série: {(serie.error as any).message}
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={cores.grid} vertical={false} />
              <XAxis dataKey="label" stroke={cores.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke={cores.axis} fontSize={11} fontFamily="Plus Jakarta Sans" tickLine={false} axisLine={false} dx={-4}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const ordenado = [...payload].sort((a, b) => (b.value as number) - (a.value as number));
                  return (
                    <div style={{ background: cores.tipBg, borderColor: cores.tipBorda }} className="rounded-lg border px-3 py-2 shadow-hover">
                      <p style={{ color: cores.tipLabel }} className="mb-1 font-body text-xs font-semibold">{label}</p>
                      {ordenado.map((e, i) => (
                        <p key={i} className="font-body text-sm font-semibold" style={{ color: e.color }}>
                          {e.name}: {fmt(e.value as number)}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              {porCanal ? (
                <>
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Plus Jakarta Sans" }} iconType="line" />
                  {canais.map((canal, i) => (
                    <Line key={canal} type="monotone" dataKey={canal} name={canal}
                      stroke={CORES[i % CORES.length]} strokeWidth={2}
                      dot={{ fill: CORES[i % CORES.length], strokeWidth: 0, r: 2.5 }}
                      activeDot={{ r: 4, strokeWidth: 2, fill: cores.dotFill, stroke: CORES[i % CORES.length] }} />
                  ))}
                </>
              ) : (
                <Line type="monotone" dataKey={metrica} name={info.label}
                  stroke={cores.linha} strokeWidth={2.5}
                  dot={{ fill: cores.linha, strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, stroke: "#38a8f9", strokeWidth: 2, fill: cores.dotFill }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
