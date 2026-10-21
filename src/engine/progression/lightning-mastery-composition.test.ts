import { describe, expect, it } from 'vitest';
import { composeHeroRecovery } from './warmth';

const AUTHORED = 'skills-sorceress-lightning-mastery';
const CANONICAL = 'sorceress.lightning_mastery';
const WARMTH = 'skills-sorceress-warmth';
const FIRE = 'skills-sorceress-fire-mastery';
const compose = (skillLevels?: Readonly<Record<string, number>>, level = 30, classId = 'sorceress', effectiveEnergy = 20) =>
  composeHeroRecovery({ classId, level, effectiveEnergy, ...(skillLevels === undefined ? {} : { skillLevels }) });

describe('P07a03B automatic eligible player Lightning Mastery composition', () => {
  it.each([AUTHORED, CANONICAL].flatMap(alias =>
    ([[0, 0], [1, 0.04], [10, 0.4], [20, 0.8], [99, 0.8]] as const)
      .map(([rank, lightning]) => ({ alias, rank, lightning }))))(
    'composes $alias allocated rank$rank as $lightning without a combo or marker', ({ alias, rank, lightning }) => {
      expect(compose({ [alias]: rank })).toEqual({ manaRegenPerSecond: 4,
        increasedDamagePct: { fire: 0, lightning } });
    });

  it('takes both alias orders and duplicates at maximum once', () => {
    for (const ranks of [{ [AUTHORED]: 2, [CANONICAL]: 7 }, { [CANONICAL]: 2, [AUTHORED]: 7 },
      { [AUTHORED]: 7, [CANONICAL]: 7 }]) {
      expect.soft(compose(ranks)).toEqual({ manaRegenPerSecond: 4,
        increasedDamagePct: { fire: 0, lightning: 0.28 } });
    }
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true])(
    'clears malformed allocation %s without suppressing a valid alternate alias', value => {
      const invalid = value as unknown as number;
      expect.soft(compose({ [AUTHORED]: invalid })).toEqual({ manaRegenPerSecond: 4,
        increasedDamagePct: { fire: 0, lightning: 0 } });
      expect.soft(compose({ [AUTHORED]: invalid, [CANONICAL]: 3 })).toEqual({ manaRegenPerSecond: 4,
        increasedDamagePct: { fire: 0, lightning: 0.12 } });
      expect(compose({ [CANONICAL]: invalid, [AUTHORED]: 3 })).toEqual({ manaRegenPerSecond: 4,
        increasedDamagePct: { fire: 0, lightning: 0.12 } });
    });

  it.each([1, 12, 29, 29.9])('uses authored requiredLevel30 instead of legacy12 at level%s', level => {
    expect(compose({ [AUTHORED]: 20, [WARMTH]: 1, [FIRE]: 20 }, level)).toEqual({
      manaRegenPerSecond: 4.16, increasedDamagePct: { fire: 0.01, lightning: 0 } });
  });

  it.each([30, 30.5, 40])('accepts eligible finite hero level%s independently of Warmth', level => {
    expect(compose({ [AUTHORED]: 1 }, level)).toEqual({ manaRegenPerSecond: 4,
      increasedDamagePct: { fire: 0, lightning: 0.04 } });
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('clears learned passives at ineligible/nonfinite level%s', level => {
    expect(compose({ [AUTHORED]: 20, [WARMTH]: 20, [FIRE]: 20 }, level)).toEqual({
      manaRegenPerSecond: 4, increasedDamagePct: { fire: 0, lightning: 0 } });
  });

  it.each(['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin', 'unknown'])(
    'does not inherit Sorceress passives for class%s', classId => {
      expect(compose({ [AUTHORED]: 20, [WARMTH]: 20, [FIRE]: 20 }, 40, classId)).toEqual({
        manaRegenPerSecond: 4, increasedDamagePct: { fire: 0, lightning: 0 } });
    });

  it.each([0, -1, NaN, Infinity, -Infinity])('keeps allocated Lightning at normalized Energy%s', energy => {
    expect(compose({ [AUTHORED]: 20, [WARMTH]: 20, [FIRE]: 20 }, 30, 'sorceress', energy)).toEqual({
      manaRegenPerSecond: 0, increasedDamagePct: { fire: 1, lightning: 0.8 } });
  });

  it('composes all three passives independently with separate damage types and unchanged recovery', () => {
    expect.soft(compose({ [AUTHORED]: 20, [WARMTH]: 20, [FIRE]: 20 })).toEqual({
      manaRegenPerSecond: 7.2, increasedDamagePct: { fire: 1, lightning: 0.8 } });
    expect.soft(compose({ [AUTHORED]: 1, [WARMTH]: 1, [FIRE]: 1 })).toEqual({
      manaRegenPerSecond: 4.16, increasedDamagePct: { fire: 0.05, lightning: 0.04 } });
    const base = compose({ [WARMTH]: 20, [FIRE]: 20 });
    const learned = compose({ [AUTHORED]: 20, [WARMTH]: 20, [FIRE]: 20 });
    expect(learned.manaRegenPerSecond).toBe(base.manaRegenPerSecond);
    expect(learned.increasedDamagePct.fire).toBe(base.increasedDamagePct.fire);
  });

  it('publishes an own explicit zero for missing or wrong aliases, never rank1 fallback', () => {
    for (const ranks of [undefined, {}, { 'sorceress.lightning-mastery': 20,
      'skills-sorceress-lightning_mastery': 20, 'mskill-lightning-mastery': 20 }]) {
      const result = compose(ranks);
      expect.soft(Object.prototype.hasOwnProperty.call(result.increasedDamagePct, 'lightning')).toBe(true);
      expect.soft(result).toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0, lightning: 0 } });
    }
  });

  it('returns independent frozen snapshots and clears only removed Lightning without accumulation', () => {
    const ranks = { [AUTHORED]: 20, [WARMTH]: 20, [FIRE]: 20 };
    const before = structuredClone(ranks);
    const first = compose(ranks);
    for (let repeat = 0; repeat < 3; repeat++) {
      const next = compose(ranks);
      expect(next).toEqual(first);
      expect(next).not.toBe(first);
      expect(next.increasedDamagePct).not.toBe(first.increasedDamagePct);
      expect(Object.isFrozen(next)).toBe(true);
      expect(Object.isFrozen(next.increasedDamagePct)).toBe(true);
    }
    expect(ranks).toEqual(before);
    ranks[AUTHORED] = 0;
    expect.soft(compose(ranks)).toEqual({ manaRegenPerSecond: 7.2,
      increasedDamagePct: { fire: 1, lightning: 0 } });
    expect(first).toEqual({ manaRegenPerSecond: 7.2, increasedDamagePct: { fire: 1, lightning: 0.8 } });
  });
});
