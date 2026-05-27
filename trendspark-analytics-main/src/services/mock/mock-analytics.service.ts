import type { AnalyticsService, AnalyticsSnapshot } from "@/services/interfaces/analytics.service";
import {
  MOCK_CATEGORY_DISTRIBUTION,
  MOCK_HEATMAP,
  MOCK_KPIS,
  MOCK_PUBLICATION_VELOCITY,
  MOCK_RADAR_FIELDS,
} from "@/mocks/data/analytics";
import { MOCK_TRENDING_AUTHORS } from "@/mocks/data/authors";
import { MOCK_TRENDING_KEYWORDS } from "@/mocks/data/keywords";
import { mockDelay } from "@/services/utils";

export class MockAnalyticsService implements AnalyticsService {
  async getSnapshot(): Promise<AnalyticsSnapshot> {
    await mockDelay();
    return {
      kpis: MOCK_KPIS,
      publicationVelocity: MOCK_PUBLICATION_VELOCITY,
      categoryDistribution: MOCK_CATEGORY_DISTRIBUTION,
      radarFields: MOCK_RADAR_FIELDS,
      heatmap: MOCK_HEATMAP,
      trendingKeywords: MOCK_TRENDING_KEYWORDS,
      trendingAuthors: MOCK_TRENDING_AUTHORS,
    };
  }
}
