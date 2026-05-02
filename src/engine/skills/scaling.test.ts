import { describe, expect, it } from 'vitest';
import {
  maxFirstThreeThenEveryThreeForLevel,
  maxSkeletonsForLevel,
  resolveSummonMaxCount
} from './scaling';
import type { SummonEffect } from './effects';

describe('summon max-count scaling', () => {
  it('caps Raise Skeleton at 1/2/3 summons on levels 1/6/12', () => {
    expect(
      [0, 1, 5, 5.9, 6, 6.1, 11, 11.9, 12, 12.1, 20, 99].map((level) => [
        level,
        maxSkeletonsForLevel(level)
      ])
    ).toEqual([
      [0, 0],
      [1, 1],
      [5, 1],
      [5.9, 1],
      [6, 2],
      [6.1, 2],
      [11, 2],
      [11.9, 2],
      [12, 3],
      [12.1, 3],
      [20, 3],
      [99, 3]
    ]);
  });

  it('keeps the legacy first-three-then-every-three curve available', () => {
    expect([0, 1, 2, 3, 4, 6, 9, 12].map(maxFirstThreeThenEveryThreeForLevel)).toEqual([
      0,
      1,
      2,
      3,
      3,
      4,
      5,
      6
    ]);
  });

  it('resolves explicit Raise Skeleton scaling independently from fallback maxCount', () => {
    const effect: SummonEffect = {
      kind: 'summon',
      summonId: 'skeleton',
      maxCount: 3,
      maxCountScaling: { kind: 'raise-skeleton-1-6-12-cap-3' }
    };

    expect(resolveSummonMaxCount(effect, 1)).toBe(1);
    expect(resolveSummonMaxCount(effect, 6)).toBe(2);
    expect(resolveSummonMaxCount(effect, 12)).toBe(3);
    expect(resolveSummonMaxCount(effect, 99)).toBe(3);
  });
});
