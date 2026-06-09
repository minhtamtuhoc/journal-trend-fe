import { apiClient } from "@/api/client";
import type { ApiSource } from "@/types/brief";
import type { AdminOverview, AdminService, AdminSyncResult } from "@/services/interfaces/admin.service";

export class HttpAdminService implements AdminService {
  getOverview() {
    return apiClient.get<AdminOverview>("/admin/overview");
  }

  triggerSync() {
    return apiClient.post<AdminSyncResult>("/admin/sync", undefined, { timeoutMs: 30_000 });
  }

  getSyncStatus() {
    return apiClient.get<AdminSyncResult>("/admin/sync/status");
  }

  resetStaleSync() {
    return apiClient.post<AdminSyncResult>("/admin/sync/reset-stale");
  }

  listSources() {
    return apiClient.get<ApiSource[]>("/admin/sources");
  }

  updateSource(name: string, body: { enabled?: boolean; syncSchedule?: string }) {
    return apiClient.patch<ApiSource>(`/admin/sources/${encodeURIComponent(name)}`, body);
  }

  recalculateTrends() {
    return apiClient.post<AdminSyncResult>("/admin/trends/recalculate");
  }

  backfillTrends(months: number) {
    return apiClient.post<AdminSyncResult>("/admin/trends/backfill", undefined, { params: { months } });
  }

  getTrendDemoStats() {
    return apiClient.get<unknown>("/admin/trends/demo-stats");
  }

  repairMetadata(limit: number) {
    return apiClient.post<AdminSyncResult>("/admin/papers/repair-metadata", undefined, { params: { limit } });
  }

  listAnomalies(limit?: number) {
    return apiClient.get<unknown[]>("/admin/anomalies", { params: { limit } });
  }

  expireStaleReviews() {
    return apiClient.post<AdminSyncResult>("/admin/papers/review/expire-stale");
  }

  approveReview(id: string, note?: string) {
    return apiClient.post<unknown>(`/v1/admin/papers/${encodeURIComponent(id)}/review/accept`, undefined, { params: { note } });
  }

  deletePaper(id: string) {
    return apiClient.delete<unknown>(`/v1/admin/papers/${encodeURIComponent(id)}`);
  }
}
