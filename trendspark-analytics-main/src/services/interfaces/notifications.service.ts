import type { NotificationItem } from "@/types/domain";

export interface NotificationsService {
  list(): Promise<NotificationItem[]>;
}
