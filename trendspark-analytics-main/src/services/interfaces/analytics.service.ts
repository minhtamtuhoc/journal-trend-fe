import type {
  Author,
  CategorySlice,
  DashboardHighlights,
  DashboardKpis,
  HeatmapCell,
  Keyword,
  PublicationVelocityPoint,
  RadarFieldPoint,
  TopicTrend,
} from "@/types/domain";

export type AnalyticsSnapshot = {
  kpis: DashboardKpis;
  publicationVelocity: PublicationVelocityPoint[];
  categoryDistribution: CategorySlice[];
  radarFields: RadarFieldPoint[];
  heatmap: HeatmapCell[];
  trendingKeywords: Keyword[];
  trendingAuthors: Author[];
  trendingTopics: TopicTrend[];
  highlights: DashboardHighlights;
};

export interface AnalyticsService {
  getSnapshot(): Promise<AnalyticsSnapshot>;
}
