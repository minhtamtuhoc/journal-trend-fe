import { seededUnit } from "@/mocks/deterministic";

const MONTH_LABELS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] as const;

/** Deterministic monthly citation curve for paper detail charts. */
export function buildPaperCitationSeries(paperId: string, totalCitations: number) {
  return MONTH_LABELS.map((m, i) => ({
    m,
    c: Math.round(totalCitations * (0.3 + (i / 12) * 0.8 + seededUnit(`${paperId}:citation:${i}`) * 0.1)),
  }));
}
