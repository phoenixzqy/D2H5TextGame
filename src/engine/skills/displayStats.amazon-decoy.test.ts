import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel } from './displayStats';
const skill = PLAYABLE_CLASS_SKILL_DATA.amazon.find((row) => row.id === 'skills-amazon-decoy');
if (!skill) throw new Error('Missing Decoy');
it.each([0, 1, 2, 19, 20])(
  'previews actual inert body/lifetime/payment at rank%i and next/MAX',
  (rank) => {
    const before = structuredClone(skill),
      model = computeSkillDisplayModel(skill, rank),
      safe = Math.max(1, rank),
      current = rank === 0 ? model.next : model.current;
    expect(current).toMatchObject({
      decoy: { durationSeconds: 8 + 0.5 * (safe - 1) },
      summonCap: 1,
      manaCost: Math.round(15 - 0.1 * (safe - 1)),
      cooldown: Number((4 - 0.05 * (safe - 1)).toFixed(1))
    });
    expect(
      Object.fromEntries(current?.summonUnit?.stats.map((row) => [row.id, row.value]) ?? [])
    ).toMatchObject({ lifeMax: 200 + 20 * (safe - 1), attack: 0, defense: 20, attackSpeed: 0 });
    expect(current?.damage).toEqual([]);
    expect(current?.utility).toEqual([]);
    if (rank > 0 && rank < 20)
      expect(model.next).toMatchObject({
        decoy: { durationSeconds: 8 + 0.5 * rank },
        summonCap: 1,
        manaCost: Math.round(15 - 0.1 * rank)
      });
    if (rank === 20) expect(model.next).toBeUndefined();
    expect(skill).toEqual(before);
  }
);

it('does not advertise a duplicate from absent,incomplete,nonfinite or contradictory metadata', () => {
  for (const field of ['decoy', 'cost', 'scaling']) {
    const invalid = structuredClone(skill);
    Reflect.deleteProperty(invalid, field);
    expect(computeSkillDisplayModel(invalid, 1).current).not.toHaveProperty('decoy');
    expect(computeSkillDisplayModel(invalid, 1).current).not.toHaveProperty('summonUnit');
  }
  const invalid = structuredClone(skill);
  if (!invalid.decoy) throw new Error('Missing Decoy');
  Reflect.set(invalid.decoy, 'durationMs', Infinity);
  expect(computeSkillDisplayModel(invalid, 1).current).not.toHaveProperty('decoy');
});
