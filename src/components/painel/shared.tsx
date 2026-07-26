import { cn } from "@/lib/utils";
import { Eye, Check, ChevronRight } from "lucide-react";
import type { PanelMember, Role, Freq } from "@/hooks/usePanelData";

export const LAYER_COLOR: Record<string, string> = {
  quentes: "bg-orange-500",
  volume: "bg-sky-500",
  construcao: "bg-steel-400",
};
export const LAYER_TEXT: Record<string, string> = {
  quentes: "text-orange-600 dark:text-orange-400",
  volume: "text-sky-600 dark:text-sky-400",
  construcao: "text-steel-400 dark:text-muted-foreground",
};
const ROLE_STYLE: Record<Role, string> = {
  dono: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  aux: "bg-steel-100 text-steel-500 dark:bg-secondary dark:text-muted-foreground",
  super: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
};
export const ROLE_LABEL: Record<Role, string> = { dono: "opera", aux: "apoia", super: "acompanha" };
export const FREQ_NAME: Record<Freq, string> = { d: "Diárias", s: "Semanais", m: "Mensais" };

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const nf = (n: number) => n.toLocaleString("pt-BR");

const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
};

export function Avatar({ member, size = 24 }: { member: PanelMember; size?: number }) {
  return (
    <span
      className="inline-grid flex-shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${member.hue} 55% 47%)` }}
      title={member.name}
    >
      {initials(member.name)}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide", ROLE_STYLE[role])}>
      {role === "super" && <Eye className="h-2.5 w-2.5" />}
      {ROLE_LABEL[role]}
    </span>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-steel-100 bg-white shadow-card dark:border-border dark:bg-card", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="font-body text-lg font-bold tracking-tight text-navy-900 dark:text-foreground">{title}</h2>
      {sub && <p className="font-body text-xs text-steel-400 dark:text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-[10px] font-bold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">
      {children}
    </p>
  );
}

/** Barra de progresso com cor por estado: nada / parcial / completo. */
export function Progress({ done, total, width = 56 }: { done: number; total: number; width?: number }) {
  const pct = total ? (done / total) * 100 : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 overflow-hidden rounded-full bg-steel-100 dark:bg-secondary" style={{ width }}>
        <span
          className={cn("block h-full rounded-full transition-all", total && done === total ? "bg-emerald-500" : done === 0 ? "bg-steel-300" : "bg-amber-500")}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className={cn("font-mono text-xs font-bold tabular-nums", total && done === total ? "text-emerald-600 dark:text-emerald-400" : "text-steel-400")}>
        {done}/{total}
      </span>
    </span>
  );
}

export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span className={cn("grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border-2 transition-colors",
      checked ? "border-emerald-500 bg-emerald-500" : "border-steel-200 dark:border-border")}>
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
    </span>
  );
}

export function Segmented<T extends string>({
  value, onChange, options, size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-lg border border-steel-100 bg-steel-50 p-0.5 dark:border-border dark:bg-secondary/40">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-md font-body font-semibold transition-colors",
            size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
            value === o.id
              ? "bg-white text-navy-900 shadow-sm dark:bg-card dark:text-foreground"
              : "text-steel-400 hover:text-navy-900 dark:text-muted-foreground dark:hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Card className="p-8 text-center font-body text-sm text-steel-400 dark:text-muted-foreground">{children}</Card>
  );
}

export function Row({ onClick, children, className }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-steel-100 bg-white px-4 py-3 text-left shadow-card dark:border-border dark:bg-card",
        onClick && "transition-all hover:border-sky-300 dark:hover:border-sky-500/40",
        className
      )}
    >
      {children}
      {onClick && <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-steel-300" />}
    </Tag>
  );
}
