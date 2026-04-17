import { useQuery } from "@tanstack/react-query";
import { getGHLPipelineFromCache } from "@/lib/ghl-supabase";
import { type GHLSummary, type GHLConfig } from "@/lib/ghl";
import { useTenant } from "@/context/TenantContext";

interface DateRange {
  from?: Date;
  to?: Date;
}

export function useGHLData(dateRange?: DateRange) {
  const { tenant } = useTenant();

  const config: GHLConfig = {
    locationId: tenant.ghlLocationId,
    pipelineId: tenant.ghlPipelineId,
    token: tenant.ghlToken,
    pessoaFieldId: tenant.pessoaFieldId,
    stageMap: tenant.stageMap,
  };

  const key = dateRange?.from
    ? `${dateRange.from.toISOString()}_${dateRange.to?.toISOString() || ""}`
    : "all";

  return useQuery<GHLSummary>({
    queryKey: ["ghl-pipeline", tenant.ghlLocationId, key],
    queryFn: () => getGHLPipelineFromCache(dateRange, config),
    staleTime: 60_000,
    refetchInterval: 120_000,
    enabled: !!tenant.ghlLocationId,
  });
}
