/** Stable 32-bit hash for reproducible pseudo-random values in mock data. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Integer in [min, max] derived deterministically from a seed string. */
export function seededInt(seed: string, min: number, max: number): number {
  const range = max - min + 1;
  const n = hashSeed(seed) % range;
  return min + n;
}

/** Float in [0, 1) derived deterministically from a seed string. */
export function seededUnit(seed: string): number {
  return (hashSeed(seed) % 10_000) / 10_000;
}
