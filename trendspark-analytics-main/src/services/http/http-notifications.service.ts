import { apiClient } from "@/api/client";
import type { NotificationItem } from "@/types/domain";
import type { NotificationsService } from "@/services/interfaces/notifications.service";

/** Server-backed notifications use numeric string ids; fallback/demo ids do not. */
export function isPersistedNotificationId(id: string): boolean {
  return /^\d+$/.test(id);
}

export class HttpNotificationsService implements NotificationsService {
  list() {
    return apiClient.get<NotificationItem[]>("/notifications");
  }

  markAsRead(id: string) {
    if (!isPersistedNotificationId(id)) {
      return Promise.resolve();
    }
    return apiClient.patch<void>(`/notifications/${id}/read`);
  }

  markAllAsRead() {
    return apiClient.patch<void>("/notifications/read-all");
  }
}
