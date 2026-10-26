import { expect, it } from 'vitest';
import { PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';
import { computeSkillDisplayModel, computeSkillRankDisplayStats, type DisplaySkillSource } from './displayStats';
const wall = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(s => s.id === 'skills-necromancer-bone-wall');
const prison = PLAYABLE_CLASS_SKILL_DATA.necromancer.find(s => s.id === 'skills-necromancer-bone-prison');
if (!wall || !prison) throw new Error('Missing authored bone defenses');
it.each([[0, 40, 17, 4], [1, 40, 17, 4], [6, 90, 16, 3.8], [12, 150, 15, 3.5], [20, 230, 13, 3]] as const)(
  'shows finite Wall capacity, duration and preserved price/CD at rank%i', (rank, capacity, manaCost, cooldown) => {
  const before = structuredClone(wall), model = computeSkillDisplayModel(wall, rank);
  const shown = rank === 0 ? model.next : model.current;
  expect(shown).toMatchObject({ boneWall: { capacity, durationSeconds: 6 }, manaCost, cooldown });
  if (rank === 0) expect(model.current).toBeUndefined();
  else if (rank < 20) expect(model.next?.boneWall).toEqual({ capacity: capacity + 10, durationSeconds: 6 });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(wall).toEqual(before);
});
it.each([[0, 27, 4], [1, 27, 4], [6, 26, 3.8], [12, 25, 3.5], [20, 23, 3]] as const)(
  'shows finite all-enemy Prison timing and preserved price/CD at rank%i', (rank, manaCost, cooldown) => {
  const before = structuredClone(prison), model = computeSkillDisplayModel(prison, rank);
  const shown = rank === 0 ? model.next : model.current;
  expect(shown).toMatchObject({ control: { durationSeconds: 2, bossDurationSeconds: 1 }, manaCost, cooldown });
  if (rank < 20) expect(model.next?.control).toEqual({ durationSeconds: 2, bossDurationSeconds: 1 });
  if (rank === 20) expect(model.next).toBeUndefined();
  expect(prison).toEqual(before);
});
it('reads caller-authored valid Wall and Prison tuning without freezing or mutating callers', () => {
  const source = { ...wall, boneWall: { durationMs: 3000, baseCapacity: 7, capacityPerRank: 2 } };
  const before = structuredClone(source);
  expect(computeSkillRankDisplayStats(source, 6).boneWall).toEqual({ capacity: 17, durationSeconds: 3 });
  expect(source).toEqual(before);
  expect(computeSkillRankDisplayStats({ ...prison, statusEffect: { durationMs: 2500, bossDurationMultiplier: .4 } }, 1).control)
    .toEqual({ durationSeconds: 2.5, bossDurationSeconds: 1 });
});
it.each<Partial<DisplaySkillSource>>([{ boneWall: { durationMs: 0, baseCapacity: 40, capacityPerRank: 10 } },
  { boneWall: { durationMs: 6000, baseCapacity: 0, capacityPerRank: 10 } }, { target: 'all-allies' }, { cost: { mana: 0 } }])(
  'does not advertise Wall protection from contradictory metadata %j', patch => {
  expect(computeSkillRankDisplayStats({ ...wall, ...patch }, 1)).not.toHaveProperty('boneWall');
});
it.each<Partial<DisplaySkillSource>>([{ statusEffect: { durationMs: 0, bossDurationMultiplier: .5 } },
  { statusEffect: { durationMs: 2000, bossDurationMultiplier: Infinity } }, { target: 'self' }, { cost: { mana: 0 } }])(
  'does not advertise Prison control from contradictory metadata %j', patch => {
  expect(computeSkillRankDisplayStats({ ...prison, ...patch }, 1)).not.toHaveProperty('control');
});

it('does not advertise an unpaid Wall marker with no authored barrier tuning', () => {
  const { boneWall, ...marker } = wall; void boneWall;
  expect(computeSkillRankDisplayStats(marker, 1)).not.toHaveProperty('boneWall');
});
it('does not advertise a Prison marker with no authored trap timing', () => {
  const { statusEffect, ...marker } = prison; void statusEffect;
  expect(computeSkillRankDisplayStats(marker, 1)).not.toHaveProperty('control');
});
