import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/api/config";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults, papersInitialData } from "@/hooks/data/query-options";

export function usePapers() {
  return useQuery({
    queryKey: queryKeys.papers.all,
    queryFn: () => getServices().papers.list(),
    initialData: papersInitialData(),
    ...mockQueryDefaults,
  });
}

export function usePaper(id: string) {
  return useQuery({
    queryKey: queryKeys.papers.detail(id),
    queryFn: () => getServices().papers.getById(id),
    enabled: Boolean(id),
    ...mockQueryDefaults,
  });
}

export function useRelatedPapers(paperId: string, category: string) {
  return useQuery({
    queryKey: queryKeys.papers.related(paperId, category),
    queryFn: () => getServices().papers.listByCategory(category, paperId, 4),
    enabled: Boolean(paperId && category),
    initialData: apiConfig.useMock
      ? MOCK_PAPERS.filter((p) => p.category === category && p.id !== paperId).slice(0, 4)
      : undefined,
    ...mockQueryDefaults,
  });
}
