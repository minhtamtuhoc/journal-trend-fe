import type { NotificationsService, PaginatedNotifications } from "@/services/interfaces/notifications.service";
import type { NotificationItem } from "@/types/domain";
import { MOCK_NOTIFICATIONS } from "@/mocks/data/notifications";
import { mockDelay } from "@/services/utils";
import { getHiddenNotifications, hideNotifications } from "@/services/notification-storage";

let items = MOCK_NOTIFICATIONS.map((n) => ({ ...n }));

export class MockNotificationsService implements NotificationsService {
  async list(page = 0, size = 20): Promise<PaginatedNotifications> {
    await mockDelay();
    const hidden = getHiddenNotifications();
    const filtered = items.filter((n) => !hidden.includes(n.id));
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);
    const last = end >= filtered.length;
    return {
      content,
      page,
      totalPages: Math.ceil(filtered.length / size),
      last,
      totalElements: filtered.length,
    };
  }

  async markAsRead(id: string) {
    await mockDelay(200);
    items = items.map((n) => (n.id === id ? { ...n, unread: false, readStatus: "READ" } : n));
  }

  async markAllAsRead() {
    await mockDelay(200);
    items = items.map((n) => ({ ...n, unread: false, readStatus: "READ" }));
  }

  async markMultipleAsRead(ids: string[]) {
    await mockDelay(200);
    items = items.map((n) =>
      ids.includes(n.id) ? { ...n, unread: false, readStatus: "READ" } : n
    );
  }

  async delete(id: string) {
    await mockDelay(100);
    items = items.filter((n) => n.id !== id);
    hideNotifications([id]);
  }

  async deleteMultiple(ids: string[]) {
    await mockDelay(100);
    items = items.filter((n) => !ids.includes(n.id));
    hideNotifications(ids);
  }

  async deleteAll() {
    await mockDelay(100);
    const visible = await this.list(0, 1000);
    const ids = visible.content.map((n) => n.id);
    items = items.filter((n) => !ids.includes(n.id));
    hideNotifications(ids);
  }

  async deleteAllRead() {
    await mockDelay(100);
    const visible = await this.list(0, 1000);
    const ids = visible.content.filter((n) => !n.unread).map((n) => n.id);
    items = items.filter((n) => !ids.includes(n.id));
    hideNotifications(ids);
  }
}
