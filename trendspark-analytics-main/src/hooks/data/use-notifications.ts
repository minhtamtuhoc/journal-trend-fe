import { useQuery } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults, notificationsInitialData } from "@/hooks/data/query-options";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => getServices().notifications.list(),
    initialData: notificationsInitialData(),
    ...mockQueryDefaults,
  });
}
