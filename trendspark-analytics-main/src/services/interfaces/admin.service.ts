import type { ApiSource } from "@/types/brief";
import type { AuditLogEntry, PendingReviewPaper } from "@/types/domain";

export type AdminOverview = {
  auditLogs: AuditLogEntry[];
  pendingReview: PendingReviewPaper[];
};

export type AdminSyncResult = {
  papersFetched: number;
  status: string;
  message: string;
};

export interface AdminService {
  getOverview(): Promise<AdminOverview>;
  triggerSync(): Promise<AdminSyncResult>;
  getSyncStatus(): Promise<AdminSyncResult>;
  resetStaleSync(): Promise<AdminSyncResult>;
  listSources(): Promise<ApiSource[]>;
  updateSource(name: string, body: { enabled?: boolean; syncSchedule?: string }): Promise<ApiSource>;
  recalculateTrends(): Promise<AdminSyncResult>;
  backfillTrends(months: number): Promise<AdminSyncResult>;
  getTrendDemoStats(): Promise<unknown>;
  repairMetadata(limit: number): Promise<AdminSyncResult>;
  listAnomalies(limit?: number): Promise<unknown[]>;
  expireStaleReviews(): Promise<AdminSyncResult>;
  approveReview(id: string, note?: string): Promise<unknown>;
  deletePaper(id: string): Promise<unknown>;
}
