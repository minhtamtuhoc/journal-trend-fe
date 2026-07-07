export type PaperSource = "OpenAlex" | "CrossRef" | "Semantic Scholar";

export type AuthorRef = {
  id: string;
  name: string;
};

/** Mirrors backend HelixTopicRef: a keyword with its persisted topic ID. */
export type TopicRef = {
  id: string;
  name: string;
};

export type Paper = {
  id: string;
  title: string;
  authors: string[];
  authorRefs?: AuthorRef[];
  journal: string;
  journalId?: string | null;
  year: number;
  citations: number;
  trendScore: number;
  keywords: TopicRef[];
  category: string;
  impactFactor: number;
  doi: string;
  abstract: string;
  source: PaperSource;
  openAccess?: boolean;
};

export type Author = {
  id: string;
  name: string;
  affiliation: string;
  papers: number;
  citations: number;
  hIndex: number;
  trendScore: number;
};


export type FollowedAuthor = {
  id: string | null;
  name: string;
};


export type AuthorProfile = Author & {
  openAlexId?: string | null;
  source?: string;
};

export type Keyword = {
  id: string;
  term: string;
  count: number;
  trendScore: number;
  monthsTrending: number;
  category: string;
};

export type TopicTrend = {
  id: string;
  name: string;
  paperCount: number;
  trendScore: number;
  rank: number;
};

export type HighlightCard = {
  id: string;
  title: string;
  subtitle: string;
  metric: number;
  metricLabel: string;
};

export type DashboardHighlights = {
  topKeyword: HighlightCard;
  topAuthor: HighlightCard;
  topPaper: HighlightCard;
  topFollowedTopic: HighlightCard;
};

export type TopicDetail = {
  id: string;
  name: string;
  description: string;
  paperCount: number;
  trendScore: number;
};

export type DashboardKpis = {
  trendScore: number;
  trendScoreDelta: number;
  activeKeywords: number;
  citationVolume: string;
  syncHealth: number;
  trendingPapers: number;
  trendingAuthors: number;
};

export type PublicationVelocityPoint = {
  month: string;
  papers: number;
  citations: number;
};

export type CategorySlice = {
  name: string;
  value: number;
  fill: string;
};

export type RadarFieldPoint = {
  field: string;
  current: number;
  previous: number;
};

export type HeatmapCell = {
  week: string;
  day: string;
  value: number;
};

export type NotificationItem = {
  id: string;
  message: string;
  createdAt: string;
  readStatus: "READ" | "UNREAD";
  triggerType: "NEW_PAPER" | "TRENDING_KEYWORD" | "SYSTEM";
  unread: boolean;
  uiType: "paper" | "trend" | "system";
  paperId?: string;
  authorId?: string;
  journalId?: string;
  keywordId?: string;
};

export type Collection = {
  id: string;
  name: string;
  /** IDs of papers saved into this collection (backend-ready shape). */
  paperIds: string[];
  /** ISO timestamp. */
  updatedAt: string;
};

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  status: "ok" | "warn" | "error" | "SUCCESS" | "success" | "RUNNING" | "running" | "FAILED" | "failed";
};

export type PendingReviewPaper = Paper & {
  status: "pending" | "flagged";
};

export type UserAdminResponse = {
  id: number;
  email: string;
  fullName: string;
  role: "STUDENT" | "LECTURER" | "RESEARCHER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "LOCKED" | string;
  createdAt: string;
  updatedAt: string;
};

export type SearchHistoryEntry = {
  query: string;
  searchType: "papers" | "authors" | "keywords";
};

export type AuthorSpotlightEntry = {
  id: string;
  name: string;
  affiliation: string;
  papers: number;
  citations: number;
  hIndex: number;
};

export type AuthorSpotlight = {
  mostPapers: AuthorSpotlightEntry | null;
  mostCitations: AuthorSpotlightEntry | null;
  mostHIndex: AuthorSpotlightEntry | null;
};


