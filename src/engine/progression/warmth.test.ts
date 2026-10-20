import { describe, expect, it } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import recovery from '../../data/combat/recovery.json';
import { composeHeroRecovery } from './warmth';

const DATA_ID = 'skills-sorceress-warmth';
const CANONICAL_ID = 'sorceress.warmth';

function compose(skillLevels: Readonly<Record<string, number>> = {}) {
  return composeHeroRecovery({ classId: 'sorceress', level: 1, effectiveEnergy: 20, skillLevels });
}

describe('P07a01c1 pure authored hero recovery composition (no runtime consumption)', () => {
  it('pins actual authored Warmth and provisional recovery tuning', () => {
    expect(recovery).toEqual({ id: 'combat/recovery', heroManaPerEffectiveEnergyPerSecond: 0.2 });
    expect(sorceressSkills.filter(s => s.id === DATA_ID)).toEqual([
      expect.objectContaining({ trigger: 'passive', requiredLevel: 1, minLevel: 1, maxLevel: 20,
        scaling: { passiveStatsPerLevel: { manaRegenPct: 0.04, fireDamagePct: 0.01 } } })
    ]);
  });

  it.each([
    [0, 4, 0], [1, 4.16, 0.01], [2, 4.32, 0.02], [20, 7.2, 0.2]
  ])('composes E20 rank%s once as %s MP/s and %s increased fire', (rank, manaRate, fire) => {
    const result = compose({ [DATA_ID]: rank });
    expect(result.manaRegenPerSecond).toBeCloseTo(manaRate, 12);
    expect(result.increasedDamagePct).toEqual({ fire });
  });

  it.each([DATA_ID, CANONICAL_ID])('uses learned rank from actual alias %s', alias => {
    expect(compose({ [alias]: 2 })).toEqual({ manaRegenPerSecond: 4.32, increasedDamagePct: { fire: 0.02 } });
  });

  it('uses the maximum valid alias rank once without adding duplicate aliases', () => {
    expect(compose({ [DATA_ID]: 2, [CANONICAL_ID]: 1 })).toEqual(compose({ [DATA_ID]: 2 }));
    expect(compose({ [DATA_ID]: 1, [CANONICAL_ID]: 2 })).toEqual(compose({ [DATA_ID]: 2 }));
    expect(compose({ [DATA_ID]: 2, [CANONICAL_ID]: 2 })).toEqual(compose({ [DATA_ID]: 2 }));
  });

  it.each([21, 99, Number.MAX_SAFE_INTEGER])('clamps valid over-cap rank %s to authored maximum20', rank => {
    expect(compose({ [DATA_ID]: rank })).toEqual(compose({ [DATA_ID]: 20 }));
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity])('ignores malformed or unallocated rank %s', rank => {
    expect(compose({ [DATA_ID]: rank })).toEqual(compose());
    expect(compose({ [DATA_ID]: rank, [CANONICAL_ID]: 2 })).toEqual(compose({ [DATA_ID]: 2 }));
  });

  it.each(['2', null, undefined, {}, []])('ignores nonnumeric imported rank %j', rank => {
    // Exercise the runtime boundary of otherwise typed saved allocations.
    expect(compose({ [DATA_ID]: rank as unknown as number })).toEqual(compose());
  });

  it('does not infer rank1 or accept unknown, other-class or active Frozen Armor allocations', () => {
    expect(composeHeroRecovery({ classId: 'sorceress', level: 1, effectiveEnergy: 20 })).toEqual(compose());
    expect(compose({ 'warmth': 20, 'paladin.warmth': 20, 'skills-sorceress-frozen-armor': 20,
      'sorceress.frozen_armor': 20 })).toEqual(compose());
  });

  it.each(['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin', 'unknown'])(
    'retains hero Energy baseline for class%s without inheriting Sorceress Warmth', classId => {
    expect(composeHeroRecovery({ classId, level: 50, effectiveEnergy: 20, skillLevels: { [DATA_ID]: 20 } }))
      .toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0 } });
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('ignores learned Warmth at invalid/ineligible level%s', level => {
    expect(composeHeroRecovery({ classId: 'sorceress', level, effectiveEnergy: 20,
      skillLevels: { [DATA_ID]: 20 } })).toEqual(compose());
  });

  it('accepts already-effective Energy210 without applying the softcap a second time', () => {
    // Adapter separately proves raw190+gear30 -> raw220 -> effective210.
    expect(composeHeroRecovery({ classId: 'sorceress', level: 1, effectiveEnergy: 210,
      skillLevels: { [DATA_ID]: 1 } }).manaRegenPerSecond).toBeCloseTo(43.68, 12);
  });

  it.each([0, -1, NaN, Infinity, -Infinity])('normalizes invalid or zero effective Energy%s without losing learned fire', effectiveEnergy => {
    expect(composeHeroRecovery({ classId: 'sorceress', level: 1, effectiveEnergy,
      skillLevels: { [DATA_ID]: 2 } })).toEqual({ manaRegenPerSecond: 0, increasedDamagePct: { fire: 0.02 } });
  });

  it('returns independent frozen snapshots without mutating inputs or accumulating repeated composition', () => {
    const skillLevels = Object.freeze({ [DATA_ID]: 2, [CANONICAL_ID]: 1 });
    const input = Object.freeze({ classId: 'sorceress', level: 1, effectiveEnergy: 20, skillLevels });
    const before = structuredClone(input);
    const jsonBefore = structuredClone(sorceressSkills);
    const first = composeHeroRecovery(input);
    for (let repeat = 0; repeat < 3; repeat++) {
      const next = composeHeroRecovery(input);
      expect(next).toEqual(first);
      expect(next).not.toBe(first);
      expect(next.increasedDamagePct).not.toBe(first.increasedDamagePct);
      expect(Object.isFrozen(next)).toBe(true);
      expect(Object.isFrozen(next.increasedDamagePct)).toBe(true);
    }
    expect(input).toEqual(before);
    expect(sorceressSkills).toEqual(jsonBefore);
    expect(compose()).toEqual({ manaRegenPerSecond: 4, increasedDamagePct: { fire: 0 } });
  });
});
