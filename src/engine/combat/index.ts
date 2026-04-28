/**
 * Combat barrel.
 * @module engine/combat
 */
export * from './types';
export * from './damage';
export * from './status';
export * from './combo';
export * from './orbs';
// Scheduler is the implementation; combat.ts re-exports its public surface.
export * from './combat';

/**
 * Minimum wall-clock animation budget (ms) per UI-visible event cluster.
 * UI consumes this constant; the engine never reads it.
 *
 * Spec: `docs/design/tick-combat.md` §6.1.
 */
export const MIN_ANIMATION_MS_PER_ACTION = 350;
