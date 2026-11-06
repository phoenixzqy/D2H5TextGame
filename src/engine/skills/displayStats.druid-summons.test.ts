import { describe, expect, it } from 'vitest';
import authored from '../../data/skills/druid.json';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
import { computeSkillDisplayModel, computeSkillRankDisplayStats } from './displayStats';
const validate = createSkillValidator<SkillDef>();
const rows = [
  {
    slug: 'raven',
    template: 'raven',
    life: 45,
    attack: 18,
    defense: 10,
    speed: 95,
    phys: 0.15,
    magic: 0.05,
    growth: [3, 1, 1],
    cost: 6,
    discount: -0.1,
    many: true
  },
  {
    slug: 'poison-creeper',
    template: 'poison_creeper',
    life: 90,
    attack: 16,
    defense: 18,
    speed: 70,
    phys: 0.05,
    magic: 0.05,
    growth: [5, 1, 1],
    cost: 8,
    discount: -0.1,
    many: false
  },
  {
    slug: 'summon-spirit-wolf',
    template: 'spirit_wolf',
    life: 80,
    attack: 20,
    defense: 10,
    speed: 85,
    phys: 0.1,
    magic: 0.05,
    growth: [5, 14, 1],
    cost: 14,
    discount: -0.15,
    many: true
  },
  {
    slug: 'summon-dire-wolf',
    template: 'dire_wolf',
    life: 100,
    attack: 25,
    defense: 10,
    speed: 90,
    phys: 0.05,
    magic: 0.05,
    growth: [8, 18, 1],
    cost: 20,
    discount: -0.2,
    many: true
  },
  {
    slug: 'carrion-vine',
    template: 'carrion_vine',
    life: 110,
    attack: 12,
    defense: 22,
    speed: 70,
    phys: 0.05,
    magic: 0.05,
    growth: [6, 1, 1],
    cost: 14,
    discount: -0.15,
    many: false
  },
  {
    slug: 'solar-creeper',
    template: 'solar_creeper',
    life: 120,
    attack: 12,
    defense: 24,
    speed: 70,
    phys: 0.05,
    magic: 0.08,
    growth: [6, 1, 1],
    cost: 18,
    discount: -0.15,
    many: false
  },
  {
    slug: 'summon-grizzly',
    template: 'grizzly',
    life: 260,
    attack: 45,
    defense: 35,
    speed: 55,
    phys: 0.05,
    magic: 0.05,
    growth: [12, 25, 2],
    cost: 35,
    discount: -0.25,
    many: false
  }
] as const;
function source(slug: string) {
  const row: unknown = authored.find((s) => s.id === 'skills-druid-' + slug);
  if (!validate(row)) throw new Error('Invalid Druid display fixture');
  return row;
}
describe.each(rows)('$slug authored summon previews', (row) => {
  it.each([0, 1, 2, 19, 20])(
    'shows real stats, cap and one-batch payment at allocation %i',
    (allocation) => {
      const s = source(row.slug),
        before = structuredClone(s);
      const model = computeSkillDisplayModel(s, allocation);
      const check = (rank: number) => {
        const stats = computeSkillRankDisplayStats(s, rank);
        const values = Object.fromEntries(
          stats.summonUnit?.stats.map((v) => [v.id, v.value]) ?? []
        );
        expect(stats.summonUnit?.summonId).toBe(row.template);
        expect(stats.summonUnit?.attackType).toBe('physical');
        expect(values).toMatchObject({
          lifeMax: row.life + row.growth[0] * (rank - 1),
          attack: row.attack + row.growth[1] * (rank - 1),
          defense: row.defense + row.growth[2] * (rank - 1),
          attackSpeed: row.speed,
          physDodge: row.phys,
          magicDodge: row.magic
        });
        expect(values.poisonResistance).toBe(
          row.template === 'poison_creeper' ? 0.35 : row.template === 'carrion_vine' ? 0.25 : 0
        );
        expect(values.fireResistance).toBe(row.template === 'solar_creeper' ? 0.2 : 0);
        expect(values.lightningResistance).toBe(row.template === 'solar_creeper' ? 0.2 : 0);
        for (const type of ['physical', 'cold', 'arcane'])
          expect(values[type + 'Resistance']).toBe(0);
        expect(stats.summonCap).toBe(
          row.many ? (rank <= 3 ? rank : 3 + Math.floor((rank - 3) / 3)) : 1
        );
        expect(stats.manaCost).toBe(Math.round(row.cost + row.discount * (rank - 1)));
        const expected =
          row.template === 'raven'
            ? { kind: 'blind', hitPenaltyPoints: 20, durationSeconds: 2 }
            : row.template === 'poison_creeper'
              ? { kind: 'poison', percentOfHit: 10, durationSeconds: 5, maxStacks: 10, minDps: 1 }
              : row.template === 'carrion_vine' || row.template === 'solar_creeper'
                ? {
                    kind: 'corpseRecovery',
                    resource: row.template === 'carrion_vine' ? 'life' : 'mana',
                    percentOfOwnerMax: 5
                  }
                : undefined;
        expect(stats.summonUnit?.effect).toEqual(expected);
        return stats;
      };
      if (allocation === 0) {
        expect(model.current).toBeUndefined();
        expect(model.next).toEqual(check(1));
      } else expect(model.current).toEqual(check(allocation));
      if (allocation > 0 && allocation < 20) expect(model.next).toEqual(check(allocation + 1));
      if (allocation === 20) expect(model.next).toBeUndefined();
      expect(s).toEqual(before);
    }
  );
});
it('does not promise Druid mechanics on a foreign or mismatched summon', () => {
  const raven = source('raven');
  for (const changed of [
    { ...raven, id: 'foreign' },
    { ...raven, summonId: 'spirit_wolf' },
    { ...raven, trigger: 'passive' },
    { ...raven, target: 'enemy' },
    { ...raven, summon: false }
  ]) {
    const body = computeSkillRankDisplayStats(changed, 1).summonUnit;
    expect(body?.attackType).toBeUndefined();
    expect(body?.effect).toBeUndefined();
  }
});
