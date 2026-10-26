import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.sorceress.find(s => s.id === 'skills-sorceress-telekinesis');
if (!row) throw new Error('Missing actual Telekinesis');
const validate = createSkillValidator();
it('authors paid single-enemy control with no damage or passive damage bonus', () => {
  expect(row).toMatchObject({ trigger: 'active', target: 'single-enemy', requiredLevel: 6,
    maxLevel: 20, cooldown: 2, cost: { mana: 7 }, appliesStatus: ['stun'],
    scaling: { cooldownPerLevel: -.05, costPerLevel: -.1 } });
  expect(row.damage).toBeUndefined(); expect(row.scaling).not.toHaveProperty('passiveStatsPerLevel');
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(registeredSkillFromJson(row).effects).toEqual([{ kind: 'debuff', statusId: 'stun' }]);
});
it.each([
  { appliesStatus: undefined }, { appliesStatus: ['knockback'] }, { appliesStatus: ['stun', 'blind'] },
  { trigger: 'passive' }, { target: 'all-enemies' }, { requiredLevel: 1 }, { maxLevel: 21 },
  { damage: { min: 1, max: 2 }, damageType: 'arcane' }, { statusEffect: { chance: .5 } },
  { prerequisites: ['skills-sorceress-static-field'] }, { timedBuff: { durationMs: 1000 } },
  { scaling: { cooldownPerLevel: -.05, costPerLevel: -.1, passiveStatsPerLevel: { arcaneDamagePct: .01 } } }
])('rejects contradictory Telekinesis metadata %j', patch => {
  expect(validate({ ...row, appliesStatus: ['stun'], ...patch })).toBe(false);
});
it.each([0, 1, 2, 19, 20])('previews real control, cost and cooldown at rank%i', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  for (const stats of [model.current, model.next].filter(s => s !== undefined)) {
    expect(stats).toMatchObject({ damage: [], utility: [],
      control: { durationSeconds: 1, bossDurationSeconds: .5 },
      manaCost: Math.round(7 - .1 * (stats.rank - 1)),
      cooldown: ({ 1: 2, 2: 1.9, 3: 1.9, 19: 1.1, 20: 1 } as Record<number, number>)[stats.rank] });
  }
  if (rank === 0) expect(model.current).toBeUndefined();
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});
