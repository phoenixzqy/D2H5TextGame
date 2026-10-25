import { expect, it } from 'vitest';
import rows from '../../data/skills/druid.json';
import type { CombatUnit } from '../combat/types';
import {
  SPIRIT_OF_BARBS_DEFINITION,
  activeSpiritOfBarbs,
  composeSpiritOfBarbs,
  copySpiritOfBarbs,
  resolveSpiritOfBarbsDefinition,
  spiritOfBarbsRank
} from './spirit-of-barbs';

const owner = {
  id: 'hero',
  class: 'druid' as const,
  level: 30,
  skillLevels: {
    'druid.oak_sage': 1,
    'druid.heart_of_wolverine': 1,
    'druid.spirit_of_barbs': 1,
    'skills-druid-spirit-of-barbs': 20
  }
};
const unit = (id: string, kind = 'hero') => ({ id, side: 'player', kind, life: 100 }) as CombatUnit;
const pet = (id: string) => ({
  ...unit(id, 'summon'),
  summon: true,
  summonOwnerId: 'hero',
  ownerId: 'hero'
});
const spirit = { ...pet('authenticated-spirit'), summonTemplateId: 'spirit_of_barbs' };

it('retains authored coefficients and copies immutable JSON-owned support template tuning', () => {
  expect(SPIRIT_OF_BARBS_DEFINITION).toEqual({
    requiredLevel: 30,
    maxRank: 20,
    thornsPerRank: 0.04,
    summonDefensePerRank: 0.02,
    summonId: 'spirit_of_barbs',
    stats: { life: 80, attack: 0, defense: 10 }
  });
  const input = structuredClone(rows);
  const copied = resolveSpiritOfBarbsDefinition(input);
  expect(Object.isFrozen(copied)).toBe(true);
  expect(Object.isFrozen(copied.stats)).toBe(true);
  expect(copied).toEqual(SPIRIT_OF_BARBS_DEFINITION);
});
it('uses exact aliases MAX once with cap20 and no implicit allocation', () => {
  expect(spiritOfBarbsRank(owner.skillLevels)).toBe(20);
  expect(spiritOfBarbsRank({ 'druid.spirit_of_barbs': 999 })).toBe(20);
  expect(spiritOfBarbsRank({ 'spirit-of-barbs': 20, spirit_of_barbs: 20 })).toBe(0);
  expect(composeSpiritOfBarbs(owner, 'original-merc')).toEqual({
    sourceHeroId: 'hero',
    fieldedMercCombatId: 'original-merc',
    rank: 20
  });
});
it.each([NaN, Infinity, -1, 0, 1.5])('invalid allocation%s grants no spirit authority', (rank) => {
  expect(
    composeSpiritOfBarbs({
      ...owner,
      skillLevels: {
        'druid.oak_sage': 1,
        'druid.heart_of_wolverine': 1,
        'druid.spirit_of_barbs': rank
      }
    })
  ).toBeUndefined();
});
it('requires class, integer unlock and the full Oak/Heart chain', () => {
  expect(composeSpiritOfBarbs({ ...owner, class: 'sorceress' })).toBeUndefined();
  expect(composeSpiritOfBarbs({ ...owner, level: 29 })).toBeUndefined();
  expect(composeSpiritOfBarbs({ ...owner, level: 30.5 })).toBeUndefined();
  for (const prerequisite of ['druid.oak_sage', 'druid.heart_of_wolverine']) {
    const levels = { ...owner.skillLevels, [prerequisite]: 0 };
    expect(composeSpiritOfBarbs({ ...owner, skillLevels: levels })).toBeUndefined();
  }
});
it('copies only valid rank/source/original-merc authority', () => {
  const projection = composeSpiritOfBarbs(owner, 'original-merc');
  expect(Object.isFrozen(projection)).toBe(true);
  expect(copySpiritOfBarbs(projection)).toEqual(projection);
  expect(copySpiritOfBarbs(projection)).not.toBe(projection);
  for (const patch of [
    { rank: 0 },
    { rank: 21 },
    { rank: NaN },
    { sourceHeroId: '' },
    { fieldedMercCombatId: 'hero' }
  ])
    expect(copySpiritOfBarbs({ sourceHeroId: 'hero', rank: 20, ...patch })).toBeUndefined();
});
it('requires an actual attested living owned spirit and the living original party', () => {
  const hero = unit('hero'),
    merc = unit('original-merc', 'merc'),
    raven = pet('raven');
  const projection = composeSpiritOfBarbs(owner, merc.id);
  const units = new Map([hero, merc, raven, spirit].map((u) => [u.id, u]));
  for (const recipient of [hero, merc, raven, spirit])
    expect(activeSpiritOfBarbs(projection, spirit.id, recipient, units)).toEqual(projection);
  expect(activeSpiritOfBarbs(projection, undefined, hero, units)).toBeUndefined();
  for (const invalid of [
    unit('bench', 'merc'),
    unit('foreign'),
    { ...raven, summonOwnerId: 'other' },
    { ...raven, ownerId: 'other' },
    { ...raven, side: 'enemy' as const },
    { ...merc, life: 0 }
  ]) {
    expect(activeSpiritOfBarbs(projection, spirit.id, invalid, units)).toBeUndefined();
  }
  for (const patch of [
    { life: 0 },
    { summonOwnerId: 'other' },
    { ownerId: 'other' },
    { summonTemplateId: 'raven' },
    { kind: 'hero' as const },
    { side: 'enemy' as const }
  ]) {
    const altered = new Map(units);
    altered.set(spirit.id, { ...spirit, ...patch });
    expect(activeSpiritOfBarbs(projection, spirit.id, hero, altered)).toBeUndefined();
  }
  for (const patch of [{ life: 0 }, { kind: 'merc' as const }, { ownerId: 'other' }]) {
    const altered = new Map(units);
    altered.set(hero.id, { ...hero, ...patch });
    expect(activeSpiritOfBarbs(projection, spirit.id, merc, altered)).toBeUndefined();
  }
});
it.each(['coefficient', 'prerequisite', 'life', 'attack', 'extra-stat'] as const)(
  'rejects changed or malformed authored %s',
  (field) => {
    const changed: unknown[] = structuredClone(rows);
    const row = changed.find(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        value.id === 'skills-druid-spirit-of-barbs'
    ) as Record<string, unknown>;
    if (field === 'coefficient')
      row.scaling = { passiveStatsPerLevel: { thornsPct: 0.99, summonDefensePct: 0.02 } };
    if (field === 'prerequisite') row.prerequisites = [];
    if (field === 'life')
      row.passiveSummon = {
        summonId: 'spirit_of_barbs',
        stats: { life: 0, attack: 0, defense: 10 }
      };
    if (field === 'attack')
      row.passiveSummon = {
        summonId: 'spirit_of_barbs',
        stats: { life: 80, attack: 1, defense: 10 }
      };
    if (field === 'extra-stat')
      row.passiveSummon = {
        summonId: 'spirit_of_barbs',
        stats: { life: 80, attack: 0, defense: 10, speed: 100 }
      };
    expect(() => resolveSpiritOfBarbsDefinition(changed)).toThrow();
  }
);
