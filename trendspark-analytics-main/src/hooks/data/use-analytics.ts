import { useQuery } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockAnalyticsSnapshot, mockQueryDefaults } from "@/hooks/data/query-options";
import { normalizeAnalyticsSnapshot } from "@/lib/normalize-analytics";
import { apiConfig } from "@/api/config";
import { isBrowser } from "@/hooks/data/client-only";

const normalizedMock = normalizeAnalyticsSnapshot(mockAnalyticsSnapshot);

export function useAnalyticsSnapshot() {
  const query = useQuery({
    queryKey: queryKeys.analytics.snapshot,
    queryFn: () => getServices().analytics.getSnapshot(),
    enabled: isBrowser,
    initialData: apiConfig.useMock ? normalizedMock : undefined,
    placeholderData: normalizedMock,
    retry: 1,
    ...mockQueryDefaults,
  });

  return {
    ...query,
    data: query.data ? normalizeAnalyticsSnapshot(query.data) : normalizedMock,
  };
}
