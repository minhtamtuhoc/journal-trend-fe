import type { Collection } from "@/types/domain";
import { seededInt } from "@/mocks/deterministic";
import { MOCK_PAPERS } from "@/mocks/data/papers";

function isoNowMinus(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

const BASE_NAMES = [
  "Edge AI Reading List",
  "CRISPR Breakthroughs",
  "Quantum Materials",
  "Climate Adaptation",
  "Neural Radiance Notes",
] as const;

export const MOCK_COLLECTIONS: Collection[] = BASE_NAMES.map((name, idx) => {
  const seed = `collection:${name}:${idx}`;
  const count = seededInt(seed, 3, 14);
  const start = seededInt(`${seed}:start`, 0, Math.max(0, MOCK_PAPERS.length - count));
  const paperIds = MOCK_PAPERS.slice(start, start + count).map((p) => p.id);

  // Deterministic "updatedAt" spread from ~10 minutes to ~9 days ago.
  const minutesAgo = seededInt(`${seed}:updated`, 10, 9 * 24 * 60);

  return {
    id: `col_${idx + 1}`,
    name,
    paperIds,
    updatedAt: isoNowMinus(minutesAgo),
  };
});

