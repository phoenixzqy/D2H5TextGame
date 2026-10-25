import { expect, it } from 'vitest';
import { DEFAULT_SKILLS } from './builders';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.assassin.find(s => s.id === 'skills-assassin-mind-blast');
if (!row) throw new Error('Missing actual Mind Blast');
const validate = createSkillValidator();

it('preserves one all-enemy payment and ordered Mana Burn/Stun through both registrations', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  for (const skill of [registeredSkillFromJson(row), DEFAULT_SKILLS.find(s => s.id === 'assassin.mind_blast')]) {
    expect(skill).toMatchObject({ target: 'all-enemies', manaCost: 30, cooldown: 3, minLevel: 24,
      effects: [{ kind: 'damage', damageType: 'arcane', base: [50, 70], perRank: [5, 5],
        applyStatuses: [{ id: 'mana-burn' }, { id: 'stun' }] }] });
  }
});
it.each([
  { appliesStatus: ['mana-burn'] }, { appliesStatus: ['stun', 'mana-burn'] },
  { damageType: 'physical' }, { target: 'single-enemy' }, { requiredLevel: 1 },
  { prerequisites: [] }, { maxLevel: 30 }, { trigger: 'passive' },
  { hitSequence: { strikes: 2 } }, { critChanceBonus: .1 },
  { aoeShape: 'line-3' }, { statusEffect: { chance: .5 } }
])('rejects incomplete or cross-skill identity %j', patch => {
  expect(validate({ ...row, ...patch })).toBe(false);
});
it.each([0, 1, 2, 19, 20])('previews the shared drain, zero-mana bonus and Stun at rank%i', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats).toMatchObject({ manaCost: 30, cooldown: 3,
      manaBurn: { drainPercent: 20, zeroManaArcaneBonusPercent: 50, untilManaRestored: true },
      control: { durationSeconds: 1, bossDurationSeconds: .5 } });
    expect(stats.damage).toEqual([{ type: 'arcane', min: 50 + (stats.rank - 1) * 5, max: 70 + (stats.rank - 1) * 5 }]);
  }
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});
