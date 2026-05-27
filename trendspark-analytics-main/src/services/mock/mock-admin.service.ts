import type { AdminService } from "@/services/interfaces/admin.service";
import { MOCK_AUDIT_LOGS, MOCK_PENDING_REVIEW } from "@/mocks/data/admin";
import { mockDelay } from "@/services/utils";

export class MockAdminService implements AdminService {
  async getOverview() {
    await mockDelay();
    return {
      auditLogs: [...MOCK_AUDIT_LOGS],
      pendingReview: [...MOCK_PENDING_REVIEW],
    };
  }
}
