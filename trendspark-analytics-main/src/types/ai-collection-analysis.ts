export interface AiCollectionAnalysisRequest {
  paperIds?: (number | string)[];
}

export interface TopicCluster {
  name: string;
  description: string;
  paperIds: number[];
}

export interface OutlierPaper {
  paperId: number;
  title: string;
  reason: string;
}

export interface CorePaper {
  paperId: number;
  title: string;
  citationCount: number;
  reason: string;
}

export interface AiCollectionAnalysisResponse {
  collectionId: number;
  collectionName: string;
  paperCount: number;
  analyzedPaperCount: number;
  overallSummary: string;
  topicClusters: TopicCluster[];
  trendOverTime: string;
  commonalities: string;
  outliers: OutlierPaper[];
  corePapers: CorePaper[];
  researchGaps: string[];
  collaborationHighlights: string;
  recommendation: string;
}
