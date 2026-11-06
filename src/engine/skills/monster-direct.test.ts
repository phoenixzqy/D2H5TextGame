import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from './registry';
import { MONSTER_DIRECT_SKILLS, resolveMonsterDirectSkills } from './monster-direct';
import { createSkillValidator } from './skill-validator';

const cases = [
  ['monster-frost-bolt', 'monster.frost_bolt', 'cold', [25, 40], 2, 'single-enemy', 500, 'spell'],
  ['monster-bone-spirit', 'monster.bone_spirit', 'arcane', [40, 60], 2, 'single-enemy', 500, 'spell'],
  ['monster-whirlwind', 'monster.whirlwind', 'physical', [40, 60], 3, 'all-enemies', 0, 'melee']
] as const;
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(cases)('%s installs a native monster action with the approved payload and both aliases',
  (id, canonical, damageType, base, cooldown, target, flight, delivery) => {
    const skill = getSkill(id);
    expect(getSkill(canonical)).toBe(skill);
    expect(skill).toMatchObject({ id: canonical, archetype: 'monster', cooldown, target,
      minLevel: 1, manaCost: 0, effects: [{ kind: 'damage', damageType, base }] });
    if (!skill) throw new Error('Missing native monster action');
    expect(getSkillDamageDelivery(skill)).toBe(delivery);
    const effect = skill.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing native monster damage');
    expect(effect.projectileFlightMs ?? 0).toBe(flight);
    expect(effect.applyStatus).toEqual(id === 'monster-frost-bolt' ? { id: 'chill' } : undefined);
    expect(effect.tags).toBeUndefined();
    expect(effect.perRank).toBeUndefined();
  });

it.each(cases.slice(1))('%s catalog agrees with the adopted P15 tuning decision',
  (id, _canonical, damageType, base, cooldown) => {
    expect(rows.find(row => row.id === id)).toMatchObject({ cooldown,
      damage: { min: base[0], max: base[1], breakdown: { [damageType]: base[1] } } });
  });

const fixture = (): Record<string, unknown>[] => structuredClone(rows);
function row(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const found = input.find(value => value.id === id);
  if (!found) throw new Error('Missing fixture ' + id);
  return found;
}

describe.each(cases)('%s JSON authority', (id, canonical, damageType, base) => {
  it('copies and deeply freezes native tuning while leaving its source mutable and unchanged', () => {
    const input = fixture(), before = structuredClone(input), resolved = resolveMonsterDirectSkills(input);
    expect(input).toEqual(before);
    expect(resolved).toEqual(MONSTER_DIRECT_SKILLS);
    const skill = resolved.find(value => value.id === canonical), effect = skill?.effects[0];
    if (!skill || effect?.kind !== 'damage') throw new Error('Missing native damage');
    for (const value of [resolved, skill, skill.effects, effect, effect.base,
      ...(effect.applyStatus ? [effect.applyStatus] : [])]) expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(row(input, id))).toBe(false);
    row(input, id).damage = { min: 1, max: 1, breakdown: { [damageType]: 1 } };
    row(input, id).appliesStatus = ['ignite'];
    expect(effect.base).toEqual(base);
    expect(effect.applyStatus).toEqual(id === 'monster-frost-bolt' ? { id: 'chill' } : undefined);
    expect(Reflect.set(effect.base, '0', 999)).toBe(false);
  });

  it('requires exactly one matching authored row', () => {
    const input = fixture();
    expect(() => resolveMonsterDirectSkills(input.filter(value => value.id !== id))).toThrow();
    expect(() => resolveMonsterDirectSkills([...input, row(input, id)])).toThrow();
  });

  it('reads permitted damage, cooldown and flight tuning from JSON', () => {
    const input = fixture(), changed = row(input, id);
    changed.damage = { min: 12, max: 21, breakdown: { [damageType]: 21 } };
    changed.cooldown = 6;
    if (id !== 'monster-whirlwind') changed.projectileFlightMs = 700;
    const skill = resolveMonsterDirectSkills(input).find(value => value.id === canonical);
    expect(skill?.cooldown).toBe(6);
    expect(skill?.effects[0]).toMatchObject({ base: [12, 21] });
    if (id !== 'monster-whirlwind') expect(skill?.effects[0]).toMatchObject({ projectileFlightMs: 700 });
  });

  it.each([
    { cooldown: 0 }, { target: 'self' }, { trigger: 'passive' }, { cost: { mana: 1 } },
    { maxLevel: 20 }, { scaling: { damagePerLevel: 1 } }, { attackDamagePct: 100 },
    { statusEffect: { chance: .5 } }, { appliesStatus: ['ignite'] }, { summon: true },
    { damage: { min: -1, max: 2, breakdown: { [damageType]: 2 } } },
    { damage: { min: 1.5, max: 2, breakdown: { [damageType]: 2 } } }
  ])('rejects unsupported semantics in the schema and native resolver: %j', change => {
    const input = fixture(), changed = row(input, id); Object.assign(changed, change);
    expect(createSkillValidator()(changed)).toBe(false);
    expect(() => resolveMonsterDirectSkills(input)).toThrow();
  });

  it.each([
    { min: 5, max: 2, breakdown: { [damageType]: 2 } },
    { min: 1, max: 2, breakdown: { [damageType]: 3 } },
    { min: 1, max: Infinity, breakdown: { [damageType]: Infinity } },
    { min: 1, max: 2, breakdown: { fire: 2 } }
  ])('rejects inconsistent damage ranges or composition: %j', damage => {
    const input = fixture(); row(input, id).damage = damage;
    expect(() => resolveMonsterDirectSkills(input)).toThrow();
  });
});

it.each([
  ['monster-frost-bolt', 0], ['monster-bone-spirit', 5001], ['monster-whirlwind', 500]
])('rejects unsupported %s flight %s', (id, flight) => {
  const input = fixture(), changed = row(input, String(id)); changed.projectileFlightMs = flight;
  expect(createSkillValidator()(changed)).toBe(false);
  expect(() => resolveMonsterDirectSkills(input)).toThrow();
});
