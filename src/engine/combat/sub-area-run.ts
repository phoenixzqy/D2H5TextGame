/**
 * Wave-plan resolution for sub-area runs.
 *
 * Translates a {@link SubAreaDef} (from `src/data/maps/sub-areas/*.json`)
 * into an ordered list of {@link WaveSpec}s the combat layer can execute.
 * If the sub-area has no waves (legacy / synthetic alias), a sane default
 * `trash → trash → elite → boss` plan is emitted.
 *
 * Spawn-count randomization (Bug C):
 *   - Per-monster `count` is treated as a hard count (`countMin = countMax`).
 *   - Per-monster `countMin`/`countMax` overrides give the JSON author
 *     direct control over the rolled range.
 *   - When neither is provided (synthetic plans, legacy data) the wave's
 *     tier picks a sensible default range — trash 3–8, elite 1–3, boss 1.
 *   - All counts are globally capped at {@link MAX_SPAWNS_PER_WAVE} (=20)
 *     for UI/perf safety.
 *   - Randomness flows through a seeded {@link Rng} threaded from the
 *     run's seed, so identical seeds yield identical plans (no
 *     `Math.random()` per repo policy).
 *
 * @module engine/combat/sub-area-run
 */

import type {
  SubAreaDef,
  WaveDef,
  Encounter
} from '../types/maps';
import defaultEliteConfigJson from '../../data/elite/elite-config.json';
import type { MonsterTier } from './types';
import type { Rng } from '../rng';
import { createRng } from '../rng';
import { scaleMonsterLevelForArea } from './monster-factory';
import type { ChapterBossDef } from '../types/maps';
import type { EliteAffixDef, EliteConfigDef } from '../types/elite';

export const DEFAULT_ELITE_CONFIG = defaultEliteConfigJson as EliteConfigDef;

/** Per-monster spawn directive resolved from a wave/encounter. */
export interface MonsterSpawn {
  readonly archetypeId: string;
  readonly tier: MonsterTier;
  readonly level: number;
  /** Per-archetype 0-based index inside this wave (for naming). */
  readonly index: number;
  /** Elite affix shared by champion / rare packs. */
  readonly eliteAffix?: EliteAffixDef;
  /** Chapter-boss stat override payload. */
  readonly chapterBoss?: ChapterBossDef;
}

/** Resolved spec for a single wave inside a sub-area run. */
export interface WaveSpec {
  readonly id: string;
  /** Wave-level tier label (largely informational). */
  readonly waveTier: WaveDef['type'];
  /** Spawn list, already index-tagged for naming. */
  readonly spawns: readonly MonsterSpawn[];
  /** Optional loot-table override (per-wave) inherited from JSON. */
  readonly lootTable?: string;
  /** Boss intro cue for UI/log playback. */
  readonly bossIntro?: {
    readonly bossArchetypeId: string;
  };
}

/** Full ordered wave plan for a sub-area run. */
export interface WavePlan {
  readonly subAreaId: string;
  readonly waves: readonly WaveSpec[];
  /** Sub-area loot table (used when a wave doesn't override it). */
  readonly defaultLootTable: string;
}

/** Hard global cap for spawn counts per wave (UI/perf safety). */
export const MAX_SPAWNS_PER_WAVE = 20;

/**
 * Default fall-back plan for sub-areas with no wave data. Mirrors the
 * roguelike structure described in Diablo2TextGame.md §7.1. Now uses
 * count ranges that {@link encountersToSpawns}-style code rolls per run.
 */
export const DEFAULT_FALLBACK_PLAN: readonly {
  readonly tier: WaveDef['type'];
  readonly countMin: number;
  readonly countMax: number;
}[] = [
  { tier: 'trash', countMin: 3, countMax: 8 },
  { tier: 'trash', countMin: 3, countMax: 8 },
  { tier: 'elite', countMin: 1, countMax: 3 },
  { tier: 'boss', countMin: 1, countMax: 1 }
];

/** Default count range for an unspecified per-monster spawn entry. */
export function defaultCountRange(waveTier: WaveDef['type']): readonly [number, number] {
  switch (waveTier) {
    case 'boss':
      return [1, 1];
    case 'elite':
      return [1, 3];
    case 'trash':
    default:
      return [3, 8];
  }
}

/**
 * Build a {@link WavePlan} from the canonical {@link SubAreaDef} JSON.
 *
 * - Skips waves that resolve to zero spawns (e.g. shrine/treasure waves
 *   without monster encounters).
 * - When `subArea.hasBoss === true` and the last wave is **not** a boss
 *   wave, the boss encounter is appended as an extra `boss` wave.
 * - When the resulting plan would be empty, the synthetic default plan is
 *   returned instead so combat still has something to do.
 *
 * @param subArea data-driven sub-area definition
 * @param fallbackArchetypeId archetype id used by the synthetic default plan
 *   (should be a stable monster id present in `monsters/actN.json`).
 * @param fallbackLevel level used by the synthetic default plan.
 * @param seed optional run seed; threaded through encounter rolls so the
 *   same seed yields the same wave plan. Defaults to a fixed value to
 *   preserve pre-Bug-C behaviour for callers who haven't been updated.
 */
export function resolveWavePlan(
  subArea: SubAreaDef,
  fallbackArchetypeId: string,
  fallbackLevel: number,
  seed?: number,
  eliteConfig: EliteConfigDef = DEFAULT_ELITE_CONFIG
): WavePlan {
  const rng = createRng((seed ?? 0) >>> 0);
  const shouldRollRandomElites = seed !== undefined;
  const out: WaveSpec[] = [];
  const baseLevel = findSubAreaBaseLevel(subArea);

  for (const wave of subArea.waves) {
    const baseSpawns = encountersToSpawns(wave.encounters ?? [], wave.type, rng, subArea.areaLevel, baseLevel);
    if (baseSpawns.length === 0) continue;
    const spawns = shouldRollRandomElites && wave.type === 'trash'
      ? maybeReplaceTrashWithElite(baseSpawns, rng, eliteConfig)
      : baseSpawns;
    out.push({
      id: wave.id,
      waveTier: wave.type,
      spawns,
      ...(wave.lootTable !== undefined ? { lootTable: wave.lootTable } : {})
    });
  }

  if (subArea.hasBoss && subArea.bossEncounter) {
    const lastIsBoss = out.length > 0 && out[out.length - 1]?.waveTier === 'boss';
    if (!lastIsBoss) {
      const spawns = encountersToSpawns([subArea.bossEncounter], 'boss', rng, subArea.areaLevel, baseLevel);
      if (spawns.length > 0) {
        out.push({
          id: `${subArea.id}-boss`,
          waveTier: 'boss',
          spawns
        });
      }
    }
  }

  if (subArea.chapterBoss) {
    const chapterWave = chapterBossWave(subArea.id, subArea.chapterBoss, scaleMonsterLevelForArea(fallbackLevel, subArea.areaLevel, baseLevel));
    if (out.length === 0) out.push(chapterWave);
    else out[out.length - 1] = chapterWave;
  }

  if (out.length === 0) {
    return synthDefaultPlan(subArea, fallbackArchetypeId, fallbackLevel, seed ?? 0);
  }

  return {
    subAreaId: subArea.id,
    waves: out,
    defaultLootTable: subArea.lootTable
  };
}

function findSubAreaBaseLevel(subArea: SubAreaDef): number {
  const levels: number[] = [];
  for (const wave of subArea.waves) {
    for (const encounter of wave.encounters ?? []) {
      levels.push(encounter.level);
    }
  }
  if (subArea.bossEncounter) levels.push(subArea.bossEncounter.level);
  return levels.length > 0 ? Math.min(...levels) : subArea.areaLevel;
}

function maybeReplaceTrashWithElite(
  baseSpawns: readonly MonsterSpawn[],
  rng: Rng,
  config: EliteConfigDef
): readonly MonsterSpawn[] {
  const trash = baseSpawns.filter((s) => s.tier === 'trash');
  if (trash.length === 0) return baseSpawns;

  const affix = rng.pick(config.affixes);
  const leader = rng.pick(trash);
  if (rng.chance(config.normalRareEliteChance)) {
    return buildRareElitePack(leader, affix);
  }
  if (rng.chance(config.normalChampionChance)) {
    return [{ ...leader, tier: 'champion', index: 0, eliteAffix: affix }];
  }
  return baseSpawns;
}

function buildRareElitePack(leader: MonsterSpawn, affix: EliteAffixDef): readonly MonsterSpawn[] {
  const pack: MonsterSpawn[] = [
    { ...leader, tier: 'rare-elite', index: 0, eliteAffix: affix }
  ];
  for (let i = 1; i <= 3; i++) {
    pack.push({ ...leader, tier: 'rare-minion', index: i, eliteAffix: affix });
  }
  return pack;
}

function chapterBossWave(
  subAreaId: string,
  boss: ChapterBossDef,
  fallbackLevel: number
): WaveSpec {
  const spawn: MonsterSpawn = {
    archetypeId: boss.archetypeId,
    tier: 'chapter-boss',
    level: fallbackLevel,
    index: 0,
    chapterBoss: boss
  };
  return {
    id: `${subAreaId}-chapter-boss`,
    waveTier: 'boss',
    spawns: [spawn],
    lootTable: boss.dropTable,
    bossIntro: { bossArchetypeId: boss.archetypeId }
  };
}

/**
 * Build a synthetic default wave plan keyed off a single archetype. Used
 * when a sub-area has no usable wave data.
 */
export function synthDefaultPlan(
  subArea: Pick<SubAreaDef, 'id' | 'lootTable' | 'areaLevel'>,
  archetypeId: string,
  level: number,
  seed = 0
): WavePlan {
  const rng = createRng(seed >>> 0);
  const waves: WaveSpec[] = DEFAULT_FALLBACK_PLAN.map((entry, waveIdx) => {
    const tier: MonsterTier =
      entry.tier === 'boss'
        ? 'boss'
        : entry.tier === 'elite'
          ? 'elite'
          : 'trash';
    const count = clampSpawn(rng.nextInt(entry.countMin, entry.countMax));
    const spawns: MonsterSpawn[] = [];
    for (let i = 0; i < count; i++) {
      const effectiveLevel = scaleMonsterLevelForArea(level, subArea.areaLevel, subArea.areaLevel);
      spawns.push({ archetypeId, tier, level: effectiveLevel, index: i });
    }
    return {
      id: `${subArea.id}-w${String(waveIdx + 1)}`,
      waveTier: entry.tier,
      spawns
    };
  });
  return {
    subAreaId: subArea.id,
    waves,
    defaultLootTable: subArea.lootTable
  };
}

/** Clamp a rolled count to `[1, MAX_SPAWNS_PER_WAVE]`. */
function clampSpawn(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > MAX_SPAWNS_PER_WAVE) return MAX_SPAWNS_PER_WAVE;
  return Math.floor(n);
}

/**
 * Convert raw encounter entries into a flat, name-indexed spawn list.
 * Tier comes from per-monster `elite`/`boss` flags first, then falls back
 * to the wave-level tier.
 *
 * Count resolution per monster entry:
 *   - Both `countMin` and `countMax` present → roll uniform in
 *     `[min, max]` via `rng`.
 *   - Only `count` present → fixed (back-compat).
 *   - Neither → roll using the wave-tier default range
 *     (see {@link defaultCountRange}).
 *
 * The cumulative wave size is capped at {@link MAX_SPAWNS_PER_WAVE}.
 */
export function encountersToSpawns(
  encounters: readonly Encounter[],
  waveTier: WaveDef['type'],
  rng?: Rng,
  areaLevel?: number,
  baseLevel?: number
): MonsterSpawn[] {
  const out: MonsterSpawn[] = [];
  const perArchetypeIdx = new Map<string, number>();
  let total = 0;

  for (const enc of encounters) {
    for (const m of enc.monsters) {
      if (total >= MAX_SPAWNS_PER_WAVE) break;
      const tier: MonsterTier = m.boss
        ? 'boss'
        : m.elite
          ? 'elite'
          : waveTier === 'boss'
            ? 'boss'
            : waveTier === 'elite'
              ? 'elite'
              : 'trash';

      let rolled: number;
      if (m.countMin !== undefined && m.countMax !== undefined) {
        const lo = Math.max(1, Math.floor(m.countMin));
        const hi = Math.max(lo, Math.floor(m.countMax));
        rolled = rng ? rng.nextInt(lo, hi) : lo;
      } else if (m.count !== undefined) {
        rolled = Math.max(1, Math.floor(m.count));
      } else {
        const [lo, hi] = defaultCountRange(waveTier);
        rolled = rng ? rng.nextInt(lo, hi) : lo;
      }
      rolled = clampSpawn(rolled);
      // Respect global per-wave cap.
      if (total + rolled > MAX_SPAWNS_PER_WAVE) {
        rolled = MAX_SPAWNS_PER_WAVE - total;
      }
      for (let i = 0; i < rolled; i++) {
        const idx = perArchetypeIdx.get(m.archetypeId) ?? 0;
        perArchetypeIdx.set(m.archetypeId, idx + 1);
        out.push({
          archetypeId: m.archetypeId,
          tier,
          level: areaLevel === undefined || baseLevel === undefined
            ? enc.level
            : scaleMonsterLevelForArea(enc.level, areaLevel, baseLevel),
          index: idx
        });
      }
      total += rolled;
    }
    if (total >= MAX_SPAWNS_PER_WAVE) break;
  }
  return out;
}
