/**
 * Deterministic pseudo-randomness.
 *
 * Quotes must be stable: refreshing the results page, re-sorting, or opening
 * the same link tomorrow has to show the same prices. Every "random" value in
 * the quote engine is therefore derived from a seed built out of the lead id
 * and the mover id, never from Math.random().
 */

export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next(): number;
  /** Uniform float in [min, max). */
  range(min: number, max: number): number;
  /** Uniform integer in [min, max]. */
  int(min: number, max: number): number;
  /** Roughly normal, clamped to [min, max]. */
  gauss(min: number, max: number): number;
  bool(probability?: number): boolean;
  pick<T>(items: readonly T[]): T;
}

export function createRng(...seedParts: Array<string | number>): Rng {
  const next = mulberry32(hashString(seedParts.join("|")));
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    gauss: (min, max) => {
      const avg = (next() + next() + next()) / 3;
      return min + avg * (max - min);
    },
    bool: (probability = 0.5) => next() < probability,
    pick: (items) => items[Math.floor(next() * items.length) % items.length],
  };
}
