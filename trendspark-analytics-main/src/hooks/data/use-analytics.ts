import { useQuery } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { normalizeAnalyticsSnapshot } from "@/lib/normalize-analytics";
import { isBrowser } from "@/hooks/data/client-only";

export function useAnalyticsSnapshot() {
  const query = useQuery({
    queryKey: queryKeys.analytics.snapshot,
    queryFn: () => getServices().analytics.getSnapshot(),
    enabled: isBrowser,
    retry: 1,
    ...mockQueryDefaults,
  });

  return {
    ...query,
    data: query.data ? normalizeAnalyticsSnapshot(query.data) : undefined,
  };
}
