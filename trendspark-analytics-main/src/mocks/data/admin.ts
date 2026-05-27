import type { AuditLogEntry, PendingReviewPaper } from "@/types/domain";
import { MOCK_PAPERS } from "@/mocks/data/papers";

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: "l1", actor: "system", action: "Auto-sync completed", target: "Scopus + Crossref + IEEE", time: "02:00:14", status: "ok" },
  { id: "l2", actor: "admin@helix.io", action: "Approved paper", target: "DOI 10.1038/s41560-024-01588-w", time: "Yesterday 18:42", status: "ok" },
  { id: "l3", actor: "system", action: "Dedup merged", target: "3 duplicates across CrossRef/Scopus", time: "Yesterday 14:21", status: "ok" },
  { id: "l4", actor: "system", action: "Cron retry succeeded", target: "IEEE Xplore connector", time: "Yesterday 03:08", status: "warn" },
  { id: "l5", actor: "moderator@helix.io", action: "Rejected duplicate", target: "DOI 10.1109/X.dup", time: "2d ago", status: "ok" },
];

export const MOCK_PENDING_REVIEW: PendingReviewPaper[] = MOCK_PAPERS.slice(0, 4).map((p, i) => ({
  ...p,
  status: i === 0 ? "flagged" : "pending",
}));
