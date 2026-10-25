import { expect, it } from 'vitest';
import { DEFAULT_SKILLS } from './builders';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const validate = createSkillValidator();
const spells = [
  { slug: 'fire-bolt', min: 30, max: 45, growth: 4, cost: 8, cooldown: 1, level: 1 },
  { slug: 'fire-ball', min: 70, max: 100, growth: 7, cost: 20, cooldown: 1, level: 12 },
  { slug: 'meteor', min: 100, max: 150, growth: 10, cost: 50, cooldown: 4, level: 24 }
] as const;
function row(slug: string) {
  const source = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(s => s.id === 'skills-sorceress-' + slug);
  if (!source) throw new Error('Missing authored direct fire spell');
  return source;
}
for (const spell of spells) {
  it.each([0, 1, 2, 20])(`previews ${spell.slug} damage/payment and actual Burn rule at rank%i`, rank => {
    const source = row(spell.slug), before = structuredClone(source), model = computeSkillDisplayModel(source, rank);
    const assertRank = (value: typeof model.current, at: number) => {
      expect(value).toMatchObject({ rank: at, manaCost: spell.cost, cooldown: spell.cooldown,
        damage: [{ type: 'fire', min: spell.min + spell.growth * (at - 1), max: spell.max + spell.growth * (at - 1) }],
        burn: { percentOfHit: 10, durationSeconds: 3, maxStacks: 5, minDps: 1 } });
      expect(value?.strikesPerCast).toBeUndefined();
      expect(value?.areaShape).toBeUndefined();
    };
    if (rank === 0) expect(model.current).toBeUndefined(); else assertRank(model.current, rank);
    if (rank === 20) expect(model.next).toBeUndefined(); else assertRank(model.next, rank + 1);
    expect(model.maxed).toBe(rank === 20); expect(source).toEqual(before);
  });
  it(`registers ${spell.slug} as one paid Fire effect with the authored Burn/Melt payload`, () => {
    const source = row(spell.slug), before = structuredClone(source);
    expect(validate(source), JSON.stringify(validate.errors)).toBe(true);
    const skill = registeredSkillFromJson(source);
    expect(skill).toMatchObject({ id: 'sorceress.' + spell.slug.replaceAll('-', '_'),
      target: spell.slug === 'meteor' ? 'all-enemies' : 'single-enemy', minLevel: spell.level,
      manaCost: spell.cost, cooldown: spell.cooldown });
    expect(skill.aoeShape).toBeUndefined(); expect(skill.effects).toHaveLength(1);
    expect(skill.effects[0]).toMatchObject({ kind: 'damage', damageType: 'fire',
      base: [spell.min, spell.max], perRank: [spell.growth, spell.growth] });
    expect(skill.effects[0]).toMatchObject(spell.slug === 'meteor'
      ? { applyStatuses: [{ id: 'burn', dotPctOfDamage: .1 }, { id: 'armor-melt', chance: 1, durationMs: 3000 }] }
      : { applyStatus: { id: 'burn', dotPctOfDamage: .1 } });
    expect(source).toEqual(before);
  });
}
it('keeps illustrative Meteor target geometry consistent with All', () => {
  expect(DEFAULT_SKILLS.find(s => s.id === 'sorceress.meteor')).toMatchObject({ target: 'all-enemies' });
  expect(DEFAULT_SKILLS.find(s => s.id === 'sorceress.meteor')?.aoeShape).toBeUndefined();
});
it.each([{ target: 'area-enemies' }, { aoeShape: 'box-3x3' }, { target: 'single-enemy' },
  { trigger: 'passive' }, { damageType: 'cold' }, { requiredLevel: 1 }, { maxLevel: 30 },
  { prerequisites: [] }, { statusEffect: undefined },
  { appliesStatus: ['burn'] }, { attackDamagePct: 100 }])('rejects incomplete/wrong Meteor identity %j', patch => {
  expect(validate({ ...row('meteor'), ...patch })).toBe(false);
});
it('preserves the existing schema-valid legacy Melt opt-out without weakening All targeting', () => {
  const { additionalStatusEffects: _metadata, ...legacy } = row('meteor');
  expect(validate(legacy), JSON.stringify(validate.errors)).toBe(true);
  expect(validate({ ...legacy, target: 'area-enemies', aoeShape: 'box-3x3' })).toBe(false);
});
