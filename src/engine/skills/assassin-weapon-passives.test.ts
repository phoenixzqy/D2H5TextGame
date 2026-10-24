import { expect, it } from 'vitest';
import skills from '../../data/skills/assassin.json';
import { composeAssassinWeaponPassives as compose, resolveAssassinWeaponPassiveDefinitions as resolve,
  ASSASSIN_WEAPON_PASSIVE_DEFINITIONS as definitions } from './assassin-weapon-passives';

const input = { classId: 'assassin', level: 30, weaponType: 'claw' as const,
  handedness: 'oneHanded' as const, dualWielding: true };
const neutral = { attackMultiplier: 1, critChanceBonus: 0, physDodgeBonus: 0, magicDodgeBonus: 0 };
it('copies immutable tuning without retaining mutable JSON rows', () => {
  const rows = structuredClone(skills), before = structuredClone(rows), copy = resolve(rows);
  expect(rows).toEqual(before); expect(copy.claw).toMatchObject({ requiredLevel: 1, maxRank: 20,
    weaponType: 'claw', handedness: 'oneHanded', perRank: { attackPct: .025, critChancePct: .005 } });
  expect(copy.block).toMatchObject({ requiredLevel: 12, maxRank: 20,
    perRank: { physDodgePct: .01, magicDodgePct: .005 } });
  expect(Object.isFrozen(copy)).toBe(true);
  expect(Object.isFrozen(copy.claw)).toBe(true); expect(Object.isFrozen(copy.claw.perRank)).toBe(true);
  rows.splice(0); expect(copy).toEqual(definitions);
});
it.each([1, 20, 99])('applies rank %s once across both exact aliases and caps', allocated => {
  const rank = Math.min(20, allocated);
  const result = compose({ ...input, skillLevels: { 'skills-assassin-claw-mastery': allocated,
    'assassin.claw_mastery': 1, 'assassin.weapon_block': allocated, 'skills-assassin-weapon-block': 1 } });
  expect(result).toEqual({ attackMultiplier: 1 + rank * .025, critChanceBonus: rank * .005,
    physDodgeBonus: rank * .01, magicDodgeBonus: rank * .005 });
});
it.each([0, -1, 1.5, NaN, Infinity, null, '20', true])('ignores invalid allocation %s', allocated => {
  const skillLevels = { 'assassin.claw_mastery': allocated, 'assassin.weapon_block': allocated } as unknown as Record<string, number>;
  expect(compose({ ...input, skillLevels })).toEqual(neutral);
  expect(compose({ ...input, skillLevels: { ...skillLevels, 'skills-assassin-claw-mastery': 1 } }).attackMultiplier).toBe(1.025);
});
it('enforces class, unlock, learned prerequisite, main-hand claw and actual dual-wield guards separately', () => {
  const learned = { ...input, skillLevels: { 'assassin.claw_mastery': 20, 'assassin.weapon_block': 20 } };
  expect(compose({ ...learned, classId: 'barbarian' })).toEqual(neutral);
  for (const level of [0, NaN, Infinity]) expect(compose({ ...learned, level })).toEqual(neutral);
  expect(compose({ ...learned, level: 11 })).toEqual({ ...neutral, attackMultiplier: 1.5, critChanceBonus: .1 });
  expect(compose({ ...learned, skillLevels: { 'assassin.weapon_block': 20 } })).toEqual(neutral);
  expect(compose({ ...learned, weaponType: 'sword' })).toEqual({ ...neutral, physDodgeBonus: .2, magicDodgeBonus: .1 });
  expect(compose({ ...learned, handedness: 'twoHanded', dualWielding: false })).toEqual(neutral);
  expect(compose({ ...learned, dualWielding: false })).toEqual({ ...neutral, attackMultiplier: 1.5, critChanceBonus: .1 });
  expect(compose({ ...input, skillLevels: { 'assassin.claw_mastery-lookalike': 20 } })).toEqual(neutral);
});
it('reads alternate authored coefficients, unlock and cap rather than runtime constants', () => {
  const rows = skills.map(row => row.id === 'skills-assassin-claw-mastery'
    ? { ...row, requiredLevel: 9, maxLevel: 4, scaling: { passiveStatsPerLevel: { attackPct: .125, critChancePct: .01 } } } : row);
  const copy = resolve(rows), skillLevels = { 'assassin.claw_mastery': 99 };
  expect(compose({ ...input, level: 8, skillLevels }, copy)).toEqual(neutral);
  expect(compose({ ...input, level: 9, skillLevels }, copy)).toEqual({ ...neutral, attackMultiplier: 1.5, critChanceBonus: .04 });
});
it.each(['claw-mastery', 'weapon-block'])('rejects missing, duplicate or contradictory %s definitions', slug => {
  const id = 'skills-assassin-' + slug, row = skills.find(row => row.id === id);
  if (!row) throw new Error('Missing authored passive');
  expect(() => resolve(skills.filter(row => row.id !== id))).toThrow(/exactly one/);
  expect(() => resolve([...skills, row])).toThrow(/exactly one/);
  expect(() => resolve(skills.map(row => row.id === id ? { ...row, cooldown: 1 } : row))).toThrow(/Invalid/);
});
