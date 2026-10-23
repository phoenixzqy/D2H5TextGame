import { describe, expect, it } from 'vitest';
import { composeRunewordCombatModifiers } from './runeword-combat';
import { resolveDamage } from '../combat/damage';
import { createRng } from '../rng';
import type { DamageType } from '../types/attributes';
import type { RunewordGrant } from '../types/items';

const grants: readonly RunewordGrant[] = [
  { id: 'skill-fire-bolt', rank: 3, skillId: 'sorceress.fire_bolt', increasedDamagePct: { fire: .12 } },
  { id: 'aura-conviction', rank: 5,
    increasedDamagePct: { fire: .1, cold: .1, lightning: .1, poison: .1, arcane: .05 } },
  { id: 'aura-holy-shock', rank: 5, increasedDamagePct: { lightning: .15 } },
  { id: 'aura-thorns-aura', rank: 5, reflectionPct: .2 },
  { id: 'aura-redemption', rank: 1, skillId: 'item.redemption', manaRegenPct: .1 }
];

describe('personal runeword combat composition', () => {
  it('adds different damage grants to ordinary learned bonuses without changing either input', () => {
    const ordinary = { manaRegenPerSecond: 4, increasedDamagePct: { fire: .3, lightning: .2 } };
    const before = structuredClone({ ordinary, grants });
    const result = composeRunewordCombatModifiers(grants, ordinary);
    expect(result.increasedDamagePct).toEqual({ fire: .52, cold: .1, lightning: .2 + .1 + .15, poison: .1, arcane: .05 });
    expect(result.increasedDamagePct.lightning).toBeCloseTo(.45, 12);
    expect(result.manaRegenBaselinePerSecond).toBe(4);
    expect(result.manaRegenPerSecond).toBe(4.4);
    expect(result.physicalReflectionPct).toBe(.2);
    expect({ ordinary, grants }).toEqual(before);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.increasedDamagePct)).toBe(true);
    ordinary.increasedDamagePct.fire = 9;
    expect(result.increasedDamagePct.fire).toBe(.52);
  });
  it.each([undefined, 0])('keeps absent/zero native recovery at zero (%s)', baseline => {
    const result = composeRunewordCombatModifiers(grants,
      baseline === undefined ? {} : { manaRegenPerSecond: baseline });
    expect(result.manaRegenBaselinePerSecond).toBe(0);
    expect(result.manaRegenPerSecond).toBe(0);
  });
  it('removes all item contributions on a fresh projection without changing the prior frozen projection', () => {
    const ordinary = { manaRegenPerSecond: 2.75, increasedDamagePct: { fire: .3 } };
    const previous = composeRunewordCombatModifiers(grants, ordinary);
    const before = structuredClone(previous);
    expect(composeRunewordCombatModifiers([], ordinary)).toEqual({ manaRegenBaselinePerSecond: 2.75,
      manaRegenPerSecond: 2.75, increasedDamagePct: { fire: .3 }, physicalReflectionPct: 0 });
    expect(previous).toEqual(before);
  });
  it.each<[DamageType, number]>([
    ['physical', 100], ['fire', 122], ['cold', 110], ['lightning', 125],
    ['poison', 110], ['arcane', 105], ['thorns', 100]
  ])('feeds %s through the ordinary damage pipeline exactly once', (type, damage) => {
    const result = composeRunewordCombatModifiers(grants);
    const hit = resolveDamage({ baseMin: 100, baseMax: 100, flatBonus: 0,
      increasedPct: result.increasedDamagePct[type] ?? 0, comboMult: 1, type,
      critChance: 0, critMult: 2, ignoreDodge: true, defenderDodge: 0,
      defenderArmor: 0, defenderMagicResist: 0,
      defenderResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }, createRng(7));
    expect(hit).toMatchObject({ hit: true, crit: false, dodged: false, final: damage });
  });
});
