import { expect, it } from 'vitest';
import { DEFAULT_SKILLS } from './builders';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { computeSkillDisplayModel } from './displayStats';

const row = PLAYABLE_CLASS_SKILL_DATA.assassin.find((s) => s.id === 'skills-assassin-fire-blast');
if (!row) throw new Error('Missing actual Fire Blast');
const validate = createSkillValidator();

it('authors and forwards the actual cone through native and legacy registration', () => {
  expect(row.aoeShape).toBe('cone-2');
  expect(registeredSkillFromJson(row)).toMatchObject({
    id: 'assassin.fire_blast',
    target: 'area-enemies',
    aoeShape: 'cone-2',
    manaCost: 25,
    cooldown: 2,
    minLevel: 1
  });
  expect(DEFAULT_SKILLS.find((s) => s.id === 'assassin.fire_blast')?.aoeShape).toBe('cone-2');
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
});
it('rejects missing/wrong cone or contradictory native Fire Blast identity', () => {
  for (const patch of [
    { aoeShape: undefined },
    { aoeShape: 'cross' },
    { aoeShape: 'box-3x3' },
    { target: 'all-enemies' },
    { trigger: 'passive' },
    { damageType: 'cold' },
    { requiredLevel: 2 },
    { maxLevel: 30 },
    { prerequisites: ['skills-assassin-shock-web'] },
    { appliesStatus: [] }
  ])
    expect(validate({ ...row, ...patch }), JSON.stringify(patch)).toBe(false);
});
it('does not grant the provisional cone to another authored owner', () => {
  expect(validate({ ...row, id: 'skills-assassin-blade-fury', aoeShape: 'cone-2' })).toBe(false);
});
it.each([0, 1, 2, 19, 20])(
  'previews the real cone without changing rank%i damage or prices',
  (rank) => {
    const before = structuredClone(row),
      model = computeSkillDisplayModel(row, rank);
    const stats = model.current ?? model.next;
    expect(stats).toMatchObject({
      areaShape: 'cone-2',
      manaCost: 25,
      cooldown: 2,
      burn: { percentOfHit: 10, durationSeconds: 3, maxStacks: 5, minDps: 1 }
    });
    const growth = 5 * Math.max(0, rank - 1);
    expect(stats?.damage).toEqual([{ type: 'fire', min: 50 + growth, max: 70 + growth }]);
    if (rank > 0 && rank < 20) expect(model.next?.areaShape).toBe('cone-2');
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(row).toEqual(before);
  }
);
