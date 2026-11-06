import { expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import monsters from '../../data/monsters/act5.json';
import { resolveBaalTentacles } from './baal-tentacles';
import { createSkillValidator } from './skill-validator';

it('validates, copies and deeply freezes only the dedicated action and body', () => {
  const skills = structuredClone(rows), creatures = structuredClone(monsters);
  const before = structuredClone([skills, creatures]);
  const skill = resolveBaalTentacles(skills, creatures), effect = skill.effects[0];
  if (effect?.kind !== 'summon' || !effect.monsterDef) throw new Error('Missing native summon');
  expect([skills, creatures]).toEqual(before);
  for (const object of [skill, skill.effects, effect, effect.monsterDef, effect.monsterDef.life, effect.monsterDef.skills])
    expect(Object.isFrozen(object)).toBe(true);
  expect(effect.monsterDef).not.toBe(creatures.find(row => row.id === effect.monsterDef?.id));
  expect(Object.isFrozen(creatures[0])).toBe(false);
  expect(effect.monsterDef).toMatchObject({ life: [200, 280], lifeGrowth: [20, 28],
    attack: [40, 40], attackGrowth: [6.25, 6.25], attackSpeed: 100, defense: 40,
    resistances: { physical: 25 }, skills: [], baseExperience: 0, canBeElite: false, canBeBoss: false });
});

it.each(['missing action', 'duplicate action', 'missing body', 'duplicate body', 'invalid body'] as const)('rejects %s instead of silently retaining a stub', mode => {
  const action = rows.find(row => row.id === 'monster-tentacles');
  const body = monsters.find(row => row.id === 'monsters/act5.baal-tentacle');
  if (!action || !body) throw new Error('Missing authored fixture');
  const skills = mode === 'missing action' ? rows.filter(row => row !== action)
    : mode === 'duplicate action' ? [...rows, action] : rows;
  const creatures = mode === 'missing body' ? monsters.filter(row => row !== body)
    : mode === 'duplicate body' ? [...monsters, body]
    : mode === 'invalid body' ? [{ ...body, surprise: true }] : monsters;
  expect(() => resolveBaalTentacles(skills, creatures)).toThrow();
});

it.each([{ count: 4 }, { maxCount: 6 }, { refundOnDeath: true }, { archetypeId: 'monsters/act1.zombie' }])('rejects unsupported tentacle metadata %j', patch => {
  expect(() => resolveBaalTentacles(rows.map(row => row.id === 'monster-tentacles'
    ? { ...row, monsterSummon: { ...row.monsterSummon, ...patch } } : row), monsters)).toThrow();
});

it('rejects mixed damage payloads and preserves the existing zombie-only schema restriction', () => {
  expect(() => resolveBaalTentacles(rows.map(row => row.id === 'monster-tentacles'
    ? { ...row, damageType: 'physical', damage: { min: 30, max: 50, breakdown: { physical: 50 } } } : row), monsters)).toThrow();
  const validate = createSkillValidator();
  const raven = rows.find(row => row.id === 'monster-blood-raven-raise-dead');
  if (!raven) throw new Error('Missing schema negative control');
  expect(validate(raven)).toBe(true);
  expect(validate({ ...raven, monsterSummon: { ...raven.monsterSummon, archetypeId: 'monsters/act5.baal-tentacle' } })).toBe(false);
});
