import { expect, it } from 'vitest';
import tuning from '@/data/combat/assassin-flight.json';
import rows from '@/data/skills/assassin.json';
import { ASSASSIN_FLIGHT_DEFINITION, assassinFlightDodge, isAssassinFlightId,
  resolveAssassinFlightDisplay, resolveAssassinFlightTuning } from './assassin-flight';

it('loads the finite blink without changing authored kick, unlock or payment', () => {
  expect(ASSASSIN_FLIGHT_DEFINITION).toEqual({ id: 'combat/assassin-flight',
    durationMs: 1000, magicDodgePerRank: .01, maxRank: 20, requiredLevel: 24 });
  const row = rows.find(row => row.id === 'skills-assassin-dragon-flight');
  expect(row).toMatchObject({ target: 'single-enemy', cooldown: 2, cost: { mana: 15 },
    damage: { min: 80, max: 115 }, scaling: { damagePerLevel: 7 },
    prerequisites: ['skills-assassin-dragon-tail'] });
});
it('copies and freezes validated tuning without freezing caller data', () => {
  const input = structuredClone(tuning), copy = resolveAssassinFlightTuning(input);
  expect(copy).toEqual(input); expect(copy).not.toBe(input);
  expect(Object.isFrozen(copy)).toBe(true); expect(Object.isFrozen(input)).toBe(false);
});
it.each([
  null, [], {}, { ...tuning, id: 'combat/teleport' }, { ...tuning, extra: true },
  ...[0, 999, 1000.5, 60001, Infinity, NaN].map(durationMs => ({ ...tuning, durationMs })),
  ...[0, -1, .05, Infinity, NaN].map(magicDodgePerRank => ({ ...tuning, magicDodgePerRank }))
])('rejects malformed or out-of-bound blink tuning %j', input => {
  expect(() => resolveAssassinFlightTuning(input)).toThrow('Invalid authored Assassin Flight');
});
it.each([1, 2, 20])('uses actual paid rank%i and exposes matching preview potency', rank => {
  const row = rows.find(row => row.id === 'skills-assassin-dragon-flight');
  expect(assassinFlightDodge(rank)).toBe(rank * .01);
  expect(resolveAssassinFlightDisplay(row, rank)).toEqual({ durationSeconds: 1, magicDodgePercent: rank });
});
it('requires explicit paid Command provenance for effective rank21', () => {
  expect(assassinFlightDodge(21)).toBe(0);
  expect(assassinFlightDodge(21, 1)).toBe(.21);
  for (const rank of [0, -1, 1.5, 22, Infinity, NaN]) expect(assassinFlightDodge(rank, 1)).toBe(0);
});
it('accepts only exact Flight aliases and complete authored previews', () => {
  expect(isAssassinFlightId('assassin.dragon_flight')).toBe(true);
  expect(isAssassinFlightId('skills-assassin-dragon-flight')).toBe(true);
  for (const id of ['dragon-flight', 'assassin.dragon-flight', 'amazon.dragon_flight', 'assassin.dragon_tail'])
    expect(isAssassinFlightId(id)).toBe(false);
  const row = rows.find(row => row.id === 'skills-assassin-dragon-flight');
  if (!row) throw new Error('Missing Flight fixture');
  for (const input of [{ ...row, cooldown: 0 }, { ...row, cost: { mana: 0 } },
    { ...row, maxLevel: 21 }, { ...row, target: 'all-enemies' },
    { ...row, damage: { min: 1, max: 1 } }, { ...row, extra: true }])
    expect(resolveAssassinFlightDisplay(input, 1)).toBeUndefined();
  for (const rank of [0, 1.5, 21, Infinity, NaN]) expect(resolveAssassinFlightDisplay(row, rank)).toBeUndefined();
});
