import { describe, expect, it } from 'vitest';
import {
  STAT_META,
  formatStatValue,
  formatStatDelta,
  deltaColorClass,
  formatResistValue,
  formatResistDelta
} from './statSheetFormat';

describe('formatStatValue', () => {
  it('rounds ints', () => {
    expect(formatStatValue('int', 34.4)).toBe('34');
    expect(formatStatValue('int', 34.5)).toBe('35');
  });
  it('formats percent as one-decimal', () => {
    expect(formatStatValue('percent', 0.05)).toBe('5.0%');
  });
  it('formats multipliers with × suffix', () => {
    expect(formatStatValue('mult', 2)).toBe('2.00×');
  });
});

describe('formatStatDelta', () => {
  it('returns empty string for zero delta', () => {
    expect(formatStatDelta('int', 0)).toBe('');
    expect(formatStatDelta('percent', 0)).toBe('');
  });
  it('formats positive ints with + sign', () => {
    expect(formatStatDelta('int', 4)).toBe('+4');
  });
  it('formats negative ints with - sign', () => {
    expect(formatStatDelta('int', -10)).toBe('-10');
  });
  it('formats percent deltas one-decimal', () => {
    expect(formatStatDelta('percent', 0.01)).toBe('+1.0%');
    expect(formatStatDelta('percent', -0.025)).toBe('-2.5%');
  });
  it('formats multiplier deltas', () => {
    expect(formatStatDelta('mult', 0.1)).toBe('+0.10×');
    expect(formatStatDelta('mult', -0.5)).toBe('-0.50×');
  });
});

describe('deltaColorClass', () => {
  it('returns muted gray for zero', () => {
    expect(deltaColorClass(0, true)).toBe('text-d2-white/40');
    expect(deltaColorClass(0, false)).toBe('text-d2-white/40');
  });
  it('returns emerald for improvement when higherIsBetter', () => {
    expect(deltaColorClass(5, true)).toBe('text-emerald-400');
  });
  it('returns rose for regression when higherIsBetter', () => {
    expect(deltaColorClass(-5, true)).toBe('text-rose-400');
  });
  it('inverts when lower is better', () => {
    expect(deltaColorClass(-5, false)).toBe('text-emerald-400');
    expect(deltaColorClass(5, false)).toBe('text-rose-400');
  });
});

describe('STAT_META', () => {
  it('covers every comparable stat with sane format defaults', () => {
    expect(STAT_META.lifeMax.format).toBe('int');
    expect(STAT_META.critChance.format).toBe('percent');
    expect(STAT_META.critDamage.format).toBe('mult');
    expect(STAT_META.attack.higherIsBetter).toBe(true);
  });
});

describe('formatResistValue / formatResistDelta', () => {
  it('formats resist values as integer %', () => {
    expect(formatResistValue(45.4)).toBe('45%');
  });
  it('returns empty string for zero resist delta', () => {
    expect(formatResistDelta(0)).toBe('');
  });
  it('signs nonzero resist deltas', () => {
    expect(formatResistDelta(5)).toBe('+5%');
    expect(formatResistDelta(-10)).toBe('-10%');
  });
});
