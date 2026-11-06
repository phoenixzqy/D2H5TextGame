import { expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { MONSTER_CURSE_SKILL, resolveMonsterCurseSkill } from './monster-curse';

function fixture(): Record<string, unknown> {
  const row = rows.find(row => row.id === 'monster-curse');
  if (!row) throw new Error('Missing authored Curse');
  return structuredClone(row);
}

it('copies and freezes the real catalog action without freezing or mutating its source', () => {
  const row = fixture(), before = structuredClone(row);
  const skill = resolveMonsterCurseSkill([row]);
  expect(skill).toEqual(MONSTER_CURSE_SKILL);
  expect(row).toEqual(before);
  for (const value of [skill, skill.effects, skill.effects[0]]) expect(Object.isFrozen(value)).toBe(true);
  expect(Object.isFrozen(row)).toBe(false);
  row.cooldown = 5;
  expect(resolveMonsterCurseSkill([row]).cooldown).toBe(5);
  expect(skill.cooldown).toBe(4);
  expect(Reflect.set(skill, 'cooldown', 99)).toBe(false);
});

it('requires one exact authored identity and rejects a missing, aliased or duplicated source', () => {
  const row = fixture();
  for (const input of [[], [{ ...row, id: 'monster.curse' }], [row, row]])
    expect(() => resolveMonsterCurseSkill(input)).toThrow(/exactly one/);
});

it.each([
  { target: 'all-enemies' }, { trigger: 'passive' }, { cooldown: 0 }, { cooldown: .5 }, { cooldown: Infinity },
  { minLevel: 2 }, { maxLevel: 20 }, { cost: { mana: 1 } }, { appliesTags: ['arcane'] },
  { appliesTags: ['amp-damage', 'fire'] }, { appliesTags: undefined },
  { damage: { min: 0, max: 0, breakdown: { arcane: 0 } } }, { damageType: 'arcane' },
  { appliesStatus: ['amplify'] }, { statusEffect: { durationMs: 1000 } },
  { scaling: { damagePerLevel: 1 } }, { heal: { pctOfMaxLife: .5, target: 'self' } },
  { summon: true }, { summonId: 'minion' }, { timedBuff: { durationMs: 3000 } },
  { unexpected: true }
])('rejects invalid or unsupported authored Curse semantics %j', patch => {
  expect(() => resolveMonsterCurseSkill([{ ...fixture(), ...patch }])).toThrow(/Invalid authored/);
});
