/**
 * D3-style HP / MP orb drops on monster kill.
 *
 * Source: docs/design/combat-formulas.md §10.2.
 *  - Trash: 25% drop chance per kill.
 *  - Elite/Champion/Boss: 100%.
 *  - Heal: 5% max HP (or max MP).
 *
 * @module engine/combat/orbs
 */

import type { Rng } from '../rng';
import type { CombatUnit, MonsterTier } from './types';

/** Kind of orb spawned. */
export type OrbKind = 'hp' | 'mp';

/** A spawned orb (consumed immediately by allies on the same tick). */
export interface Orb {
  readonly kind: OrbKind;
  /** % of max stat restored (default 0.05). */
  readonly restorePct: number;
}

/** Drop-chance table keyed by tier (per spec). */
export const ORB_DROP_CHANCE: Readonly<Record<MonsterTier, number>> = Object.freeze({
  trash: 0.25,
  elite: 1.0,
  champion: 1.0,
  boss: 1.0
});

/**
 * Roll orb drops for a slain monster.
 * Each kill rolls *independently* for an HP and an MP orb.
 */
export function rollOrbDrops(tier: MonsterTier, rng: Rng): readonly Orb[] {
  const chance = ORB_DROP_CHANCE[tier];
  const orbs: Orb[] = [];
  if (rng.chance(chance)) orbs.push({ kind: 'hp', restorePct: 0.05 });
  if (rng.chance(chance)) orbs.push({ kind: 'mp', restorePct: 0.05 });
  return orbs;
}

/** Apply a list of orbs to a single ally unit (heal/restore caps at max). */
export function applyOrbs(unit: CombatUnit, orbs: readonly Orb[]): CombatUnit {
  let life = unit.life;
  let mana = unit.mana;
  for (const orb of orbs) {
    if (orb.kind === 'hp') {
      life = Math.min(unit.stats.lifeMax, life + Math.floor(unit.stats.lifeMax * orb.restorePct));
    } else {
      mana = Math.min(unit.stats.manaMax, mana + Math.floor(unit.stats.manaMax * orb.restorePct));
    }
  }
  return { ...unit, life, mana };
}
