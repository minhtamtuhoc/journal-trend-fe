export type PaperSource = "Scopus" | "CrossRef" | "IEEE Xplore";

export type Paper = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citations: number;
  trendScore: number;
  keywords: string[];
  category: string;
  impactFactor: number;
  doi: string;
  abstract: string;
  source: PaperSource;
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

export type Keyword = {
  id: string;
  term: string;
  count: number;
  trendScore: number;
  monthsTrending: number;
  category: string;
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
  type: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  status: "ok" | "warn" | "error";
};

export type PendingReviewPaper = Paper & {
  status: "pending" | "flagged";
};
