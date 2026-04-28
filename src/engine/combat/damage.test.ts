import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { resolveDamage, type DamageInput } from './damage';
import type { Resistances } from '../types/attributes';

const ZERO_RES: Resistances = {
  fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0
};

function baseInput(overrides: Partial<DamageInput> = {}): DamageInput {
  return {
    baseMin: 100,
    baseMax: 100,
    flatBonus: 0,
    increasedPct: 0,
    comboMult: 1,
    type: 'physical',
    critChance: 0,
    critMult: 2,
    defenderResistances: ZERO_RES,
    defenderArmor: 0,
    defenderMagicResist: 0,
    defenderDodge: 0,
    hitChance: 1,
    ...overrides
  };
}

describe('damage pipeline', () => {
  it('floor at 1 minimum', () => {
    const out = resolveDamage(baseInput({ baseMin: 1, baseMax: 1, defenderArmor: 9999 }), createRng(1));
    expect(out.final).toBe(1);
  });

  it('flat then %inc then combo (order matters)', () => {
    const out = resolveDamage(
      baseInput({
        baseMin: 100, baseMax: 100,
        flatBonus: 50,             // 150
        increasedPct: 0.5,         // 225
        comboMult: 1.3             // 292.5
      }),
      createRng(2)
    );
    expect(out.final).toBe(292);
  });

  it('resist clamps at 75', () => {
    const out = resolveDamage(
      baseInput({
        baseMin: 1000, baseMax: 1000,
        type: 'fire',
        defenderResistances: { ...ZERO_RES, fire: 200 }
      }),
      createRng(3)
    );
    // 1000 * (1 - 0.75) = 250
    expect(out.final).toBe(250);
  });

  it('Act IV resist pierce of -20 takes 60% to 40%', () => {
    const out = resolveDamage(
      baseInput({
        baseMin: 1000, baseMax: 1000,
        type: 'fire',
        defenderResistances: { ...ZERO_RES, fire: 60 },
        resistPenalty: 20
      }),
      createRng(4)
    );
    // resist -> 40%, dmg = 1000 * 0.6 = 600
    expect(out.final).toBe(600);
    expect(out.effectiveResistPct).toBe(40);
  });

  it('Act V pierce of -40 can drive resist below 0 (amp)', () => {
    const out = resolveDamage(
      baseInput({
        baseMin: 100, baseMax: 100,
        type: 'cold',
        defenderResistances: { ...ZERO_RES, cold: 0 },
        resistPenalty: 40
      }),
      createRng(5)
    );
    // resist -> -40, dmg = 100 * 1.4 = 140
    expect(out.final).toBe(140);
  });

  it('crit doubles by default critMult=2', () => {
    const out = resolveDamage(
      baseInput({ baseMin: 100, baseMax: 100, critChance: 1 }),
      createRng(6)
    );
    expect(out.crit).toBe(true);
    expect(out.final).toBe(200);
  });

  it('crit overflow converts excess at 1:2 → 130% crit chance becomes 100% + 215% mult', () => {
    const out = resolveDamage(
      baseInput({ baseMin: 100, baseMax: 100, critChance: 1.3, critMult: 2 }),
      createRng(7)
    );
    // 100 * 2.15 = 215
    expect(out.crit).toBe(true);
    expect(out.final).toBe(215);
  });

  it('100% dodge always misses', () => {
    const out = resolveDamage(baseInput({ defenderDodge: 1 }), createRng(8));
    expect(out.hit).toBe(false);
    expect(out.dodged).toBe(true);
    expect(out.final).toBe(0);
  });

  it('ignoreDodge bypasses dodge roll (thorns/spectral)', () => {
    const out = resolveDamage(baseInput({ defenderDodge: 1, ignoreDodge: true }), createRng(9));
    expect(out.hit).toBe(true);
  });

  it('armor flat-subtraction is post-resist', () => {
    const out = resolveDamage(
      baseInput({
        baseMin: 200, baseMax: 200,
        type: 'physical',
        defenderResistances: { ...ZERO_RES, physical: 50 },
        defenderArmor: 50
      }),
      createRng(10)
    );
    // 200 * 0.5 - 50 = 50
    expect(out.final).toBe(50);
  });

  it('cold uses magic resist (mitigation), not armor', () => {
    const out = resolveDamage(
      baseInput({
        baseMin: 200, baseMax: 200,
        type: 'cold',
        defenderArmor: 999,        // ignored
        defenderMagicResist: 50
      }),
      createRng(11)
    );
    expect(out.final).toBe(150);
  });

  it('deterministic given seed', () => {
    const a = resolveDamage(baseInput({ baseMin: 50, baseMax: 100, critChance: 0.5 }), createRng(42));
    const b = resolveDamage(baseInput({ baseMin: 50, baseMax: 100, critChance: 0.5 }), createRng(42));
    expect(a).toEqual(b);
  });
});
