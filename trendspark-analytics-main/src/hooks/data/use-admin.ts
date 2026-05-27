import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/api/config";
import { getServices, queryKeys } from "@/services";
import { mockAdminOverview, mockQueryDefaults } from "@/hooks/data/query-options";

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.admin.overview,
    queryFn: () => getServices().admin.getOverview(),
    initialData: apiConfig.useMock ? mockAdminOverview : undefined,
    ...mockQueryDefaults,
  });
}
