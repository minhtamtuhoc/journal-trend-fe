import { useQuery } from "@tanstack/react-query";
import { apiConfig } from "@/api/config";
import { getServices } from "@/services";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";

export function useSearchJournals(q?: string, limit = 24) {
  return useQuery({
    queryKey: ["journals", "search", q, limit],
    queryFn: () => getServices().journals.search(q, limit),
    enabled: isBrowser,
    placeholderData: [],
    ...mockQueryDefaults,
  });
}

export function useJournal(id: string) {
  return useQuery({
    queryKey: ["journals", "detail", id],
    queryFn: () => getServices().journals.getById(id),
    enabled: isBrowser && Boolean(id),
    ...mockQueryDefaults,
  });
}
