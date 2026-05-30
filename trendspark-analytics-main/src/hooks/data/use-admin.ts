import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiConfig } from "@/api/config";
import { isAdminUser, useAuth } from "@/auth";
import { getServices, queryKeys } from "@/services";
import { mockAdminOverview, mockQueryDefaults } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";

export function useAdminOverview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.admin.overview,
    queryFn: () => getServices().admin.getOverview(),
    enabled: isBrowser && isAdminUser(user),
    initialData: apiConfig.useMock ? mockAdminOverview : undefined,
    placeholderData: { auditLogs: [], pendingReview: [] },
    retry: 1,
    ...mockQueryDefaults,
  });
}

export function useAdminSources() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.admin.sources,
    queryFn: () => getServices().admin.listSources(),
    enabled: isBrowser && isAdminUser(user),
    placeholderData: [],
    retry: 1,
    ...mockQueryDefaults,
  });
}

export function useUpdateAdminSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      getServices().admin.updateSource(name, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.sources }),
  });
}
