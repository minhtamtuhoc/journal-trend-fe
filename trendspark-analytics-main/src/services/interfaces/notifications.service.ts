import type { NotificationItem } from "@/types/domain";

export interface NotificationsService {
  list(): Promise<NotificationItem[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
}
