import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.assassin.find(s => s.id === 'skills-assassin-psychic-hammer');
if (!row) throw new Error('Missing actual Psychic Hammer');
const validate = createSkillValidator();
it('authors the no-movement Stun adaptation without changing the scalar attack', () => {
  expect(row).toMatchObject({ trigger: 'active', target: 'single-enemy', requiredLevel: 1,
    maxLevel: 20, cooldown: 1, cost: { mana: 6 }, damageType: 'arcane',
    damage: { min: 30, max: 45 }, scaling: { damagePerLevel: 3 }, appliesStatus: ['stun'] });
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(registeredSkillFromJson(row)).toMatchObject({ id: 'assassin.psychic_hammer',
    effects: [{ kind: 'damage', base: [30, 45], perRank: [3, 3], applyStatus: { id: 'stun' } }] });
});
it.each([
  { appliesStatus: undefined }, { appliesStatus: ['knockback'] }, { appliesStatus: ['stun', 'blind'] },
  { trigger: 'passive' }, { target: 'all-enemies' }, { damageType: 'physical' },
  { requiredLevel: 6 }, { maxLevel: 21 }, { statusEffect: { chance: .5 } },
  { hitSequence: { strikes: 2 } }, { additionalStatusEffects: { freeze: { chance: 1 } } },
  { aoeShape: 'cross' }, { onHitRecovery: { lifeFraction: .1 } }
])('rejects contradictory Hammer metadata %j', patch => {
  expect(validate({ ...row, appliesStatus: ['stun'], ...patch })).toBe(false);
});
it.each([0, 1, 2, 19, 20])('previews actual Arcane and shared control at rank%i', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats.damage).toEqual([{ type: 'arcane', min: 30 + 3 * (stats.rank - 1), max: 45 + 3 * (stats.rank - 1) }]);
    expect(stats).toMatchObject({ manaCost: 6, cooldown: 1,
      control: { durationSeconds: 1, bossDurationSeconds: .5 } });
  }
  if (rank === 0) expect(model.current).toBeUndefined();
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});
