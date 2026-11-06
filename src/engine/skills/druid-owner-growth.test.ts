import { describe, expect, it } from 'vitest';
import type { CombatUnit } from '../combat/types';
import { mitigateDamage } from '../combat/damage';
import { buildSummon, getSummonStats } from './summons';
import { computeSkillDisplayModel } from './displayStats';
import { resolveDruidSummonDefinition } from './druid-summon-definition';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
import authored from '../../data/summons/druid.json';
import skills from '../../data/skills/druid.json';

const rows = [
  ['raven', 'raven', [45, 18, 10], [3, 1, 1], [20, 10, 3]],
  ['spirit_wolf', 'summon-spirit-wolf', [80, 20, 10], [5, 14, 1], [30, 14, 4]],
  ['dire_wolf', 'summon-dire-wolf', [100, 25, 10], [8, 18, 1], [40, 18, 5]],
  ['grizzly', 'summon-grizzly', [260, 45, 35], [12, 25, 2], [70, 25, 7]],
  ['poison_creeper', 'poison-creeper', [90, 16, 18], [5, 1, 1], [25, 8, 3]],
  ['carrion_vine', 'carrion-vine', [110, 12, 22], [6, 1, 1], [25, 8, 3]],
  ['solar_creeper', 'solar-creeper', [120, 12, 24], [6, 1, 1], [25, 8, 3]]
] as const;
const stats = {
  life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 20, defense: 10,
  magicResist: 0, attackSpeed: 70, critChance: 0, critDamage: 1.5,
  physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
};
const owner: CombatUnit = {
  id: 'druid-owner', name: 'Druid', side: 'player', kind: 'hero', level: 12,
  tier: 'trash', stats, life: 100, mana: 100, statuses: [], cooldowns: {},
  skillOrder: [], activeBuffIds: [], enraged: false, summonedAdds: false
};

describe('Druid earned owner growth', () => {
  it.each(rows)('%s composes rank and owner growth in runtime and previews', (id, slug, base, rankGrowth, growth) => {
    const validate = createSkillValidator<SkillDef>();
    const skill: unknown = skills.find(row => row.id === 'skills-druid-' + slug);
    if (!validate(skill)) throw new Error('Invalid authored summon skill');
    for (const level of [1, 12, 55]) for (const rank of [1, 2, 20]) {
      const body = buildSummon({ ...owner, level }, id, { skillLevel: rank, statScaling: skill.scaling?.summonStatsPerLevel });
      if (!body) throw new Error('Missing Druid body');
      const expected = base.map((n, i) => n + (rankGrowth[i] ?? 0) * (rank - 1) + (growth[i] ?? 0) * (level - 1));
      expect([body.stats.lifeMax, body.stats.attack, body.stats.defense]).toEqual(expected);
      expect(body.life).toBe(body.stats.lifeMax);
      expect(body.summonOwnerId).toBe(owner.id);
      const model = computeSkillDisplayModel(skill, rank, undefined, undefined, undefined, undefined, level);
      const values = Object.fromEntries(model.current?.summonUnit?.stats.map(row => [row.id, row.value]) ?? []);
      expect([values.lifeMax, values.attack, values.defense]).toEqual(expected);
      if (rank < 20) {
        const next = Object.fromEntries(model.next?.summonUnit?.stats.map(row => [row.id, row.value]) ?? []);
        expect([next.lifeMax, next.attack, next.defense]).toEqual(expected.map((n, i) => n + (rankGrowth[i] ?? 0)));
      } else expect(model.next).toBeUndefined();
      const baseline = buildSummon({ ...owner, level: 1 }, id, { skillLevel: rank, statScaling: skill.scaling?.summonStatsPerLevel });
      expect(baseline?.stats).toEqual(getSummonStats(id, { skillLevel: rank, statScaling: skill.scaling?.summonStatsPerLevel }));
    }
  });

  it('lets earned12 rank14 wolves damage and survive the retained Cold Plains armor/attack', () => {
    const body = buildSummon(owner, 'spirit_wolf', { skillLevel: 14, statScaling: { lifeMax: 5, attack: 2, defense: 1 } });
    if (!body) throw new Error('Missing wolf');
    expect(body.stats).toMatchObject({ lifeMax: 475, attack: 200, defense: 67 });
    const damage = mitigateDamage(body.stats.attack, { type: 'physical', defenderArmor: 79,
      defenderMagicResist: 14, defenderResistances: stats.resistances });
    expect(damage.final).toBe(121);
    const incoming = mitigateDamage(111, { type: 'physical', defenderArmor: body.stats.defense,
      defenderMagicResist: body.stats.magicResist, defenderResistances: body.stats.resistances });
    expect(incoming.final).toBe(44);
    expect(body.life).toBeGreaterThan(incoming.final * 10);
  });

  it('keeps hostile, mercenary and malformed owner bodies at existing ranked stats', () => {
    for (const [id] of rows) {
      const baseline = getSummonStats(id);
      for (const unit of [{ ...owner, side: 'enemy' as const }, { ...owner, kind: 'merc' as const },
        ...[0, -1, 1.5, NaN, Infinity].map(level => ({ ...owner, level }))])
        expect(buildSummon(unit, id)?.stats).toEqual(baseline);
      for (const ownerLevel of [0, -1, 1.5, NaN, Infinity])
        expect(() => getSummonStats(id, { ownerLevel })).toThrow('Invalid summon owner level');
    }
    expect(buildSummon(owner, 'clay_golem')?.stats).toEqual(getSummonStats('clay_golem'));
  });

  it('requires complete immutable JSON coefficients without accepting foreign tuning', () => {
    const input = structuredClone(authored), definition = resolveDruidSummonDefinition(input);
    const growth = Reflect.get(definition, 'ownerLevelGrowth') as Record<string, Record<string, number>> | undefined;
    expect(growth).toBeDefined();
    if (!growth) throw new Error('Missing validated growth');
    expect(Object.isFrozen(growth)).toBe(true);
    for (const [id, , , , expected] of rows) {
      expect(growth[id]).toEqual({ lifeMax: expected[0], attack: expected[1], defense: expected[2] });
      expect(Object.isFrozen(growth[id])).toBe(true);
      for (const field of ['lifeMax', 'attack', 'defense']) for (const value of [-1, 1.5, NaN, Infinity, 501]) {
        const changed = structuredClone(authored);
        const overrides = structuredClone(growth);
        Reflect.set(overrides[id] ?? {}, field, value);
        Reflect.set(changed, 'ownerLevelGrowth', overrides);
        expect(() => resolveDruidSummonDefinition(changed)).toThrow();
      }
      const incomplete = structuredClone(growth); Reflect.deleteProperty(incomplete, id);
      expect(() => resolveDruidSummonDefinition({ ...authored, ownerLevelGrowth: incomplete })).toThrow();
      for (const field of ['lifeMax', 'attack', 'defense']) {
        const partial = structuredClone(growth); Reflect.deleteProperty(partial[id] ?? {}, field);
        expect(() => resolveDruidSummonDefinition({ ...authored, ownerLevelGrowth: partial })).toThrow();
      }
    }
    const missing = structuredClone(authored); Reflect.deleteProperty(missing, 'ownerLevelGrowth');
    expect(() => resolveDruidSummonDefinition(missing)).toThrow();
    expect(() => resolveDruidSummonDefinition({ ...authored, ownerLevelGrowth: { ...growth, foreign: {} } })).toThrow();
    const inputGrowth = Reflect.get(input, 'ownerLevelGrowth') as Record<string, Record<string, number>>;
    Reflect.set(inputGrowth.raven ?? {}, 'attack', 999);
    expect(growth.raven?.attack).toBe(10);
  });
});
