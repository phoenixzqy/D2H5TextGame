import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';

const amazon = PLAYABLE_CLASS_SKILL_DATA.amazon;
import { createSkillValidator } from './skill-validator';

const row = amazon.find(s => s.id === 'skills-amazon-freezing-arrow');
if (!row) throw new Error('Missing Freezing Arrow');
const validate = createSkillValidator();
it('validates actual Freezing Arrow data with explicit secondary probability', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(row).toMatchObject({ damageType: 'cold', damage: { min: 50, max: 70 },
    scaling: { damagePerLevel: 5 }, cost: { mana: 20 }, cooldown: 2,
    requiredLevel: 30, maxLevel: 20, aoeShape: 'box-3x3',
    appliesStatus: ['chill', 'freeze'], additionalStatusEffects: { freeze: { chance: .15 } } });
});
it('preserves both ordered statuses in real registration without changing inputs', () => {
  const before = structuredClone(row), skill = registeredSkillFromJson(row);
  expect(row).toEqual(before);
  expect(skill).toMatchObject({ id: 'amazon.freezing_arrow', manaCost: 20, cooldown: 2,
    target: 'area-enemies', aoeShape: 'box-3x3', effects: [{ kind: 'damage',
      damageType: 'cold', base: [50, 70], perRank: [5, 5],
      applyStatuses: [{ id: 'chill' }, { id: 'freeze', chance: .15 }] }] });
});
it.each([
  { chance: -0.1 }, { chance: 1.1 }, {}, { chance: .15, durationMs: 1000 }
])('existing closed secondary schema rejects invalid metadata %j', freeze => {
  expect(validate({ ...row, additionalStatusEffects: { freeze } })).toBe(false);
});
it('does not guess secondary probability when an opt-in is absent', () => {
  const uncontracted = { ...row }; Reflect.deleteProperty(uncontracted, 'additionalStatusEffects');
  expect(registeredSkillFromJson(uncontracted).effects).toEqual([expect.objectContaining({ applyStatus: { id: 'chill' } })]);
});
it('preserves the sibling Ice Arrow Freeze-then-Chill registration', () => {
  const ice = amazon.find(s => s.id === 'skills-amazon-ice-arrow');
  if (!ice) throw new Error('Missing Ice Arrow');
  expect(registeredSkillFromJson(ice).effects).toEqual([expect.objectContaining({
    applyStatuses: [{ id: 'freeze' }, { id: 'chill' }] })]);
});
