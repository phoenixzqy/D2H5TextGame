import { expect, it, vi } from 'vitest';
import { createRng } from '../rng';
import { rollDamage, resolveDamage, type DamageInput } from './damage';

const base: DamageInput = { baseMin: 10, baseMax: 20, flatBonus: 0, increasedPct: 0,
  comboMult: 1, type: 'physical', critChance: .2, critMult: 2, defenderDodge: 0,
  defenderArmor: 0, defenderMagicResist: 0,
  defenderResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } };

it.each([
  [{}, .895], [{ defenderDodge: .2 }, .755],
  [{ hitChancePenalty: .3 }, .685], [{ defenderDodge: 2 }, .335],
  [{ hitChance: 1 }, 1], [{ hitChance: .85, weaponMissReduction: 1 }, 1],
  [{ defenderDodge: 2, weaponMissReduction: 1 }, 1]
])('applies relative miss reduction after ordinary penalty/dodge/floor %j', (patch, expected) => {
  const rng = createRng(7), chance = vi.spyOn(rng, 'chance');
  rollDamage({ ...base, weaponMissReduction: .3, ...patch }, rng);
  expect(chance.mock.calls[0]?.[0]).toBeCloseTo(expected, 15);
});

it.each([undefined, 0, .3, 1])('preserves rejection of malformed hit chance above 1 at reduction%s', reduction => {
  const input = { ...base, hitChance: 1.01, ...(reduction !== undefined ? { weaponMissReduction: reduction } : {}) };
  expect(() => rollDamage(input, createRng(7))).toThrow();
});

it.each([-1, 1.01, NaN, Infinity])('rejects an invalid new reduction fraction%s', weaponMissReduction => {
  expect(() => rollDamage({ ...base, weaponMissReduction }, createRng(7))).toThrow(/reduction/i);
});

it('preserves exact zero/absent damage and subsequent seeded stream over hits and misses', () => {
  for (let seed = 0; seed < 80; seed++) {
    const ordinary = createRng(seed), zero = createRng(seed);
    expect(resolveDamage(base, ordinary)).toEqual(resolveDamage({ ...base, weaponMissReduction: 0 }, zero));
    expect(zero.next()).toBe(ordinary.next());
  }
});

it('uses one ordinary hit draw; a converted miss adds only ordinary base and crit draws', () => {
  let converted = 0;
  for (let seed = 0; seed < 120; seed++) {
    const a = createRng(seed), b = createRng(seed), control = createRng(seed);
    const nextInt = vi.spyOn(b, 'nextInt'), chance = vi.spyOn(b, 'chance');
    const ordinary = rollDamage(base, a), aimed = rollDamage({ ...base, weaponMissReduction: .3 }, b);
    const hit = control.chance(.895);
    if (hit) { control.nextInt(10, 20); control.chance(.2); }
    expect(aimed.hit).toBe(hit);
    expect(nextInt).toHaveBeenCalledTimes(hit ? 1 : 0);
    expect(chance).toHaveBeenCalledTimes(hit ? 2 : 1);
    expect(b.next()).toBe(control.next());
    if (!ordinary.hit && aimed.hit) converted++;
  }
  expect(converted).toBeGreaterThan(0);
});

it('keeps always-hit attacks free of an accuracy draw', () => {
  const rng = createRng(7), chance = vi.spyOn(rng, 'chance');
  expect(rollDamage({ ...base, ignoreDodge: true, defenderDodge: 9, weaponMissReduction: .3 }, rng).hit).toBe(true);
  expect(chance.mock.calls).toEqual([[.2]]);
});
