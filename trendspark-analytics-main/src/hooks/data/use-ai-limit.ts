import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { isBrowser } from "@/hooks/data/client-only";
import { mockQueryDefaults } from "@/hooks/data/query-options";

export interface AiCollectionAnalysisLimitResponse {
  maxPapers: number;
}

export function useAiCollectionAnalysisLimit() {
  return useQuery({
    queryKey: ["ai-collection-analysis-limit"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AiCollectionAnalysisLimitResponse }>(
        "/v1/ai/collection-analysis-limit"
      );
      return res.data;
    },
    enabled: isBrowser,
    ...mockQueryDefaults,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAiCollectionAnalysisLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (maxPapers: number) => {
      const res = await apiClient.put<{ data: AiCollectionAnalysisLimitResponse }>(
        "/v1/admin/settings/ai-collection-analysis-limit",
        { maxPapers }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-collection-analysis-limit"] });
    },
  });
}
