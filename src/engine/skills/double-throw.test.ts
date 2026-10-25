import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-double-throw');
if (!row) throw new Error('Missing actual Double Throw');
const validate = createSkillValidator();
const complete = () => ({ ...row, hitSequence: { strikes: 2 } });
it('authors the real pair without changing damage, cost or native eligibility', () => {
  expect(row).toMatchObject({ target: 'area-enemies', hitSequence: { strikes: 2 },
    damage: { min: 50, max: 75 }, scaling: { damagePerLevel: 5 }, cost: { mana: 12 },
    cooldown: 1, requiredLevel: 12, maxLevel: 20, prerequisites: ['skills-barbarian-double-swing'] });
  expect(row).not.toHaveProperty('aoeShape'); expect(row).not.toHaveProperty('maxTargets');
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
});
it('retains the default total-attempt semantics through actual registration', () => {
  const before = structuredClone(row), skill = registeredSkillFromJson(row);
  expect(skill).toMatchObject({ id: 'barbarian.double_throw', target: 'area-enemies',
    manaCost: 12, cooldown: 1, effects: [{ kind: 'damage', damageType: 'physical',
      base: [50, 75], perRank: [5, 5], hitSequence: { strikes: 2 } }] });
  expect(skill).not.toHaveProperty('aoeShape'); expect(row).toEqual(before);
});
it('requires the exact pair and rejects contradictory Throw metadata', () => {
  expect(validate(complete()), JSON.stringify(validate.errors)).toBe(true);
  for (const patch of [{ hitSequence: undefined }, { hitSequence: {} }, { hitSequence: { strikes: 1 } },
    { hitSequence: { strikes: 3 } }, { hitSequence: { strikes: 2, targetMode: 'each-original' } },
    { hitSequence: { strikes: 2, typo: true } }, { aoeShape: 'cross' }, { maxTargets: 3 },
    { trigger: 'passive' }, { target: 'single-enemy' }, { damageType: 'cold' },
    { requiredLevel: 1 }, { maxLevel: 21 }, { prerequisites: [] }, { cost: { mana: 10 } },
    { appliesStatus: ['stun'] }, { ignoresDefense: true }, { onHitRecovery: { lifeFraction: .5 } }])
    expect(validate({ ...complete(), ...patch }), JSON.stringify(patch)).toBe(false);
});
it('does not leak the pair capability to an unrelated skill or change sibling modes', () => {
  const bash = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-bash');
  expect(validate(bash)).toBe(true); expect(validate({ ...bash, hitSequence: { strikes: 2 } })).toBe(false);
  const swing = PLAYABLE_CLASS_SKILL_DATA.barbarian.find(s => s.id === 'skills-barbarian-double-swing');
  expect(swing?.hitSequence).toEqual({ strikes: 2, targetMode: 'each-original' });
  const fury = PLAYABLE_CLASS_SKILL_DATA.druid.find(s => s.id === 'skills-druid-fury');
  expect(fury?.hitSequence).toEqual({ strikes: 5 });
  expect(validate(swing)).toBe(true); expect(validate(fury)).toBe(true);
});
it.each([0, 1, 2, 19, 20])('previews rank%i per-attempt damage and two total attempts', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats).toMatchObject({ strikesPerCast: 2, manaCost: 12, cooldown: 1,
      damage: [{ type: 'physical', min: 50 + 5 * (stats.rank - 1), max: 75 + 5 * (stats.rank - 1) }] });
    expect(stats).not.toHaveProperty('strikesPerTarget');
  }
  if (rank === 0) expect(model.current).toBeUndefined();
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});
it('does not advertise a valid Throw pair for contradictory or missing metadata', () => {
  for (const patch of [{ target: 'single-enemy' }, { trigger: 'passive' }, { damageType: 'arcane' as const },
    { hitSequence: { strikes: 3 } }, { hitSequence: { strikes: 2, targetMode: 'each-original' as const } },
    { aoeShape: 'cross' as const }])
    expect(computeSkillDisplayModel({ ...row, ...patch }, 1).current).not.toHaveProperty('strikesPerCast');
  const missing = { ...row };
  Reflect.deleteProperty(missing, 'hitSequence');
  expect(computeSkillDisplayModel(missing, 1).current).not.toHaveProperty('strikesPerCast');
});
