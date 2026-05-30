import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { isPersistedNotificationId } from "@/services/http/http-notifications.service";
import { MOCK_NOTIFICATIONS } from "@/mocks";
import { mockQueryDefaults, notificationsInitialData } from "@/hooks/data/query-options";
import { isBrowser } from "@/hooks/data/client-only";
import type { NotificationItem } from "@/types/domain";

export function useNotifications() {
  const query = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => getServices().notifications.list(),
    enabled: isBrowser,
    initialData: notificationsInitialData(),
    placeholderData: MOCK_NOTIFICATIONS,
    retry: 1,
    ...mockQueryDefaults,
  });

  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getServices().notifications.markAsRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<NotificationItem[]>(queryKeys.notifications.all);
      qc.setQueryData<NotificationItem[]>(queryKeys.notifications.all, (old) =>
        old?.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: (_data, _err, id) => {
      if (isPersistedNotificationId(id)) {
        void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => getServices().notifications.markAllAsRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = qc.getQueryData<NotificationItem[]>(queryKeys.notifications.all);
      const hadPersistedUnread = previous?.some(
        (n) => n.unread && isPersistedNotificationId(n.id),
      );
      qc.setQueryData<NotificationItem[]>(queryKeys.notifications.all, (old) =>
        old?.map((n) => ({ ...n, unread: false })),
      );
      return { previous, hadPersistedUnread };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.notifications.all, ctx.previous);
    },
    onSettled: (_data, _err, _vars, ctx) => {
      if (ctx?.hadPersistedUnread) {
        void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      }
    },
  });
}
