import { replayProfiles } from '@/data/loaders/replay-profiles';
import { nativeMonsterStats } from '../combat/monster-factory';
import type { WavePlan } from '../combat/sub-area-run';
import type { ChapterBossDef } from '../types/maps';
import type { MonsterDef } from '../types/monsters';

export type ReplayProfileId = import('../types/save').NativeReplayProfileId;

/** Resolve a displayed or runtime monster level after all Normal planner adjustments. */
export function monsterLevelForReplay(normalLevel: number, profileId: ReplayProfileId): number {
  if (!Object.hasOwn(replayProfiles, profileId)) throw new RangeError('Unknown replay profile');
  const level = normalLevel + replayProfiles[profileId].monsterLevelOffset;
  if (!Number.isSafeInteger(normalLevel) || normalLevel < 1 || !Number.isSafeInteger(level)) {
    throw new RangeError('Invalid replay monster level');
  }
  return level;
}

/** Scale exact chapter anchors only by native level growth; construction applies its HP factor once. */
export function scaleChapterBossForReplay(boss: ChapterBossDef, def: MonsterDef, normalLevel: number,
  profileId: ReplayProfileId): ChapterBossDef {
  const level = monsterLevelForReplay(normalLevel, profileId);
  if (level === normalLevel) return boss;
  const from = nativeMonsterStats(def, normalLevel), to = nativeMonsterStats(def, level);
  const scale = (anchor: number, stat: keyof typeof from): number => {
    if (![anchor, from[stat], to[stat]].every(value => Number.isFinite(value) && value > 0)) {
      throw new RangeError('Invalid chapter replay progression');
    }
    const result = Math.round(anchor * to[stat] / from[stat]);
    if (!Number.isSafeInteger(result) || result < 1) throw new RangeError('Invalid scaled chapter stat');
    return result;
  };
  return { ...boss, hp: scale(boss.hp, 'life'), atk: scale(boss.atk, 'attack'), def: scale(boss.def, 'defense') };
}

/** Bind an immutable profile on a privately cloned plan without changing source manifests or loot. */
export function applyReplayProfileToPlan(plan: WavePlan, profileId: ReplayProfileId,
  monsters: ReadonlyMap<string, MonsterDef>): WavePlan {
  monsterLevelForReplay(1, profileId);
  if (profileId !== 'normal' && plan.questSourceProjection !== undefined) throw new Error('Quest projection requires Normal');
  const waves = plan.waves.map(wave => ({ ...wave, spawns: wave.spawns.map(spawn => {
    const level = monsterLevelForReplay(spawn.level, profileId);
    if (!spawn.chapterBoss) return { ...spawn, level };
    const def = monsters.get(spawn.archetypeId);
    if (!def) throw new Error('Unknown chapter archetype');
    return { ...spawn, level, chapterBoss: scaleChapterBossForReplay(spawn.chapterBoss, def, spawn.level, profileId) };
  }) }));
  const bound = structuredClone({ ...plan, waves });
  Object.defineProperty(bound, 'replayProfileId', { value: profileId, enumerable: true, writable: false, configurable: false });
  return bound;
}
