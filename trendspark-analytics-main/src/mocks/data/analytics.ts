import type {
  CategorySlice,
  DashboardKpis,
  HeatmapCell,
  PublicationVelocityPoint,
  RadarFieldPoint,
} from "@/types/domain";
import { seededInt } from "@/mocks/deterministic";

export const MOCK_KPIS: DashboardKpis = {
  trendScore: 84.2,
  trendScoreDelta: 18.4,
  activeKeywords: 1284,
  citationVolume: "42.8M",
  syncHealth: 99.9,
  trendingPapers: 327,
  trendingAuthors: 142,
};

export const MOCK_PUBLICATION_VELOCITY: PublicationVelocityPoint[] = [
  { month: "Jan", papers: 2400, citations: 12400 },
  { month: "Feb", papers: 2700, citations: 14100 },
  { month: "Mar", papers: 3100, citations: 16800 },
  { month: "Apr", papers: 2950, citations: 18200 },
  { month: "May", papers: 3400, citations: 21500 },
  { month: "Jun", papers: 3800, citations: 24800 },
  { month: "Jul", papers: 4100, citations: 28400 },
  { month: "Aug", papers: 4500, citations: 31200 },
  { month: "Sep", papers: 4900, citations: 34800 },
  { month: "Oct", papers: 5300, citations: 39200 },
  { month: "Nov", papers: 5600, citations: 42100 },
  { month: "Dec", papers: 6100, citations: 45800 },
];

export const MOCK_CATEGORY_DISTRIBUTION: CategorySlice[] = [
  { name: "Bio-Tech", value: 34, fill: "var(--chart-1)" },
  { name: "Quantum Computing", value: 22, fill: "var(--chart-2)" },
  { name: "AI / ML", value: 18, fill: "var(--chart-3)" },
  { name: "Climate Systems", value: 14, fill: "var(--chart-4)" },
  { name: "Materials Science", value: 12, fill: "var(--chart-5)" },
];

export const MOCK_RADAR_FIELDS: RadarFieldPoint[] = [
  { field: "AI/ML", current: 92, previous: 78 },
  { field: "Genomics", current: 84, previous: 70 },
  { field: "Quantum", current: 76, previous: 55 },
  { field: "Climate", current: 68, previous: 62 },
  { field: "Robotics", current: 72, previous: 65 },
  { field: "NanoTech", current: 80, previous: 71 },
];

const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const MOCK_HEATMAP: HeatmapCell[] = Array.from({ length: 12 }, (_, w) => w + 1).flatMap((week) =>
  HEATMAP_DAYS.map((day) => ({
    week: `W${week}`,
    day,
    value: seededInt(`heatmap:${week}:${day}`, 20, 99),
  })),
);
