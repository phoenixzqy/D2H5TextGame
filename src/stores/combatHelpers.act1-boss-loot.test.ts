/** BUG048: actual manual boss level must reach its authored equipment pool. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadTreasureClasses } from '@/data/loaders/loot';
import { resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { decodeSave } from '@/engine/save/validate';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { awardLootForVictory, buildEnemiesForWave } from './combatHelpers';
import { useFormationStore } from './formationStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { exportCurrentSave, __resetPersistenceForTests } from './persistence';
import { usePlayerStore } from './playerStore';
import { resolveSubArea } from './subAreaResolver';

function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Missing real data');
  return value;
}
function reset(): void {
  __resetPersistenceForTests();
  for (const store of [useFormationStore, useInventoryStore, useMapStore,
    useMercStore, useMetaStore, usePlayerStore]) store.getState().reset();
}
beforeEach(reset);
afterEach(reset);

function actualBossWave() {
  const subArea = required(resolveSubArea(1, 'a1-catacombs'));
  const plan = resolveChallengeWavePlan({ subArea,
    fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 1,
    seed: 1, challengeOrdinal: 0, mode: 'manual' });
  return required(plan.waves.find(wave => wave.presentation?.isActBoss));
}

describe('Act I manual chapter-boss equipment eligibility', () => {
  it('uses the real level19 chapter boss and its actual treasure class', () => {
    const wave = actualBossWave();
    expect(wave.lootTable).toBe('loot/act1-boss');
    const enemies = buildEnemiesForWave(wave, 1);
    expect(enemies).toHaveLength(1);
    expect(enemies[0]).toMatchObject({ level: 19, tier: 'chapter-boss', kind: 'monster' });
  });

  it.each([[8, 0], [9, 4], [10, 5], [12, 7], [14, 7], [19, 7], [20, 0]])(
    'admits %i-level equipment with exactly %i eligible authored rows', (level, count) => {
      const tc = required(loadTreasureClasses().get('loot/act1-boss'));
      expect(tc.picks.filter(pick => pick.type === 'item' &&
        level >= pick.qlvlMin && level <= pick.qlvlMax)).toHaveLength(count);
    });

  it('preserves the deferred rune cap and direct rewards outside the gear band', () => {
    const tc = required(loadTreasureClasses().get('loot/act1-boss'));
    const rune = required(tc.picks.find(pick => pick.type === 'rune'));
    expect([rune.qlvlMin, rune.qlvlMax]).toEqual([9, 18]);
    for (const level of [8, 20]) {
      expect(tc.picks.filter(pick => level >= pick.qlvlMin && level <= pick.qlvlMax)
        .map(pick => pick.type)).toEqual(['gem', 'currency', 'gold']);
    }
  });

  it('awards the source-derived seed1 gear through real stores and export after a synthetic kill', () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('BossLoot', 'sorceress'));
    const wave = actualBossWave();
    // Deliberate reward-boundary fixture: this does not simulate or prove victory.
    const slainEnemies = buildEnemiesForWave(wave, 1).map(enemy => ({ ...enemy, life: 0 }));
    const reward = awardLootForVictory({ slainEnemies, act: 1,
      treasureClassId: required(wave.lootTable), seed: 1 });
    expect(reward.items.map(item => item.baseId)).toEqual([
      'items/base/helm-skull-cap', 'items/base/amu-brass',
      'items/base/sh-kite', 'items/base/sh-kite'
    ]);
    expect(new Set(reward.items.map(item => item.id)).size).toBe(4);
    for (const item of reward.items) {
      expect(item).toMatchObject({ rarity: 'rare', level: 19, ilvl: 19 });
      expect(item.id.length).toBeGreaterThan(0);
      if (item.baseId === 'items/base/amu-brass') expect(item.baseRolls).toEqual({});
      else expect(required(item.baseRolls?.defense)).toBeGreaterThan(0);
      expect(required(item.affixes).length).toBeGreaterThan(0);
      expect(item.uniqueId).toBeUndefined();
    }
    expect(useInventoryStore.getState().backpack).toEqual(reward.items);
    const exported = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(exported.inventory.backpack).toEqual(reward.items);
  });
});
