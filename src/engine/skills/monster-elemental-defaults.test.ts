import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { DEFAULT_SKILLS } from './builders';
import { resolveMonsterDirectSkills } from './monster-direct';
import { resolveMonsterDotSkills } from './monster-dot';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from './registry';
import { createSkillValidator } from './skill-validator';

const cases = [
  { authored: 'monster-fire-breath', canonical: 'monster.fire_breath', type: 'fire',
    base: [40, 60], cooldown: 3, target: 'area-enemies', flight: undefined,
    status: { id: 'ignite', dotPctOfDamage: 0.1 }, resolve: resolveMonsterDotSkills },
  { authored: 'monster-poison-spit', canonical: 'monster.poison_spit', type: 'poison',
    base: [20, 30], cooldown: 2, target: 'single-enemy', flight: 500,
    status: { id: 'poison', stacksOnApply: 2, dotPctOfDamage: 0.05 }, resolve: resolveMonsterDotSkills },
  { authored: 'monster-frost-aura', canonical: 'monster.frost_aura', type: 'cold',
    base: [15, 25], cooldown: 3, target: 'all-enemies', flight: undefined,
    status: { id: 'chill' }, resolve: resolveMonsterDirectSkills }
] as const;

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(cases)('$authored JSON authority', spec => {
  function fixture(): { input: Record<string, unknown>[]; row: Record<string, unknown> } {
    const input: Record<string, unknown>[] = structuredClone(rows);
    const row = input.find(value => value.id === spec.authored);
    if (!row) throw new Error('Missing elemental monster fixture');
    return { input, row };
  }

  it('resolves authored elemental tuning without a hardcoded default', () => {
    const { input, row } = fixture();
    row.damage = { min: 60, max: 70, breakdown: { [spec.type]: 70 } }; row.cooldown = 2;
    expect(spec.resolve(input).find(skill => skill.id === spec.canonical))
      .toMatchObject({ cooldown: 2, effects: [{ base: [60, 70] }] });
    expect(DEFAULT_SKILLS.some(skill => skill.id === spec.canonical)).toBe(false);
  });

  it('preserves the adopted native payload, delivery and both aliases', () => {
    const skill = getSkill(spec.authored);
    expect(getSkill(spec.canonical)).toBe(skill);
    expect(skill).toEqual({ id: spec.canonical, archetype: 'monster', target: spec.target,
      cooldown: spec.cooldown, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType: spec.type, base: spec.base, applyStatus: spec.status,
        ...(spec.flight === undefined ? {} : { projectileFlightMs: spec.flight }) }] });
    if (!skill) throw new Error('Missing native elemental monster action');
    expect(getSkillDamageDelivery(skill)).toBe('spell');
  });

  it('copies immutable numeric tuning while leaving its source mutable', () => {
    const { input, row } = fixture();
    row.damage = { min: 12, max: 21, breakdown: { [spec.type]: 21 } }; row.cooldown = 6;
    if (spec.type !== 'cold') row.statusEffect = { ...row.statusEffect as object, dotPctOfDamage: 0.2 };
    if (spec.flight !== undefined) row.projectileFlightMs = 700;
    const before = structuredClone(input), skills = spec.resolve(input);
    const skill = skills.find(value => value.id === spec.canonical), effect = skill?.effects[0];
    expect(input).toEqual(before); expect(Object.isFrozen(row)).toBe(false);
    if (!skill || effect?.kind !== 'damage') throw new Error('Missing native elemental effect');
    for (const value of [skills, skill, skill.effects, effect, effect.base, effect.applyStatus]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(skill.cooldown).toBe(6); expect(effect.base).toEqual([12, 21]);
    expect(effect.applyStatus).toEqual({ ...spec.status, ...(spec.type === 'cold' ? {} : { dotPctOfDamage: 0.2 }) });
    expect(effect.projectileFlightMs).toBe(spec.flight === undefined ? undefined : 700);
    row.damage = { min: 99, max: 99, breakdown: { [spec.type]: 99 } };
    row.statusEffect = { dotPctOfDamage: 0.9 };
    expect(effect.base).toEqual([12, 21]);
    expect(effect.applyStatus).toEqual({ ...spec.status, ...(spec.type === 'cold' ? {} : { dotPctOfDamage: 0.2 }) });
  });

  it('requires exactly one matching authored row', () => {
    const { input, row } = fixture();
    expect(() => spec.resolve(input.filter(value => value !== row))).toThrow();
    expect(() => spec.resolve([...input, row])).toThrow();
  });

  it.each([{ cost: { mana: 1 } }, { appliesStatus: ['freeze'] }, { scaling: { damagePerLevel: 1 } }])('rejects unsupported elemental semantics: %j', change => {
      const { input, row } = fixture(); Object.assign(row, change);
      expect(createSkillValidator()(row)).toBe(false);
      expect(() => spec.resolve(input)).toThrow();
  });

  it('rejects missing projectile flight or invented flight for immediate actions', () => {
    const { input, row } = fixture();
    if (spec.flight === undefined) row.projectileFlightMs = 500;
    else delete row.projectileFlightMs;
    expect(createSkillValidator()(row)).toBe(false);
    expect(() => spec.resolve(input)).toThrow();
  });
});
