import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';

const row = PLAYABLE_CLASS_SKILL_DATA.assassin.find((s) => s.id === 'skills-assassin-dragon-talon');
if (!row) throw new Error('Missing actual Dragon Talon row');
const validate = createSkillValidator();
const complete = () => ({ ...row, hitSequence: { strikes: 3 } });
it('authors the actual Dragon Talon sequence while preserving its original damage, cost and eligibility', () => {
  expect(row).toMatchObject({
    hitSequence: { strikes: 3 },
    target: 'single-enemy',
    requiredLevel: 1,
    maxLevel: 20,
    cost: { mana: 4 },
    cooldown: 1,
    damage: { min: 40, max: 60 },
    scaling: { damagePerLevel: 4 }
  });
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
});
it('preserves the bounded sequence through actual registration without mutating JSON', () => {
  const before = structuredClone(row),
    skill = registeredSkillFromJson(row);
  expect(row).toEqual(before);
  expect(skill).toMatchObject({
    id: 'assassin.dragon_talon',
    target: 'single-enemy',
    manaCost: 4,
    cooldown: 1,
    effects: [
      {
        kind: 'damage',
        damageType: 'physical',
        base: [40, 60],
        perRank: [4, 4],
        hitSequence: { strikes: 3 }
      }
    ]
  });
});
it('requires Dragon Talon sequence metadata rather than permitting the old scalar attack', () => {
  expect(validate(complete()), JSON.stringify(validate.errors)).toBe(true);
  const missing = complete();
  Reflect.deleteProperty(missing, 'hitSequence');
  expect(validate(missing)).toBe(false);
});
it.each([undefined, 0, 1, -1, 1.5, 9, NaN, Infinity])(
  'rejects invalid Dragon Talon attempts %s',
  (strikes) => {
    expect(validate({ ...complete(), hitSequence: strikes === undefined ? {} : { strikes } })).toBe(
      false
    );
  }
);
it('rejects unrelated skill ownership and contradictory Dragon Talon payloads', () => {
  for (const patch of [
    { id: 'skills-assassin-dragon-tail' },
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { damageType: 'cold' },
    { maxLevel: 21 },
    { requiredLevel: 2 },
    { appliesStatus: ['bleed'] },
    { statusEffect: { dotPctOfDamage: 0.1 } },
    { hitSequence: { strikes: 3, typo: true } },
    { ignoresDefense: true }
  ]) {
    expect(validate({ ...complete(), ...patch }), JSON.stringify(patch)).toBe(false);
  }
});
