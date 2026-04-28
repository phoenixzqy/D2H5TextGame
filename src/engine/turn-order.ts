/**
 * Turn order calculation
 * Determines combat action order based on attack speed
 * @module engine/turn-order
 */

import type { Rng } from './rng';

/**
 * Unit with attack speed (minimal interface)
 */
export interface UnitSpeed {
  readonly id: string;
  readonly attackSpeed: number;
}

/**
 * Calculate turn order for a set of units
 * Higher attack speed = earlier in turn order
 * Ties broken deterministically using RNG fork
 * 
 * @param units Units to order
 * @param rng RNG for deterministic tie-breaking
 * @returns Array of unit IDs in turn order (first = acts first)
 */
export function calculateTurnOrder(
  units: readonly UnitSpeed[],
  rng: Rng
): readonly string[] {
  if (units.length === 0) {
    return [];
  }

  // Fork RNG for turn order to avoid affecting other systems
  const turnRng = rng.fork('turn-order');

  // Assign a tie-break value to each unit
  const unitsWithTieBreak = units.map((unit) => ({
    id: unit.id,
    attackSpeed: unit.attackSpeed,
    tieBreak: turnRng.next() // Deterministic random tie-breaker
  }));

  // Sort by attack speed (descending), then by tie-break value (descending)
  const sorted = [...unitsWithTieBreak].sort((a, b) => {
    // Primary: higher attack speed goes first
    if (a.attackSpeed !== b.attackSpeed) {
      return b.attackSpeed - a.attackSpeed;
    }
    // Tie-break: higher random value goes first
    return b.tieBreak - a.tieBreak;
  });

  return sorted.map((u) => u.id);
}

/**
 * Get the next actor in turn order
 * Wraps around to the start if at the end
 * 
 * @param currentIndex Current actor index
 * @param turnOrderLength Length of turn order array
 * @returns Next actor index
 */
export function getNextActorIndex(
  currentIndex: number,
  turnOrderLength: number
): number {
  if (turnOrderLength === 0) {
    return 0;
  }
  return (currentIndex + 1) % turnOrderLength;
}

/**
 * Check if a new turn should start
 * A new turn starts when we wrap around to index 0
 * 
 * @param currentIndex Current actor index
 * @param nextIndex Next actor index
 * @returns True if advancing to nextIndex starts a new turn
 */
export function isNewTurn(currentIndex: number, nextIndex: number): boolean {
  return nextIndex < currentIndex || (currentIndex === -1 && nextIndex === 0);
}

/**
 * Recalculate turn order (called when units die or speed changes)
 * Preserves the relative position of the current actor if possible
 * 
 * @param currentActorId ID of current actor
 * @param units New unit list
 * @param rng RNG for tie-breaking
 * @returns New turn order and current actor index
 */
export function recalculateTurnOrder(
  currentActorId: string | undefined,
  units: readonly UnitSpeed[],
  rng: Rng
): { readonly turnOrder: readonly string[]; readonly currentActorIndex: number } {
  const newOrder = calculateTurnOrder(units, rng);

  // Find the new index of the current actor
  let currentActorIndex = currentActorId
    ? newOrder.indexOf(currentActorId)
    : 0;

  // If current actor is not in new order (died), start from beginning
  if (currentActorIndex === -1) {
    currentActorIndex = 0;
  }

  return { turnOrder: newOrder, currentActorIndex };
}
