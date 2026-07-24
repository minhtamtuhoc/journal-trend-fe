export interface KeywordTrendPoint {
  term: string;
  year: number;
  month?: number;
  paperCount: number;
}

export interface JournalVolumePoint {
  journalName: string;
  paperCount: number;
}

export interface TrendsSection {
  lineChart: KeywordTrendPoint[];
  barChart: JournalVolumePoint[];
}

export interface RecommendedPaper {
  id: number;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citations: number;
  doi: string;
  recommendationReason: string;
  matchType:
    | "FOLLOWED_AUTHOR"
    | "KEYWORD_OVERLAP"
    | "TOP_CITED"
    | "POPULAR"
    | "COMBINED_MATCH"
    | "TRENDING_KEYWORD"
    | "TRENDING_JOURNAL"
    | "RISING";
}

export interface AuthorInfluencePoint {
  authorId?: number;
  authorName: string;
  paperCount: number;
  mainDomain: string;
  matchingKeywordCount: number;
}

export interface KeywordCoOccurrencePoint {
  term: string;
  coOccurrenceCount: number;
  growthRate: number;
}

export interface ResearchGapPoint {
  term: string;
  paperCount: number;
  paperId?: number;
}

export interface FollowedDomain {
  domain: string;
  followedKeywords: string[];
  hotTopics: ResearchGapPoint[];
  researchGaps: ResearchGapPoint[];
}

export interface LandscapeSection {
  bubbleChart: AuthorInfluencePoint[];
  tagCloud: KeywordCoOccurrencePoint[];
  researchGaps: ResearchGapPoint[];
  followedDomains?: FollowedDomain[];
}

export interface FollowStats {
  keywordCount: number;
  authorCount: number;
  journalCount: number;
}

export interface PersonalReportResponse {
  trends: TrendsSection;
  recommendations: RecommendedPaper[];
  landscape: LandscapeSection;
  followStats: FollowStats;
}
