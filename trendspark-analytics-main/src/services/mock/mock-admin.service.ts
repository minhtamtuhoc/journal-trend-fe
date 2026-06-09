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

  async recalculateTrends() {
    await mockDelay(150);
    return { papersFetched: 0, status: "SUCCESS", message: "Recalculated all trends successfully" };
  }

  async backfillTrends(months: number) {
    await mockDelay(150);
    return { papersFetched: 0, status: "SUCCESS", message: `Backfilled historical trends for ${months} months` };
  }

  async getTrendDemoStats() {
    await mockDelay(100);
    return { totalTrendRecords: 120, status: "SUCCESS" };
  }

  async repairMetadata(limit: number) {
    await mockDelay(200);
    return { papersFetched: limit, status: "SUCCESS", message: `Repaired ${limit} papers` };
  }

  async listAnomalies(limit = 20) {
    await mockDelay(100);
    return [
      { topicId: "1", topicName: "LNP", trendScore: 310.2, paperCount: 15, detectedAt: new Date().toISOString() }
    ].slice(0, limit);
  }

  async expireStaleReviews() {
    await mockDelay(150);
    return { papersFetched: 0, status: "SUCCESS", message: "Expired stale reviews successfully" };
  }

  async approveReview(id: string, note?: string) {
    await mockDelay(150);
    return { status: "SUCCESS", message: "Approved (mock)" };
  }

  async deletePaper(id: string) {
    await mockDelay(150);
    return { status: "SUCCESS", message: "Deleted (mock)" };
  }
}
