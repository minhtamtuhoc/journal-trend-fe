import { apiClient } from "@/api/client";
import type { NotificationItem } from "@/types/domain";
import type { NotificationsService, PaginatedNotifications } from "@/services/interfaces/notifications.service";
import { getHiddenNotifications, hideNotifications } from "@/services/notification-storage";

/** Server-backed notifications use numeric string ids; fallback/demo ids do not. */
export function isPersistedNotificationId(id: string): boolean {
  return /^\d+$/.test(id);
}

export class HttpNotificationsService implements NotificationsService {
  async list(page = 0, size = 20): Promise<PaginatedNotifications> {
    const response = await apiClient.get<any>("/v1/notifications", {
      params: { page, size }
    });

    const pageResponse = response?.data;
    const content = pageResponse?.content ?? [];

    const mappedContent = content.map((res: any): NotificationItem => {
      let uiType: "paper" | "trend" | "system" = "system";
      if (res.triggerType === "NEW_PAPER") {
        uiType = "paper";
      } else if (res.triggerType === "TRENDING_KEYWORD") {
        uiType = "trend";
      }

      return {
        id: String(res.id),
        message: res.message,
        createdAt: res.createdAt,
        readStatus: res.readStatus || "UNREAD",
        triggerType: res.triggerType || "SYSTEM",
        unread: res.readStatus === "UNREAD",
        uiType,
        paperId: res.paperId ? String(res.paperId) : undefined,
        keywordId: res.keywordId ? String(res.keywordId) : undefined,
        authorId: res.authorId ? String(res.authorId) : undefined,
        journalId: res.journalId ? String(res.journalId) : undefined,
      };
    });

    const hidden = getHiddenNotifications();
    const filteredContent = mappedContent.filter((n: NotificationItem) => !hidden.includes(n.id));

    return {
      content: filteredContent,
      page: pageResponse?.page ?? 0,
      totalPages: pageResponse?.totalPages ?? 0,
      last: pageResponse?.last ?? true,
      totalElements: pageResponse?.totalElements ?? 0,
    };
  }

  markAsRead(id: string) {
    if (!isPersistedNotificationId(id)) {
      return Promise.resolve();
    }
    return apiClient.patch<void>(`/v1/notifications/${id}/read`);
  }

  markAllAsRead() {
    return apiClient.patch<void>("/v1/notifications/read-all");
  }

  delete(id: string) {
    hideNotifications([id]);
    return Promise.resolve();
  }

  async deleteAll() {
    // Fetch up to 1000 items to hide them locally
    const res = await this.list(0, 1000);
    const ids = res.content.map((n) => n.id);
    hideNotifications(ids);
  }

  async deleteAllRead() {
    // Fetch up to 1000 items to find read ones and hide them
    const res = await this.list(0, 1000);
    const ids = res.content.filter((n) => !n.unread).map((n) => n.id);
    hideNotifications(ids);
  }
}
