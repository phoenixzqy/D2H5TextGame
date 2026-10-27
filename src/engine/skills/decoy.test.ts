import { expect, it } from 'vitest';
import rows from '../../data/skills/amazon.json';
import { createSkillValidator } from './skill-validator';
import type { SkillDef } from '../types/skills';
import { DECOY_DEFINITION, decoyBodyStats, decoyDuration, resolveDecoyDefinition } from './decoy';
const validate = createSkillValidator<SkillDef>();
const row = rows.find((row) => row.id === 'skills-amazon-decoy');
if (!validate(row) || !row.decoy) throw new Error('Missing complete Decoy data');

it('keeps all authored skills schema-valid and removes the phantom active dodge marker', () => {
  for (const skill of rows) expect(validate(skill), skill.id).toBe(true);
  expect(row.appliesStatus).toBeUndefined();
  expect(row.scaling.passiveStatsPerLevel).toBeUndefined();
  expect(DECOY_DEFINITION).toMatchObject({
    manaCost: 15,
    cooldown: 4,
    manaCostPerRank: -0.1,
    cooldownPerRank: -0.05,
    requiredLevel: 24,
    maxRank: 20,
    maxCount: 1
  });
});
it.each([
  [1, 200, 8000],
  [2, 220, 8500],
  [20, 580, 17500]
])('builds literal paid rank%i body/lifetime', (rank, life, duration) => {
  expect(decoyBodyStats(rank)).toMatchObject({
    life,
    lifeMax: life,
    mana: 0,
    manaMax: 0,
    attack: 0,
    attackSpeed: 0,
    defense: 20,
    critChance: 0,
    critDamage: 1,
    physDodge: 0,
    magicDodge: 0,
    magicFind: 0,
    goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
  });
  expect(decoyDuration(rank)).toBe(duration);
});
it('requires paid +1 provenance beyond the allocation cap and never shares mutable body data', () => {
  expect(decoyBodyStats(21, 1).lifeMax).toBe(600);
  expect(decoyDuration(21, 1)).toBe(18000);
  const body = decoyBodyStats(1);
  body.resistances.fire = 90;
  expect(decoyBodyStats(1).resistances.fire).toBe(0);
  expect(Object.isFrozen(body.resistances)).toBe(false);
  expect(() => decoyBodyStats(21)).toThrow('Invalid paid Decoy rank');
});
it.each([0, -1, 1.5, NaN, Infinity, 22])('refuses invalid paid rank %s', (rank) => {
  expect(() => decoyBodyStats(rank)).toThrow('Invalid paid Decoy rank');
  expect(() => decoyDuration(rank)).toThrow('Invalid paid Decoy rank');
});
it('copies and deeply freezes complete input without freezing caller data', () => {
  const input = structuredClone(row),
    before = structuredClone(input),
    d = resolveDecoyDefinition([input]);
  expect(Object.isFrozen(d)).toBe(true);
  expect(Object.isFrozen(d.bodyStats)).toBe(true);
  expect(Object.isFrozen(d.bodyStats.resistances)).toBe(true);
  expect(Object.isFrozen(input)).toBe(false);
  input.decoy.bodyStats.resistances.fire = 30;
  expect(d.bodyStats.resistances).toEqual(before.decoy.bodyStats.resistances);
  expect(() => resolveDecoyDefinition([])).toThrow('Invalid authored Decoy');
  expect(() => resolveDecoyDefinition([row, row])).toThrow('Invalid authored Decoy');
});
it.each(['durationMs', 'durationPerRankMs', 'lifePerRank', 'maxCount', 'bodyStats'])(
  'rejects missing Decoy %s',
  (field) => {
    const input = structuredClone(row);
    Reflect.deleteProperty(input.decoy, field);
    expect(() => resolveDecoyDefinition([input])).toThrow('Invalid authored Decoy');
  }
);
it.each(Object.keys(row.decoy.bodyStats))('requires complete body stat %s', (field) => {
  const input = structuredClone(row);
  Reflect.deleteProperty(input.decoy.bodyStats, field);
  expect(() => resolveDecoyDefinition([input])).toThrow('Invalid authored Decoy');
});
it.each(Object.keys(row.decoy.bodyStats.resistances))(
  'requires explicit %s resistance',
  (field) => {
    const input = structuredClone(row);
    Reflect.deleteProperty(input.decoy.bodyStats.resistances, field);
    expect(() => resolveDecoyDefinition([input])).toThrow('Invalid authored Decoy');
  }
);
it('rejects nonfinite,unknown,foreign and contradictory effects at the data boundary', () => {
  for (const patch of [
    { durationMs: 0 },
    { durationMs: Infinity },
    { durationPerRankMs: NaN },
    { lifePerRank: -1 },
    { maxCount: 2 },
    { extra: true },
    { bodyStats: { ...row.decoy.bodyStats, attack: 1 } },
    { bodyStats: { ...row.decoy.bodyStats, attackSpeed: 100 } },
    { bodyStats: { ...row.decoy.bodyStats, lifeMax: NaN } },
    { bodyStats: { ...row.decoy.bodyStats, resistances: {} } }
  ])
    expect(() => resolveDecoyDefinition([{ ...row, decoy: { ...row.decoy, ...patch } }])).toThrow(
      'Invalid authored Decoy'
    );
  for (const patch of [
    { trigger: 'passive' },
    { target: 'all-enemies' },
    { cost: { mana: 0 } },
    { damage: { min: 1, max: 1 } },
    { appliesStatus: ['decoy'] },
    { summon: true },
    { hydra: {} },
    { requiredLevel: 1 },
    { scaling: { passiveStatsPerLevel: { physDodgePct: 0.005 } } }
  ])
    expect(() => resolveDecoyDefinition([{ ...row, ...patch }])).toThrow('Invalid authored Decoy');
  expect(validate({ ...row, id: 'skills-amazon-slow-missiles' })).toBe(false);
});
