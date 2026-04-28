import { describe, it, expect } from 'vitest';
import { createRng, hashSeed } from './rng';

describe('RNG - Determinism', () => {
  it('produces identical sequences for the same seed', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);

    const seq1 = Array.from({ length: 100 }, () => rng1.next());
    const seq2 = Array.from({ length: 100 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(54321);

    const seq1 = Array.from({ length: 100 }, () => rng1.next());
    const seq2 = Array.from({ length: 100 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });
});

describe('RNG - next()', () => {
  it('returns values in [0, 1)', () => {
    const rng = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('has reasonable distribution', () => {
    const rng = createRng(999);
    const buckets = [0, 0, 0, 0];
    const samples = 10000;

    for (let i = 0; i < samples; i++) {
      const val = rng.next();
      const bucket = Math.floor(val * 4);
      const currentCount = buckets[bucket];
      if (currentCount !== undefined) {
        buckets[bucket] = currentCount + 1;
      }
    }

    // Each bucket should have ~2500 samples (±20%)
    buckets.forEach((count) => {
      expect(count).toBeGreaterThan(samples / 4 - samples * 0.2);
      expect(count).toBeLessThan(samples / 4 + samples * 0.2);
    });
  });
});

describe('RNG - nextInt()', () => {
  it('returns integers in [min, max] inclusive', () => {
    const rng = createRng(777);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(10, 20);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });

  it('includes both bounds', () => {
    const rng = createRng(888);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      seen.add(rng.nextInt(1, 3));
    }
    expect(seen.has(1)).toBe(true);
    expect(seen.has(2)).toBe(true);
    expect(seen.has(3)).toBe(true);
  });

  it('throws on invalid range', () => {
    const rng = createRng(123);
    expect(() => rng.nextInt(10, 5)).toThrow('Invalid range');
  });

  it('throws on non-integer bounds', () => {
    const rng = createRng(456);
    expect(() => rng.nextInt(1.5, 10)).toThrow('must be integers');
  });
});

describe('RNG - pick()', () => {
  it('picks elements from array', () => {
    const rng = createRng(333);
    const arr = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 100; i++) {
      const val = rng.pick(arr);
      expect(arr).toContain(val);
    }
  });

  it('covers all elements over many picks', () => {
    const rng = createRng(444);
    const arr = [1, 2, 3, 4, 5];
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      seen.add(rng.pick(arr));
    }
    expect(seen.size).toBe(5);
  });

  it('throws on empty array', () => {
    const rng = createRng(555);
    expect(() => rng.pick([])).toThrow('Cannot pick from empty array');
  });
});

describe('RNG - chance()', () => {
  it('returns true/false based on probability', () => {
    const rng = createRng(666);
    const results = Array.from({ length: 1000 }, () => rng.chance(0.3));
    const trueCount = results.filter((x) => x).length;

    // Should be ~300 trues (±20%)
    expect(trueCount).toBeGreaterThan(200);
    expect(trueCount).toBeLessThan(400);
  });

  it('returns true for p=1', () => {
    const rng = createRng(111);
    for (let i = 0; i < 10; i++) {
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('returns false for p=0', () => {
    const rng = createRng(222);
    for (let i = 0; i < 10; i++) {
      expect(rng.chance(0)).toBe(false);
    }
  });

  it('throws on invalid probability', () => {
    const rng = createRng(999);
    expect(() => rng.chance(-0.1)).toThrow('Probability must be in');
    expect(() => rng.chance(1.1)).toThrow('Probability must be in');
  });
});

describe('RNG - fork()', () => {
  it('produces independent streams', () => {
    const rng = createRng(1000);
    const child1 = rng.fork('combat');
    const child2 = rng.fork('loot');

    const seq1 = Array.from({ length: 10 }, () => child1.next());
    const seq2 = Array.from({ length: 10 }, () => child2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('produces deterministic forks', () => {
    const rng1 = createRng(2000);
    const rng2 = createRng(2000);

    const child1 = rng1.fork('drops');
    const child2 = rng2.fork('drops');

    const seq1 = Array.from({ length: 10 }, () => child1.next());
    const seq2 = Array.from({ length: 10 }, () => child2.next());

    expect(seq1).toEqual(seq2);
  });

  it('produces different streams for different labels', () => {
    const rng = createRng(3000);
    const childA = rng.fork('A');
    const childB = rng.fork('B');

    expect(childA.next()).not.toBe(childB.next());
  });
});

describe('hashSeed()', () => {
  it('produces consistent hashes', () => {
    expect(hashSeed('test')).toBe(hashSeed('test'));
  });

  it('produces different hashes for different strings', () => {
    expect(hashSeed('abc')).not.toBe(hashSeed('def'));
  });

  it('handles empty string', () => {
    expect(typeof hashSeed('')).toBe('number');
  });
});
