import { expect, it } from 'vitest';
import authored from '../../data/skills/sorceress.json';
import { HYDRA_DEFINITION, composeHydraRank, hydraBodyStats, resolveHydraDefinition } from './hydra';
import { createSkillValidator } from './skill-validator';
import { registeredSkillFromJson } from './dataCatalog';

const source = authored.find(row => row.id === 'skills-sorceress-hydra');
const validate = createSkillValidator<Parameters<typeof registeredSkillFromJson>[0]>();
const levels = { 'skills-sorceress-inferno': 1, 'skills-sorceress-blaze': 1,
  'skills-sorceress-fire-wall': 1, 'skills-sorceress-hydra': 1 };

it('adapts a validated Hydra into only a paid startup effect, with no player damage primitive', () => {
  if (!source) throw new Error('Missing Hydra source');
  const row: unknown = source;
  if (!validate(row)) throw new Error('Invalid Hydra source');
  expect(registeredSkillFromJson(row)).toMatchObject({ id: 'sorceress.hydra',
    summonOnStart: true, manaCost: 40, cooldown: 4, minLevel: 30, target: 'summon', effects: [{ kind: 'hydra' }] });
  expect(HYDRA_DEFINITION).toMatchObject({ heads: 3, durationMs: 10000, maxCount: 1,
    bolt: { base: [95, 140], perRank: [9, 9], applyStatus: { id: 'burn', dotPctOfDamage: .1 } } });
});

it.each([{ hydra: undefined }, { cost: undefined }, { cost: { mana: 0 } }, { target: 'all-enemies' },
  { summon: false }, { summonId: 'skeleton' }, { requiredLevel: 29 }, { damageType: 'cold' },
  { statusEffect: { dotPctOfDamage: .1, durationMs: 1000 } }, { periodicSpell: { durationMs: 3000, intervalMs: 1000 } },
  { scaling: { damagePerLevel: 9, costPerLevel: -1 } }, { hitSequence: { strikes: 3 } }])(
  'rejects contradictory authored Hydra source %j', patch => {
    expect(validate({ ...source, ...patch })).toBe(false);
  });

it.each([{ heads: 0 }, { heads: 9 }, { durationMs: 0 }, { durationMs: 60001 }, { maxCount: 2 },
  { bodyStats: { ...source?.hydra?.bodyStats, lifeMax: 0 } },
  { bodyStats: { ...source?.hydra?.bodyStats, critChance: 2 } }, { extra: 1 }])(
  'rejects malformed body/head/lifetime metadata %j', patch => {
    expect(validate({ ...source, hydra: { ...source?.hydra, ...patch } })).toBe(false);
  });

it('rejects absent/duplicate and reversed-damage source definitions', () => {
  expect(() => resolveHydraDefinition([])).toThrow();
  expect(() => resolveHydraDefinition([source, source])).toThrow();
  expect(() => resolveHydraDefinition([{ ...source, damage: { min: 200, max: 100 } }])).toThrow();
});

it('copies/freeze nested body and bolt tuning without mutating or retaining caller-owned JSON', () => {
  const row = structuredClone(source), before = structuredClone(row), resolved = resolveHydraDefinition([row]);
  expect(row).toEqual(before);
  expect(Object.isFrozen(resolved.bodyStats.resistances)).toBe(true);
  expect(Object.isFrozen(resolved.bolt.base)).toBe(true);
  if (!row?.hydra) throw new Error('Missing source body');
  row.hydra.bodyStats.lifeMax = 999; row.damage.min = 999;
  expect(resolved.bodyStats.lifeMax).toBe(240); expect(resolved.bolt.base).toEqual([95, 140]);
  const stats = hydraBodyStats(); stats.resistances.fire = -99;
  expect(hydraBodyStats().resistances.fire).toBe(50);
});

it.each([1, 2, 20])('projects rank%i with learned prerequisites and no selection side effect', rank => {
  const player = { class: 'sorceress' as const, level: 30, skillLevels: { ...levels, 'skills-sorceress-hydra': rank } };
  const before = structuredClone(player); expect(composeHydraRank(player)).toBe(rank); expect(player).toEqual(before);
});

it.each([{ class: 'amazon' as const, level: 30, skillLevels: levels },
  { class: 'sorceress' as const, level: 29, skillLevels: levels },
  { class: 'sorceress' as const, level: 30, skillLevels: { ...levels, 'skills-sorceress-blaze': 0 } },
  { class: 'sorceress' as const, level: 30, skillLevels: { ...levels, 'skills-sorceress-hydra': 0 } }])(
  'denies wrong-class/unlock/unlearned/transitive-prerequisite authority %j', player => {
    expect(composeHydraRank(player)).toBe(0);
  });
