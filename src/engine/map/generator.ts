/**
 * Wave / map generator.
 *
 * Source: docs/design/maps-spec.md (Wave 2A) and monster-spec.md.
 *
 * Generates a deterministic ordered list of "encounters" for a sub-area:
 *  - Trash waves (most), each 2-4 monsters from the area's monster pool.
 *  - 1-2 Elite/Champion encounters (at fixed wave indices).
 *  - Optional treasure goblin encounter.
 *  - Boss encounter at the end (only if marked).
 *
 * @module engine/map/generator
 */

import { createRng, type Rng } from '../rng';
import type { MonsterTier } from '../combat/types';

/** A reference to a monster definition (resolved by the host). */
export interface MonsterRef {
  readonly id: string;
  readonly tier: MonsterTier;
  /** Allowed wave types this monster can be slotted into. */
  readonly roles: readonly ('trash' | 'elite' | 'champion' | 'boss' | 'treasure')[];
}

/** A single encounter in a wave plan. */
export interface GeneratedWaveDef {
  readonly index: number;
  readonly tier: MonsterTier | 'treasure';
  readonly monsters: readonly string[];
}

/** Inputs to the generator. */
export interface GenerateWavesInput {
  readonly seed: number;
  readonly waveCount: number;
  readonly pool: readonly MonsterRef[];
  /** Whether the area's final wave is a boss. */
  readonly hasBoss?: boolean;
  /** Whether to insert a treasure goblin somewhere in the middle. */
  readonly includeTreasure?: boolean;
}

function pickRole(
  rng: Rng,
  pool: readonly MonsterRef[],
  role: 'trash' | 'elite' | 'champion' | 'boss' | 'treasure'
): MonsterRef | undefined {
  const subset = pool.filter((m) => m.roles.includes(role));
  if (subset.length === 0) return undefined;
  return rng.pick(subset);
}

/**
 * Generate the wave plan for an area.
 * Deterministic given (seed, pool, waveCount, flags).
 */
export function generateWaves(input: GenerateWavesInput): readonly GeneratedWaveDef[] {
  const rng = createRng(input.seed);
  const total = Math.max(1, input.waveCount);
  const waves: GeneratedWaveDef[] = [];

  // Choose elite indices: roughly 25% and 75% of the way through.
  const eliteIdx = Math.max(1, Math.floor(total * 0.33));
  const championIdx = Math.max(eliteIdx + 1, Math.floor(total * 0.66));
  const treasureIdx = input.includeTreasure
    ? Math.max(1, Math.floor(total * 0.5))
    : -1;
  const bossIdx = input.hasBoss ? total - 1 : -1;

  for (let i = 0; i < total; i++) {
    if (i === bossIdx) {
      const boss = pickRole(rng, input.pool, 'boss');
      waves.push({ index: i, tier: 'boss', monsters: boss ? [boss.id] : [] });
      continue;
    }
    if (i === treasureIdx) {
      const t = pickRole(rng, input.pool, 'treasure');
      waves.push({ index: i, tier: 'treasure', monsters: t ? [t.id] : [] });
      continue;
    }
    if (i === championIdx) {
      const c = pickRole(rng, input.pool, 'champion') ?? pickRole(rng, input.pool, 'elite');
      waves.push({ index: i, tier: 'champion', monsters: c ? [c.id] : [] });
      continue;
    }
    if (i === eliteIdx) {
      const e = pickRole(rng, input.pool, 'elite');
      waves.push({ index: i, tier: 'elite', monsters: e ? [e.id] : [] });
      continue;
    }
    // Trash: 2-4 monsters
    const count = rng.nextInt(2, 4);
    const monsters: string[] = [];
    for (let k = 0; k < count; k++) {
      const m = pickRole(rng, input.pool, 'trash');
      if (m) monsters.push(m.id);
    }
    waves.push({ index: i, tier: 'trash', monsters });
  }

  return waves;
}
