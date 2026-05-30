import type { AuditLogEntry, PendingReviewPaper } from "@/types/domain";

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: "l1", actor: "system", action: "Auto-sync completed", target: "OpenAlex + Crossref + Semantic Scholar", time: "02:00:14", status: "ok" },
  { id: "l2", actor: "admin@helix.io", action: "Manual sync triggered", target: "OpenAlex ingest", time: "Yesterday 18:02", status: "ok" },
  { id: "l3", actor: "system", action: "Dedup merged", target: "3 duplicates by DOI (Crossref/OpenAlex)", time: "Yesterday 14:21", status: "ok" },
  { id: "l4", actor: "system", action: "Enrich batch", target: "Semantic Scholar metadata", time: "Yesterday 03:08", status: "ok" },
];

export const MOCK_PENDING_REVIEW: PendingReviewPaper[] = [];
