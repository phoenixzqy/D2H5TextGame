/**
 * Map unlock predicate tests.
 */
import { describe, it, expect } from 'vitest';
import {
  ACT_GATE_QUESTS,
  isActUnlocked,
  isSubAreaUnlocked,
  highestUnlockedAct,
  getUnlockedActs
} from './unlock';

describe('map/unlock', () => {
  it('act 1 is always unlocked', () => {
    expect(isActUnlocked(1, new Set())).toBe(true);
  });

  it('act 2 requires Andariel', () => {
    const empty = new Set<string>();
    expect(isActUnlocked(2, empty)).toBe(false);
    const done = new Set([ACT_GATE_QUESTS[2] ?? '']);
    expect(isActUnlocked(2, done)).toBe(true);
  });

  it('progressively unlocks acts as boss quests are completed', () => {
    const done = new Set<string>();
    expect(highestUnlockedAct(done)).toBe(1);
    done.add(ACT_GATE_QUESTS[2] ?? '');
    expect(highestUnlockedAct(done)).toBe(2);
    done.add(ACT_GATE_QUESTS[3] ?? '');
    expect(highestUnlockedAct(done)).toBe(3);
    done.add(ACT_GATE_QUESTS[4] ?? '');
    expect(highestUnlockedAct(done)).toBe(4);
    done.add(ACT_GATE_QUESTS[5] ?? '');
    expect(highestUnlockedAct(done)).toBe(5);
  });

  it('sub-area unlock follows act unlock', () => {
    const empty = new Set<string>();
    expect(isSubAreaUnlocked(1, empty)).toBe(true);
    expect(isSubAreaUnlocked(2, empty)).toBe(false);
    const done = new Set([ACT_GATE_QUESTS[2] ?? '']);
    expect(isSubAreaUnlocked(2, done)).toBe(true);
  });

  it('getUnlockedActs returns ascending list', () => {
    const done = new Set([ACT_GATE_QUESTS[2] ?? '', ACT_GATE_QUESTS[3] ?? '']);
    expect(getUnlockedActs(done)).toEqual([1, 2, 3]);
  });

  it('out-of-range acts are locked', () => {
    expect(isActUnlocked(0, new Set())).toBe(true); // <=1 => unlocked
    expect(isActUnlocked(99, new Set())).toBe(false);
  });
});
