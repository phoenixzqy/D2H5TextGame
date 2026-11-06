import { afterEach, beforeEach, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from './registry';
import { resolveMonsterDirectSkills } from './monster-direct';
import { createSkillValidator } from './skill-validator';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('installs both aliases as a native all-target Mana Burn spell with the adopted tuning', () => {
  const skill = getSkill('monster-mana-rift');
  expect(getSkill('monster.mana_rift')).toBe(skill);
  expect(skill).toEqual({ id: 'monster.mana_rift', archetype: 'monster', target: 'all-enemies',
    cooldown: 3, minLevel: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'arcane', base: [10, 20], applyStatus: { id: 'mana-burn' } }] });
  if (!skill) throw new Error('Missing native Mana Rift');
  expect(getSkillDamageDelivery(skill)).toBe('spell');
});

it('aligns the catalog with the P15 Wraith damage, targeting and Mana Burn contract', () => {
  expect(rows.find(row => row.id === 'monster-mana-rift')).toMatchObject({
    target: 'all-enemies', cooldown: 3, cost: { mana: 0 }, damageType: 'arcane',
    damage: { min: 10, max: 20, breakdown: { arcane: 20 } }, appliesStatus: ['mana-burn'] });
});

function fixture(): { input: Record<string, unknown>[]; row: Record<string, unknown> } {
  const input: Record<string, unknown>[] = structuredClone(rows);
  const row = input.find(row => row.id === 'monster-mana-rift');
  if (!row) throw new Error('Missing Mana Rift fixture');
  return { input, row };
}

it('derives permitted numeric tuning while independently freezing the native payload', () => {
  const { input, row } = fixture();
  row.damage = { min: 12, max: 24, breakdown: { arcane: 24 } }; row.cooldown = 5;
  const before = structuredClone(input);
  const resolved = resolveMonsterDirectSkills(input), skill = resolved.find(value => value.id === 'monster.mana_rift');
  expect(skill).toMatchObject({ cooldown: 5, effects: [{ base: [12, 24] }] });
  expect(input).toEqual(before);
  const effect = skill?.effects[0];
  if (!skill || effect?.kind !== 'damage') throw new Error('Missing native damage');
  for (const value of [resolved, skill, skill.effects, effect, effect.base, effect.applyStatus])
    expect(Object.isFrozen(value)).toBe(true);
  expect(Object.isFrozen(row)).toBe(false);
  row.damage = { min: 99, max: 99, breakdown: { arcane: 99 } }; row.appliesStatus = [];
  expect(effect.base).toEqual([12, 24]); expect(effect.applyStatus).toEqual({ id: 'mana-burn' });
});

it('rejects missing and duplicate authored Mana Rift rows', () => {
  const { input, row } = fixture();
  expect(() => resolveMonsterDirectSkills(input.filter(value => value.id !== row.id))).toThrow();
  expect(() => resolveMonsterDirectSkills([...input, row])).toThrow();
});

it.each([
  { target: 'single-enemy' }, { appliesStatus: [] }, { statusEffect: { durationMs: 3000 } },
  { projectileFlightMs: 500 }, { cost: { mana: 1 } }, { scaling: { damagePerLevel: 1 } }
])('rejects unsupported Mana Rift semantics in schema and resolver: %j', change => {
  const { input, row } = fixture(); Object.assign(row, change);
  expect(createSkillValidator()(row)).toBe(false);
  expect(() => resolveMonsterDirectSkills(input)).toThrow();
});

it.each([
  { min: 3, max: 2, breakdown: { arcane: 2 } },
  { min: 1, max: 2, breakdown: { arcane: 3 } }
])('rejects inconsistent authored Mana Rift damage: %j', damage => {
  const { input, row } = fixture(); row.damage = damage;
  expect(() => resolveMonsterDirectSkills(input)).toThrow();
});
