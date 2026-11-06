import { describe, expect, it } from 'vitest';
import { monsters, subAreas } from '@/data';
import { loadAwardPools, loadTreasureClasses } from '@/data/loaders/loot';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { applyReplayProfileToPlan } from '../map/replay-profile';
import { createRng } from '../rng';
import { rollKillRewards } from './award';
import type { TreasureClass } from './drop-roller';

// D08 continuous envelopes include every authored Normal level and +40 Hell replay.
// Intermediate levels are deliberately checked even when not currently spawned.
const domains = [
  ['trash-act1', 2, 38], ['mini-act1', 7, 32], ['act1-boss', 19, 39],
  ['trash-act2', 14, 51], ['mini-act2', 22, 48], ['act2-boss', 32, 52],
  ['trash-act3', 27, 66], ['mini-act3', 36, 63], ['act3-boss', 47, 67],
  ['trash-act4', 42, 81], ['mini-act4', 49, 76], ['act4-boss', 61, 81],
  ['trash-act5', 56, 102], ['mini-act5', 60, 95], ['act5-boss', 82, 102]
] as const;
const tables = loadTreasureClasses();
const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
const eligible = (table: TreasureClass, level: number) => table.picks.filter(pick =>
  pick.type === 'item' && pick.weight > 0 && level >= pick.qlvlMin && level <= pick.qlvlMax);

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing actual campaign content');
  return value;
}

describe('BUG152 campaign and replay equipment eligibility', () => {
  it.each(domains)('%s has equipment throughout its finite level domain %i–%i', (id, min, max) => {
    const table = required(tables.get(`loot/${id}`));
    for (let level = min; level <= max + 20; level++) {
      expect(eligible(table, level).length, `${id}/L${String(level)}`).toBeGreaterThan(0);
    }
    expect(eligible(table, max + 21)).toEqual([]);
  });

  it.each(['manual', 'idle'] as const)('covers actual Normal, Nightmare and Hell plans across all areas (%s)', mode => {
    const observedTables = new Set<string>();
    expect(subAreas).toHaveLength(29);
    for (const subArea of subAreas) {
      // All13 count residues (8–20), two seeds, and both idle pity endpoints.
      // Promotions and affix selection do not alter spawn levels.
      for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
        for (const seed of [0, 3286157777]) for (const idleEliteMisses of [0, 100]) {
          const normal = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: required(monsters[0]).id,
            fallbackLevel: subArea.areaLevel, seed, challengeOrdinal, mode, idleEliteMisses });
          for (const profile of ['normal', 'nightmare', 'hell'] as const) {
            const plan = applyReplayProfileToPlan(normal, profile, monsterIndex);
            for (const wave of plan.waves) {
              const id = wave.lootTable ?? plan.defaultLootTable;
              const table = required(tables.get(id));
              observedTables.add(id);
              for (const spawn of wave.spawns) {
                expect(eligible(table, spawn.level).length,
                  `${subArea.id}/${wave.id}/${profile}/L${String(spawn.level)}`).toBeGreaterThan(0);
              }
            }
          }
        }
      }
    }
    for (const [id] of domains) expect(observedTables.has(`loot/${id}`)).toBe(true);
  });

  it.each(domains)('%s materializes equipment at the actual Nightmare ceiling%i/%i', (id, _min, max) => {
    const actMatch = /act([1-5])/.exec(id);
    const act = Number(required(actMatch?.[1])) as 1 | 2 | 3 | 4 | 5;
    const rng = createRng(3286157777), pools = loadAwardPools();
    // Isolated reward-boundary calls, not earned wins. Native pick/noDrop policy.
    const items = Array.from({ length: 8 }, () => rollKillRewards({ act, difficulty: 'nightmare',
      monsterLevel: max, tier: 'chapter-boss', treasureClassId: `loot/${id}`,
      magicFind: 0, goldFind: 0 }, pools, rng).items).flat();
    expect(items.length).toBeGreaterThan(0);
    // D09 adds guarantee sources and replaces configured live-boss ordinary
    // picks with offset trash / terminal-cap jewelry projections. Calculate
    // their eligibility independently of the production projection helper.
    const ordinaryGroups = pools.chapterBossEquipment?.get(`loot/${id}`)?.groups ?? [];
    const sourceIds = new Set([...(ordinaryGroups.length === 0 ? [`loot/${id}`] : []),
      ...(pools.equipmentGuarantees?.get(`loot/${id}`) ?? []).map(rule => rule.sourceTableId)]);
    const projectedBases = ordinaryGroups.flatMap(group => {
      const equipment = required(tables.get(group.sourceTableId)).picks.filter(pick => pick.type === 'item');
      const terminal = Math.max(...equipment.map(pick => pick.qlvlMax));
      return equipment.filter(pick => pick.weight > 0 && max >= pick.qlvlMin + group.minimumLevelOffset &&
        max <= (pick.qlvlMax === terminal ? group.terminalLevelCap : pick.qlvlMax)).map(pick => pick.baseId);
    });
    const allowedBases = [...projectedBases,
      ...[...sourceIds].flatMap(source => eligible(required(tables.get(source)), max).map(pick => pick.baseId))];
    for (const item of items) {
      expect(allowedBases).toContain(item.baseId);
      expect(item.ilvl).toBe(max);
      expect(pools.bases.has(item.baseId)).toBe(true);
    }
    expect(new Set(items.map(item => item.id)).size).toBe(items.length);
  });
});
