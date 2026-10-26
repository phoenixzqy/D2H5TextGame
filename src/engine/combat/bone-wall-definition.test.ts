import { expect, it } from 'vitest';
import rows from '../../data/skills/necromancer.json';
import { createSkillValidator } from '../skills/skill-validator';
import { BONE_WALL_DEFINITION, isBoneWallDefinition, resolveBoneWallDefinition } from './bone-wall-definition';
const row = rows.find(r => r.id === 'skills-necromancer-bone-wall');
if (!row) throw new Error('Missing authored Wall');
const validate = createSkillValidator();
it('authors a finite destructible Wall without changing its unlock, prerequisite, target or price', () => {
  expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
  expect(row).toMatchObject({ requiredLevel: 12, prerequisites: ['skills-necromancer-bone-armor'],
    trigger: 'active', target: 'self', maxLevel: 20, cooldown: 4, cost: { mana: 17 },
    scaling: { cooldownPerLevel: -.05, costPerLevel: -.2 }, appliesStatus: ['bone-wall'],
    boneWall: { durationMs: 6000, baseCapacity: 40, capacityPerRank: 10 } });
});
it.each([
  { boneWall: undefined }, { boneWall: {} }, { boneWall: { durationMs: 6000, baseCapacity: 40 } },
  ...[0, -1, .5, 60001, NaN, Infinity].map(durationMs => ({ boneWall: { durationMs, baseCapacity: 40, capacityPerRank: 10 } })),
  ...[0, -1, .5, 1000001, NaN, Infinity].map(baseCapacity => ({ boneWall: { durationMs: 6000, baseCapacity, capacityPerRank: 10 } })),
  ...[-1, .5, 1000001, NaN, Infinity].map(capacityPerRank => ({ boneWall: { durationMs: 6000, baseCapacity: 40, capacityPerRank } })),
  { boneWall: { durationMs: 6000, baseCapacity: 40, capacityPerRank: 10, extra: true } },
  { trigger: 'passive' }, { target: 'all-allies' }, { maxLevel: 21 }, { requiredLevel: 11 },
  { prerequisites: [] }, { cost: { mana: 0 } }, { cooldown: 0 }, { scaling: { cooldownPerLevel: -.1 } },
  { appliesStatus: ['bone-armor'] }, { damage: { min: 1, max: 1 } }, { summon: true }, { summonId: 'wall' }
])('rejects incomplete or contradictory Wall contract %j', patch => {
  const invalid = { ...row, ...patch };
  expect(validate(invalid)).toBe(false);
  expect(isBoneWallDefinition(invalid)).toBe(false);
  expect(() => resolveBoneWallDefinition([invalid])).toThrow();
});
it('allows bounded JSON tuning while reserving the capability for exact player Wall', () => {
  expect(validate({ ...row, boneWall: { durationMs: 3000, baseCapacity: 1, capacityPerRank: 0 } })).toBe(true);
  expect(validate({ ...row, id: 'skills-necromancer-bone-armor', boneWall: {
    durationMs: 6000, baseCapacity: 40, capacityPerRank: 10 } })).toBe(false);
});

it('copies immutable tuning without freezing callers and refuses duplicate or missing definitions', () => {
  expect(BONE_WALL_DEFINITION).toMatchObject({ durationMs: 6000, baseCapacity: 40, capacityPerRank: 10,
    requiredLevel: 12, maxRank: 20, manaCost: 17, cooldown: 4, costPerRank: -.2, cooldownPerRank: -.05 });
  const source = structuredClone(rows), definition = resolveBoneWallDefinition(source);
  const changed = source.find(r => r.id === row.id);
  if (!changed?.boneWall) throw new Error('Missing copied Wall tuning');
  changed.boneWall.baseCapacity = 70;
  expect(definition.baseCapacity).toBe(40); expect(Object.isFrozen(definition)).toBe(true);
  expect(resolveBoneWallDefinition(source).baseCapacity).toBe(70);
  expect(() => resolveBoneWallDefinition([])).toThrow();
  expect(() => resolveBoneWallDefinition([row, row])).toThrow();
  expect(isBoneWallDefinition({ ...row, id: 'monster.bone_wall' })).toBe(false);
});
