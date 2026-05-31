import { useQuery } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { isBrowser } from "@/hooks/data/client-only";
import { mockQueryDefaults } from "@/hooks/data/query-options";

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
      const author = await getServices().authors.getById(authorId);
      if (!author) throw new Error("Author not found");
      return author;
    },
    enabled: isBrowser && Boolean(authorId),
    retry: false,
    ...mockQueryDefaults,
  });
}

export function useAuthorPapers(authorId: string) {
  return useQuery({
    queryKey: queryKeys.authors.papers(authorId),
    queryFn: () => getServices().authors.listPapers(authorId),
    enabled: isBrowser && Boolean(authorId),
    ...mockQueryDefaults,
  });
}
