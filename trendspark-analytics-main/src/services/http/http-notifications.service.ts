import { apiClient } from "@/api/client";
import type { NotificationItem } from "@/types/domain";
import type { NotificationsService } from "@/services/interfaces/notifications.service";

export class HttpNotificationsService implements NotificationsService {
  list() {
    return apiClient.get<NotificationItem[]>("/notifications");
  }
}
