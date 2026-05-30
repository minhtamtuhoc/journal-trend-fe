import type { NotificationsService } from "@/services/interfaces/notifications.service";
import type { NotificationItem } from "@/types/domain";
import { MOCK_NOTIFICATIONS } from "@/mocks/data/notifications";
import { mockDelay } from "@/services/utils";

let items = MOCK_NOTIFICATIONS.map((n) => ({ ...n }));

export class MockNotificationsService implements NotificationsService {
  async list() {
    await mockDelay();
    return [...items];
  }

  async markAsRead(id: string) {
    await mockDelay(200);
    items = items.map((n) => (n.id === id ? { ...n, unread: false } : n));
  }

  async markAllAsRead() {
    await mockDelay(200);
    items = items.map((n) => ({ ...n, unread: false }));
  }
}
