import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { DEFAULT_SKILLS } from './builders';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from './registry';
import { MONSTER_DIRECT_SKILLS, resolveMonsterDirectSkills } from './monster-direct';
import { createSkillValidator } from './skill-validator';

const cases = [
  ['monster-weak-melee', 'monster.weak_melee', 10, 15],
  ['monster-strong-melee', 'monster.strong_melee', 30, 50]
] as const;

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(cases)('%s', (authored, canonical, min, max) => {
  function fixture(): { input: Record<string, unknown>[]; row: Record<string, unknown> } {
    const input: Record<string, unknown>[] = structuredClone(rows);
    const row = input.find(value => value.id === authored);
    if (!row) throw new Error('Missing authored melee fixture');
    return { input, row };
  }

  it('resolves JSON-owned tuning without a hardcoded default', () => {
    const { input, row } = fixture();
    row.damage = { min: 60, max: 70, breakdown: { physical: 70 } }; row.cooldown = 2;
    expect(resolveMonsterDirectSkills(input).find(skill => skill.id === canonical))
      .toMatchObject({ cooldown: 2, effects: [{ base: [60, 70] }] });
    expect(DEFAULT_SKILLS.some(skill => skill.id === canonical)).toBe(false);
  });

  it('installs the authored free physical single-target strike through both aliases', () => {
    const skill = getSkill(authored);
    expect(getSkill(canonical)).toBe(skill);
    expect(skill).toBe(MONSTER_DIRECT_SKILLS.find(value => value.id === canonical));
    expect(skill).toEqual({ id: canonical, archetype: 'monster', target: 'single-enemy',
      cooldown: 1, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType: 'physical', base: [min, max] }] });
    if (!skill) throw new Error('Missing native melee action');
    expect(getSkillDamageDelivery(skill)).toBe('melee');
  });

  it('copies and freezes tuning without retaining or freezing the authored row', () => {
    const { input, row } = fixture(), before = structuredClone(input);
    const skills = resolveMonsterDirectSkills(input), skill = skills.find(value => value.id === canonical);
    const effect = skill?.effects[0];
    expect(input).toEqual(before);
    if (!skill || effect?.kind !== 'damage') throw new Error('Missing native melee damage');
    for (const value of [skills, skill, skill.effects, effect, effect.base]) expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(row)).toBe(false);
    row.damage = { min: 99, max: 99, breakdown: { physical: 99 } };
    expect(effect.base).toEqual([min, max]);
    expect(effect.tags).toBeUndefined(); expect(effect.applyStatus).toBeUndefined();
    expect(effect.projectileFlightMs).toBeUndefined();
  });

  it('requires exactly one authored row', () => {
    const { input, row } = fixture();
    expect(() => resolveMonsterDirectSkills(input.filter(value => value !== row))).toThrow();
    expect(() => resolveMonsterDirectSkills([...input, row])).toThrow();
  });

  it.each([
    { target: 'all-enemies' }, { appliesStatus: ['chill'] }, { cost: { mana: 1 } },
    { scaling: { damagePerLevel: 1 } }, { projectileFlightMs: 500 }, { damageType: 'fire' }
  ])('rejects unsupported melee semantics: %j', change => {
    const { input, row } = fixture(); Object.assign(row, change);
    expect(createSkillValidator()(row)).toBe(false);
    expect(() => resolveMonsterDirectSkills(input)).toThrow();
  });

  it.each([
    { min: 3, max: 2, breakdown: { physical: 2 } },
    { min: 1, max: 2, breakdown: { physical: 3 } }
  ])('rejects inconsistent melee damage: %j', damage => {
    const { input, row } = fixture(); row.damage = damage;
    expect(() => resolveMonsterDirectSkills(input)).toThrow();
  });
});
