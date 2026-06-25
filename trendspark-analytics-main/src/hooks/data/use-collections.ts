import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { MOCK_COLLECTIONS } from "@/mocks";
import { mockQueryDefaults, collectionsInitialData } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";
import type { Collection } from "@/types/domain";

export function useCollections() {
  const query = useQuery({
    queryKey: queryKeys.collections.all,
    queryFn: () => getServices().collections.list(),
    enabled: isBrowser,
    initialData: collectionsInitialData(),
    placeholderData: MOCK_COLLECTIONS,
    retry: 1,
    ...mockQueryDefaults,
  });

  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCollection(collectionId: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: queryKeys.collections.detail(collectionId),
    queryFn: () => getServices().collections.getById(collectionId),
    enabled: isBrowser && Boolean(collectionId),
    initialData: () => {
      const all = qc.getQueryData<Collection[]>(queryKeys.collections.all);
      return all?.find((c) => c.id === collectionId) ?? undefined;
    },
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
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
      qc.invalidateQueries({ queryKey: queryKeys.collections.detail(id) });
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
            const shouldHave = set.has(c.id);
            const has = c.paperIds.includes(paperId);
            if (shouldHave && !has) {
              return { ...c, paperIds: [...c.paperIds, paperId], updatedAt: now };
            } else if (!shouldHave && has) {
              return { ...c, paperIds: c.paperIds.filter((id) => id !== paperId), updatedAt: now };
            }
            return c;
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

export function useRemovePaperFromCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, paperId }: { collectionId: string; paperId: string }) =>
      getServices().collections.removePaperFromCollection({ collectionId, paperId }),
    onMutate: async ({ collectionId, paperId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.collections.all });
      await qc.cancelQueries({ queryKey: queryKeys.collections.detail(collectionId) });

      const previousAll = qc.getQueryData<Collection[]>(queryKeys.collections.all);
      const previousDetail = qc.getQueryData<Collection | null>(queryKeys.collections.detail(collectionId));

      const now = new Date().toISOString();

      qc.setQueryData<Collection[]>(queryKeys.collections.all, (old) => {
        if (!old) return old;
        return old.map((c) => {
          if (c.id !== collectionId) return c;
          if (!c.paperIds.includes(paperId)) return c;
          return { ...c, paperIds: c.paperIds.filter((id) => id !== paperId), updatedAt: now };
        });
      });

      qc.setQueryData<Collection | null>(queryKeys.collections.detail(collectionId), (old) => {
        if (!old) return old;
        if (!old.paperIds.includes(paperId)) return old;
        return { ...old, paperIds: old.paperIds.filter((id) => id !== paperId), updatedAt: now };
      });

      return { previousAll, previousDetail };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previousAll) qc.setQueryData(queryKeys.collections.all, ctx.previousAll);
      if (ctx?.previousDetail !== undefined) qc.setQueryData(queryKeys.collections.detail(vars.collectionId), ctx.previousDetail);
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.collections.all });
      qc.invalidateQueries({ queryKey: queryKeys.collections.detail(vars.collectionId) });
    },
  });
}

