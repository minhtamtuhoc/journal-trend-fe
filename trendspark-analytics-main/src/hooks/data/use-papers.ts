import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/api/config";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults, papersInitialData } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";

export function usePapers() {
  return useQuery({
    queryKey: queryKeys.papers.all,
    queryFn: () => getServices().papers.list(),
    enabled: isBrowser,
    initialData: papersInitialData(),
    placeholderData: apiConfig.useMock ? MOCK_PAPERS : [],
    ...mockQueryDefaults,
  });
}

export function usePaper(id: string) {
  return useQuery({
    queryKey: queryKeys.papers.detail(id),
    queryFn: async () => {
      const paper = await getServices().papers.getById(id);
      if (!paper) throw new Error("Paper not found");
      return paper;
    },
    enabled: isBrowser && Boolean(id),
    retry: false,
    ...mockQueryDefaults,
  });
}

export function usePapersByTopic(topicId: string) {
  return useQuery({
    queryKey: queryKeys.papers.byTopic(topicId),
    queryFn: () => getServices().papers.listByTopic(topicId),
    enabled: isBrowser && Boolean(topicId),
    placeholderData: apiConfig.useMock ? [] : undefined,
    ...mockQueryDefaults,
  });
}

export function useRelatedPapers(paperId: string, category: string) {
  return useQuery({
    queryKey: queryKeys.papers.related(paperId, category),
    queryFn: () => getServices().papers.listByCategory(category, paperId, 4),
    enabled: isBrowser && Boolean(paperId && category),
    initialData: apiConfig.useMock
      ? MOCK_PAPERS.filter((p) => p.category === category && p.id !== paperId).slice(0, 4)
      : undefined,
    ...mockQueryDefaults,
  });
}
