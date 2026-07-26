import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, KeyRound, Check, Loader2, ShieldCheck } from "lucide-react";

const MIN = 8;

/**
 * Fica fora do componente de propósito: definida dentro, o React trataria
 * cada render como um tipo novo, remontaria o input e o foco se perderia
 * a cada tecla digitada.
 */
function Campo({ label, value, onChange, autoComplete, ver, setVer }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  ver: boolean;
  setVer: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="font-body text-[10px] font-bold uppercase tracking-wider text-steel-400 dark:text-muted-foreground">{label}</label>
      <div className="relative mt-1">
        <Input
          type={ver ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="h-9 pr-9 font-body text-sm"
        />
        <button type="button" onClick={() => setVer(!ver)} tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-steel-300 hover:text-steel-500"
          aria-label={ver ? "Esconder senhas" : "Mostrar senhas"}>
          {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/**
 * Minha conta — trocar a propria senha.
 *
 * Existe porque o Supabase self-hosted esta sem SMTP: sem isso, ninguem
 * consegue recuperar senha sozinho e cada troca vira tarefa manual de admin.
 * A senha atual e conferida antes da troca; o updateUser do Supabase nao
 * exige isso, mas sem a conferencia qualquer sessao aberta trocaria a senha.
 */
export default function Conta() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ver, setVer] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pronto, setPronto] = useState(false);

  const curta = nova.length > 0 && nova.length < MIN;
  const diferente = confirma.length > 0 && nova !== confirma;
  const igualAtual = nova.length > 0 && nova === atual;
  const podeSalvar = atual && nova.length >= MIN && nova === confirma && !igualAtual && !salvando;

  const trocar = async () => {
    if (!podeSalvar || !user?.email) return;
    setSalvando(true);
    try {
      // confere a senha atual reautenticando — evita troca por sessao esquecida aberta
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: atual,
      });
      if (authError) {
        toast({ title: "Senha atual incorreta", description: "Confira e tente de novo.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: nova });
      if (error) {
        toast({ title: "Não consegui trocar a senha", description: error.message, variant: "destructive" });
        return;
      }
      setPronto(true);
      setAtual(""); setNova(""); setConfirma("");
      toast({ title: "Senha alterada", description: "Use a nova senha no próximo acesso." });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-steel-50 dark:bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-body text-xl font-bold tracking-tight text-navy-900 dark:text-foreground">Minha conta</h1>
            <p className="font-body text-xs text-steel-400 dark:text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="rounded-xl border border-steel-100 bg-white p-5 shadow-card dark:border-border dark:bg-card">
          {pronto ? (
            <div className="py-6 text-center">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <p className="font-body text-base font-bold text-navy-900 dark:text-foreground">Senha alterada</p>
              <p className="mt-1 font-body text-xs text-steel-400 dark:text-muted-foreground">
                Ela já vale para o próximo acesso, em qualquer dispositivo.
              </p>
              <Button variant="ghost" className="mt-4 font-body text-xs" onClick={() => setPronto(false)}>
                Trocar de novo
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-4 font-body text-sm font-semibold text-navy-900 dark:text-foreground">Trocar senha</p>
              <div className="space-y-3">
                <Campo label="Senha atual" value={atual} onChange={setAtual} autoComplete="current-password" ver={ver} setVer={setVer} />
                <Campo label="Nova senha" value={nova} onChange={setNova} autoComplete="new-password" ver={ver} setVer={setVer} />
                <Campo label="Repita a nova senha" value={confirma} onChange={setConfirma} autoComplete="new-password" ver={ver} setVer={setVer} />
              </div>

              <ul className="mt-3 space-y-1">
                {[
                  { ok: nova.length >= MIN, txt: `Pelo menos ${MIN} caracteres` },
                  { ok: nova.length > 0 && nova === confirma, txt: "As duas novas são iguais" },
                  { ok: nova.length > 0 && !igualAtual, txt: "Diferente da senha atual" },
                ].map((r) => (
                  <li key={r.txt} className={cn("flex items-center gap-1.5 font-body text-[11px]",
                    r.ok ? "text-emerald-600 dark:text-emerald-400" : "text-steel-400 dark:text-muted-foreground")}>
                    <Check className={cn("h-3 w-3", !r.ok && "opacity-30")} strokeWidth={3} />
                    {r.txt}
                  </li>
                ))}
              </ul>

              {(curta || diferente || igualAtual) && (
                <p className="mt-2 font-body text-[11px] text-red-600 dark:text-red-400">
                  {curta ? `A nova senha precisa de ${MIN} caracteres ou mais.`
                    : diferente ? "As duas novas senhas não batem."
                      : "A nova senha precisa ser diferente da atual."}
                </p>
              )}

              <Button onClick={trocar} disabled={!podeSalvar} className="mt-4 w-full font-body text-sm">
                {salvando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Trocando…</> : "Trocar senha"}
              </Button>
            </>
          )}
        </div>

        <p className="mt-4 font-body text-[11px] leading-relaxed text-steel-400 dark:text-muted-foreground">
          Esqueceu a senha e não consegue entrar? O envio de e-mail do servidor ainda não está
          configurado, então a recuperação automática não funciona — peça a um admin para redefinir.
        </p>
      </main>
    </div>
  );
}
