import { describe, expect, it } from 'vitest';
import skills from '../../data/skills/necromancer.json';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';
import type { CombatUnit } from '../combat/types';
import type { DerivedStats } from '../types/attributes';
import type { SkillDef } from '../types/skills';
import { buildSummon, getSummonStats } from './summons';
import { createSkillValidator } from './skill-validator';
import { computeSkillRankDisplayStats } from './displayStats';
import authored from '../../data/summons/necromancer.json';
import { getNecromancerSummonStats, resolveNecromancerSummonDefinition } from './necromancer-summon-definition';

// Literal pre-migration compatibility oracles, independent of authored body data.
const bodies = [
  ['skeleton', 112, 25, 14, 70, 0.05, 0.05, 0, 0, 0, 0, 0],
  ['clay_golem', 220, 24, 34, 55, 0.02, 0.02, 10, 0, 0, 0, 0],
  ['skeletal_mage', 88, 30, 10, 70, 0.05, 0.08, 0, 10, 10, 10, 10],
  ['iron_golem', 260, 36, 48, 60, 0.05, 0.05, 20, 0, 0, 20, 0],
  ['revived', 150, 28, 18, 65, 0.05, 0.05, 0, 0, 0, 0, 0]
] as const;
const ranked = [
  ['skeleton', [[112, 25, 14, 0.05], [162, 35, 19, 0.05], [302, 63, 33, 0.05]]],
  ['clay_golem', [[220, 24, 34, 0.02], [310, 29, 44, 0.02], [562, 43, 72, 0.02]]],
  ['skeletal_mage', [[88, 30, 10, 0.08], [123, 45, 10, 0.09], [221, 87, 10, 0.118]]],
  ['iron_golem', [[260, 36, 48, 0.05], [340, 46, 63, 0.05], [564, 74, 105, 0.05]]],
  ['revived', [[150, 28, 18, 0.05], [210, 38, 23, 0.05], [378, 66, 37, 0.05]]]
] as const;
const ownerStats: DerivedStats = { life: 100, lifeMax: 100, mana: 50, manaMax: 50,
  attack: 10, defense: 0, magicResist: 0, attackSpeed: 10, critChance: 0, critDamage: 1.5,
  physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } };
const owner: CombatUnit = { id: 'necro-body-data', name: 'Necromancer', side: 'player', level: 30,
  kind: 'hero', tier: 'trash', stats: ownerStats, life: 100, mana: 50, statuses: [],
  cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false };
const validate = createSkillValidator<SkillDef>();
function sourceFor(id: string): SkillDef {
  const row: unknown = skills.find(row => 'summonId' in row && row.summonId === id);
  if (!validate(row)) throw new Error('Missing valid native summon skill');
  return row;
}

describe('complete pre-migration Necromancer body compatibility', () => {
  it.each(bodies.map(([id, life, attack, defense, attackSpeed, physDodge, magicDodge, physical, fire, cold, lightning, poison]) =>
    ({ id, life, attack, defense, attackSpeed, physDodge, magicDodge, physical, fire, cold, lightning, poison })))(
    '$id preserves every base stat in factory and pure lookup',
    ({ id, life, attack, defense, attackSpeed, physDodge, magicDodge, physical, fire, cold, lightning, poison }) => {
      const expected = { life, lifeMax: life, mana: 0, manaMax: 0, attack, defense,
        magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
        attackSpeed, physDodge, magicDodge, critChance: 0.05, critDamage: 1.5, magicFind: 0, goldFind: 0,
        resistances: { physical, fire, cold, lightning, poison, arcane: 0 } };
      expect(getSummonStats(id)).toEqual(expected);
      const body = buildSummon(owner, id);
      expect(body?.stats).toEqual(expected);
      expect(body).toMatchObject({ life, mana: 0, side: 'player', level: 30,
        summonOwnerId: owner.id, summonTemplateId: id, summon: true, kind: 'summon' });
    });
  it.each(ranked)('%s preserves authored rank 1/6/20 growth in bodies and UI previews', (id, values) => {
    const source = sourceFor(id), before = structuredClone(source);
    [1, 6, 20].forEach((rank, index) => {
      const expected = values[index];
      if (!expected) throw new Error('Missing literal rank oracle');
      const [lifeMax, attack, defense, magicDodge] = expected;
      const options = { skillLevel: rank, statScaling: source.scaling?.summonStatsPerLevel };
      const stats = getSummonStats(id, options);
      expect(stats).toMatchObject({ life: lifeMax, lifeMax, attack, defense, magicDodge });
      expect(buildSummon(owner, id, options)?.stats).toEqual(stats);
      const preview = computeSkillRankDisplayStats(source, rank).summonUnit;
      expect(Object.fromEntries(preview?.stats.map(row => [row.id, row.value]) ?? []))
        .toMatchObject({ lifeMax, attack, defense });
    });
    expect(source).toEqual(before);
  });
});

describe('JSON-owned Necromancer summon definitions', () => {
  it.each(bodies.map(([id]) => ({ id })))('$id returns fresh independent stats for runtime and preview', ({ id }) => {
    const first = getNecromancerSummonStats(id), second = getNecromancerSummonStats(id);
    expect(first).toEqual(getSummonStats(id));
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first?.resistances).not.toBe(second?.resistances);
    if (!first || !second) throw new Error('Missing expected body');
    Reflect.set(first, 'attack', 9999);
    Reflect.set(first.resistances, 'physical', 99);
    expect(getNecromancerSummonStats(id)).toEqual(second);
    expect(buildSummon(owner, id)?.stats).toEqual(second);
  });
  it('deeply copies and freezes every definition while preserving caller mutability', () => {
    const input = structuredClone(authored), result = resolveNecromancerSummonDefinition(input);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.templates)).toBe(true);
    expect(Object.isFrozen(input)).toBe(false);
    for (const [id] of bodies) {
      const before = structuredClone(input.templates[id]);
      expect(Object.isFrozen(input.templates[id])).toBe(false);
      expect(Object.isFrozen(result.templates[id])).toBe(true);
      expect(Object.isFrozen(result.templates[id].resistances)).toBe(true);
      input.templates[id].attack = 999;
      input.templates[id].resistances.physical = 95;
      expect(result.templates[id]).toEqual(before);
    }
  });
  it('keeps edited valid tuning instead of substituting legacy literals', () => {
    const input = structuredClone(authored);
    input.templates.skeleton.attack = 42;
    input.templates.clay_golem.resistances.cold = 15;
    const result = resolveNecromancerSummonDefinition(input);
    expect(result.templates.skeleton.attack).toBe(42);
    expect(result.templates.clay_golem.resistances.cold).toBe(15);
  });
  it.each([undefined, null, [], {}, { ...authored, id: 'summons/foreign' },
    { ...authored, extra: 1 }, { ...authored, templates: { ...authored.templates, foreign: {} } }
  ])('rejects malformed/foreign definitions %# without fallback', input => {
    expect(() => resolveNecromancerSummonDefinition(input)).toThrow('Invalid authored Necromancer summon definition');
  });
  it.each(bodies.map(([id]) => ({ id })))('requires complete valid body $id and all six resistances', ({ id }) => {
    const missingBody = structuredClone(authored);
    Reflect.deleteProperty(missingBody.templates, id);
    expect(() => resolveNecromancerSummonDefinition(missingBody)).toThrow();
    for (const key of Object.keys(authored.templates[id])) {
      const input = structuredClone(authored);
      Reflect.deleteProperty(input.templates[id], key);
      expect(() => resolveNecromancerSummonDefinition(input)).toThrow();
    }
    for (const key of Object.keys(authored.templates[id].resistances)) {
      const input = structuredClone(authored);
      Reflect.deleteProperty(input.templates[id].resistances, key);
      expect(() => resolveNecromancerSummonDefinition(input)).toThrow();
    }
    for (const [key, value] of [['lifeMax', 0], ['attack', -1], ['attack', NaN],
      ['defense', Infinity], ['attackSpeed', 1.5], ['critChance', 1.1],
      ['magicDodge', -0.1], ['extra', 1]] as const) {
      const input = structuredClone(authored);
      Reflect.set(input.templates[id], key, value);
      expect(() => resolveNecromancerSummonDefinition(input)).toThrow();
    }
    for (const [key, value] of [['physical', 101], ['cold', NaN], ['fire', Infinity], ['extra', 0]] as const) {
      const input = structuredClone(authored);
      Reflect.set(input.templates[id].resistances, key, value);
      expect(() => resolveNecromancerSummonDefinition(input)).toThrow();
    }
  });
  it.each(['unknown', 'constructor', '__proto__', 'blood_golem', 'fire_golem', 'raven', 'minion'])(
    'does not claim unrelated template %s', id => {
      expect(getNecromancerSummonStats(id)).toBeUndefined();
    });
});
