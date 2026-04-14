/**
 * Seeded PRNG (mulberry32) for deterministic slide ordering.
 * Seed 0 uses Date.now() for non-deterministic behavior.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed === 0 ? Date.now() : seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle using provided RNG. Returns new array. */
export function shuffleArray<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Compute the effective slide order for N images.
 *
 * - "sequential": identity [0, 1, 2, ..., N-1]
 * - "shuffle": Fisher-Yates shuffle of [0..N-1]
 * - "random": not pre-computed here — callers use per-slot `rng() * N`
 *   but we still return the identity for schedule building; the schedule
 *   builder handles per-slot random picks itself.
 */
export function computeEffectiveOrder(
  imageCount: number,
  order: "sequential" | "shuffle" | "random",
  seed: number
): number[] {
  const identity = Array.from({ length: imageCount }, (_, i) => i);

  if (order === "sequential" || order === "random") {
    return identity;
  }

  const rng = createSeededRng(seed);
  return shuffleArray(identity, rng);
}
