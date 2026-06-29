import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { isBrowser } from "@/hooks/data/client-only";
import { queryKeys } from "@/services";

export type KpiCardsDto = {
  totalPapers: number;
  totalJournals: number;
  totalKeywords: number;
  trendingKeywordsCount: number;
  trendingTopicsCount: number;
  lastSyncStatus: string;
  lastSyncTime: string | null;
};

export type TopicKeywordDto = {
  term: string;
  trendScore: number;
};

export type TrendingTopicDto = {
  topicId: number;
  topicName: string;
  trendingKeywordsCount: number;
  averageTrendScore: number;
  topKeywords: TopicKeywordDto[];
};

export type TrendingKeywordDto = {
  keywordId: number;
  rank: number;
  keyword: string;
  domain: string;
  trendScore: number;
  paperCount: number;
};

export type RecentPublicationDto = {
  paperId: number;
  title: string;
  journal: string;
  publicationDate: string | null;
  citationCount: number;
  topKeywords: string[];
};

export type TopJournalDto = {
  journalId: number;
  journalName: string;
  totalPapers: number;
  impactFactor: number;
  domain: string;
};

export type SyncMonitorDto = {
  lastSyncTime: string | null;
  syncStatus: string;
  papersSynced: number;
  durationSeconds: number;
  errorMessage: string | null;
};

export type DashboardSummaryResponse = {
  kpi: KpiCardsDto;
  trendingTopics: TrendingTopicDto[];
  trendingKeywords: TrendingKeywordDto[];
  recentPublications: RecentPublicationDto[];
  topJournals: TopJournalDto[];
  syncMonitor: SyncMonitorDto | null;
};

export type KeywordChartPointDto = {
  year: number;
  month: number;
  paperCount: number;
  trendScore: number;
};

export type KeywordChartResponse = {
  keywordId: number;
  keyword: string;
  history: KeywordChartPointDto[];
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardSummaryResponse }>("/v1/dashboard/summary");
      return res.data;
    },
    enabled: isBrowser,
    staleTime: 5 * 60 * 1000,
  });
}

export function useKeywordChartData(keywordId: number | null) {
  return useQuery({
    queryKey: ["dashboard", "keyword-chart", keywordId],
    queryFn: async () => {
      if (!keywordId) return null;
      const res = await apiClient.get<{ data: KeywordChartResponse }>("/v1/dashboard/keyword-chart", {
        params: { keywordId },
      });
      return res.data;
    },
    enabled: isBrowser && Boolean(keywordId),
  });
}
