/**
 * @deprecated Import types from `@/types/domain`, fixtures from `@/mocks`, or data via hooks/services.
 * Kept for backward compatibility during migration.
 */
export type { Paper, Author, Keyword } from "@/types/domain";

export {
  MOCK_KPIS as KPIS,
  MOCK_PUBLICATION_VELOCITY as PUBLICATION_VELOCITY,
  MOCK_CATEGORY_DISTRIBUTION as CATEGORY_DISTRIBUTION,
  MOCK_RADAR_FIELDS as RADAR_FIELDS,
  MOCK_HEATMAP as HEATMAP,
  MOCK_TRENDING_KEYWORDS as TRENDING_KEYWORDS,
  MOCK_PAPERS as PAPERS,
  MOCK_TRENDING_AUTHORS as TRENDING_AUTHORS,
  MOCK_NOTIFICATIONS as NOTIFICATIONS,
  MOCK_AUDIT_LOGS as AUDIT_LOGS,
  MOCK_PENDING_REVIEW as PENDING_REVIEW,
} from "@/mocks";
