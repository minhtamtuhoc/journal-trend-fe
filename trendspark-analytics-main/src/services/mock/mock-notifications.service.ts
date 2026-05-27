import type { NotificationsService } from "@/services/interfaces/notifications.service";
import { MOCK_NOTIFICATIONS } from "@/mocks/data/notifications";
import { mockDelay } from "@/services/utils";

export class MockNotificationsService implements NotificationsService {
  async list() {
    await mockDelay();
    return [...MOCK_NOTIFICATIONS];
  }
}
