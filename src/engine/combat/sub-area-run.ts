/**
 * Wave-plan resolution for sub-area runs.
 *
 * Translates a {@link SubAreaDef} (from `src/data/maps/sub-areas/*.json`)
 * into an ordered list of {@link WaveSpec}s the combat layer can execute.
 * If the sub-area has no waves (legacy / synthetic alias), a sane default
 * `trash → trash → elite → boss` plan is emitted.
 *
 * Pure: no React/DOM and no RNG (RNG only enters at monster build time).
 *
 * @module engine/combat/sub-area-run
 */

import type {
  SubAreaDef,
  WaveDef,
  Encounter
} from '../types/maps';
import type { MonsterTier } from './types';

/** Per-monster spawn directive resolved from a wave/encounter. */
export interface MonsterSpawn {
  readonly archetypeId: string;
  readonly tier: MonsterTier;
  readonly level: number;
  /** Per-archetype 0-based index inside this wave (for naming). */
  readonly index: number;
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
}

/** Full ordered wave plan for a sub-area run. */
export interface WavePlan {
  readonly subAreaId: string;
  readonly waves: readonly WaveSpec[];
  /** Sub-area loot table (used when a wave doesn't override it). */
  readonly defaultLootTable: string;
}

/**
 * Default fall-back plan for sub-areas with no wave data. Mirrors the
 * roguelike structure described in Diablo2TextGame.md §7.1.
 */
export const DEFAULT_FALLBACK_PLAN: readonly {
  readonly tier: WaveDef['type'];
  readonly count: number;
}[] = [
  { tier: 'trash', count: 3 },
  { tier: 'trash', count: 4 },
  { tier: 'elite', count: 2 },
  { tier: 'boss', count: 1 }
];

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
 */
export function resolveWavePlan(
  subArea: SubAreaDef,
  fallbackArchetypeId: string,
  fallbackLevel: number
): WavePlan {
  const out: WaveSpec[] = [];

  for (const wave of subArea.waves) {
    const spawns = encountersToSpawns(wave.encounters ?? [], wave.type);
    if (spawns.length === 0) continue;
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
      const spawns = encountersToSpawns([subArea.bossEncounter], 'boss');
      if (spawns.length > 0) {
        out.push({
          id: `${subArea.id}-boss`,
          waveTier: 'boss',
          spawns
        });
      }
    }
  }

  if (out.length === 0) {
    return synthDefaultPlan(subArea, fallbackArchetypeId, fallbackLevel);
  }

  return {
    subAreaId: subArea.id,
    waves: out,
    defaultLootTable: subArea.lootTable
  };
}

/**
 * Build a synthetic default wave plan keyed off a single archetype. Used
 * when a sub-area has no usable wave data.
 */
export function synthDefaultPlan(
  subArea: Pick<SubAreaDef, 'id' | 'lootTable' | 'areaLevel'>,
  archetypeId: string,
  level: number
): WavePlan {
  const waves: WaveSpec[] = DEFAULT_FALLBACK_PLAN.map((entry, waveIdx) => {
    const tier: MonsterTier =
      entry.tier === 'boss'
        ? 'boss'
        : entry.tier === 'elite'
          ? 'elite'
          : 'trash';
    const spawns: MonsterSpawn[] = [];
    for (let i = 0; i < entry.count; i++) {
      spawns.push({ archetypeId, tier, level, index: i });
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

/**
 * Convert raw encounter entries into a flat, name-indexed spawn list.
 * Tier comes from per-monster `elite`/`boss` flags first, then falls back
 * to the wave-level tier.
 */
function encountersToSpawns(
  encounters: readonly Encounter[],
  waveTier: WaveDef['type']
): MonsterSpawn[] {
  const out: MonsterSpawn[] = [];
  // Per-archetype counter so multiple groups of the same archetype within
  // one wave still yield "Fallen A / Fallen B / Fallen C".
  const perArchetypeIdx = new Map<string, number>();

  for (const enc of encounters) {
    for (const m of enc.monsters) {
      const tier: MonsterTier = m.boss
        ? 'boss'
        : m.elite
          ? 'elite'
          : waveTier === 'boss'
            ? 'boss'
            : waveTier === 'elite'
              ? 'elite'
              : 'trash';
      for (let i = 0; i < m.count; i++) {
        const idx = perArchetypeIdx.get(m.archetypeId) ?? 0;
        perArchetypeIdx.set(m.archetypeId, idx + 1);
        out.push({
          archetypeId: m.archetypeId,
          tier,
          level: enc.level,
          index: idx
        });
      }
    }
  }
  return out;
}
