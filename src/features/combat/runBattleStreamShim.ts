/**
 * runBattleStream UI shim.
 *
 * The engine now ships a real {@link import('@/engine/combat').runBattleStream}.
 * This shim still exists so the existing UI imports keep working; it
 * re-exports the engine surface plus a synchronous "drain to playback
 * buffer" helper that the UI consumes.
 */
import {
  runBattleStream as engineRunBattleStream,
  MIN_ANIMATION_MS_PER_ACTION as ENGINE_MIN_ANIMATION_MS_PER_ACTION,
  type BattleEventWithTime,
  type CombatResult,
  type CombatSnapshot
} from '@/engine/combat';

export type { BattleEventWithTime } from '@/engine/combat';
export const MIN_ANIMATION_MS_PER_ACTION = ENGINE_MIN_ANIMATION_MS_PER_ACTION;

export interface BattlePlaybackData {
  readonly events: readonly BattleEventWithTime[];
  readonly result: CombatResult;
}

/**
 * Drain the engine's stream into a buffered playback record. The engine is
 * pure, so this is safe to do synchronously off-the-main-thread or inline.
 */
export function runBattleStream(
  snapshot: CombatSnapshot,
  // Kept for legacy call sites — the real engine now derives intervals
  // from each combatant's `attackIntervalMs`.
  _attackIntervalMs = 1200
): BattlePlaybackData {
  void _attackIntervalMs;
  const events: BattleEventWithTime[] = [];
  const it = engineRunBattleStream(snapshot);
  let result: CombatResult | undefined;
  for (;;) {
    const r = it.next();
    if (r.done) {
      result = r.value;
      break;
    }
    events.push(r.value);
  }
  return { events, result: { ...result, events } };
}
