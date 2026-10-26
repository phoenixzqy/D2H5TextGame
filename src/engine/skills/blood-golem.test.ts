import { describe, expect, it } from 'vitest';
import authored from '../../data/summons/blood-golem.json';
import { bloodGolemBodyStats, resolveBloodGolemDefinition } from './blood-golem';
import { getSummonStats } from './summons';

describe('JSON-owned Blood Golem definition', () => {
  it('preserves every existing base stat for runtime and preview', () => {
    const stats = bloodGolemBodyStats();
    expect(stats).toEqual(getSummonStats('blood_golem'));
    expect(stats).toMatchObject({ life: 180, lifeMax: 180, mana: 0, manaMax: 0,
      attack: 34, defense: 24, attackSpeed: 70, critChance: 0.05, critDamage: 1.5,
      physDodge: 0.05, magicDodge: 0.05, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 20, arcane: 0 } });
    expect(stats.resistances).not.toBe(bloodGolemBodyStats().resistances);
  });
  it('deeply copies and freezes supplied tuning while leaving the caller mutable', () => {
    const input = structuredClone(authored), result = resolveBloodGolemDefinition(input);
    input.bodyStats.attack = 100; input.bodyStats.resistances.poison = 0;
    input.lifeLeechFraction = 0.5;
    expect(result.bodyStats.attack).toBe(34);
    expect(result.bodyStats.resistances.poison).toBe(20);
    expect(result.lifeLeechFraction).toBe(0.1);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(result.bodyStats)).toBe(true);
    expect(Object.isFrozen(result.bodyStats.resistances)).toBe(true);
  });
  it.each([undefined, null, [], {}, { ...authored, extra: 1 },
    { ...authored, id: 'summons/foreign' },
    ...[0, -1, Infinity, NaN, 1.1].map(lifeLeechFraction => ({ ...authored, lifeLeechFraction })),
    { ...authored, bodyStats: { ...authored.bodyStats, lifeMax: 0 } },
    { ...authored, bodyStats: { ...authored.bodyStats, attack: NaN } },
    { ...authored, bodyStats: { ...authored.bodyStats, extra: 1 } }
  ])('rejects malformed or incomplete source %#', input => {
    expect(() => resolveBloodGolemDefinition(input)).toThrow('Invalid authored Blood Golem definition');
  });
});
