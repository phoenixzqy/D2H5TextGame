import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { rollDamage, resolveRolledDamage, type DamageInput } from './damage';
const source = (patch: Partial<DamageInput> = {}): DamageInput => ({
  baseMin: 120,
  baseMax: 120,
  flatBonus: 0,
  increasedPct: 0,
  comboMult: 1,
  type: 'fire',
  critChance: 1,
  critMult: 2,
  hitChance: 1,
  defenderResistances: { physical: 0, fire: 50, cold: 25, lightning: 0, poison: 0, arcane: 0 },
  defenderArmor: 10,
  defenderMagicResist: 5,
  defenderDodge: 0,
  ...patch
});
describe('one shared hit/base/crit roll for elemental damage components', () => {
  it('applies each component modifiers and mitigation to the same immutable successful roll', () => {
    const input = source(),
      before = structuredClone(input),
      rng = createRng(7),
      expected = createRng(7);
    expected.next();
    expected.next(); // hit and crit; fixed base requires no draw
    const roll = rollDamage(input, rng);
    expect(roll).toEqual({ hit: true, dodged: false, crit: true, base: 120, critMultiplier: 2 });
    expect(Object.isFrozen(roll)).toBe(true);
    expect(resolveRolledDamage(input, roll, 1 / 3)).toMatchObject({
      final: 30,
      crit: true,
      effectiveResistPct: 50
    });
    expect(
      resolveRolledDamage(source({ type: 'cold', increasedPct: 0.5 }), roll, 1 / 3)
    ).toMatchObject({ final: 85, crit: true, effectiveResistPct: 25 });
    expect(
      resolveRolledDamage(source({ type: 'lightning', comboMult: 1.25 }), roll, 1 / 3)
    ).toMatchObject({ final: 95, crit: true, effectiveResistPct: 0 });
    expect(rng.next()).toBe(expected.next());
    expect(input).toEqual(before);
  });
  it('shares a real miss without base/crit or component-specific RNG draws', () => {
    const input = source({ defenderDodge: 1 }),
      rng = createRng(1),
      expected = createRng(1);
    expected.next();
    const roll = rollDamage(input, rng);
    expect(roll).toEqual({ hit: false, dodged: true, crit: false });
    for (const type of ['fire', 'cold', 'lightning'] as const)
      expect(resolveRolledDamage({ ...input, type }, roll, 1 / 3)).toMatchObject({
        hit: false,
        dodged: true,
        crit: false,
        raw: 0,
        final: 0
      });
    expect(rng.next()).toBe(expected.next());
  });
  it('rolls the authored inclusive total base once before splitting unrounded shares', () => {
    const input = source({
      baseMin: 90,
      baseMax: 150,
      critChance: 0,
      defenderArmor: 0,
      defenderMagicResist: 0,
      defenderResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    });
    const rng = createRng(7),
      expected = createRng(7);
    expected.next();
    expected.next();
    expected.next();
    const roll = rollDamage(input, rng);
    expect(roll).toEqual({ hit: true, dodged: false, crit: false, base: 93, critMultiplier: 1 });
    for (const type of ['fire', 'cold', 'lightning'] as const)
      expect(resolveRolledDamage({ ...input, type }, roll, 1 / 3).final).toBe(31);
    expect(rng.next()).toBe(expected.next());
  });
  it('keeps fractional raw shares until each element reaches the normal floor', () => {
    const input = source({
      baseMin: 101,
      baseMax: 101,
      critChance: 0,
      defenderArmor: 0,
      defenderMagicResist: 0,
      defenderResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    });
    const roll = rollDamage(input, createRng(7));
    expect(resolveRolledDamage({ ...input, increasedPct: 0.5 }, roll, 1 / 3).final).toBe(50);
    expect(resolveRolledDamage({ ...input, defenderArmor: 1000 }, roll, 1 / 3).final).toBe(1);
  });
});
