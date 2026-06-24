import type { NotificationItem } from "@/types/domain";

export interface PaginatedNotifications {
  content: NotificationItem[];
  page: number;
  totalPages: number;
  last: boolean;
  totalElements: number;
}

export interface NotificationsService {
  list(page: number, size: number): Promise<PaginatedNotifications>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  markMultipleAsRead(ids: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  deleteMultiple(ids: string[]): Promise<void>;
  deleteAll(): Promise<void>;
  deleteAllRead(): Promise<void>;
  markMultipleAsRead(ids: string[]): Promise<void>;
  deleteMultiple(ids: string[]): Promise<void>;
}
