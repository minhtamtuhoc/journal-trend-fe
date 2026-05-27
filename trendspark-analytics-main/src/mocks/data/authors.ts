import type { Author } from "@/types/domain";

export const MOCK_TRENDING_AUTHORS: Author[] = [
  { id: "a1", name: "Dr. Yara Chen", affiliation: "MIT — Broad Institute", papers: 42, citations: 8420, hIndex: 38, trendScore: 94.2 },
  { id: "a2", name: "Prof. Anton Markov", affiliation: "ETH Zürich", papers: 31, citations: 5210, hIndex: 29, trendScore: 88.7 },
  { id: "a3", name: "Dr. Lina Schmidt", affiliation: "Stanford Neuroscience", papers: 28, citations: 6140, hIndex: 32, trendScore: 86.1 },
  { id: "a4", name: "Prof. Kenji Nakamura", affiliation: "Tokyo Institute of Tech", papers: 47, citations: 9120, hIndex: 41, trendScore: 83.4 },
  { id: "a5", name: "Dr. Elena Goldberg", affiliation: "DeepMind", papers: 22, citations: 4820, hIndex: 24, trendScore: 81.9 },
  { id: "a6", name: "Prof. Fiona Andersen", affiliation: "Oxford Climate Lab", papers: 19, citations: 3210, hIndex: 22, trendScore: 74.6 },
];
