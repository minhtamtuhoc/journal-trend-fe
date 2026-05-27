import { useQuery } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockAnalyticsSnapshot, mockQueryDefaults } from "@/hooks/data/query-options";
import { apiConfig } from "@/api/config";

export function useAnalyticsSnapshot() {
  return useQuery({
    queryKey: queryKeys.analytics.snapshot,
    queryFn: () => getServices().analytics.getSnapshot(),
    initialData: apiConfig.useMock ? mockAnalyticsSnapshot : undefined,
    ...mockQueryDefaults,
  });
}
