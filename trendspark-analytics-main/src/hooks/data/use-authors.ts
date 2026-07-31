import { useQuery } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { isBrowser } from "@/hooks/data/client-only";
import { mockQueryDefaults } from "@/hooks/data/query-options";

export function useAuthors(params: { page: number; size: number; q?: string; topicId?: string; sort?: "papers" | "citations" | "hIndex" }) {
  return useQuery({
    queryKey: queryKeys.authors.list(params),
    queryFn: () => getServices().authors.list(params),
    enabled: isBrowser,
    ...mockQueryDefaults,
  });
}

export function useFeaturedAuthors() {
  return useQuery({
    queryKey: queryKeys.authors.featured,
    queryFn: () => getServices().authors.listFeatured(24),
    enabled: isBrowser,
    ...mockQueryDefaults,
  });
}

export function useAuthor(authorId: string) {
  return useQuery({
    queryKey: queryKeys.authors.detail(authorId),
    queryFn: async () => {
      try {
        const author = await getServices().authors.getById(authorId);
        return author ?? null;
      } catch (err) {
        return null;
      }
    },
    enabled: isBrowser && Boolean(authorId),
    retry: false,
    ...mockQueryDefaults,
  });
}

export function useAuthorPapers(authorId: string) {
  return useQuery({
    queryKey: queryKeys.authors.papers(authorId),
    queryFn: async () => {
      try {
        const papers = await getServices().authors.listPapers(authorId);
        return papers ?? [];
      } catch (err) {
        return [];
      }
    },
    enabled: isBrowser && Boolean(authorId),
    retry: false,
    ...mockQueryDefaults,
  });
}

export function useAuthorSpotlight() {
  return useQuery({
    queryKey: queryKeys.authors.spotlight,
    queryFn: () => getServices().authors.getSpotlight(),
    enabled: isBrowser,
    ...mockQueryDefaults,
  });
}

