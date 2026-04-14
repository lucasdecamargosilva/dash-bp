import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useTenant, type TenantConfig } from "@/context/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Plus, Save, Trash2, Pencil, Loader2, Shield, Copy, UserPlus, ShieldCheck, ShieldX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEFAULT_STAGE_MAP = {
  "stage_id_1": "Contato",
  "stage_id_2": "Msg Enviada",
  "stage_id_3": "Conexao",
  "stage_id_4": "WhatsApp Obtido",
  "stage_id_5": "Reuniao Agendada",
  "stage_id_6": "Reuniao Realizada",
  "stage_id_7": "Proposta em Analise",
  "stage_id_8": "Venda Fechada",
};

interface AdminUser {
  id: number;
  user_id: string;
  role: string;
  email?: string;
}

const Admin = () => {
  const { isAdmin, allTenants, refreshTenants } = useTenant();
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Admin users management
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  const loadAdmins = async () => {
    const { data: roles } = await (supabase as any).from("user_roles").select("*").eq("role", "admin");
    if (!roles) { setAdmins([]); return; }
    // Get emails from profiles
    const userIds = roles.map((r: any) => r.user_id);
    const { data: profiles } = await (supabase as any).from("profiles").select("id,email").in("id", userIds);
    const emailMap = new Map((profiles || []).map((p: any) => [p.id, p.email]));
    setAdmins(roles.map((r: any) => ({ ...r, email: emailMap.get(r.user_id) || "?" })));
  };

  useEffect(() => { if (isAdmin) loadAdmins(); }, [isAdmin]);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      // Find user by email
      const { data: profile } = await (supabase as any).from("profiles").select("id").eq("email", newAdminEmail.trim()).single();
      if (!profile) { toast.error("Usuario nao encontrado com esse email"); setAddingAdmin(false); return; }
      // Check if already admin
      const existing = admins.find(a => a.user_id === profile.id);
      if (existing) { toast.error("Esse usuario ja e admin"); setAddingAdmin(false); return; }
      // Insert
      const { error } = await (supabase as any).from("user_roles").insert({ user_id: profile.id, role: "admin" });
      if (error) throw error;
      toast.success(`${newAdminEmail.trim()} agora e admin!`);
      setNewAdminEmail("");
      await loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar admin");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (!window.confirm(`Remover admin "${admin.email}"?`)) return;
    const { error } = await (supabase as any).from("user_roles").delete().eq("id", admin.id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Admin removido");
    await loadAdmins();
  };

  // Form state
  const [form, setForm] = useState({
    user_id: "",
    empresa: "",
    ghl_location_id: "",
    ghl_pipeline_id: "",
    ghl_token: "",
    pessoa_field_id: "",
    stage_map: JSON.stringify(DEFAULT_STAGE_MAP, null, 2),
  });

  const resetForm = () => {
    setForm({ user_id: "", empresa: "", ghl_location_id: "", ghl_pipeline_id: "", ghl_token: "", pessoa_field_id: "", stage_map: JSON.stringify(DEFAULT_STAGE_MAP, null, 2) });
    setEditId(null);
  };

  const handleEdit = (t: TenantConfig) => {
    setEditId(t.id);
    setForm({
      user_id: t.userId,
      empresa: t.empresa,
      ghl_location_id: t.ghlLocationId,
      ghl_pipeline_id: t.ghlPipelineId,
      ghl_token: t.ghlToken,
      pessoa_field_id: t.pessoaFieldId,
      stage_map: JSON.stringify(t.stageMap, null, 2),
    });
  };

  const handleSave = async () => {
    if (!form.empresa || !form.user_id || !form.ghl_location_id || !form.ghl_pipeline_id || !form.ghl_token) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    setSaving(true);
    try {
      let stageMap = {};
      try { stageMap = JSON.parse(form.stage_map); } catch { toast.error("Stage map JSON invalido"); setSaving(false); return; }

      const data = {
        user_id: form.user_id,
        empresa: form.empresa,
        ghl_location_id: form.ghl_location_id,
        ghl_pipeline_id: form.ghl_pipeline_id,
        ghl_token: form.ghl_token,
        pessoa_field_id: form.pessoa_field_id,
        stage_map: stageMap,
      };

      if (editId) {
        const { error } = await (supabase as any).from("tenant_config").update(data).eq("id", editId);
        if (error) throw error;
        toast.success("Tenant atualizado!");
      } else {
        const { error } = await (supabase as any).from("tenant_config").insert(data);
        if (error) throw error;
        toast.success("Tenant criado!");
      }

      resetForm();
      await refreshTenants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, empresa: string) => {
    if (!window.confirm(`Excluir tenant "${empresa}"?`)) return;
    const { error } = await (supabase as any).from("tenant_config").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Tenant excluido");
    await refreshTenants();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <Shield className="h-12 w-12 text-steel-300 mx-auto" />
            <p className="text-sm font-body text-steel-400">Acesso restrito a administradores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bp-scroll">
      <DashboardHeader />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-foreground">Admin</h1>
            <p className="text-sm font-body text-steel-400 dark:text-muted-foreground mt-0.5">Gerenciar administradores e empresas</p>
          </div>

          {/* Admins */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden">
            <div className="px-5 py-4 border-b border-steel-100 dark:border-border flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Administradores</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Admin list */}
              <div className="space-y-2">
                {admins.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-steel-50 dark:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-sky-500" />
                      <span className="text-sm font-body font-semibold text-navy-900 dark:text-foreground">{a.email}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveAdmin(a)} className="h-7 w-7 p-0 text-steel-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <ShieldX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {admins.length === 0 && (
                  <p className="text-sm font-body text-steel-400 dark:text-muted-foreground text-center py-4">Nenhum admin cadastrado.</p>
                )}
              </div>
              {/* Add admin */}
              <div className="flex items-center gap-2">
                <Input
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="Email do usuario"
                  className="h-9 text-sm font-body flex-1"
                  onKeyDown={e => e.key === "Enter" && handleAddAdmin()}
                />
                <Button onClick={handleAddAdmin} disabled={addingAdmin} className="h-9 bg-navy-900 hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-body text-xs gap-1.5">
                  {addingAdmin ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Tenant List */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi overflow-hidden">
            <div className="px-5 py-4 border-b border-steel-100 dark:border-border">
              <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground">Tenants Cadastrados ({allTenants.length})</h3>
            </div>
            <div className="overflow-x-auto bp-scroll">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-steel-100 dark:border-border bg-steel-50/50 dark:bg-secondary/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Empresa</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">User ID</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Location</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Pipeline</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-body font-bold uppercase tracking-[0.1em] text-steel-400 dark:text-muted-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {allTenants.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-sm font-body text-steel-400 dark:text-muted-foreground">Nenhum tenant cadastrado.</td></tr>
                  )}
                  {allTenants.map(t => (
                    <tr key={t.id} className="border-b border-steel-50 dark:border-border/50 hover:bg-sky-50/30 dark:hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-body text-sm font-semibold text-navy-900 dark:text-foreground">{t.empresa}</td>
                      <td className="px-4 py-3 font-body text-xs text-steel-500 dark:text-muted-foreground font-mono">{t.userId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-body text-xs text-steel-500 dark:text-muted-foreground font-mono">{t.ghlLocationId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 font-body text-xs text-steel-500 dark:text-muted-foreground font-mono">{t.ghlPipelineId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="h-7 w-7 p-0 text-steel-400 hover:text-sky-600"><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id, t.empresa)} className="h-7 w-7 p-0 text-steel-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Edit Form */}
          <div className="bg-white dark:bg-card rounded-xl border border-steel-100 dark:border-border shadow-kpi p-5">
            <h3 className="font-display text-lg font-bold text-navy-900 dark:text-foreground mb-4">
              {editId ? "Editar Tenant" : "Novo Tenant"}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400">Empresa *</Label>
                  <Input value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} placeholder="Nome da empresa" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400">User ID (Supabase) *</Label>
                  <Input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} placeholder="UUID do usuario" className="h-9 text-sm font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400">GHL Location ID *</Label>
                  <Input value={form.ghl_location_id} onChange={e => setForm({ ...form, ghl_location_id: e.target.value })} placeholder="Location ID" className="h-9 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400">GHL Pipeline ID *</Label>
                  <Input value={form.ghl_pipeline_id} onChange={e => setForm({ ...form, ghl_pipeline_id: e.target.value })} placeholder="Pipeline ID" className="h-9 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400">Pessoa Field ID</Label>
                  <Input value={form.pessoa_field_id} onChange={e => setForm({ ...form, pessoa_field_id: e.target.value })} placeholder="Custom field ID" className="h-9 text-sm font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400">GHL API Token *</Label>
                <Input value={form.ghl_token} onChange={e => setForm({ ...form, ghl_token: e.target.value })} placeholder="pit-xxxxx..." className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-body font-semibold uppercase tracking-wider text-steel-400">Stage Map (JSON)</Label>
                <textarea
                  value={form.stage_map}
                  onChange={e => setForm({ ...form, stage_map: e.target.value })}
                  className="w-full h-40 rounded-md border border-steel-200 dark:border-border bg-white dark:bg-card text-sm font-mono p-3 resize-y"
                  placeholder='{"stage_id": "Stage Name", ...}'
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={saving} className="bg-navy-900 hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-body text-xs gap-1.5">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  {editId ? "Salvar Alteracoes" : "Criar Tenant"}
                </Button>
                {editId && (
                  <Button variant="outline" onClick={resetForm} className="font-body text-xs">Cancelar</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
