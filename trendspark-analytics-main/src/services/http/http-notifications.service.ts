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

  markMultipleAsRead(ids: string[]) {
    const persistedIds = ids.filter(isPersistedNotificationId);
    if (persistedIds.length === 0) {
      return Promise.resolve();
    }
    return apiClient.patch<void>("/v1/notifications/bulk-read", null, {
      params: { ids: persistedIds.join(",") }
    });
  }

  delete(id: string) {
    if (!isPersistedNotificationId(id)) {
      hideNotifications([id]);
      return Promise.resolve();
    }
    return apiClient.delete<void>(`/v1/notifications/${id}`);
  }

  deleteMultiple(ids: string[]) {
    const persistedIds = ids.filter(isPersistedNotificationId);
    const localIds = ids.filter((id) => !isPersistedNotificationId(id));
    if (localIds.length > 0) {
      hideNotifications(localIds);
    }
    if (persistedIds.length === 0) {
      return Promise.resolve();
    }
    return apiClient.delete<void>("/v1/notifications/bulk", {
      params: { ids: persistedIds.join(",") }
    });
  }

  deleteAll() {
    return apiClient.delete<void>("/v1/notifications/all");
  }

  deleteAllRead() {
    return apiClient.delete<void>("/v1/notifications/all-read");
  }

  markMultipleAsRead(ids: string[]) {
    const persistedIds = ids.filter(isPersistedNotificationId);
    if (persistedIds.length === 0) {
      return Promise.resolve();
    }
    return apiClient.patch<void>("/v1/notifications/bulk-read", null, {
      params: { ids: persistedIds.join(",") }
    });
  }

  deleteMultiple(ids: string[]) {
    hideNotifications(ids);
    const persistedIds = ids.filter(isPersistedNotificationId);
    if (persistedIds.length > 0) {
      apiClient.delete<void>("/v1/notifications/bulk", {
        params: { ids: persistedIds.join(",") }
      }).catch((err) => console.error("Failed to delete bulk notifications on backend:", err));
    }
    return Promise.resolve();
  }
}
