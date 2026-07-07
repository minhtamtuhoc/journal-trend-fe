import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";

export function useRecentSearches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.searchHistory.recent,
    queryFn: () => getServices().searchHistory.getRecentSearches(),
    enabled: isBrowser && Boolean(user),
    placeholderData: [],
    retry: 1,
    ...mockQueryDefaults,
  });
}

export function useRecordSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ query, searchType }: { query: string; searchType: "papers" | "authors" | "keywords" }) =>
      getServices().searchHistory.recordSearch(query, searchType),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.searchHistory.recent }),
  });
}
