import { expect, it } from 'vitest';
import rows from '@/data/skills/amazon.json';
import { createSkillValidator } from '@/engine/skills/skill-validator';
import type { SkillDef } from '@/engine/types/skills';
import { buildSummon, getSummonStats } from '@/engine/skills/summons';
import { computeSkillRankDisplayStats } from '@/engine/skills/displayStats';
import { MITIGATION_DEFINITION } from '@/engine/combat/mitigation-definition';
const validate = createSkillValidator<SkillDef>();
const source = rows.find((row) => row.id === 'skills-amazon-valkyrie');
if (!validate(source)) throw new Error('Missing valid Valkyrie definition');
it.each([
  [1, 200, 40, 20],
  [6, 270, 55, 30],
  [20, 466, 97, 58]
])('preserves literal Valkyrie rank%i body and preview', (rank, life, attack, defense) => {
  const stats = getSummonStats('valkyrie', {
    skillLevel: rank,
    statScaling: source.scaling.summonStatsPerLevel
  });
  expect(stats).toEqual({
    life,
    lifeMax: life,
    mana: 0,
    manaMax: 0,
    attack,
    defense,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    attackSpeed: 70,
    critChance: 0.05,
    critDamage: 1.5,
    physDodge: 0.05,
    magicDodge: 0.05,
    magicFind: 0,
    goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
  });
  expect(
    Object.fromEntries(
      computeSkillRankDisplayStats(source, rank).summonUnit?.stats.map((row) => [
        row.id,
        row.value
      ]) ?? []
    )
  ).toMatchObject({ lifeMax: life, attack, defense });
});

import authored from '../../data/summons/amazon.json';
import { getAmazonSummonStats, resolveAmazonSummonDefinition } from './amazon-summon-definition';
import type { CombatUnit } from '../combat/types';
it('uses the same complete body for native factories and pure previews without sharing mutable stats', () => {
  const stats = getAmazonSummonStats('valkyrie');
  if (!stats) throw new Error('Missing Valkyrie body');
  const owner: CombatUnit = {
    id: 'amazon-body-test',
    name: 'Amazon',
    side: 'player',
    kind: 'hero',
    tier: 'trash',
    level: 30,
    stats,
    life: stats.lifeMax,
    mana: 0,
    statuses: [],
    cooldowns: {},
    skillOrder: [],
    activeBuffIds: [],
    enraged: false,
    summonedAdds: false
  };
  for (const rank of [1, 6, 20]) {
    const options = { skillLevel: rank, statScaling: source.scaling.summonStatsPerLevel };
    const body = buildSummon(owner, 'valkyrie', options);
    expect(body?.stats).toEqual(getSummonStats('valkyrie', options));
    expect(body).toMatchObject({
      side: 'player',
      level: 30,
      summon: true,
      kind: 'summon',
      summonOwnerId: owner.id,
      summonTemplateId: 'valkyrie'
    });
    expect(body?.life).toBe(body?.stats.lifeMax);
    expect(body?.mana).toBe(0);
  }
  const before = structuredClone(stats);
  Reflect.set(stats, 'attack', 9999);
  Reflect.set(stats.resistances, 'physical', 99);
  const next = getAmazonSummonStats('valkyrie');
  expect(next).toEqual(before);
  expect(next?.resistances).not.toBe(stats.resistances);
  expect(buildSummon(owner, 'valkyrie')?.stats).toEqual(before);
  for (const foreign of [
    'skeleton',
    'raven',
    'shadow_master',
    'decoy',
    '__proto__',
    'constructor',
    ''
  ])
    expect(getAmazonSummonStats(foreign)).toBeUndefined();
});
it('copies and deeply freezes validated data while leaving the caller mutable', () => {
  const input = structuredClone(authored),
    before = structuredClone(input);
  const result = resolveAmazonSummonDefinition(input);
  expect(result).toEqual(before);
  expect(Object.isFrozen(result)).toBe(true);
  expect(Object.isFrozen(result.templates)).toBe(true);
  expect(Object.isFrozen(result.templates.valkyrie)).toBe(true);
  expect(Object.isFrozen(result.templates.valkyrie.resistances)).toBe(true);
  expect(Object.isFrozen(input)).toBe(false);
  expect(Object.isFrozen(input.templates.valkyrie.resistances)).toBe(false);
  input.templates.valkyrie.lifeMax = 300;
  input.templates.valkyrie.resistances.physical = 10;
  expect(result).toEqual(before);
  expect(resolveAmazonSummonDefinition(input)).toEqual(input);
});
it.each(Object.keys(authored.templates.valkyrie))('rejects missing Valkyrie field %s', (field) => {
  const input = structuredClone(authored);
  Reflect.deleteProperty(input.templates.valkyrie, field);
  expect(() => resolveAmazonSummonDefinition(input)).toThrow('Invalid authored Amazon');
});
it.each(Object.keys(authored.templates.valkyrie.resistances))(
  'requires the complete %s resistance',
  (field) => {
    const input = structuredClone(authored);
    Reflect.deleteProperty(input.templates.valkyrie.resistances, field);
    expect(() => resolveAmazonSummonDefinition(input)).toThrow('Invalid authored Amazon');
  }
);
it('rejects malformed, foreign, nonfinite, out-of-range and unknown tuning without defaults', () => {
  for (const input of [
    null,
    [],
    {},
    { ...authored, id: 'summons/necromancer' },
    { ...authored, extra: true },
    { ...authored, templates: {} },
    {
      ...authored,
      templates: { ...authored.templates, shadow_master: authored.templates.valkyrie }
    }
  ])
    expect(() => resolveAmazonSummonDefinition(input)).toThrow('Invalid authored Amazon');
  for (const patch of [
    { lifeMax: 0 },
    { lifeMax: -1 },
    { lifeMax: 1.5 },
    { manaMax: -1 },
    { attack: -1 },
    { defense: NaN },
    { attackSpeed: Infinity },
    { critChance: 1.01 },
    { critDamage: 0.5 },
    { physDodge: -0.01 },
    { magicDodge: 2 },
    { magicFind: -1 },
    { goldFind: -1 },
    { extra: 1 },
    { resistances: {} },
    { resistances: { ...authored.templates.valkyrie.resistances, arcane: 101 } },
    { resistances: { ...authored.templates.valkyrie.resistances, cold: -101 } },
    { resistances: { ...authored.templates.valkyrie.resistances, lightning: NaN } }
  ])
    expect(() =>
      resolveAmazonSummonDefinition({
        ...authored,
        templates: {
          valkyrie: { ...authored.templates.valkyrie, ...patch }
        }
      })
    ).toThrow('Invalid authored Amazon');
});
