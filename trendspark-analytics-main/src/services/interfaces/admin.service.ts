import type { AuditLogEntry, PendingReviewPaper } from "@/types/domain";

export type AdminOverview = {
  auditLogs: AuditLogEntry[];
  pendingReview: PendingReviewPaper[];
};

export interface AdminService {
  getOverview(): Promise<AdminOverview>;
}
