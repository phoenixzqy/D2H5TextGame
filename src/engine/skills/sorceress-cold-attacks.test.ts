import { expect, it } from 'vitest';
import { DEFAULT_SKILLS } from './builders';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const validate = createSkillValidator();
const expected = [
  { slug: 'ice-bolt', min: 30, max: 45, growth: 4, cost: 10, cooldown: 1, level: 1, target: 'single-enemy' },
  { slug: 'frost-nova', min: 25, max: 35, growth: 3, cost: 20, cooldown: 3, level: 6, target: 'all-enemies' },
  { slug: 'frozen-orb', min: 60, max: 90, growth: 6, cost: 30, cooldown: 2, level: 30, target: 'area-enemies' },
  { slug: 'blizzard', min: 85, max: 125, growth: 80, cost: 35, cooldown: 4, level: 24, target: 'all-enemies' }
] as const;
function row(slug: string) {
  const value = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(s => s.id === 'skills-sorceress-' + slug);
  if (!value) throw new Error('Missing authored cold attack');
  return value;
}
for (const spell of expected) {
  it.each([0, 1, 2, 20])(`previews actual ${spell.slug} current/next/MAX at allocated rank%i`, rank => {
    const source = row(spell.slug), before = structuredClone(source);
    const model = computeSkillDisplayModel(source, rank);
    const assertRank = (value: typeof model.current, at: number) => {
      expect(value).toMatchObject({ rank: at, manaCost: spell.cost, cooldown: spell.cooldown,
        damage: [{ type: 'cold', min: spell.min + spell.growth * (at - 1),
          max: spell.max + spell.growth * (at - 1) }],
        coldAttack: { durationSeconds: 2, slowPercent: 50 } });
      expect(value?.coldAttack?.freeze).toEqual(spell.slug === 'frost-nova'
        ? { chancePercent: 10, durationSeconds: 1, bossDurationSeconds: .5 } : undefined);
      expect(value?.areaShape).toBe(spell.slug === 'frozen-orb' ? 'cone-2' : undefined);
      expect(value?.strikesPerCast).toBeUndefined();
      expect(value?.ignoresMagicResist).toBeUndefined();
      expect(value?.periodic).toBeUndefined();
    };
    if (rank === 0) expect(model.current).toBeUndefined();
    else assertRank(model.current, rank);
    if (rank === 20) expect(model.next).toBeUndefined();
    else assertRank(model.next, rank + 1);
    expect(model.maxed).toBe(rank === 20);
    expect(source).toEqual(before);
  });
  it(`registers actual ${spell.slug} damage/payment/geometry without extra hits`, () => {
    const source = row(spell.slug), before = structuredClone(source);
    expect(validate(source), JSON.stringify(validate.errors)).toBe(true);
    const registered = registeredSkillFromJson(source);
    expect(registered).toMatchObject({ id: 'sorceress.' + spell.slug.replaceAll('-', '_'),
      target: spell.target, minLevel: spell.level, manaCost: spell.cost, cooldown: spell.cooldown });
    expect(registered.effects).toHaveLength(1);
    expect(registered.effects[0]).toMatchObject({ kind: 'damage', damageType: 'cold',
      base: [spell.min, spell.max], perRank: [spell.growth, spell.growth] });
    if (spell.slug !== 'frost-nova') expect(registered.effects[0]).toMatchObject({ applyStatus: { id: 'chill' } });
    if (spell.slug === 'frozen-orb') expect(registered.aoeShape).toBe('cone-2');
    if (spell.slug === 'blizzard') expect(registered.aoeShape).toBeUndefined();
    if (spell.slug === 'frost-nova') expect(registered.effects[0]).toMatchObject({
      applyStatuses: [{ id: 'chill' }, { id: 'freeze', chance: .1 }] });
    expect(source).toEqual(before);
  });
}
it('keeps legacy Orb/Blizzard target geometry consistent', () => {
  expect(DEFAULT_SKILLS.find(s => s.id === 'sorceress.frozen_orb')?.aoeShape).toBe('cone-2');
  expect(DEFAULT_SKILLS.find(s => s.id === 'sorceress.blizzard')).toMatchObject({ target: 'all-enemies' });
});
it.each([{ aoeShape: undefined }, { aoeShape: 'box-3x3' }, { target: 'single-enemy' },
  { trigger: 'passive' }, { damageType: 'fire' }, { requiredLevel: 1 }, { maxLevel: 30 },
  { prerequisites: [] }, { appliesStatus: ['burn'] }])('rejects incomplete/wrong Frozen Orb identity %j', patch => {
  expect(validate({ ...row('frozen-orb'), ...patch })).toBe(false);
});
it.each([{ target: 'area-enemies' }, { aoeShape: 'box-3x3' }, { target: 'single-enemy' },
  { trigger: 'passive' }, { damageType: 'fire' }, { requiredLevel: 1 }, { maxLevel: 30 },
  { prerequisites: [] }, { appliesStatus: ['burn'] }])('rejects incomplete/wrong Blizzard identity %j', patch => {
  expect(validate({ ...row('blizzard'), ...patch })).toBe(false);
});
it('reserves the new Cold cone ownership for Frozen Orb', () => {
  expect(validate({ ...row('frozen-orb'), id: 'skills-sorceress-lightning', aoeShape: 'cone-2' })).toBe(false);
});
