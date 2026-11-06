/** BUG048: actual manual boss level must reach its authored equipment pool. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadTreasureClasses } from '@/data/loaders/loot';
import { DEFAULT_ELITE_CONFIG, resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
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
  it.each([
    [2, 'a2-tomb-of-tal-rasha', 32, 25600, 350, 280],
    [3, 'a3-durance-of-hate', 47, 33600, 300, 360],
    [4, 'a4-chaos-sanctuary', 61, 44800, 420, 460],
    [5, 'a5-throne-of-destruction', 82, 57600, 520, 560]
  ] as const)('preserves Act %i chapter boss scaling', (act, alias, level, hp, attack, defense) => {
    const subArea = required(resolveSubArea(act, alias));
    const plan = resolveChallengeWavePlan({ subArea,
      fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 1,
      seed: 1, challengeOrdinal: 0, mode: 'manual' });
    const boss = required(buildEnemiesForWave(required(plan.waves.at(-1)), 1)[0]);
    expect(boss).toMatchObject({ level, life: hp, stats: { lifeMax: hp, attack, defense } });
    expect(subArea.chapterBoss?.magicResist).toBeUndefined();
  });

  it.each([0, 1, 0xffffffff])('builds the reviewed Act I entry boss without altering its guards or identity (seed %i)', seed => {
    const subArea = required(resolveSubArea(1, 'a1-catacombs'));
    const chapterBoss = required(subArea.chapterBoss);
    const oldArea = { ...subArea, chapterBoss: {
      archetypeId: chapterBoss.archetypeId, hp: 2200, atk: 150, def: 200,
      skills: chapterBoss.skills, dropTable: chapterBoss.dropTable
    } };
    const options = { fallbackArchetypeId: 'monsters/act1.fallen', fallbackLevel: 1,
      seed, challengeOrdinal: 0, mode: 'manual' as const };
    const plan = resolveChallengeWavePlan({ ...options, subArea });
    const oldPlan = resolveChallengeWavePlan({ ...options, subArea: oldArea });
    expect(plan.waves.slice(0, -1)).toEqual(oldPlan.waves.slice(0, -1));
    const wave = required(plan.waves.at(-1));
    const oldWave = required(oldPlan.waves.at(-1));
    const boss = required(buildEnemiesForWave(wave, seed)[0]);
    const oldBoss = required(buildEnemiesForWave(oldWave, seed)[0]);
    expect(DEFAULT_ELITE_CONFIG.chapterBossHpMultiplier).toBe(8);
    expect(subArea.chapterBoss).toEqual({ archetypeId: 'monsters/act1.andariel',
      hp: 150, atk: 90, def: 40, magicResist: 15,
      skills: ['monster-poison-cloud'], dropTable: 'loot/act1-boss' });
    expect(boss).toMatchObject({ level: 19, life: 1200, tier: 'chapter-boss',
      kind: 'monster', stats: { lifeMax: 1200, attack: 90, defense: 40, magicResist: 15 } });
    expect(wave.lootTable).toBe('loot/act1-boss');
    expect(wave.spawns).toHaveLength(1);
    expect(boss.attackRange).toEqual([90, 90]);
    expect(oldBoss.attackRange).toEqual([150, 150]);
    // Reversing only the selected power fields recovers the old entire unit:
    // resistance, AS, dodge, skills, cooldowns, RNG-derived naming and ID stay intact.
    expect({ ...boss, life: oldBoss.life, attackRange: oldBoss.attackRange, stats: { ...boss.stats,
      life: oldBoss.stats.life, lifeMax: oldBoss.stats.lifeMax, attack: oldBoss.stats.attack,
      defense: oldBoss.stats.defense, magicResist: oldBoss.stats.magicResist } }).toEqual(oldBoss);
  });

  it('uses the real level19 chapter boss and its actual treasure class', () => {
    const wave = actualBossWave();
    expect(wave.lootTable).toBe('loot/act1-boss');
    const enemies = buildEnemiesForWave(wave, 1);
    expect(enemies).toHaveLength(1);
    expect(enemies[0]).toMatchObject({ level: 19, tier: 'chapter-boss', kind: 'monster' });
  });

  // D08/D05 finite pools also include the P15 earned bow/javelin sources.
  it.each([[8, 0], [9, 4], [10, 5], [12, 9], [14, 9], [19, 10], [20, 10], [39, 10], [40, 10], [59, 10], [60, 0]])(
    'admits %i-level equipment with exactly %i eligible authored rows', (level, count) => {
      const tc = required(loadTreasureClasses().get('loot/act1-boss'));
      expect(tc.picks.filter(pick => pick.type === 'item' &&
        level >= pick.qlvlMin && level <= pick.qlvlMax)).toHaveLength(count);
    });

  it('preserves the deferred rune cap and direct rewards outside the gear band', () => {
    const tc = required(loadTreasureClasses().get('loot/act1-boss'));
    const rune = required(tc.picks.find(pick => pick.type === 'rune'));
    expect([rune.qlvlMin, rune.qlvlMax]).toEqual([9, 18]);
    for (const level of [8, 60]) {
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
      'items/base/helm-skull-cap', 'items/base/weapon-bow',
      'items/base/wp1h-scimitar', 'items/base/sh-kite'
    ]);
    expect(new Set(reward.items.map(item => item.id)).size).toBe(4);
    for (const item of reward.items) {
      expect(item).toMatchObject({ rarity: 'rare', level: 19, ilvl: 19 });
      expect(item.id.length).toBeGreaterThan(0);
      const weapon = item.baseId === 'items/base/weapon-bow' || item.baseId === 'items/base/wp1h-scimitar';
      expect(required(weapon ? item.baseRolls?.attack : item.baseRolls?.defense)).toBeGreaterThan(0);
      expect(required(item.affixes).length).toBeGreaterThan(0);
      expect(item.uniqueId).toBeUndefined();
    }
    expect(useInventoryStore.getState().backpack).toEqual(reward.items);
    const exported = decodeSave(JSON.parse(required(exportCurrentSave())) as unknown);
    expect(exported.inventory.backpack).toEqual(reward.items);
  });
});
