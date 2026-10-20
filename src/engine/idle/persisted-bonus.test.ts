import { describe, expect, it } from 'vitest';
import type { IdleState } from '../types/save';
import { checkpointIdleBonus, resumeIdleBonus } from './persisted-bonus';

const HOUR = 3_600_000;
const START = 1_000_000;
const state = (patch: Partial<IdleState> = {}): IdleState => ({
  lastOnline: START,
  offlineTime: 0,
  activeMultiplier: 1,
  multiplierSecondsRemaining: 0,
  ...patch
});

describe('persisted offline bonus arithmetic', () => {
  it.each([
    [0.5, 1.04, 600], [1, 1.08, 1200], [2, 1.16, 2400],
    [4, 1.32, 4800], [6, 1.48, 7200], [6.25, 1.5, 7200],
    [24, 1.5, 7200], [168, 1.5, 7200]
  ])('resumes after %sh with the locked multiplier/window', (hours, multiplier, seconds) => {
    const result = resumeIdleBonus(state(), START, START + hours * HOUR);
    expect(result.activeMultiplier).toBeCloseTo(multiplier, 12);
    expect(result.multiplierSecondsRemaining).toBeCloseTo(seconds, 12);
    expect(result.offlineTime).toBe(hours * HOUR);
    expect(result.lastOnline).toBe(START + hours * HOUR);
  });

  it('counts sub-minute gaps without using cumulative time to create a bonus', () => {
    const first = resumeIdleBonus(state(), START, START + 59_999);
    const next = resumeIdleBonus(first, first.lastOnline, first.lastOnline + 59_999);
    expect(next).toEqual(state({ lastOnline: START + 119_998, offlineTime: 119_998 }));
    const threshold = resumeIdleBonus(state(), START, START + 60_000);
    expect(threshold.activeMultiplier).toBeCloseTo(1 + 0.08 / 60, 12);
    expect(threshold.multiplierSecondsRemaining).toBe(20);
  });

  it('uses a newer legacy save timestamp instead of granting already-saved online time', () => {
    const result = resumeIdleBonus(state(), START + HOUR, START + 2 * HOUR);
    expect(result.activeMultiplier).toBeCloseTo(1.08, 12);
    expect(result.offlineTime).toBe(HOUR);
    const newerIdle = resumeIdleBonus(state({ lastOnline: START + HOUR }), START, START + 2 * HOUR);
    expect(newerIdle).toEqual(result);
  });

  it('retains a stronger unfinished bonus and its remaining duration across an away gap', () => {
    const prior = Object.freeze(state({ activeMultiplier: 1.25, multiplierSecondsRemaining: 317, idleTarget: 'den' }));
    expect(resumeIdleBonus(prior, START, START + 5 * 60_000)).toEqual({
      ...prior, lastOnline: START + 5 * 60_000, offlineTime: 5 * 60_000
    });
    expect(prior.lastOnline).toBe(START);
  });

  it('retains an exactly tied multiplier without refreshing its shorter remaining window', () => {
    const prior = state({ activeMultiplier: 1.5, multiplierSecondsRemaining: 7 });
    const result = resumeIdleBonus(prior, START, START + 24 * HOUR);
    expect(result.activeMultiplier).toBe(1.5);
    expect(result.multiplierSecondsRemaining).toBe(7);
  });

  it.each([[1.16, 2], [1.32, 4]])('preserves an uncapped stored tie %s after %sh away', (multiplier, hours) => {
    const prior = state({ activeMultiplier: multiplier, multiplierSecondsRemaining: 7 });
    const result = resumeIdleBonus(prior, START, START + hours * HOUR);
    expect(result.activeMultiplier).toBe(multiplier);
    expect(result.multiplierSecondsRemaining).toBe(7);
  });

  it('replaces a weaker old bonus with a genuinely higher fresh accrual', () => {
    const prior = state({ activeMultiplier: 1.02, multiplierSecondsRemaining: 7000 });
    const result = resumeIdleBonus(prior, START, START + HOUR);
    expect(result.activeMultiplier).toBeCloseTo(1.08, 12);
    expect(result.multiplierSecondsRemaining).toBe(1200);
  });

  it('consumes only online elapsed time and preserves informational state', () => {
    const prior = Object.freeze(state({ activeMultiplier: 1.5, multiplierSecondsRemaining: 7200, offlineTime: 42, idleTarget: 'den' }));
    const result = checkpointIdleBonus(prior, START + HOUR);
    expect(result).toEqual({ ...prior, lastOnline: START + HOUR, activeMultiplier: 1.25, multiplierSecondsRemaining: 3600 });
    expect(prior.activeMultiplier).toBe(1.5);
  });

  it('has the same decay through multiple online checkpoints as through one checkpoint', () => {
    const prior = state({ activeMultiplier: 1.32, multiplierSecondsRemaining: 4800 });
    const direct = checkpointIdleBonus(prior, START + 1_234_567);
    const split = checkpointIdleBonus(checkpointIdleBonus(prior, START + 345_678), START + 1_234_567);
    expect(split.activeMultiplier).toBeCloseTo(direct.activeMultiplier, 12);
    expect(split.multiplierSecondsRemaining).toBeCloseTo(direct.multiplierSecondsRemaining, 12);
    expect(split.lastOnline).toBe(direct.lastOnline);
    expect(split.offlineTime).toBe(0);
  });

  it.each([7200_000, 7200_001, 24 * HOUR])('expires at or beyond the remaining online window (%sms)', elapsed => {
    const prior = state({ activeMultiplier: 1.5, multiplierSecondsRemaining: 7200 });
    expect(checkpointIdleBonus(prior, START + elapsed)).toEqual(state({ lastOnline: START + elapsed }));
  });

  it('does not refresh on repeated same-clock resume or checkpoint after JSON-shaped reload', () => {
    const resumed = resumeIdleBonus(state(), START, START + 4 * HOUR);
    const consumed = checkpointIdleBonus(resumed, resumed.lastOnline + 600_000);
    const decoded = JSON.parse(JSON.stringify(consumed)) as IdleState;
    expect(resumeIdleBonus(decoded, decoded.lastOnline, decoded.lastOnline)).toEqual(consumed);
    expect(checkpointIdleBonus(decoded, decoded.lastOnline)).toEqual(consumed);
    const later = resumeIdleBonus(decoded, decoded.lastOnline, decoded.lastOnline + 60_000);
    expect(later.activeMultiplier).toBe(consumed.activeMultiplier);
    expect(later.multiplierSecondsRemaining).toBe(consumed.multiplierSecondsRemaining);
    expect(later.offlineTime).toBe(4 * HOUR + 60_000);
    expect(Object.keys(later).sort()).toEqual(Object.keys(state()).sort());
  });

  it('clamps rollback to zero and reanchors rather than retaining a clock high watermark', () => {
    const prior = state({ activeMultiplier: 1.25, multiplierSecondsRemaining: 900, offlineTime: 10 });
    const resumed = resumeIdleBonus(prior, START, START - 60_000);
    const checked = checkpointIdleBonus(prior, START - 60_000);
    expect(resumed).toEqual({ ...prior, lastOnline: START - 60_000 });
    expect(checked).toEqual(resumed);
    const next = resumeIdleBonus(resumed, resumed.lastOnline, START);
    expect(next.offlineTime).toBe(60_010);
    expect(next.multiplierSecondsRemaining).toBe(900);
  });

  it.each([
    [2, 9000, 1.5, 7200], [0.5, 300, 1, 0], [1.4, -1, 1, 0],
    [1, 300, 1, 0], [1.25, 0, 1, 0], [1.25, 0.25, 1.25, 0.25]
  ])('normalizes the saved multiplier/window tuple (%s, %s)', (multiplier, seconds, expectedMultiplier, expectedSeconds) => {
    const prior = state({ activeMultiplier: multiplier, multiplierSecondsRemaining: seconds, offlineTime: -10 });
    const expected = state({ activeMultiplier: expectedMultiplier, multiplierSecondsRemaining: expectedSeconds });
    expect(checkpointIdleBonus(prior, START)).toEqual(expected);
    expect(resumeIdleBonus(prior, START, START)).toEqual(expected);
  });

  it('clears a residual window if its decayed multiplier rounds to one', () => {
    const prior = state({ activeMultiplier: 1 + Number.EPSILON, multiplierSecondsRemaining: 1 });
    expect(checkpointIdleBonus(prior, START + 750)).toEqual(state({ lastOnline: START + 750 }));
  });

  it.each([NaN, Infinity, -Infinity])('rejects nonfinite inputs (%s) without mutation', bad => {
    const prior = Object.freeze(state());
    expect(() => checkpointIdleBonus(prior, bad)).toThrow(RangeError);
    expect(() => resumeIdleBonus(prior, bad, START)).toThrow(RangeError);
    expect(() => resumeIdleBonus(prior, START, bad)).toThrow(RangeError);
    for (const key of ['lastOnline', 'offlineTime', 'activeMultiplier', 'multiplierSecondsRemaining'] as const) {
      const invalid = Object.freeze(state({ [key]: bad }));
      expect(() => checkpointIdleBonus(invalid, START)).toThrow(RangeError);
      expect(() => resumeIdleBonus(invalid, START, START)).toThrow(RangeError);
      expect(invalid[key]).toBe(bad);
    }
    expect(prior).toEqual(state());
  });

  it('rejects overflowing elapsed arithmetic in either direction even with finite inputs', () => {
    for (const sign of [-1, 1]) {
      const anchor = sign * Number.MAX_VALUE;
      const prior = Object.freeze(state({ lastOnline: anchor }));
      expect(() => checkpointIdleBonus(prior, -anchor)).toThrow(RangeError);
      expect(() => resumeIdleBonus(prior, anchor, -anchor)).toThrow(RangeError);
      expect(prior.lastOnline).toBe(anchor);
    }
  });

  it('rejects an overflowing cumulative counter rather than returning an invalid future save', () => {
    const prior = Object.freeze(state({ lastOnline: 0, offlineTime: Number.MAX_VALUE }));
    expect(() => resumeIdleBonus(prior, 0, Number.MAX_VALUE)).toThrow(RangeError);
    expect(prior.offlineTime).toBe(Number.MAX_VALUE);
  });
});
