import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.amazon.find(s => s.id === 'skills-amazon-impale');
if (!row) throw new Error('Missing actual Impale row');
const validate = createSkillValidator();
const complete = () => ({ ...row, ignoresDefense: true, statusEffect: { dotPctOfDamage: .1 } });
it('requires actual Impale to carry its explicit bypass and Bleed potency', () => {
  expect(row).toMatchObject({ ignoresDefense: true, statusEffect: { dotPctOfDamage: .1 },
    requiredLevel: 12, maxLevel: 20, cost: { mana: 10 }, cooldown: 2,
    damage: { min: 75, max: 110 }, scaling: { damagePerLevel: 150 } });
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
});
it('preserves both capabilities in real registration without source mutation', () => {
  const before = structuredClone(row), skill = registeredSkillFromJson(row);
  expect(row).toEqual(before);
  expect(skill).toMatchObject({ id: 'amazon.impale', manaCost: 10, cooldown: 2,
    target: 'single-enemy', effects: [{ kind: 'damage', damageType: 'physical',
      ignoresDefense: true, base: [75, 110], perRank: [150, 150], applyStatus: { id: 'bleed', dotPctOfDamage: .1 } }] });
});
it('requires each behavior field on the actual row', () => {
  expect(validate(complete()), JSON.stringify(validate.errors)).toBe(true);
  for (const field of ['ignoresDefense', 'statusEffect']) {
    const missing: Record<string, unknown> = complete(); Reflect.deleteProperty(missing, field);
    expect(validate(missing)).toBe(false);
  }
});
it.each([false, 1, 'true', null, {}])('rejects malformed bypass %j', ignoresDefense => {
  expect(validate({ ...complete(), ignoresDefense })).toBe(false);
});
it.each([{}, { dotPctOfDamage: 0 }, { dotPctOfDamage: -.1 }, { dotPctOfDamage: 1.1 },
  { dotPctOfDamage: Infinity }, { dotPctOfDamage: NaN }, { dotPctOfDamage: .1, typo: true }])(
  'rejects malformed Bleed potency %j', statusEffect => {
    expect(validate({ ...complete(), statusEffect })).toBe(false);
  });
it('rejects foreign or contradictory damage, eligibility, statuses and target payloads', () => {
  for (const patch of [{ id: 'skills-amazon-jab' }, { trigger: 'passive' },
    { target: 'all-enemies' }, { damageType: 'fire' }, { requiredLevel: 11 },
    { maxLevel: 21 }, { appliesStatus: ['bleed', 'burn'] }, { prerequisites: [] },
    { ignoresMagicResist: true }, { onHitRecovery: { lifeFraction: .5 } }, { hitSequence: { strikes: 5 } }]) {
    expect(validate({ ...complete(), ...patch }), JSON.stringify(patch)).toBe(false);
  }
});
it('shows JSON-owned bypass and shared Bleed rules at unlearned/current/next/MAX ranks', () => {
  for (const rank of [0, 1, 2, 19, 20]) {
    const model = computeSkillDisplayModel(row, rank), stats = rank === 0 ? model.next : model.current;
    expect(stats).toMatchObject({ ignoresDefense: true, periodic: {
      statusId: 'bleed', percentOfHit: 10, durationSeconds: 3, maxStacks: 1, minDps: 1 } });
    expect(stats?.damage).toEqual([{ type: 'physical', min: 75 + 150 * Math.max(0, rank - 1),
      max: 110 + 150 * Math.max(0, rank - 1) }]);
    if (rank > 0 && rank < 20) expect(model.next).toHaveProperty('ignoresDefense', true);
    if (rank === 20) expect(model.next).toBeUndefined();
  }
});
it('never infers a display bypass from a name or ordinary Physical damage', () => {
  const without = { ...row }; Reflect.deleteProperty(without, 'ignoresDefense');
  for (const source of [without, { ...row, id: 'foreign' }, { ...row, trigger: 'passive' },
    { ...row, damageType: 'fire' as const }]) {
    expect(computeSkillDisplayModel(source, 1).current).not.toHaveProperty('ignoresDefense');
  }
});
