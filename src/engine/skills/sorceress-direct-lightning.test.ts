import { expect, it } from 'vitest';
import { DEFAULT_SKILLS } from './builders';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const validate = createSkillValidator();
const spells = [
  { slug: 'charged-bolt', min: 25, max: 40, growth: 3, cost: 8, cooldown: 1, level: 1, target: 'area-enemies' },
  { slug: 'lightning', min: 45, max: 80, growth: 6, cost: 15, cooldown: 1, level: 12, target: 'single-enemy' },
  { slug: 'nova', min: 40, max: 60, growth: 4, cost: 18, cooldown: 2, level: 12, target: 'all-enemies' },
  { slug: 'chain-lightning', min: 50, max: 70, growth: 5, cost: 25, cooldown: 2, level: 18, target: 'area-enemies' }
] as const;
function row(slug: string) {
  const source = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(s => s.id === 'skills-sorceress-' + slug);
  if (!source) throw new Error('Missing direct lightning source');
  return source;
}
for (const spell of spells) {
  it(`registers authored ${spell.slug} with one paid Lightning effect`, () => {
    const source = row(spell.slug), before = structuredClone(source);
    expect(validate(source), JSON.stringify(validate.errors)).toBe(true);
    const skill = registeredSkillFromJson(source);
    expect(skill).toMatchObject({ id: 'sorceress.' + spell.slug.replaceAll('-', '_'), target: spell.target,
      minLevel: spell.level, manaCost: spell.cost, cooldown: spell.cooldown });
    expect(skill.effects).toHaveLength(1);
    expect(skill.effects[0]).toMatchObject({ kind: 'damage', damageType: 'lightning',
      base: [spell.min, spell.max], perRank: [spell.growth, spell.growth] });
    if (spell.slug === 'chain-lightning') {
      expect(skill).toMatchObject({ aoeShape: 'chain', maxTargets: 5 });
      expect(skill.effects[0]).toMatchObject({ applyStatus: { id: 'paralyze' } });
      expect(source).toHaveProperty('synergies.chill', 1.3);
    } else {
      expect(skill.aoeShape).toBeUndefined();
      expect(skill.effects[0]).not.toHaveProperty('applyStatus');
    }
    expect(source).toEqual(before);
  });
  it.each([0, 1, 2, 20])(`previews ${spell.slug} current/next/MAX at rank%i`, rank => {
    const source = row(spell.slug), before = structuredClone(source), model = computeSkillDisplayModel(source, rank);
    const check = (value: typeof model.current, at: number) => {
      expect(value).toMatchObject({ rank: at, manaCost: spell.cost, cooldown: spell.cooldown,
        damage: [{ type: 'lightning', min: spell.min + spell.growth * (at - 1), max: spell.max + spell.growth * (at - 1) }] });
      if (spell.slug === 'chain-lightning') expect(value).toMatchObject({ maxTargets: 5,
        control: { durationSeconds: 1, bossDurationSeconds: 1 } });
      else expect(value?.control).toBeUndefined();
      expect(value?.burn).toBeUndefined();
    };
    if (rank === 0) expect(model.current).toBeUndefined(); else check(model.current, rank);
    if (rank === 20) expect(model.next).toBeUndefined(); else check(model.next, rank + 1);
    expect(model.maxed).toBe(rank === 20); expect(source).toEqual(before);
  });
}
it.each([{ aoeShape: 'line-3' }, { aoeShape: 'cone-2' }, { maxTargets: 3 }, { maxTargets: undefined },
  { target: 'all-enemies' }, { target: 'single-enemy' }, { trigger: 'passive' }, { requiredLevel: 1 },
  { prerequisites: [] }, { maxLevel: 30 }, { appliesStatus: [] }, { damageType: 'fire' },
  { statusEffect: { chance: .2 } }, { hitSequence: { strikes: 2 } }])('rejects incomplete/wrong Chain Lightning identity %j', patch => {
  expect(validate({ ...row('chain-lightning'), ...patch })).toBe(false);
});
it('restricts chain/cap5 to Chain Lightning while preserving both cross/cap3 identities', () => {
  for (const [cls, id] of [['paladin', 'skills-paladin-zeal'], ['barbarian', 'skills-barbarian-double-swing']] as const) {
    const source = PLAYABLE_CLASS_SKILL_DATA[cls].find(s => s.id === id);
    if (!source) throw new Error('Missing cross compatibility source');
    expect(validate(source), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...source, maxTargets: 5 })).toBe(false);
    expect(validate({ ...source, aoeShape: 'chain' })).toBe(false);
  }
  expect(validate({ ...row('nova'), aoeShape: 'chain', maxTargets: 5 })).toBe(false);
});
it('keeps the illustrative Chain Lightning cap/shape and fresh Paralyze payload consistent', () => {
  const skill = DEFAULT_SKILLS.find(s => s.id === 'sorceress.chain_lightning');
  expect(skill).toMatchObject({ target: 'area-enemies', aoeShape: 'chain', maxTargets: 5 });
  expect(skill?.effects[0]).toMatchObject({ applyStatus: { id: 'paralyze' } });
  expect(skill?.effects[0]).not.toHaveProperty('applyStatus.chance');
});
