import { describe, expect, it } from 'vitest';
import { composeHeroRecovery } from './warmth';

/** Compare legacy fire output while permitting only an own, exact-zero Lightning projection. */
function fireDamageProjection(actual: Readonly<Partial<Record<string, number>>> | undefined) {
  if (!actual || !Object.prototype.hasOwnProperty.call(actual, 'lightning')) return actual;
  expect(actual.lightning).toBe(0);
  const { lightning: _zero, ...remaining } = actual;
  return remaining;
}
function fireRecoveryProjection(actual: ReturnType<typeof composeHeroRecovery>) {
  return { ...actual, increasedDamagePct: fireDamageProjection(actual.increasedDamagePct) };
}

const AUTHORED = 'skills-sorceress-fire-mastery';
const CANONICAL = 'sorceress.fire_mastery';
const WARMTH = 'skills-sorceress-warmth';
const compose = (skillLevels?: Readonly<Record<string, number>>, level = 30, classId = 'sorceress', effectiveEnergy = 20) =>
  composeHeroRecovery({ classId, level, effectiveEnergy, ...(skillLevels === undefined ? {} : { skillLevels }) });

describe('P07a02B automatic eligible hero Fire Mastery composition', () => {
  it.each([[0, 0], [1, 0.04], [10, 0.4], [20, 0.8], [99, 0.8]])(
    'composes allocated rank%s as %s increased fire with unchanged baseline recovery', (rank, fire) => {
      expect(fireRecoveryProjection(compose({ [AUTHORED]: rank }))).toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire } });
    });

  it.each([AUTHORED, CANONICAL])('uses exact alias %s without a combo or marker input', alias => {
    expect(fireRecoveryProjection(compose({ [alias]: 1 }))).toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0.04 } });
  });

  it('maxes both alias orders and duplicate aliases once', () => {
    expect(compose({ [AUTHORED]: 2, [CANONICAL]: 7 })).toEqual(compose({ [AUTHORED]: 7 }));
    expect(compose({ [CANONICAL]: 2, [AUTHORED]: 7 })).toEqual(compose({ [AUTHORED]: 7 }));
    expect(compose({ [AUTHORED]: 20, [CANONICAL]: 20 })).toEqual(compose({ [AUTHORED]: 20 }));
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, '20', null, undefined, true])(
    'ignores malformed imported allocation %s while retaining a valid alternate alias', value => {
      const invalid = value as unknown as number;
      expect(compose({ [AUTHORED]: invalid })).toEqual(compose());
      expect(compose({ [AUTHORED]: invalid, [CANONICAL]: 3 })).toEqual(compose({ [AUTHORED]: 3 }));
      expect(compose({ [CANONICAL]: invalid, [AUTHORED]: 3 })).toEqual(compose({ [AUTHORED]: 3 }));
    });

  it('uses requiredLevel30 independently of Warmth and legacy Mastery minLevel12', () => {
    const ranks = { [AUTHORED]: 1, [WARMTH]: 1 };
    for (const level of [1, 12, 29, 29.9]) {
      expect(fireRecoveryProjection(compose(ranks, level))).toEqual({ manaRegenPerSecond: 4.16, increasedDamagePct: { fire: 0.01 } });
    }
    expect(fireRecoveryProjection(compose(ranks, 30))).toEqual({ manaRegenPerSecond: 4.16, increasedDamagePct: { fire: 0.05 } });
    expect(compose(ranks, 30.5)).toEqual(compose(ranks, 30));
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('rejects ineligible/nonfinite hero level%s', level => {
    expect(fireRecoveryProjection(compose({ [AUTHORED]: 20, [WARMTH]: 20 }, level)))
      .toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0 } });
  });

  it.each(['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin', 'unknown'])(
    'keeps Energy baseline without Sorceress passive inheritance for %s', classId => {
      expect(fireRecoveryProjection(compose({ [AUTHORED]: 20, [WARMTH]: 20 }, 30, classId)))
        .toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0 } });
    });

  it('adds Mastery and Warmth once instead of multiplying their bonuses', () => {
    expect(fireRecoveryProjection(compose({ [AUTHORED]: 1, [WARMTH]: 1 })))
      .toEqual({ manaRegenPerSecond: 4.16, increasedDamagePct: { fire: 0.05 } });
    expect(fireRecoveryProjection(compose({ [AUTHORED]: 20, [WARMTH]: 20 })))
      .toEqual({ manaRegenPerSecond: 7.2, increasedDamagePct: { fire: 1 } });
    expect(compose({ [AUTHORED]: 7, [CANONICAL]: 2, [WARMTH]: 3 }).increasedDamagePct.fire)
      .toBeCloseTo(0.31, 12);
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('retains learned fire when effectiveEnergy%s normalizes to zero', energy => {
    expect(fireRecoveryProjection(compose({ [AUTHORED]: 20, [WARMTH]: 20 }, 30, 'sorceress', energy)))
      .toEqual({ manaRegenPerSecond: 0, increasedDamagePct: { fire: 1 } });
  });

  it('does not infer an absent rank from malformed mastery aliases or an active buff', () => {
    expect(fireRecoveryProjection(compose())).toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0 } });
    expect(compose({ 'sorceress.fire-mastery': 20, 'skills-sorceress-fire_mastery': 20,
      'skills-sorceress-lightning_mastery': 20, 'skills-sorceress-frozen-armor': 20 }))
      .toEqual(compose());
  });

  it('returns independent frozen snapshots and clears only removed Mastery without accumulation', () => {
    const ranks = { [AUTHORED]: 20, [WARMTH]: 20 };
    const before = structuredClone(ranks);
    const first = compose(ranks);
    for (let index = 0; index < 3; index++) {
      const next = compose(ranks);
      expect(next).toEqual(first);
      expect(next).not.toBe(first);
      expect(next.increasedDamagePct).not.toBe(first.increasedDamagePct);
      expect(Object.isFrozen(next)).toBe(true);
      expect(Object.isFrozen(next.increasedDamagePct)).toBe(true);
    }
    expect(ranks).toEqual(before);
    ranks[AUTHORED] = 0;
    expect(fireRecoveryProjection(compose(ranks))).toEqual({ manaRegenPerSecond: 7.2, increasedDamagePct: { fire: 0.2 } });
    expect(fireRecoveryProjection(first)).toEqual({ manaRegenPerSecond: 7.2, increasedDamagePct: { fire: 1 } });
  });
});
