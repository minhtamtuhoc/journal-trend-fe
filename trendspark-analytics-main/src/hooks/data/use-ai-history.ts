import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth";
import { isBrowser } from "@/hooks/data/client-only";
import { mockQueryDefaults } from "@/hooks/data/query-options";

export interface AiAnalysisHistorySummaryItem {
  id: number;
  analysisType: "TOP_TRENDS" | "SINGLE_KEYWORD";
  targetKeywords: string[];
  overallVerdict?: string;
  createdAt: string;
}

export interface AiAnalysisHistoryDetailPage {
  id: number;
  analysisType: "TOP_TRENDS" | "SINGLE_KEYWORD";
  targetKeywords: string[];
  overallVerdict?: string;
  createdAt: string;
  result: any;
}

export interface PageResponseData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function useAiHistoryList(page = 0, size = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai-history-list", page, size],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PageResponseData<AiAnalysisHistorySummaryItem> }>(
        "/v1/ai/history",
        { params: { page, size } }
      );
      return res.data;
    },
    enabled: isBrowser && Boolean(user),
    ...mockQueryDefaults,
  });
}

export function useAiHistoryDetail(id: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai-history-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get<{ data: AiAnalysisHistoryDetailPage }>(
        `/v1/ai/history/${id}`
      );
      return res.data;
    },
    enabled: isBrowser && Boolean(user) && Boolean(id),
    ...mockQueryDefaults,
  });
}

export function useDeleteAiHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/v1/ai/history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-history-list"] });
    },
  });
}

export function useClearAllAiHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete("/v1/ai/history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-history-list"] });
    },
  });
}
