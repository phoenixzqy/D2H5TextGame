import { describe, expect, it, vi } from 'vitest';
import banner from '../../data/gacha/banner-config.json';
import { createRng, type Rng } from '../rng';
import {
  createRecruitmentState, planRecruitment, planStarUpgrade, readRecruitmentState,
  type RecruitmentState
} from './recruitment-state';

const rules = { ...banner, rates: { SSR: .02, SR: .13, R: .85 },
  pity: { sr: { threshold: 10 }, ssr: { threshold: 50 } } };
const rId = banner.pool.R[0] ?? '';
function fixed() {
  const next = vi.fn(() => .999);
  const rng: Rng = { ...createRng(1), next, pick<T>(values: readonly T[]): T {
    const first = values[0]; if (first === undefined) throw new Error('Empty test pool'); return first;
  } };
  return { rng, next };
}
function historyState(): RecruitmentState {
  return planRecruitment(fixed().rng, rules, createRecruitmentState(0), {}, new Set(), 10, 1000).state;
}

describe('durable recruitment state and transaction plans', () => {
  it('initializes only new history/SR state while preserving a legacy SSR counter above the new floor', () => {
    const state = createRecruitmentState(89);
    expect(state).toEqual({ pityCounter: 89, srPityCounter: 0, totalPulls: 0, history: [] });
    expect(readRecruitmentState(state, {}, rules)).toEqual({ state, progress: {} });
    const result = planRecruitment(fixed().rng, rules, state, {}, new Set(), 1, 1000);
    expect(result.results[0]?.rarity).toBe('SSR');
    expect(result.state).toMatchObject({ pityCounter: 0, srPityCounter: 0, totalPulls: 1 });
  });
  it('plans same-batch duplicate receipts and both counters without touching input', () => {
    const state = createRecruitmentState(0), progress = {}, owned = new Set<string>();
    const result = planRecruitment(fixed().rng, rules, state, progress, owned, 10, 1234);
    expect(result.results.filter(row => row.isNew)).toHaveLength(2);
    expect(result.progress[rId]).toEqual({ stars: 0, shards: 16 });
    expect(result.state).toMatchObject({ pityCounter: 10, srPityCounter: 0, totalPulls: 10 });
    expect(result.state.history[1]).toEqual({ ordinal: 2, timestamp: 1234, mercId: rId,
      rarity: 'R', isNew: false, shardCount: 2 });
    expect(state).toEqual(createRecruitmentState(0)); expect(progress).toEqual({}); expect(owned.size).toBe(0);
  });
  it('retains the last 100 consecutive receipts with stable ordinals across batches', () => {
    let state = createRecruitmentState(0), progress = {};
    const owned = new Set<string>(Object.values(banner.pool).flat());
    for (let index = 0; index < 12; index++) {
      const next = planRecruitment(fixed().rng, rules, state, progress, owned, 10, 1000 + index);
      state = next.state; progress = next.progress;
    }
    expect(state.totalPulls).toBe(120); expect(state.history).toHaveLength(100);
    expect(state.history[0]?.ordinal).toBe(21); expect(state.history[99]?.ordinal).toBe(120);
    expect(readRecruitmentState(state, progress, rules)).toEqual({ state, progress });
  });
  it('spends shards only on an explicit star action and retains excess at the five-star cap', () => {
    const progress = { [rId]: { stars: 4, shards: 303 } }, before = structuredClone(progress);
    const next = planStarUpgrade(rules, progress, rId);
    expect(next).toEqual({ [rId]: { stars: 5, shards: 203 } });
    expect(planStarUpgrade(rules, next ?? {}, rId)).toBeNull();
    expect(progress).toEqual(before);
  });
  it('refuses missing, unknown or underfunded star progress', () => {
    expect(planStarUpgrade(rules, {}, rId)).toBeNull();
    expect(planStarUpgrade(rules, { [rId]: { stars: 0, shards: 99 } }, rId)).toBeNull();
    expect(planStarUpgrade(rules, {}, 'mercs/unknown')).toBeNull();
  });
  it.each(['negative', 'fractional', 'unsafe', 'sr-over-ssr', 'sr-over-floor', 'missing', 'extra'])(
    'rejects %s state before consuming randomness', fault => {
      const state = createRecruitmentState(0);
      if (fault === 'negative') Reflect.set(state, 'pityCounter', -1);
      if (fault === 'fractional') Reflect.set(state, 'srPityCounter', .5);
      if (fault === 'unsafe') Reflect.set(state, 'totalPulls', Number.MAX_SAFE_INTEGER + 1);
      if (fault === 'sr-over-ssr') Reflect.set(state, 'srPityCounter', 1);
      if (fault === 'sr-over-floor') { Reflect.set(state, 'srPityCounter', 10); Reflect.set(state, 'pityCounter', 10); }
      if (fault === 'missing') Reflect.deleteProperty(state, 'history');
      if (fault === 'extra') Reflect.set(state, 'extra', 1);
      const { rng, next } = fixed();
      expect(() => planRecruitment(rng, rules, state, {}, new Set(), 1, 1000)).toThrow('Invalid recruitment');
      expect(next).not.toHaveBeenCalled();
    });
  it.each(['wrong-tier', 'unknown-id', 'missing-id-and-tier', 'ordinal-gap', 'negative-timestamp', 'false-shards', 'new-with-shards',
    'short-history', 'future-counter'])(
    'rejects %s durable history', fault => {
      const state = historyState(), row = state.history[1];
      if (fault === 'wrong-tier') Reflect.set(row ?? {}, 'rarity', 'SSR');
      if (fault === 'unknown-id') Reflect.set(row ?? {}, 'mercId', 'mercs/unknown');
      if (fault === 'missing-id-and-tier') { Reflect.set(row ?? {}, 'mercId', 'mercs/unknown'); Reflect.set(row ?? {}, 'rarity', undefined); }
      if (fault === 'ordinal-gap') Reflect.set(row ?? {}, 'ordinal', 7);
      if (fault === 'negative-timestamp') Reflect.set(row ?? {}, 'timestamp', -1);
      if (fault === 'false-shards') Reflect.set(row ?? {}, 'shardCount', 15);
      if (fault === 'new-with-shards') Reflect.set(state.history[0] ?? {}, 'shardCount', 2);
      if (fault === 'short-history') Reflect.set(state, 'history', state.history.slice(1));
      if (fault === 'future-counter') Reflect.set(state, 'srPityCounter', 1);
      expect(() => readRecruitmentState(state, {}, rules)).toThrow('Invalid recruitment');
    });
  it.each(['negative-shards', 'fractional-stars', 'above-cap', 'unknown-id', 'extra-field'])(
    'rejects %s progress', fault => {
      const progress = { [rId]: { stars: 0, shards: 0 } };
      if (fault === 'negative-shards') Reflect.set(progress[rId] ?? {}, 'shards', -1);
      if (fault === 'fractional-stars') Reflect.set(progress[rId] ?? {}, 'stars', .5);
      if (fault === 'above-cap') Reflect.set(progress[rId] ?? {}, 'stars', 6);
      if (fault === 'unknown-id') Reflect.set(progress, 'mercs/unknown', { stars: 0, shards: 0 });
      if (fault === 'extra-field') Reflect.set(progress[rId] ?? {}, 'free', true);
      expect(() => readRecruitmentState(createRecruitmentState(0), progress, rules)).toThrow('Invalid recruitment');
    });
  it.each(['state', 'history-array', 'history-row', 'progress', 'progress-row'])(
    'refuses a %s accessor without executing it', target => {
      const state = historyState(), progress = { [rId]: { stars: 0, shards: 16 } }; let reads = 0;
      const owner = target === 'state' ? state : target === 'history-array' ? state.history
        : target === 'history-row' ? state.history[0] : target === 'progress' ? progress : progress[rId];
      const key = target === 'state' ? 'srPityCounter' : target === 'history-array' ? '0'
        : target === 'history-row' ? 'mercId' : target === 'progress' ? rId : 'shards';
      Object.defineProperty(owner ?? {}, key, { enumerable: true, get() { reads++; return 0; } });
      expect(() => readRecruitmentState(state, progress, rules)).toThrow('Invalid recruitment');
      expect(reads).toBe(0);
    });
  it('refuses overflow before a plan can be published and never mutates balances', () => {
    const progress = { [rId]: { stars: 0, shards: Number.MAX_SAFE_INTEGER } };
    expect(() => planRecruitment(fixed().rng, rules, createRecruitmentState(0), progress,
      new Set([rId]), 1, 1000)).toThrow('Invalid recruitment');
    expect(progress[rId]?.shards).toBe(Number.MAX_SAFE_INTEGER);
  });
});
