import { expect, it } from 'vitest';
import { registeredSkillFromJson, PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';
import { COLD_ARMOR_IDS, COLD_ARMOR_DEFINITIONS, composeColdArmorRanks, resolveColdArmorDefinition } from './cold-armors';

const validate = createSkillValidator();
for (const id of COLD_ARMOR_IDS) {
  const source = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(row => row.id === 'skills-sorceress-' + id);
  if (!source) throw new Error('Missing authored armor');
  const shiver = id === 'shiver-armor';
  it(`registers ${id} as only a paid buff, without a damage effect at cast time`, () => {
    expect(validate(source), JSON.stringify(validate.errors)).toBe(true);
    expect(registeredSkillFromJson(source).effects).toEqual([
      { kind: 'buff', id, duration: -1, coldArmor: id }
    ]);
    expect(COLD_ARMOR_DEFINITIONS[id]).toMatchObject({ min: shiver ? 12 : 24, max: shiver ? 18 : 36,
      growth: shiver ? 3 : 4, maxRank: 20, requiredLevel: shiver ? 12 : 24,
      defensePerRank: shiver ? .035 : .04, coldPerRank: shiver ? .01 : 0, dodgePerRank: shiver ? 0 : .01 });
  });
  it.each([{ armorRetaliation: undefined }, { armorRetaliation: { min: 0, max: 1, perRank: 1 } },
    { armorRetaliation: { min: 1, max: 2, perRank: -1 } }, { armorRetaliation: { min: 1, max: 2, perRank: 1, extra: 0 } },
    { trigger: 'passive' }, { target: 'all-enemies' }, { requiredLevel: 1 }, { prerequisites: [] },
    { appliesStatus: ['frozen-armor'] }, { damage: { min: 1, max: 2 }, damageType: 'cold' },
    { scaling: { passiveStatsPerLevel: { defensePct: 1 } } }])(`${id} rejects malformed authoring %j`, patch => {
    expect(validate({ ...source, ...patch })).toBe(false);
  });
  it(`rejects reversed ${id} ranges and duplicate definitions without weakening validation`, () => {
    expect(() => resolveColdArmorDefinition([{ ...source, armorRetaliation: { min: 20, max: 10, perRank: 1 } }], id)).toThrow();
    expect(() => resolveColdArmorDefinition([source, source], id)).toThrow();
    expect(() => resolveColdArmorDefinition([], id)).toThrow();
  });
  it.each([0, 1, 2, 20])(`${id} previews retaliation separately from the buff cast at rank%i`, rank => {
    const model = computeSkillDisplayModel(source, rank), previewRank = Math.max(1, rank);
    const current = model.current ?? model.next;
    expect(current?.damage).toEqual([]);
    expect(current).toHaveProperty('coldArmor', { min: (shiver ? 12 : 24) + (shiver ? 3 : 4) * (previewRank - 1),
      max: (shiver ? 18 : 36) + (shiver ? 3 : 4) * (previewRank - 1), freezeSeconds: 1, bossFreezeSeconds: .5 });
    if (rank === 20) expect(model.next).toBeUndefined();
    else expect(model.next).toHaveProperty('coldArmor.min', (shiver ? 12 : 24) + (shiver ? 3 : 4) * rank);
  });
}
it('keeps native class/unlock/prerequisites and alias authority separate from priority selection', () => {
  const levels = { 'skills-sorceress-frozen-armor': 1, 'skills-sorceress-shiver-armor': 1,
    'sorceress.shiver_armor': 20, 'skills-sorceress-chilling-armor': 2 };
  expect(composeColdArmorRanks({ class: 'sorceress', level: 30, skillLevels: levels }))
    .toEqual({ 'shiver-armor': 20, 'chilling-armor': 2 });
  expect(composeColdArmorRanks({ class: 'sorceress', level: 12, skillLevels: levels }))
    .toEqual({ 'shiver-armor': 20, 'chilling-armor': 0 });
  for (const player of [{ class: 'amazon' as const, level: 30, skillLevels: levels },
    { class: 'sorceress' as const, level: 30, skillLevels: { 'skills-sorceress-chilling-armor': 20 } }])
    expect(composeColdArmorRanks(player)).toEqual({ 'shiver-armor': 0, 'chilling-armor': 0 });
});
