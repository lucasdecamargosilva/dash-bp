import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Default stage map (PR1ME ROI)
const DEFAULT_STAGE_MAP: Record<string, string> = {
  "919e7abb-740b-4152-aefb-d49a542997a3": "Contato",
  "ecd03656-bb21-4658-802f-b1d446b02030": "Msg Enviada",
  "e165377b-8d2a-4a40-81f2-9c20771da1c7": "Conexao",
  "dc5538ca-cf3c-415c-b8b5-b23ed3dcc962": "WhatsApp Obtido",
  "7ecfbf7f-b86a-485a-81aa-4d921bbc9cef": "Reuniao Agendada",
  "82fb8199-ed43-449a-9fec-cb051b3805d3": "Reuniao Realizada",
  "1c76360f-dcf8-43b7-a370-937535c9f9b1": "Proposta em Analise",
  "d36edf84-84a2-43a2-982d-d22c49f226d2": "Venda Fechada",
};

export interface TenantConfig {
  id: string;
  userId: string;
  empresa: string;
  ghlLocationId: string;
  ghlPipelineId: string;
  ghlToken: string;
  pessoaFieldId: string;
  stageMap: Record<string, string>;
}

// Default config (PR1ME ROI) — used as fallback
const DEFAULT_CONFIG: TenantConfig = {
  id: "default",
  userId: "",
  empresa: "PR1ME ROI",
  ghlLocationId: "Fv53xady7VzauTiZY4kJ",
  ghlPipelineId: "ni6Jby8x5qChm1wthLpk",
  ghlToken: "pit-9ae2be8a-eee7-47a3-85b9-97e3fb36d4cc",
  pessoaFieldId: "ZlEZlOCfiVom6suGmlGe",
  stageMap: DEFAULT_STAGE_MAP,
};

interface TenantContextType {
  tenant: TenantConfig;
  loading: boolean;
  isAdmin: boolean;
  allTenants: TenantConfig[];
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: DEFAULT_CONFIG,
  loading: true,
  isAdmin: false,
  allTenants: [],
  refreshTenants: async () => {},
});

export const useTenant = () => useContext(TenantContext);


export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantConfig>(DEFAULT_CONFIG);
  const [allTenants, setAllTenants] = useState<TenantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const parseTenantRow = (row: any): TenantConfig => ({
    id: row.id,
    userId: row.user_id,
    empresa: row.empresa || "",
    ghlLocationId: row.ghl_location_id || "",
    ghlPipelineId: row.ghl_pipeline_id || "",
    ghlToken: row.ghl_token || "",
    pessoaFieldId: row.pessoa_field_id || "",
    stageMap: row.stage_map && Object.keys(row.stage_map).length > 0 ? row.stage_map : DEFAULT_STAGE_MAP,
  });

  const loadTenant = async () => {
    if (!user) {
      setTenant(DEFAULT_CONFIG);
      setLoading(false);
      return;
    }

    try {
      // Check if user is admin (from user_roles table)
      const { data: roleData } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      const adminCheck = !!roleData;
      setIsAdmin(adminCheck);

      // Try to load tenant config for this user
      const { data, error } = await (supabase as any)
        .from("tenant_config")
        .select("*")
        .eq("user_id", user.id)
        .eq("ativo", true)
        .single();

      if (data && !error) {
        setTenant(parseTenantRow(data));
      } else if (adminCheck) {
        // Admin without own tenant sees default (PR1ME ROI)
        setTenant({ ...DEFAULT_CONFIG, userId: user.id });
      } else {
        // Regular user without tenant config — no pipeline access
        setTenant({ ...DEFAULT_CONFIG, userId: user.id, ghlLocationId: "", ghlPipelineId: "", ghlToken: "", empresa: "Sem empresa configurada" });
      }

      // If admin, load all tenants
      if (adminCheck) {
        const { data: all } = await (supabase as any)
          .from("tenant_config")
          .select("*")
          .order("empresa");
        setAllTenants((all || []).map(parseTenantRow));
      }
    } catch {
      setTenant({ ...DEFAULT_CONFIG, userId: user.id });
    } finally {
      setLoading(false);
    }
  };

  const refreshTenants = async () => {
    if (!isAdmin) return;
    const { data } = await (supabase as any)
      .from("tenant_config")
      .select("*")
      .order("empresa");
    setAllTenants((data || []).map(parseTenantRow));
  };

  useEffect(() => {
    loadTenant();
  }, [user]);

  return (
    <TenantContext.Provider value={{ tenant, loading, isAdmin, allTenants, refreshTenants }}>
      {children}
    </TenantContext.Provider>
  );
}
