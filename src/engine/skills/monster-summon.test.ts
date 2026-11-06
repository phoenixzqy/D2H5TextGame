import { beforeEach, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import authored from '../../data/summons/monster.json';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import { getSkill, loadDefaultSkills, resetRegistry } from './registry';
import { getMonsterSummonStats, resolveMonsterSummonDefinition, resolveMonsterSummonSkill } from './monster-summon';
import { createSkillValidator } from './skill-validator';
import { getSummonStats } from './summons';

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });

it('preserves the complete native startup payload without introducing batches or refunds', () => {
  expect(getSkill('monster-summon-adds')).toEqual({
    id: 'monster.summon_adds', archetype: 'monster', target: 'summon', cooldown: 5,
    manaCost: 0, minLevel: 1, summonOnStart: true,
    effects: [{ kind: 'summon', summonId: 'minion', maxCount: 2 }]
  });
  expect(getSkill('monster.summon_adds')).toBe(getSkill('monster-summon-adds'));
});

it('copies authored cap, startup and cooldown tuning without retaining caller state', () => {
  const input = structuredClone(rows), tuning = structuredClone(authored);
  const row = input.find(value => value.id === 'monster-summon-adds');
  if (!row) throw new Error('Missing Summon Adds fixture');
  row.cooldown = 7; tuning.summonAdds.maxCount = 3; tuning.summonAdds.onStart = false;
  const before = structuredClone({ input, tuning });
  const skill = resolveMonsterSummonSkill(input, tuning);
  expect(skill).toMatchObject({ cooldown: 7, summonOnStart: false,
    effects: [{ kind: 'summon', summonId: 'minion', maxCount: 3 }] });
  for (const value of [skill, skill.effects, skill.effects[0]]) expect(Object.isFrozen(value)).toBe(true);
  expect({ input, tuning }).toEqual(before);
  expect(Object.isFrozen(row)).toBe(false); expect(Object.isFrozen(tuning.summonAdds)).toBe(false);
  row.cooldown = 10; tuning.summonAdds.maxCount = 4;
  expect(skill.cooldown).toBe(7); expect(skill.effects[0]).toMatchObject({ maxCount: 3 });
});

it('requires exactly one matching catalog row', () => {
  const row = rows.find(value => value.id === 'monster-summon-adds');
  expect(() => resolveMonsterSummonSkill(rows.filter(value => value !== row), authored)).toThrow();
  expect(() => resolveMonsterSummonSkill([...rows, row], authored)).toThrow();
});

it.each([
  { cost: { mana: 1 } }, { scaling: { damagePerLevel: 1 } },
  { target: 'all-enemies' }, { trigger: 'passive' }, { summonId: 'skeleton' },
  { monsterSummon: { archetypeId: 'monsters/act1.fallen', count: 2, maxCount: 2, refundOnDeath: false } }
])('rejects unsupported action semantics: %j', patch => {
  const input: Record<string, unknown>[] = structuredClone(rows);
  const row = input.find(value => value.id === 'monster-summon-adds');
  if (!row) throw new Error('Missing Summon Adds fixture');
  Object.assign(row, patch);
  expect(createSkillValidator()(row)).toBe(false);
  expect(() => resolveMonsterSummonSkill(input, authored)).toThrow();
});

it('requires the explicit free cost and template identity', () => {
  for (const field of ['cost', 'summonId']) {
    const input: Record<string, unknown>[] = structuredClone(rows);
    const row = input.find(value => value.id === 'monster-summon-adds');
    if (!row) throw new Error('Missing Summon Adds fixture');
    Reflect.deleteProperty(row, field);
    expect(() => resolveMonsterSummonSkill(input, authored)).toThrow();
  }
});

it('preserves complete fixed minion body stats and isolates preview mutations', () => {
  const stats = getMonsterSummonStats('minion');
  const expected = { life: 40, lifeMax: 40, mana: 0, manaMax: 0, attack: 10, defense: 10,
    attackSpeed: 70, critChance: 0.05, critDamage: 1.5, physDodge: 0.05, magicDodge: 0.05,
    magicFind: 0, goldFind: 0, magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } };
  expect(stats).toEqual(expected);
  expect(getSummonStats('minion', { skillLevel: 20, ownerLevel: 90 })).toEqual(expected);
  if (!stats) throw new Error('Missing fixed minion body');
  Reflect.set(stats, 'attack', 9999); Reflect.set(stats.resistances, 'cold', 99);
  expect(getMonsterSummonStats('minion')).toEqual(expected);
  expect(getSummonStats('minion')).toEqual(expected);
  for (const foreign of ['skeleton', 'valkyrie', 'spirit_of_barbs', '__proto__', 'constructor', '']) {
    expect(getMonsterSummonStats(foreign)).toBeUndefined();
  }
});

it('copies complete body tuning deeply without freezing the caller', () => {
  const input = structuredClone(authored);
  input.templates.minion.lifeMax = 60; input.templates.minion.resistances.cold = 10;
  const before = structuredClone(input), result = resolveMonsterSummonDefinition(input);
  expect(result).toEqual(before);
  for (const value of [result, result.summonAdds, result.templates, result.templates.minion,
    result.templates.minion.resistances]) expect(Object.isFrozen(value)).toBe(true);
  expect(Object.isFrozen(input.templates.minion.resistances)).toBe(false);
  input.templates.minion.lifeMax = 99; input.templates.minion.resistances.cold = 80;
  expect(result).toEqual(before);
});

it.each(Object.keys(authored.templates.minion))('requires the complete minion %s field', field => {
  const input = structuredClone(authored);
  Reflect.deleteProperty(input.templates.minion, field);
  expect(() => resolveMonsterSummonDefinition(input)).toThrow('Invalid authored monster summon');
});

it('rejects incomplete or malformed body, resistance, startup and cap tuning without defaults', () => {
  for (const patch of [
    { lifeMax: 0 }, { manaMax: -1 }, { attack: -1 }, { defense: NaN }, { attackSpeed: Infinity },
    { critChance: 1.01 }, { physDodge: -0.01 }, { extra: true }, { resistances: {} },
    { resistances: { ...authored.templates.minion.resistances, cold: 101 } }
  ]) expect(() => resolveMonsterSummonDefinition({ ...authored,
    templates: { minion: { ...authored.templates.minion, ...patch } } })).toThrow();
  for (const summonAdds of [{}, { maxCount: 2 }, { onStart: true }, { maxCount: 0, onStart: true },
    { maxCount: 1.5, onStart: true }, { maxCount: 2, onStart: 1 }, { ...authored.summonAdds, count: 2 }]) {
    const input = { ...authored, summonAdds };
    expect(() => resolveMonsterSummonDefinition(input)).toThrow();
    expect(() => resolveMonsterSummonSkill(rows, input)).toThrow();
  }
  for (const input of [null, [], {}, { ...authored, id: 'summons/amazon' },
    { ...authored, extra: true }, { ...authored, templates: {} }]) {
    expect(() => resolveMonsterSummonDefinition(input)).toThrow();
  }
});
