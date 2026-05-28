import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults, collectionsInitialData } from "@/hooks/data/query-options";
import type { Collection } from "@/types/domain";

export function useCollections() {
  return useQuery({
    queryKey: queryKeys.collections.all,
    queryFn: () => getServices().collections.list(),
    initialData: collectionsInitialData(),
    ...mockQueryDefaults,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => getServices().collections.create({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

export function useRenameCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => getServices().collections.update(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getServices().collections.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

export function useSavePaperToCollections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paperId, collectionIds }: { paperId: string; collectionIds: string[] }) =>
      getServices().collections.savePaperToCollections({ paperId, collectionIds }),
    onMutate: async ({ paperId, collectionIds }) => {
      await qc.cancelQueries({ queryKey: queryKeys.collections.all });
      const previous = qc.getQueryData<Collection[]>(queryKeys.collections.all);

      const set = new Set(collectionIds);
      const now = new Date().toISOString();
      if (previous) {
        qc.setQueryData<Collection[]>(queryKeys.collections.all, (old) => {
          if (!old) return old;
          return old.map((c) => {
            if (!set.has(c.id)) return c;
            if (c.paperIds.includes(paperId)) return c;
            return { ...c, paperIds: [...c.paperIds, paperId], updatedAt: now };
          });
        });
      }

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.collections.all, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

