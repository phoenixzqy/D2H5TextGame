import { describe, expect, it } from 'vitest';
import necromancer from '../../data/skills/necromancer.json';
import druid from '../../data/skills/druid.json';
import { composeDamageMasteries, DAMAGE_MASTERY_DEFINITIONS, resolveDamageMasteryDefinitions } from './damage-masteries';

describe('independent authored damage mastery tuning', () => {
  it('copies and freezes nested primitives without retaining or freezing the caller', () => {
    const rows = structuredClone([...necromancer, ...druid]);
    const result = resolveDamageMasteryDefinitions(rows);
    expect(result).toEqual(DAMAGE_MASTERY_DEFINITIONS);
    expect(Object.isFrozen(result)).toBe(true);
    for (const definition of Object.values(result)) {
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(definition.perRank)).toBe(true);
    }
    const row = rows.find(row => row.id === 'skills-necromancer-poison-mastery');
    if (!row?.scaling.passiveStatsPerLevel || !('poisonDamagePct' in row.scaling.passiveStatsPerLevel)) throw new Error('Missing tuning');
    expect(Object.isFrozen(row.scaling.passiveStatsPerLevel)).toBe(false);
    row.scaling.passiveStatsPerLevel.poisonDamagePct = 99;
    expect(result.poison.perRank.poisonDamagePct).toBe(0.04);
    expect(() => resolveDamageMasteryDefinitions([])).toThrow(/exactly one/);
    expect(() => resolveDamageMasteryDefinitions([...rows, row])).toThrow(/exactly one/);
  });
  it('uses copied unlocks, caps and independently authored coefficients', () => {
    const rows: unknown[] = [...necromancer, ...druid].map(row => row.id !== 'skills-druid-elemental-mastery' ? row
      : { ...row, requiredLevel: 9, maxLevel: 3,
        scaling: { passiveStatsPerLevel: { elementalDamagePct: 0.125, magicDodgePct: 0.02 } } });
    const definitions = resolveDamageMasteryDefinitions(rows);
    expect(composeDamageMasteries({ classId: 'druid', level: 9,
      skillLevels: { 'druid.elemental_mastery': 99 } }, definitions))
      .toEqual({ increasedDamagePct: { fire: 0.375, cold: 0.375 }, magicDodgeBonus: 0.06 });
    expect(composeDamageMasteries({ classId: 'druid', level: 8,
      skillLevels: { 'druid.elemental_mastery': 99 } }, definitions))
      .toEqual({ increasedDamagePct: {}, magicDodgeBonus: 0 });
  });
  it('ignores untyped malformed ranks without suppressing a valid second alias or mutating input', () => {
    for (const invalid of [null, '20', true, 1.5, Infinity, NaN, -1]) {
      const levels = { 'necromancer.poison_mastery': invalid, 'skills-necromancer-poison-mastery': 2 } as unknown as Readonly<Record<string, number>>;
      const before = structuredClone(levels);
      const result = composeDamageMasteries({ classId: 'necromancer', level: 30, skillLevels: levels });
      expect(result).toEqual({ increasedDamagePct: { poison: 0.08, arcane: 0.04 }, magicDodgeBonus: 0 });
      expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.increasedDamagePct)).toBe(true);
      expect(levels).toEqual(before);
    }
  });
});
