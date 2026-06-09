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

export function useRecalculateTrends() {
  return useMutation({
    mutationFn: () => getServices().admin.recalculateTrends(),
  });
}

export function useBackfillTrends() {
  return useMutation({
    mutationFn: (months: number) => getServices().admin.backfillTrends(months),
  });
}

export function useTrendDemoStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.admin.demoStats,
    queryFn: () => getServices().admin.getTrendDemoStats(),
    enabled: isBrowser && isAdminUser(user),
    ...mockQueryDefaults,
  });
}

export function useRepairMetadata() {
  return useMutation({
    mutationFn: (limit: number) => getServices().admin.repairMetadata(limit),
  });
}

export function useAdminAnomalies(limit?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.admin.anomalies,
    queryFn: () => getServices().admin.listAnomalies(limit),
    enabled: isBrowser && isAdminUser(user),
    ...mockQueryDefaults,
  });
}

export function useExpireStaleReviews() {
  return useMutation({
    mutationFn: () => getServices().admin.expireStaleReviews(),
  });
}

export function useApprovePaper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      getServices().admin.approveReview(id, note),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["pending-review"] });
      const previous = qc.getQueryData<unknown[]>(["pending-review"]);
      if (previous) {
        qc.setQueryData(
          ["pending-review"],
          previous.filter((item: any) => item.id !== id)
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(["pending-review"], context.previous);
      }
    },
    onSuccess: (data, { id }) => {
      qc.setQueryData(
        ["pending-review"],
        (old: unknown[] | undefined) => old?.filter((item: any) => item.id !== id) ?? []
      );
      qc.invalidateQueries({ queryKey: queryKeys.admin.overview });
    },
  });
}

export function useDeletePaper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      getServices().admin.deletePaper(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["pending-review"] });
      const previous = qc.getQueryData<unknown[]>(["pending-review"]);
      if (previous) {
        qc.setQueryData(
          ["pending-review"],
          previous.filter((item: any) => item.id !== id)
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(["pending-review"], context.previous);
      }
    },
    onSuccess: (data, id) => {
      qc.setQueryData(
        ["pending-review"],
        (old: unknown[] | undefined) => old?.filter((item: any) => item.id !== id) ?? []
      );
      qc.invalidateQueries({ queryKey: queryKeys.admin.overview });
      qc.invalidateQueries({ queryKey: queryKeys.papers.all });
    },
  });
}

export function usePendingReview() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pending-review"],
    queryFn: async () => {
      const overview = await getServices().admin.getOverview();
      return overview.pendingReview;
    },
    enabled: isBrowser && isAdminUser(user),
    placeholderData: [],
    retry: 1,
    ...mockQueryDefaults,
  });
}
