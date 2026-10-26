import { describe, expect, it } from 'vitest';
import authored from '../../data/summons/fire-golem.json';
import { fireGolemBodyStats, resolveFireGolemDefinition } from './fire-golem';
import { getSummonStats } from './summons';

describe('JSON-owned Fire Golem definition', () => {
  it('preserves every existing base stat for runtime and preview', () => {
    const stats = fireGolemBodyStats();
    expect(stats).toEqual(getSummonStats('fire_golem'));
    expect(stats).toMatchObject({ life: 240, lifeMax: 240, mana: 0, manaMax: 0,
      attack: 42, defense: 36, attackSpeed: 65, critChance: 0.05, critDamage: 1.5,
      physDodge: 0.05, magicDodge: 0.05, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 50, cold: 0, lightning: 0, poison: 0, arcane: 0 } });
    expect(stats.resistances).not.toBe(fireGolemBodyStats().resistances);
  });
  it('deeply copies and freezes supplied tuning while leaving the caller mutable', () => {
    const input = structuredClone(authored), result = resolveFireGolemDefinition(input);
    input.bodyStats.attack = 100; input.bodyStats.resistances.fire = 0;
    input.attack.dotPctOfDamage = 0.5;
    expect(result.bodyStats.attack).toBe(42);
    expect(result.bodyStats.resistances.fire).toBe(50);
    expect(result.attack).toEqual({ damageType: 'fire', dotPctOfDamage: 0.1 });
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(result.bodyStats)).toBe(true);
    expect(Object.isFrozen(result.bodyStats.resistances)).toBe(true);
    expect(Object.isFrozen(result.attack)).toBe(true);
  });
  it.each([undefined, null, [], {}, { ...authored, extra: 1 },
    { ...authored, id: 'summons/foreign' },
    { ...authored, attack: { damageType: 'physical', dotPctOfDamage: 0.1 } },
    { ...authored, attack: { damageType: 'fire', dotPctOfDamage: 0 } },
    { ...authored, attack: { damageType: 'fire', dotPctOfDamage: Infinity } },
    { ...authored, attack: { damageType: 'fire', dotPctOfDamage: 1.1 } },
    { ...authored, bodyStats: { ...authored.bodyStats, lifeMax: 0 } },
    { ...authored, bodyStats: { ...authored.bodyStats, attack: NaN } },
    { ...authored, bodyStats: { ...authored.bodyStats, extra: 1 } }
  ])('rejects malformed or incomplete source %#', input => {
    expect(() => resolveFireGolemDefinition(input)).toThrow('Invalid authored Fire Golem definition');
  });
});
