import { useQuery } from "@tanstack/react-query";
import { getGHLPipelineFromCache } from "@/lib/ghl-supabase";
import { type GHLSummary } from "@/lib/ghl";

interface DateRange {
  from?: Date;
  to?: Date;
}

export function useGHLData(dateRange?: DateRange) {
  const key = dateRange?.from
    ? `${dateRange.from.toISOString()}_${dateRange.to?.toISOString() || ""}`
    : "all";

  return useQuery<GHLSummary>({
    queryKey: ["ghl-pipeline", key],
    queryFn: () => getGHLPipelineFromCache(dateRange),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
