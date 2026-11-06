import { describe, it, expect } from 'vitest';
import {
  xpRequired,
  xpTotal,
  levelForXp,
  xpScale,
  xpForKill,
  awardXp,
  LEVEL_CAP
} from './xp';

describe('xp progression', () => {
  it('xpRequired matches reference table', () => {
    expect(xpRequired(1)).toBe(100);
    expect(xpRequired(2)).toBe(565);
    expect(xpRequired(3)).toBe(1558);
    expect(xpRequired(10)).toBe(31622);
    expect(xpRequired(70)).toBeGreaterThan(4_000_000);
    expect(xpRequired(70)).toBeLessThan(4_100_000);
  });

  it('xpTotal(1) is 0 and xpTotal(2) is xpRequired(1)', () => {
    expect(xpTotal(1)).toBe(0);
    expect(xpTotal(2)).toBe(100);
    expect(xpTotal(3)).toBe(100 + 565);
  });

  it('retains the exact native late-game level costs and totals', () => {
    expect(xpTotal(56)).toBe(36_383_607);
    expect(xpTotal(70)).toBe(79_955_041);
    expect(xpTotal(90)).toBe(193_772_764);
  });

  it('levelForXp inverts xpTotal', () => {
    for (const L of [1, 5, 10, 25, 50, 70, 89, 90]) {
      expect(levelForXp(xpTotal(L))).toBe(L);
      expect(levelForXp(xpTotal(L) + 1)).toBe(L);
    }
  });

  it('levelForXp clamps at LEVEL_CAP', () => {
    expect(levelForXp(1e12)).toBe(LEVEL_CAP);
  });

  it('xpScale: equal level = 1.0; diff=15 → 0.10 floor', () => {
    expect(xpScale(10, 10)).toBe(1);
    expect(xpScale(15, 10)).toBe(1); // diff=5 still 1.0
    expect(xpScale(16, 10)).toBeCloseTo(0.9);
    expect(xpScale(25, 10)).toBeCloseTo(0.1);
    expect(xpScale(40, 10)).toBe(0.1); // floor
  });

  it('awardXp grants stat & skill points across levelups', () => {
    const r = awardXp(0, xpTotal(13));
    expect(r.level).toBe(13);
    expect(r.levelsGained).toBe(12);
    expect(r.statPointsGranted).toBe(60);
    // 12 from levelups + 1 milestone at L12
    expect(r.skillPointsGranted).toBe(13);
  });

  it('awardXp rejects negative amount', () => {
    expect(() => awardXp(0, -1)).toThrow();
  });

  it('xpRequired throws on bad input', () => {
    expect(() => xpRequired(0)).toThrow();
    expect(() => xpRequired(-1)).toThrow();
  });
});

describe('combat-qualified kill XP curve (D02)', () => {
  it('preserves every introductory reward through the level18 anchor', () => {
    for (let level = 1; level <= 18; level++) expect(xpForKill(level)).toBe(level * 10);
  });

  it.each([
    [19, 206], [20, 234], [32, 759], [47, 1983], [56, 3073],
    [61, 3806], [82, 7973], [90, 10062], [122, 21527]
  ])('awards the selected integer reward at resolved enemy level%i', (level, expected) => {
    expect(xpForKill(level)).toBe(expected);
  });

  it('keeps the existing invalid-level fallback and supports enemies above the hero cap', () => {
    for (const level of [0, -1, NaN, Infinity, -Infinity]) expect(xpForKill(level)).toBe(5);
    expect(xpForKill(122)).toBeGreaterThan(xpForKill(LEVEL_CAP));
  });
});
