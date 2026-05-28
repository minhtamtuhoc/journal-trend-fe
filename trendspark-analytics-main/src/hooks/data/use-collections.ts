import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults, collectionsInitialData } from "@/hooks/data/query-options";

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

