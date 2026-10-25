import { expect, it } from 'vitest';
import rows from '../../data/skills/druid.json';
import type { CombatUnit } from '../combat/types';
import {
  activeDruidAllyAuras,
  composeDruidAllyAuras,
  copyDruidAllyAuras,
  DRUID_ALLY_AURA_DEFINITIONS,
  resolveDruidAllyAuraDefinitions
} from './druid-ally-auras';
const native = {
  id: 'hero',
  class: 'druid' as const,
  level: 30,
  skillLevels: { 'druid.oak_sage': 1, 'skills-druid-oak-sage': 20, 'druid.heart_of_wolverine': 19 }
};
const unit = (id: string, kind = 'hero') => ({ id, side: 'player', kind, life: 100 }) as CombatUnit;
it('captures exact aliases MAX/cap and copies immutable allocation authority', () => {
  const p = composeDruidAllyAuras(native, 'merc');
  expect(p).toEqual({
    sourceHeroId: 'hero',
    fieldedMercCombatId: 'merc',
    oakRank: 20,
    heartRank: 19
  });
  expect(
    composeDruidAllyAuras({ ...native, skillLevels: { 'druid.oak_sage': 999 } })?.oakRank
  ).toBe(20);
  const copy = copyDruidAllyAuras(p);
  expect(copy).toEqual(p);
  expect(copy).not.toBe(p);
  expect(Object.isFrozen(copy)).toBe(true);
  expect(DRUID_ALLY_AURA_DEFINITIONS.oak).toMatchObject({
    requiredLevel: 6,
    maxRank: 20,
    lifePerRank: 0.03
  });
  expect(DRUID_ALLY_AURA_DEFINITIONS.heart).toMatchObject({
    requiredLevel: 18,
    attackPerRank: 0.03,
    critPerRank: 0.005
  });
});
it.each([NaN, Infinity, -1, 0, 1.5])('invalid allocation%s grants no implicit rank', (value) => {
  expect(
    composeDruidAllyAuras({
      ...native,
      skillLevels: { 'druid.oak_sage': value, 'druid.heart_of_wolverine': 20 }
    })
  ).toBeUndefined();
});
it('honors native class, integral level and the full Heart prerequisite', () => {
  expect(composeDruidAllyAuras({ ...native, class: 'sorceress' })).toBeUndefined();
  expect(composeDruidAllyAuras({ ...native, level: 5 })).toBeUndefined();
  expect(composeDruidAllyAuras({ ...native, level: 30.5 })).toBeUndefined();
  expect(composeDruidAllyAuras({ ...native, level: 17 })).toMatchObject({
    oakRank: 20,
    heartRank: 0
  });
});
it('supports only living original hero/merc/owned summons; control alone leaves it active', () => {
  const hero = unit('hero'),
    merc = unit('merc', 'merc');
  const pet = { ...unit('pet', 'summon'), summon: true, summonOwnerId: 'hero', ownerId: 'hero' };
  const units = new Map([hero, merc, pet].map((u) => [u.id, u])),
    p = composeDruidAllyAuras(native, 'merc');
  for (const recipient of [hero, merc, pet])
    expect(activeDruidAllyAuras(p, recipient, units)).toEqual(p);
  for (const recipient of [
    unit('bench', 'merc'),
    unit('foreign'),
    { ...pet, ownerId: 'enemy' },
    { ...pet, side: 'enemy' as const },
    { ...merc, life: 0 }
  ])
    expect(activeDruidAllyAuras(p, recipient, units)).toBeUndefined();
  expect(activeDruidAllyAuras(p, merc, new Map([['hero', { ...hero, life: 0 }]]))).toBeUndefined();
  expect(
    activeDruidAllyAuras(p, merc, new Map([['hero', { ...hero, kind: 'merc' }]]))
  ).toBeUndefined();
});
it('rejects malformed standalone authority without mutating it', () => {
  const p = composeDruidAllyAuras(native);
  if (!p) throw new Error('Missing projection');
  for (const patch of [
    { oakRank: 0 },
    { heartRank: 21 },
    { oakRank: NaN },
    { sourceHeroId: '' },
    { fieldedMercCombatId: 'hero' }
  ])
    expect(copyDruidAllyAuras({ ...p, ...patch })).toBeUndefined();
});
it.each(['oak', 'heart'] as const)('rejects changed authored coefficients for%s', (key) => {
  const changed = structuredClone(rows),
    row = changed.find(
      (row) =>
        row.id === (key === 'oak' ? 'skills-druid-oak-sage' : 'skills-druid-heart-of-wolverine')
    );
  if (!row?.scaling.passiveStatsPerLevel) throw new Error('Missing authored row');
  const stats = row.scaling.passiveStatsPerLevel;
  if ('lifePct' in stats) stats.lifePct = 0.99;
  else if ('attackPct' in stats) stats.attackPct = 0.99;
  expect(() => resolveDruidAllyAuraDefinitions(changed)).toThrow();
});
