import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { createSkillValidator } from './skill-validator';
import { MONSTER_PHYSICAL_SKILLS, resolveMonsterPhysicalSkills } from './monster-physical';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from './registry';

const cases = [
  ['monster-charge', 'monster.charge', 4, [60, 90], 'single-enemy', 'melee', undefined],
  ['monster-rend', 'monster.rend', 2, [25, 40], 'single-enemy', 'melee',
    { id: 'bleed', dotPctOfDamage: .1, durationMs: 3000 }],
  ['monster-leap', 'monster.leap', 3, [40, 60], 'single-enemy', 'melee', undefined],
  ['monster-leap-attack', 'monster.leap_attack', 3, [50, 70], 'single-enemy', 'melee',
    { id: 'stun', chance: .5, durationMs: 1000 }],
  ['monster-war-cry', 'monster.war_cry', 4, [20, 30], 'all-enemies', 'spell',
    { id: 'stun', chance: .3, durationMs: 1000 }]
] as const;
const fixture = (): Record<string, unknown>[] => structuredClone(rows);
function row(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const found = input.find(value => value.id === id);
  if (!found) throw new Error('Missing fixture ' + id);
  return found;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(cases)('%s JSON-backed native action', (authored, canonical, cooldown, base, target, delivery, status) => {
  it('resolves both aliases with exact native damage, delivery and status without combo tags', () => {
    const skill = getSkill(authored);
    expect(getSkill(canonical)).toBe(skill);
    expect(skill).toMatchObject({ id: canonical, archetype: 'monster', target, cooldown,
      manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base }] });
    if (!skill) throw new Error('Missing native skill');
    expect(getSkillDamageDelivery(skill)).toBe(delivery);
    const effect = skill.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing damage');
    expect(effect.applyStatus).toEqual(status);
    expect(effect.tags).toBeUndefined();
    expect(effect.attackDamagePct).toBe(authored === 'monster-charge' ? 100 : undefined);
    expect(effect.perRank).toBeUndefined();
  });

  it('copies and deeply freezes native tuning without freezing or mutating input', () => {
    const input = fixture(), before = structuredClone(input);
    const resolved = resolveMonsterPhysicalSkills(input), skill = resolved.find(value => value.id === canonical);
    expect(input).toEqual(before);
    expect(resolved).toEqual(MONSTER_PHYSICAL_SKILLS);
    if (!skill) throw new Error('Missing resolved skill');
    const effect = skill.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing damage');
    for (const value of [resolved, skill, skill.effects, effect, effect.base, ...(effect.applyStatus ? [effect.applyStatus] : [])])
      expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(input)).toBe(false);
    row(input, authored).damage = { min: 1, max: 1, breakdown: { physical: 1 } };
    row(input, authored).statusEffect = { durationMs: 99 };
    expect(effect.base).toEqual(base);
    expect(effect.applyStatus).toEqual(status);
    expect(Reflect.set(effect.base, '0', 999)).toBe(false);
  });

  it('rejects missing and duplicate authored leaves', () => {
    expect(() => resolveMonsterPhysicalSkills(fixture().filter(value => value.id !== authored))).toThrow();
    const input = fixture();
    expect(() => resolveMonsterPhysicalSkills([...input, row(input, authored)])).toThrow();
  });

  it.each([
    { damage: { min: 5, max: 2, breakdown: { physical: 2 } } },
    { damage: { min: 1.5, max: 2, breakdown: { physical: 2 } } },
    { damage: { min: -1, max: 2, breakdown: { physical: 2 } } },
    { damage: { min: 1, max: 2, breakdown: { physical: 3 } } },
    { damage: { min: 1, max: 2, breakdown: { fire: 2 } } },
    { damage: { min: 1, max: Infinity, breakdown: { physical: Infinity } } },
    { cost: { mana: 1 } }, { scaling: { damagePerLevel: 1 } }, { attackDamagePct: -1 },
    { hitSequence: { count: 2 } }, { trigger: 'passive' }, { maxLevel: 20 },
    { cooldown: 0 }, { target: 'self' }, { additionalStatusEffects: [] }
  ])('rejects malformed or unsupported semantics %j', change => {
    const input = fixture(); Object.assign(row(input, authored), change);
    expect(() => resolveMonsterPhysicalSkills(input)).toThrow();
  });
});

it.each(['monster-rend', 'monster-leap', 'monster-leap-attack', 'monster-war-cry'])(
  'keeps %s fixed-only in schema and adapter', id => {
    const input = fixture(), changed = row(input, id); changed.attackDamagePct = 100;
    expect(createSkillValidator()(changed)).toBe(false);
    expect(() => resolveMonsterPhysicalSkills(input)).toThrow();
  });

it.each([
  ['monster-rend', { dotPctOfDamage: 0, durationMs: 3000 }],
  ['monster-rend', { dotPctOfDamage: 1.1, durationMs: 3000 }],
  ['monster-rend', { dotPctOfDamage: .1, durationMs: 0 }],
  ['monster-rend', { durationMs: 3000 }],
  ['monster-rend', { dotPctOfDamage: .1, durationMs: 3000, stacksOnApply: 3 }],
  ['monster-leap-attack', { chance: -.1, durationMs: 1000 }],
  ['monster-leap-attack', { chance: 1.1, durationMs: 1000 }],
  ['monster-leap-attack', { chance: .5 }],
  ['monster-war-cry', { chance: .3, durationMs: -1 }],
  ['monster-war-cry', { chance: .3, durationMs: 1000, dotPctOfDamage: .1 }],
  ['monster-charge', { durationMs: 1000 }], ['monster-leap', { chance: .5, durationMs: 1000 }]
] as const)('rejects invalid %s status metadata %j in schema and adapter', (id, statusEffect) => {
  const input = fixture(), changed = row(input, id); changed.statusEffect = statusEffect;
  expect(createSkillValidator()(changed)).toBe(false);
  expect(() => resolveMonsterPhysicalSkills(input)).toThrow();
});

it('derives permitted numeric tuning from JSON instead of duplicated engine constants', () => {
  const input = fixture(); row(input, 'monster-rend').damage = { min: 10, max: 20, breakdown: { physical: 20 } };
  row(input, 'monster-rend').statusEffect = { dotPctOfDamage: .2, durationMs: 4500 };
  const skill = resolveMonsterPhysicalSkills(input).find(value => value.id === 'monster.rend');
  expect(skill?.effects[0]).toEqual({ kind: 'damage', damageType: 'physical', base: [10, 20],
    applyStatus: { id: 'bleed', dotPctOfDamage: .2, durationMs: 4500 } });
});
