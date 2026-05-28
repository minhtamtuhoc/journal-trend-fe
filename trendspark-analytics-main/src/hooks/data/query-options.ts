import { apiConfig } from "@/api/config";
import type { AnalyticsSnapshot } from "@/services/interfaces/analytics.service";
import type { AdminOverview } from "@/services/interfaces/admin.service";
import type { Collection, NotificationItem, Paper } from "@/types/domain";
import {
  MOCK_AUDIT_LOGS,
  MOCK_HEATMAP,
  MOCK_KPIS,
  MOCK_NOTIFICATIONS,
  MOCK_PENDING_REVIEW,
  MOCK_PUBLICATION_VELOCITY,
  MOCK_RADAR_FIELDS,
  MOCK_CATEGORY_DISTRIBUTION,
  MOCK_COLLECTIONS,
} from "@/mocks";
import { MOCK_PAPERS } from "@/mocks/data/papers";
import { MOCK_TRENDING_AUTHORS } from "@/mocks/data/authors";
import { MOCK_TRENDING_KEYWORDS } from "@/mocks/data/keywords";

const mockStaleTime = Infinity;

export const mockQueryDefaults = {
  staleTime: apiConfig.useMock ? mockStaleTime : 60_000,
  gcTime: apiConfig.useMock ? mockStaleTime : 300_000,
} as const;

export const mockAnalyticsSnapshot: AnalyticsSnapshot = {
  kpis: MOCK_KPIS,
  publicationVelocity: MOCK_PUBLICATION_VELOCITY,
  categoryDistribution: MOCK_CATEGORY_DISTRIBUTION,
  radarFields: MOCK_RADAR_FIELDS,
  heatmap: MOCK_HEATMAP,
  trendingKeywords: MOCK_TRENDING_KEYWORDS,
  trendingAuthors: MOCK_TRENDING_AUTHORS,
};

export const mockAdminOverview: AdminOverview = {
  auditLogs: MOCK_AUDIT_LOGS,
  pendingReview: MOCK_PENDING_REVIEW,
};

export function papersInitialData(): Paper[] | undefined {
  return apiConfig.useMock ? MOCK_PAPERS : undefined;
}

export function notificationsInitialData(): NotificationItem[] | undefined {
  return apiConfig.useMock ? MOCK_NOTIFICATIONS : undefined;
}

export function collectionsInitialData(): Collection[] | undefined {
  return apiConfig.useMock ? MOCK_COLLECTIONS : undefined;
}
