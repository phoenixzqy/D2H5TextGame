import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from './registry';
import { resolveMonsterDirectSkills } from './monster-direct';
import { createSkillValidator } from './skill-validator';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('uses authored Weak Ranged damage and native monster identity through both aliases', () => {
  const skill = getSkill('monster-weak-ranged');
  expect(getSkill('monster.weak_ranged')).toBe(skill);
  expect(skill).toEqual({ id: 'monster.weak_ranged', archetype: 'monster', target: 'single-enemy',
    cooldown: 1, manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical',
      base: [12, 18], projectileFlightMs: 500 }] });
  if (!skill) throw new Error('Missing native ranged action');
  expect(getSkillDamageDelivery(skill)).toBe('ranged');
});

it('keeps the catalog aligned with the authored physical projectile contract', () => {
  expect(rows.find(row => row.id === 'monster-weak-ranged')).toMatchObject({
    target: 'single-enemy', cooldown: 1, projectileFlightMs: 500, cost: { mana: 0 },
    damageType: 'physical', damage: { min: 12, max: 18, breakdown: { physical: 18 } } });
});

function fixture(): { input: Record<string, unknown>[]; row: Record<string, unknown> } {
  const input: Record<string, unknown>[] = structuredClone(rows);
  const row = input.find(value => value.id === 'monster-weak-ranged');
  if (!row) throw new Error('Missing Weak Ranged fixture');
  return { input, row };
}

it('copies and freezes authored tuning without freezing or retaining its input', () => {
  const { input, row } = fixture();
  row.damage = { min: 20, max: 25, breakdown: { physical: 25 } };
  row.cooldown = 2; row.projectileFlightMs = 700;
  const before = structuredClone(input), resolved = resolveMonsterDirectSkills(input);
  const skill = resolved.find(value => value.id === 'monster.weak_ranged'), effect = skill?.effects[0];
  expect(input).toEqual(before);
  expect(skill).toMatchObject({ cooldown: 2, effects: [{ base: [20, 25], projectileFlightMs: 700 }] });
  if (!skill || effect?.kind !== 'damage') throw new Error('Missing native ranged damage');
  for (const value of [resolved, skill, skill.effects, effect, effect.base]) expect(Object.isFrozen(value)).toBe(true);
  expect(Object.isFrozen(row)).toBe(false);
  row.damage = { min: 99, max: 99, breakdown: { physical: 99 } };
  expect(effect.base).toEqual([20, 25]);
  expect(effect.tags).toBeUndefined(); expect(effect.applyStatus).toBeUndefined();
});

it('requires exactly one authored Weak Ranged row', () => {
  const { input, row } = fixture();
  expect(() => resolveMonsterDirectSkills(input.filter(value => value !== row))).toThrow();
  expect(() => resolveMonsterDirectSkills([...input, row])).toThrow();
});

it.each([
  { target: 'all-enemies' }, { appliesStatus: ['chill'] }, { cost: { mana: 1 } },
  { scaling: { damagePerLevel: 1 } }, { projectileFlightMs: 0 }, { projectileFlightMs: 5001 },
  { damageType: 'fire' }
])('rejects unsupported Weak Ranged semantics: %j', change => {
  const { input, row } = fixture(); Object.assign(row, change);
  expect(createSkillValidator()(row)).toBe(false);
  expect(() => resolveMonsterDirectSkills(input)).toThrow();
});

it.each([
  { min: 3, max: 2, breakdown: { physical: 2 } },
  { min: 1, max: 2, breakdown: { physical: 3 } }
])('rejects inconsistent Weak Ranged damage: %j', damage => {
  const { input, row } = fixture(); row.damage = damage;
  expect(() => resolveMonsterDirectSkills(input)).toThrow();
});
