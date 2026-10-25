import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';

const row = PLAYABLE_CLASS_SKILL_DATA.assassin.find((s) => s.id === 'skills-assassin-dragon-claw');
if (!row) throw new Error('Missing actual Dragon Claw row');
const validate = createSkillValidator();
const complete = () => ({ ...row, hitSequence: { strikes: 2 }, critChanceBonus: 0.1 });
it('authors the actual Dragon Claw sequence while preserving its original damage, cost and eligibility', () => {
  expect(row).toMatchObject({
    hitSequence: { strikes: 2 },
    critChanceBonus: 0.1,
    target: 'single-enemy',
    requiredLevel: 6,
    maxLevel: 20,
    cost: { mana: 20 },
    cooldown: 1,
    damage: { min: 70, max: 100 },
    scaling: { damagePerLevel: 7 }
  });
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
});
it('preserves the bounded sequence through actual registration without mutating JSON', () => {
  const before = structuredClone(row),
    skill = registeredSkillFromJson(row);
  expect(row).toEqual(before);
  expect(skill).toMatchObject({
    id: 'assassin.dragon_claw',
    target: 'single-enemy',
    manaCost: 20,
    cooldown: 1,
    effects: [
      {
        kind: 'damage',
        damageType: 'physical',
        base: [70, 100],
        perRank: [7, 7],
        hitSequence: { strikes: 2 },
        critChanceBonus: 0.1
      }
    ]
  });
});
it('requires Dragon Claw sequence metadata rather than permitting the old scalar attack', () => {
  expect(validate(complete()), JSON.stringify(validate.errors)).toBe(true);
  const missing = complete();
  Reflect.deleteProperty(missing, 'hitSequence');
  expect(validate(missing)).toBe(false);
});
it.each([undefined, 0, 1, -1, 1.5, 9, NaN, Infinity])(
  'rejects invalid Dragon Claw attempts %s',
  (strikes) => {
    expect(validate({ ...complete(), hitSequence: strikes === undefined ? {} : { strikes } })).toBe(
      false
    );
  }
);
it('rejects unrelated skill ownership and contradictory Dragon Claw payloads', () => {
  for (const patch of [
    { id: 'skills-assassin-dragon-tail' },
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { damageType: 'cold' },
    { maxLevel: 21 },
    { requiredLevel: 1 },
    { appliesStatus: ['bleed'] },
    { statusEffect: { dotPctOfDamage: 0.1 } },
    { hitSequence: { strikes: 2, typo: true } },
    { ignoresDefense: true }
  ]) {
    expect(validate({ ...complete(), ...patch }), JSON.stringify(patch)).toBe(false);
  }
});

it.each([undefined, 0, -0.1, 1.01, NaN, Infinity])(
  'rejects missing or invalid local critical bonus %s',
  (bonus) => {
    const candidate = complete();
    if (bonus === undefined) Reflect.deleteProperty(candidate, 'critChanceBonus');
    else candidate.critChanceBonus = bonus;
    expect(validate(candidate)).toBe(false);
  }
);
it('requires exactly the advertised pair and original prerequisite', () => {
  for (const patch of [
    { hitSequence: { strikes: 3 } },
    { prerequisites: [] },
    { prerequisites: ['skills-assassin-fire-blast'] }
  ])
    expect(validate({ ...complete(), ...patch })).toBe(false);
});
it('rejects the critical bonus on an otherwise valid sibling sequence', () => {
  const talon = PLAYABLE_CLASS_SKILL_DATA.assassin.find(
    (s) => s.id === 'skills-assassin-dragon-talon'
  );
  expect(validate(talon)).toBe(true);
  expect(validate({ ...talon, critChanceBonus: 0.1 })).toBe(false);
});
