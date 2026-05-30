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
}
