import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-double-swing');
if (!row) throw new Error('Missing actual Double Swing');
const validate = createSkillValidator();
const complete = () => ({ ...row, aoeShape: 'cross', maxTargets: 3,
  hitSequence: { strikes: 2, targetMode: 'each-original' } });
it('authors the actual two-pass capped cross without changing original damage or eligibility', () => {
  expect(row).toMatchObject({ target: 'area-enemies', aoeShape: 'cross', maxTargets: 3,
    hitSequence: { strikes: 2, targetMode: 'each-original' }, damage: { min: 40, max: 60 },
    scaling: { damagePerLevel: 4, attackDamagePctPerLevel: 20 }, cost: { mana: 10 }, cooldown: 1,
    requiredLevel: 6, maxLevel: 20, prerequisites: ['skills-barbarian-bash'] });
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
});
it('preserves both pass count and original-target mode through actual registration', () => {
  const before = structuredClone(row);
  expect(registeredSkillFromJson(row)).toMatchObject({ id: 'barbarian.double_swing',
    aoeShape: 'cross', maxTargets: 3, manaCost: 10, cooldown: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [40, 60], perRank: [4, 4],
      hitSequence: { strikes: 2, targetMode: 'each-original' } }] });
  expect(row).toEqual(before);
});
it('accepts only the complete authored pair, shape, target cap and native eligibility', () => {
  expect(validate(complete()), JSON.stringify(validate.errors)).toBe(true);
  for (const patch of [{ hitSequence: undefined }, { hitSequence: { strikes: 2 } },
    { hitSequence: { strikes: 6, targetMode: 'each-original' } },
    { hitSequence: { strikes: 2, targetMode: 'other' } },
    { hitSequence: { strikes: 2, targetMode: 'each-original', typo: true } },
    { aoeShape: undefined }, { aoeShape: 'cone-2' }, { maxTargets: undefined }, { maxTargets: 4 },
    { target: 'single-enemy' }, { trigger: 'passive' }, { requiredLevel: 1 },
    { prerequisites: [] }, { damageType: 'arcane' }, { appliesStatus: ['stun'] },
    { critChanceBonus: .1 }, { onHitRecovery: { lifeFraction: .5 } }])
    expect(validate({ ...complete(), ...patch }), JSON.stringify(patch)).toBe(false);
});
it('rejects the per-original mode on unrelated and existing rotated sequence skills', () => {
  for (const id of ['skills-druid-fury', 'skills-amazon-jab', 'skills-assassin-dragon-talon', 'skills-assassin-dragon-claw']) {
    const sibling = Object.values(PLAYABLE_CLASS_SKILL_DATA).flat().find(s => s.id === id);
    expect(validate(sibling)).toBe(true);
    expect(validate({ ...sibling, hitSequence: { strikes: 2, targetMode: 'each-original' } })).toBe(false);
  }
});
it.each([0, 1, 2, 19, 20])('previews rank%i damage per attempt and attempts per target without inventing a total', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats).toMatchObject({ strikesPerTarget: 2, maxTargets: 3, manaCost: 10, cooldown: 1,
      additionalAttackPercent: 20 * (stats.rank - 1),
      damage: [{ type: 'physical', min: 40 + 4 * (stats.rank - 1), max: 60 + 4 * (stats.rank - 1) }] });
    expect(stats).not.toHaveProperty('strikesPerCast');
  }
  if (rank === 0) expect(model.current).toBeUndefined();
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});
it('requires finite nonnegative Attack growth and rejects moving it to an unrelated skill', () => {
  const scaling = { ...row.scaling }; Reflect.deleteProperty(scaling, 'attackDamagePctPerLevel');
  expect(validate({ ...row, scaling })).toBe(false);
  for (const value of [-1, '20', null])
    expect(validate({ ...row, scaling: { ...row.scaling, attackDamagePctPerLevel: value } })).toBe(false);
  const bash = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(skill => skill.id === 'skills-barbarian-bash');
  expect(validate({ ...bash, scaling: { ...bash?.scaling, attackDamagePctPerLevel: 20 } })).toBe(false);
});
it('does not infer per-target attempts from an unrelated or incomplete sequence', () => {
  for (const patch of [{ id: 'skills-barbarian-bash' }, { trigger: 'passive' },
    { target: 'all-enemies' }, { damageType: 'arcane' as const }, { aoeShape: 'cone-2' as const },
    { maxTargets: 2 }, { hitSequence: { strikes: 2 } }])
    expect(computeSkillDisplayModel({ ...row, ...patch }, 1).current).not.toHaveProperty('strikesPerTarget');
});
