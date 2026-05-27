import type {
  Author,
  CategorySlice,
  DashboardKpis,
  HeatmapCell,
  Keyword,
  PublicationVelocityPoint,
  RadarFieldPoint,
} from "@/types/domain";

export type AnalyticsSnapshot = {
  kpis: DashboardKpis;
  publicationVelocity: PublicationVelocityPoint[];
  categoryDistribution: CategorySlice[];
  radarFields: RadarFieldPoint[];
  heatmap: HeatmapCell[];
  trendingKeywords: Keyword[];
  trendingAuthors: Author[];
};

export interface AnalyticsService {
  getSnapshot(): Promise<AnalyticsSnapshot>;
}
