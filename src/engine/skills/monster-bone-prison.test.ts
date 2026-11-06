import { expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { MONSTER_BONE_PRISON, resolveMonsterBonePrison } from './monster-bone-prison';

function fixture(patch: Record<string, unknown> = {}) {
  return rows.map(row => row.id === 'monster-bone-prison' ? { ...structuredClone(row), ...patch } : structuredClone(row));
}
it('copies and deeply freezes native authority without freezing or retaining mutable JSON', () => {
  const input = fixture(), before = structuredClone(input), out = resolveMonsterBonePrison(input);
  expect(out).toEqual(MONSTER_BONE_PRISON); expect(input).toEqual(before);
  for (const value of [out, out.skill, out.effect, out.effect.base, out.skill.effects]) expect(Object.isFrozen(value)).toBe(true);
  const row = input.find(r => r.id === 'monster-bone-prison'); if (!row?.damage) throw new Error('Missing fixture');
  row.damage.min = 99; expect(out.effect.base).toEqual([10, 20]); expect(Object.isFrozen(input)).toBe(false);
});
it('derives permitted trap duration and direct damage from JSON', () => {
  expect(resolveMonsterBonePrison(fixture({ statusEffect: { durationMs: 1500 },
    damage: { min: 20, max: 30, breakdown: { arcane: 30 } } }))).toMatchObject({ durationMs: 1500, effect: { base: [20, 30] } });
});
it('rejects missing and duplicate definitions', () => {
  expect(() => resolveMonsterBonePrison(rows.filter(r => r.id !== 'monster-bone-prison'))).toThrow();
  const row = rows.find(r => r.id === 'monster-bone-prison'); expect(() => resolveMonsterBonePrison([...rows, row])).toThrow();
});
it.each([
  { statusEffect: undefined }, { statusEffect: {} },
  ...[0, -1, .5, 60001, NaN, Infinity].map(durationMs => ({ statusEffect: { durationMs } })),
  { statusEffect: { durationMs: 2000, chance: .5 } }, { appliesStatus: ['stun'] },
  { trigger: 'passive' }, { target: 'all-enemies' }, { cooldown: 0 }, { minLevel: 2 }, { maxLevel: 20 },
  { cost: undefined }, { cost: { mana: 1 } }, { damage: undefined }, { damageType: 'physical' },
  { damage: { min: 21, max: 20, breakdown: { arcane: 20 } } },
  { damage: { min: 10, max: 20, breakdown: { arcane: 19 } } },
  { appliesTags: ['arcane'] }, { projectileFlightMs: 500 }, { scaling: { damagePerLevel: 1 } }
])('rejects malformed or contradictory authored private trap %j', patch => {
  expect(() => resolveMonsterBonePrison(fixture(patch))).toThrow();
});
