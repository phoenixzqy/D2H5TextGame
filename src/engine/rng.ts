/**
 * Seedable RNG based on mulberry32 algorithm
 * Pure, deterministic, and fast pseudorandom number generator
 */

export interface Rng {
  /** Returns a random number in [0, 1) */
  next(): number;
  /** Returns a random integer in [min, max] (inclusive) */
  nextInt(min: number, max: number): number;
  /** Picks a random element from an array */
  pick<T>(arr: readonly T[]): T;
  /** Returns true with probability p (0-1) */
  chance(p: number): boolean;
  /** Creates a derived RNG with a new seed based on a label */
  fork(label: string): Rng;
}

/**
 * Hash a string into a 32-bit unsigned integer seed
 */
export function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash >>> 0; // Convert to 32-bit unsigned
  }
  return hash;
}

/**
 * Mulberry32 PRNG implementation
 */
function createMulberry32(seed: number): () => number {
  let state = seed >>> 0; // Ensure unsigned 32-bit
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a new RNG instance with the given seed
 */
export function createRng(seed: number): Rng {
  const gen = createMulberry32(seed);

  return {
    next(): number {
      return gen();
    },

    nextInt(min: number, max: number): number {
      if (min > max) {
        throw new Error(
          `Invalid range: min (${String(min)}) > max (${String(max)})`
        );
      }
      if (!Number.isInteger(min) || !Number.isInteger(max)) {
        throw new Error(
          `Range bounds must be integers: [${String(min)}, ${String(max)}]`
        );
      }
      const range = max - min + 1;
      return Math.floor(gen() * range) + min;
    },

    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) {
        throw new Error('Cannot pick from empty array');
      }
      const index = Math.floor(gen() * arr.length);
      const element = arr[index];
      if (element === undefined) {
        throw new Error('Array index out of bounds');
      }
      return element;
    },

    chance(p: number): boolean {
      if (p < 0 || p > 1) {
        throw new Error(`Probability must be in [0,1], got ${String(p)}`);
      }
      return gen() < p;
    },

    fork(label: string): Rng {
      // Derive a new seed by hashing the label with the current state
      const derivedSeed = hashSeed(label) ^ seed;
      return createRng(derivedSeed);
    }
  };
}
