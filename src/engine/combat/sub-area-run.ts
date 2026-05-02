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
  Encounter,
  WaveKind
} from '../types/maps';
import defaultEliteConfigJson from '../../data/elite/elite-config.json';
import type { MonsterTier } from './types';
import type { Rng } from '../rng';
import { createRng } from '../rng';
import { scaleMonsterLevelForArea } from './monster-factory';
import type { ChapterBossDef } from '../types/maps';
import type { EliteAffixDef, EliteConfigDef } from '../types/elite';
import { resolveIdleEncounter } from '../idle/online-tick';

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

export interface WavePresentation {
  readonly kind: WaveKind;
  readonly isForcedElite?: boolean;
  readonly isIdleElite?: boolean;
  readonly forcedEliteKind?: 'champion' | 'rareElite';
  readonly idleEliteMissesAfterWave?: number;
  readonly isActBoss?: boolean;
  readonly difficultyBand?: 'normal' | 'hard' | 'finale';
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
  /** Transient UI/debug metadata for the current wave. */
  readonly presentation?: WavePresentation;
}

export interface DifficultyContext {
  readonly areaLevel: number;
  readonly monsterLevelBonus: number;
  readonly finaleBand: 'none' | 'penultimate' | 'final';
}

/** Full ordered wave plan for a sub-area run. */
export interface WavePlan {
  readonly subAreaId: string;
  readonly waves: readonly WaveSpec[];
  /** Sub-area loot table (used when a wave doesn't override it). */
  readonly defaultLootTable: string;
  readonly mode?: 'manual' | 'idle' | 'legacy' | 'synthetic';
  readonly seed?: number;
  readonly difficulty?: DifficultyContext;
}

export interface ResolveChallengeWavePlanInput {
  readonly subArea: SubAreaDef;
  readonly fallbackArchetypeId: string;
  readonly fallbackLevel: number;
  readonly seed: number;
  readonly challengeOrdinal: number;
  readonly mode?: 'manual' | 'idle';
  readonly idleEliteMisses?: number;
  readonly eliteConfig?: EliteConfigDef;
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

const DEFAULT_CHALLENGE_ROTATION: readonly WaveKind[] = ['trash', 'trash', 'elite', 'trash'];
const DEFAULT_CHALLENGE_MIN_MONSTERS = 8;
const DEFAULT_CHALLENGE_MAX_MONSTERS = 20;
const IDLE_CHALLENGE_TICK_STRIDE = 20;
const DEFAULT_FINAL_ELITE_WAVES = 2;

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

/**
 * Build the manual map-challenge plan requested by the combat redesign.
 *
 * Manual challenges preserve the authored map wave structure, cycle each
 * authored/fallback non-boss wave to 8-20 monsters, force the final two non-boss
 * waves into elite guards, then append an authored map boss / chapter boss
 * after those guards when present.
 */
export function resolveChallengeWavePlan(input: ResolveChallengeWavePlanInput): WavePlan {
  const { subArea, fallbackArchetypeId, fallbackLevel, seed } = input;
  const eliteConfig = input.eliteConfig ?? DEFAULT_ELITE_CONFIG;
  const rng = createRng(seed >>> 0);
  const difficulty = resolveDifficultyContext(subArea);
  const baseLevel = findSubAreaBaseLevel(subArea);
  const templates = challengeWaveTemplates(subArea, fallbackArchetypeId, fallbackLevel);
  const out: WaveSpec[] = [];
  const finalEliteWaves = subArea.challenge?.manualFinalEliteWaves ?? DEFAULT_FINAL_ELITE_WAVES;
  const mode = input.mode ?? 'manual';
  let idleEliteMisses = input.idleEliteMisses ?? 0;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    if (!template) continue;
    const forcedEliteIndex = i >= templates.length - finalEliteWaves;
    const sourceKind = template.type === 'elite' ? 'elite' : 'trash';
    const waveKind: WaveKind = forcedEliteIndex ? 'elite' : sourceKind;
    const targetMonsterCount = resolveChallengeMonsterCount(subArea, input.challengeOrdinal, i);
    const effectiveAreaLevel = difficulty.areaLevel + waveLevelOffset(i, templates.length);
    const sourceEncounters = template.encounters ?? [
      fallbackEncounter(fallbackArchetypeId, fallbackLevel)
    ];
    const baseSpawns = encountersToSpawns(
      sourceEncounters,
      waveKind,
      rng,
      effectiveAreaLevel,
      baseLevel
    );
    const forcedEliteKind = forcedEliteIndex && i === templates.length - 1 ? 'rareElite' : 'champion';
    let spawns = forcedEliteIndex
      ? forceElitePack(baseSpawns, rng, eliteConfig, forcedEliteKind, targetMonsterCount)
      : fitSpawnsToMonsterCount(baseSpawns, targetMonsterCount);
    let isIdleElite = false;
    let idleEliteMissesAfterWave: number | undefined;
    if (mode === 'idle' && !forcedEliteIndex && waveKind === 'trash') {
      const idleEncounter = resolveIdleEncounter({
        subArea,
        act: actNumberFromSubArea(subArea),
        tickIndex: input.challengeOrdinal * IDLE_CHALLENGE_TICK_STRIDE + i,
        seed,
        playerLevel: fallbackLevel,
        eliteMisses: idleEliteMisses,
        eliteConfig,
        fallbackArchetypeId
      });
      idleEliteMisses = idleEncounter.nextEliteMisses;
      idleEliteMissesAfterWave = idleEliteMisses;
      if (idleEncounter.monsterTier === 'champion' || idleEncounter.monsterTier === 'rare-elite') {
        isIdleElite = true;
        spawns = forceElitePack(
          baseSpawns,
          rng,
          eliteConfig,
          idleEncounter.monsterTier === 'rare-elite' ? 'rareElite' : 'champion',
          targetMonsterCount
        );
      }
    }
    if (spawns.length === 0) continue;
    out.push({
      id: `${subArea.id}-challenge-w${String(i + 1)}`,
      waveTier: isIdleElite ? 'elite' : waveKind,
      spawns,
      ...(template.lootTable !== undefined ? { lootTable: template.lootTable } : {}),
      presentation: {
        kind: isIdleElite ? 'elite' : waveKind,
        ...(forcedEliteIndex ? { isForcedElite: true, forcedEliteKind } : {}),
        ...(isIdleElite ? { isIdleElite: true } : {}),
        ...(idleEliteMissesAfterWave !== undefined ? { idleEliteMissesAfterWave } : {}),
        difficultyBand: difficultyBandForUi(difficulty.finaleBand)
      }
    });
  }

  if (subArea.bossEncounter && !subArea.chapterBoss) {
    const bossSpawns = encountersToSpawns(
      [subArea.bossEncounter],
      'boss',
      rng,
      difficulty.areaLevel + 3,
      baseLevel
    );
    if (bossSpawns.length > 0) {
      out.push({
        id: `${subArea.id}-boss`,
        waveTier: 'boss',
        spawns: bossSpawns,
        presentation: {
          kind: 'boss',
          difficultyBand: difficultyBandForUi(difficulty.finaleBand)
        }
      });
    }
  } else if (!subArea.chapterBoss) {
    const authoredBoss = subArea.waves.find((w) => w.type === 'boss' && (w.encounters?.length ?? 0) > 0);
    if (authoredBoss?.encounters) {
      const bossSpawns = encountersToSpawns(
        authoredBoss.encounters,
        'boss',
        rng,
        difficulty.areaLevel + 3,
        baseLevel
      );
      if (bossSpawns.length > 0) {
        out.push({
          id: `${subArea.id}-boss`,
          waveTier: 'boss',
          spawns: bossSpawns,
          ...(authoredBoss.lootTable !== undefined ? { lootTable: authoredBoss.lootTable } : {}),
          presentation: {
            kind: 'boss',
            difficultyBand: difficultyBandForUi(difficulty.finaleBand)
          }
        });
      }
    }
  }

  if (subArea.chapterBoss) {
    out.push(chapterBossWave(
      subArea.id,
      subArea.chapterBoss,
      Math.max(1, subArea.areaLevel + difficulty.monsterLevelBonus + 5),
      difficultyBandForUi(difficulty.finaleBand)
    ));
  }

  if (out.length === 0) {
    return synthDefaultPlan(subArea, fallbackArchetypeId, fallbackLevel, seed);
  }

  return {
    subAreaId: subArea.id,
    waves: out,
    defaultLootTable: subArea.lootTable,
    mode,
    seed,
    difficulty
  };
}

function actNumberFromSubArea(subArea: SubAreaDef): 1 | 2 | 3 | 4 | 5 {
  const match = /act([1-5])/.exec(subArea.actId);
  return (match?.[1] ? Number(match[1]) : 1) as 1 | 2 | 3 | 4 | 5;
}

function resolveDifficultyContext(subArea: SubAreaDef): DifficultyContext {
  const finaleBand = subArea.difficulty?.finaleBand ?? 'none';
  const monsterLevelBonus = subArea.difficulty?.monsterLevelBonus ?? 0;
  return {
    areaLevel: subArea.areaLevel + monsterLevelBonus,
    monsterLevelBonus,
    finaleBand
  };
}

function challengeWaveTemplates(
  subArea: SubAreaDef,
  fallbackArchetypeId: string,
  fallbackLevel: number
): readonly WaveDef[] {
  const authored = subArea.waves.filter((w) => w.type !== 'boss' && (w.encounters?.length ?? 0) > 0);
  if (authored.length > 0) return authored;

  const rotation = resolveChallengeRotation(subArea);
  const fallbackCount = subArea.hasBoss || subArea.chapterBoss ? 5 : 3;
  return Array.from({ length: fallbackCount }, (_, i): WaveDef => ({
    id: `${subArea.id}-fallback-w${String(i + 1)}`,
    type: rotation[i % rotation.length] === 'elite' ? 'elite' : 'trash',
    encounters: [fallbackEncounter(fallbackArchetypeId, fallbackLevel)]
  }));
}

function resolveChallengeMonsterCount(
  subArea: SubAreaDef,
  challengeOrdinal: number,
  waveIndex: number
): number {
  const min = clampMonsterCount(subArea.challenge?.monsterCount.min ?? DEFAULT_CHALLENGE_MIN_MONSTERS);
  const max = clampMonsterCount(subArea.challenge?.monsterCount.max ?? DEFAULT_CHALLENGE_MAX_MONSTERS);
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = hi - lo + 1;
  return lo + ((Math.max(0, Math.floor(challengeOrdinal)) + waveIndex) % span);
}

function resolveChallengeRotation(subArea: SubAreaDef): readonly WaveKind[] {
  const rotation = subArea.challenge?.rotation;
  if (!rotation || rotation.length === 0) return DEFAULT_CHALLENGE_ROTATION;
  return rotation;
}

function clampMonsterCount(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_CHALLENGE_MIN_MONSTERS;
  return Math.min(DEFAULT_CHALLENGE_MAX_MONSTERS, Math.max(DEFAULT_CHALLENGE_MIN_MONSTERS, Math.floor(n)));
}

function waveLevelOffset(index: number, total: number): number {
  if (total <= 1) return 0;
  return Math.floor((3 * index) / (total - 1));
}

function difficultyBandForUi(finaleBand: DifficultyContext['finaleBand']): NonNullable<WavePresentation['difficultyBand']> {
  if (finaleBand === 'final') return 'finale';
  if (finaleBand === 'penultimate') return 'hard';
  return 'normal';
}

function fallbackEncounter(archetypeId: string, level: number): Encounter {
  return {
    id: 'fallback',
    level,
    monsters: [{ archetypeId }]
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

function forceElitePack(
  baseSpawns: readonly MonsterSpawn[],
  rng: Rng,
  config: EliteConfigDef,
  forcedEliteKind: 'champion' | 'rareElite',
  targetCount: number
): readonly MonsterSpawn[] {
  const leader = baseSpawns.find((s) => s.tier === 'trash' || s.tier === 'elite') ?? baseSpawns[0];
  if (!leader) return baseSpawns;
  const affix = rng.pick(config.affixes);
  if (forcedEliteKind === 'rareElite') {
    const count = clampSpawn(targetCount);
    const pack: MonsterSpawn[] = [{ ...leader, tier: 'rare-elite', index: 0, eliteAffix: affix }];
    for (let i = 1; i < count; i++) {
      const source = baseSpawns[i % baseSpawns.length] ?? leader;
      pack.push({ ...source, tier: 'rare-minion', index: i, eliteAffix: affix });
    }
    return pack;
  }
  return fitSpawnsToMonsterCount(
    baseSpawns.map((spawn) => ({ ...spawn, tier: 'champion' as const, eliteAffix: affix })),
    targetCount
  );
}

function chapterBossWave(
  subAreaId: string,
  boss: ChapterBossDef,
  fallbackLevel: number,
  difficultyBand?: WavePresentation['difficultyBand']
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
    bossIntro: { bossArchetypeId: boss.archetypeId },
    presentation: {
      kind: 'boss',
      isActBoss: true,
      ...(difficultyBand ? { difficultyBand } : {})
    }
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

function fitSpawnsToMonsterCount(
  spawns: readonly MonsterSpawn[],
  targetCount: number
): readonly MonsterSpawn[] {
  if (spawns.length === 0) return spawns;
  const count = clampSpawn(targetCount);
  const out: MonsterSpawn[] = [];
  const perArchetypeIdx = new Map<string, number>();

  for (let i = 0; i < count; i++) {
    const source = spawns[i % spawns.length];
    if (!source) continue;
    const idx = perArchetypeIdx.get(source.archetypeId) ?? 0;
    perArchetypeIdx.set(source.archetypeId, idx + 1);
    out.push({ ...source, index: idx });
  }

  return out;
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
