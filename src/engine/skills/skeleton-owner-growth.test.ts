import { describe, expect, it } from 'vitest';
import type { CombatUnit } from '../combat/types';
import type { DerivedStats } from '../types/attributes';
import { mitigateDamage } from '../combat/damage';
import { buildSummon, getSummonStats } from './summons';
import { composeSkeletonMastery, empowerSkeletonSummon } from './skeleton-mastery';
import { computeSkillDisplayModel } from './displayStats';
import authored from '../../data/summons/necromancer.json';
import skills from '../../data/skills/necromancer.json';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
import { resolveNecromancerSummonDefinition } from './necromancer-summon-definition';

const stats: DerivedStats = { life: 100, lifeMax: 100, mana: 100, manaMax: 100,
  attack: 20, defense: 10, magicResist: 0, attackSpeed: 70, critChance: 0,
  critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } };
const owner: CombatUnit = { id: 'owner-growth', name: 'Necromancer', side: 'player',
  kind: 'hero', level: 12, tier: 'trash', stats, life: 100, mana: 100, statuses: [],
  cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false };
const scaling = { lifeMax: 10, attack: 2, defense: 1 };

describe('Skeleton owner growth', () => {
  it('keeps owner1 baseline and adds earned level before Mastery', () => {
    const base = buildSummon({ ...owner, level: 1 }, 'skeleton', { skillLevel: 11, statScaling: scaling });
    const body = buildSummon(owner, 'skeleton', { skillLevel: 11, statScaling: scaling });
    expect(base?.stats).toMatchObject({ lifeMax: 212, attack: 45, defense: 24 });
    expect(body?.stats).toMatchObject({ lifeMax: 542, attack: 199, defense: 68 });
    if (!body) throw new Error('Missing skeleton');
    const mastery = composeSkeletonMastery({ id: owner.id, class: 'necromancer', level: 12,
      skillLevels: { 'necromancer.skeleton_mastery': 1 } });
    const boosted = empowerSkeletonSummon(mastery, owner, body);
    expect(boosted.stats.lifeMax).toBeCloseTo(563.68);
    expect(boosted.stats.attack).toBeCloseTo(202.98);
    expect(boosted.stats.defense).toBeCloseTo(68.68);
    expect(boosted.life).toBe(boosted.stats.lifeMax);
    const damage = mitigateDamage(boosted.stats.attack, { type: 'physical', defenderArmor: 98,
      defenderMagicResist: 26, defenderResistances: { ...stats.resistances, physical: 30 } });
    expect(damage.final).toBeGreaterThan(1);
    expect(base?.stats).toMatchObject({ lifeMax: 212, attack: 45, defense: 24 });
  });
  it('uses the same owner growth in runtime and current/next previews', () => {
    const validate = createSkillValidator<SkillDef>();
    const skill: unknown = skills.find(row => row.id === 'skills-necromancer-raise-skeleton');
    if (!validate(skill)) throw new Error('Invalid skeleton skill');
    const model = computeSkillDisplayModel(skill, 11, undefined, undefined, undefined, undefined, owner.level);
    for (const [rank, preview] of [[11, model.current], [12, model.next]] as const) {
      const body = buildSummon(owner, 'skeleton', { skillLevel: rank,
        statScaling: skill.scaling?.summonStatsPerLevel });
      expect(Object.fromEntries(preview?.summonUnit?.stats.map(row => [row.id, row.value]) ?? []))
        .toMatchObject({ lifeMax: body?.stats.lifeMax, attack: body?.stats.attack, defense: body?.stats.defense });
    }
    expect(model.current?.summonUnit?.stats.find(row => row.id === 'attack')?.value).toBe(199);
  });
  it('does not grow hostile skeletons or unrelated summoned templates', () => {
    expect(buildSummon({ ...owner, side: 'enemy' }, 'skeleton')?.stats).toEqual(getSummonStats('skeleton'));
    expect(buildSummon({ ...owner, kind: 'merc' }, 'skeleton')?.stats).toEqual(getSummonStats('skeleton'));
    expect(buildSummon(owner, 'clay_golem')?.stats).toEqual(getSummonStats('clay_golem'));
    expect(buildSummon(owner, 'valkyrie')?.stats).toEqual(getSummonStats('valkyrie'));
  });
  it('preserves capped skill progression at earned owner55 and scales Mage bodies too', () => {
    const hero = { ...owner, level: 55 };
    const body = buildSummon(hero, 'skeleton', { skillLevel: 20, statScaling: scaling });
    if (!body) throw new Error('Missing skeleton');
    const mastery = composeSkeletonMastery({ id: hero.id, class: 'necromancer', level: 55,
      skillLevels: { 'necromancer.skeleton_mastery': 20 } });
    const boosted = empowerSkeletonSummon(mastery, hero, body);
    expect(boosted.stats.lifeMax).toBeCloseTo(3459.6);
    expect(boosted.stats.attack).toBeCloseTo(1146.6);
    expect(boosted.stats.defense).toBeCloseTo(298.8);
    expect(mitigateDamage(boosted.stats.attack, { type: 'physical', defenderArmor: 560,
      defenderMagicResist: 243, defenderResistances: stats.resistances }).final).toBeGreaterThan(1);
    expect(getSummonStats('skeletal_mage', { ownerLevel: 12, skillLevel: 1 }))
      .toMatchObject({ lifeMax: 308, attack: 140, defense: 43 });
  });
  it('requires and freezes complete JSON owner growth without retaining caller references', () => {
    const input = structuredClone(authored), definition = resolveNecromancerSummonDefinition(input);
    expect(Object.isFrozen(definition.ownerLevelGrowth)).toBe(true);
    expect(Object.isFrozen(definition.ownerLevelGrowth.skeleton)).toBe(true);
    input.ownerLevelGrowth.skeleton.attack = 200;
    expect(definition.ownerLevelGrowth.skeleton.attack).toBe(14);
    for (const field of ['lifeMax', 'attack', 'defense']) {
      const incomplete = structuredClone(authored);
      Reflect.deleteProperty(incomplete.ownerLevelGrowth.skeleton, field);
      expect(() => resolveNecromancerSummonDefinition(incomplete)).toThrow();
    }
    for (const value of [-1, 1.5, Infinity, NaN]) {
      const invalid = structuredClone(authored);
      invalid.ownerLevelGrowth.skeleton.attack = value;
      expect(() => resolveNecromancerSummonDefinition(invalid)).toThrow();
    }
    const missing = structuredClone(authored); Reflect.deleteProperty(missing, 'ownerLevelGrowth');
    expect(() => resolveNecromancerSummonDefinition(missing)).toThrow();
  });
  it('withholds runtime growth for malformed levels without breaking generic preparation', () => {
    for (const level of [0, -1, 1.5, NaN, Infinity]) {
      for (const template of ['skeleton', 'skeletal_mage']) {
        const body = buildSummon({ ...owner, level }, template);
        expect(body?.stats).toEqual(getSummonStats(template));
        expect(body?.kind).toBe('summon');
      }
    }
  });
  it('rejects invalid owner-level preview and unknown growth fields', () => {
    for (const ownerLevel of [0, -1, 1.5, NaN, Infinity])
      expect(() => getSummonStats('skeleton', { ownerLevel })).toThrow('Invalid summon owner level');
    const input = { ...authored, ownerLevelGrowth: { skeleton: { lifeMax: 30, attack: 14, defense: 4 },
      skeletal_mage: { lifeMax: 20, attack: 10, defense: 3 }, foreign: { lifeMax: 1, attack: 1, defense: 1 } } };
    expect(() => resolveNecromancerSummonDefinition(input)).toThrow();
  });
});
