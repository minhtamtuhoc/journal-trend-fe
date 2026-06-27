import { useMutation, useQueryClient, useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";
import type { NotificationItem } from "@/types/domain";
import type { PaginatedNotifications } from "@/services/interfaces/notifications.service";

export function useNotifications() {
  const query = useInfiniteQuery<PaginatedNotifications>({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ pageParam = 0 }) => getServices().notifications.list(pageParam as number, 1000),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.last ? undefined : lastPage.page + 1;
    },
    enabled: isBrowser,
    retry: 1,
    refetchInterval: 10000, // Poll every 10 seconds to auto-refresh notifications list
    ...mockQueryDefaults,
  });

  const notifications = query.data?.pages.flatMap((page) => page.content) ?? [];

  return {
    ...query,
    notifications,
    data: notifications,
  };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getServices().notifications.markAsRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all);
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.map((n) =>
              n.id === id ? { ...n, unread: false, readStatus: "READ" as const } : n
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => getServices().notifications.markAllAsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all);
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.map((n) => ({ ...n, unread: false, readStatus: "READ" as const })),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkMultipleNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => getServices().notifications.markMultipleAsRead(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all);
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.map((n) =>
              ids.includes(n.id) ? { ...n, unread: false, readStatus: "READ" as const } : n
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteMultipleNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => getServices().notifications.deleteMultiple(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all);
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.filter((n) => !ids.includes(n.id)),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getServices().notifications.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all);
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.filter((n) => n.id !== id),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => getServices().notifications.deleteAll(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all);
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: [],
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteAllReadNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => getServices().notifications.deleteAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all);
      qc.setQueryData<InfiniteData<PaginatedNotifications>>(queryKeys.notifications.all, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            content: page.content.filter((n) => n.unread),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
