import { expect, it } from 'vitest';
import { DEFAULT_SKILLS } from './builders';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.assassin.find(s => s.id === 'skills-assassin-blade-fury');
if (!row) throw new Error('Missing actual Blade Fury');
const validate = createSkillValidator();

it('authors the Physical cone through native and legacy registration', () => {
  expect(row.aoeShape).toBe('cone-2');
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(registeredSkillFromJson(row)).toMatchObject({ id: 'assassin.blade_fury',
    target: 'area-enemies', aoeShape: 'cone-2', manaCost: 15, cooldown: 1, minLevel: 18 });
  expect(DEFAULT_SKILLS.find(s => s.id === 'assassin.blade_fury')?.aoeShape).toBe('cone-2');
});
it.each([
  { aoeShape: undefined }, { aoeShape: 'line-3' }, { target: 'single-enemy' },
  { trigger: 'passive' }, { damageType: 'fire' }, { requiredLevel: 1 },
  { maxLevel: 30 }, { prerequisites: [] }, { appliesStatus: ['burn'] },
  { hitSequence: { strikes: 2 } }, { critChanceBonus: 0.1 }
])('rejects incomplete or cross-skill Blade Fury identity %j', patch => {
  expect(validate({ ...row, ...patch })).toBe(false);
});
it('does not grant cone ownership to another skill', () => {
  expect(validate({ ...row, id: 'skills-assassin-shock-web', aoeShape: 'cone-2' })).toBe(false);
});
it.each([0, 1, 2, 19, 20])('previews the true Physical cone at rank%i', rank => {
  const before = structuredClone(row), model = computeSkillDisplayModel(row, rank);
  const stats = model.current ?? model.next;
  const growth = 4 * Math.max(0, rank - 1);
  expect(stats).toMatchObject({ areaShape: 'cone-2', manaCost: 15, cooldown: 1,
    damage: [{ type: 'physical', min: 40 + growth, max: 60 + growth }] });
  expect(stats?.burn).toBeUndefined();
  expect(stats?.criticalBonusPoints).toBeUndefined();
  expect(stats?.strikesPerCast).toBeUndefined();
  if (rank > 0 && rank < 20) expect(model.next?.areaShape).toBe('cone-2');
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(row).toEqual(before);
});
