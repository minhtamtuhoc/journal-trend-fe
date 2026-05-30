import type { AdminService } from "@/services/interfaces/admin.service";
import type { ApiSource } from "@/types/brief";
import { MOCK_AUDIT_LOGS, MOCK_PENDING_REVIEW } from "@/mocks/data/admin";
import { mockDelay } from "@/services/utils";

const MOCK_SOURCES: ApiSource[] = [
  { name: "OpenAlex", baseUrl: "https://api.openalex.org", enabled: true, syncSchedule: "0 2 * * *", lastSyncAt: null, successRate: 99.2 },
  { name: "Crossref", baseUrl: "https://api.crossref.org", enabled: true, syncSchedule: "0 2 * * *", lastSyncAt: null, successRate: 98.5 },
  { name: "SemanticScholar", baseUrl: "https://api.semanticscholar.org", enabled: true, syncSchedule: "0 2 * * *", lastSyncAt: null, successRate: 97.1 },
];

export class MockAdminService implements AdminService {
  async getOverview() {
    await mockDelay();
    return {
      auditLogs: [...MOCK_AUDIT_LOGS],
      pendingReview: [...MOCK_PENDING_REVIEW],
    };
  }

  async triggerSync() {
    await mockDelay(300);
    return { papersFetched: 0, status: "RUNNING", message: "Đang đồng bộ metadata từ OpenAlex…" };
  }

  async getSyncStatus() {
    await mockDelay(200);
    return { papersFetched: 248, status: "SUCCESS", message: "Hoàn tất · 248 bài báo" };
  }

  async resetStaleSync() {
    await mockDelay(100);
    return { papersFetched: 0, status: "NONE", message: "Đã reset sync kẹt" };
  }

  async listSources() {
    await mockDelay();
    return [...MOCK_SOURCES];
  }

  async updateSource(name: string, body: { enabled?: boolean; syncSchedule?: string }) {
    await mockDelay();
    const src = MOCK_SOURCES.find((s) => s.name === name);
    if (!src) throw new Error(`Source not found: ${name}`);
    if (body.enabled !== undefined) src.enabled = body.enabled;
    if (body.syncSchedule !== undefined) src.syncSchedule = body.syncSchedule;
    return { ...src };
  }
}
