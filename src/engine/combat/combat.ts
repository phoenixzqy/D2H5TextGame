/**
 * Deterministic battle runner — public surface.
 *
 * The actual implementation now lives in {@link import('./scheduler')} which
 * runs a virtual-millisecond tick scheduler. This module re-exports the
 * legacy types (`BattleEvent`, `CombatSnapshot`, `CombatResult`) and the
 * `runBattle` function so existing callers keep compiling unchanged.
 *
 * @module engine/combat/combat
 */

export {
  runBattle,
  runBattleStream,
  AVG_INTERVAL_MS,
  MIN_COOLDOWN_MS,
  MAX_VIRTUAL_MS,
  MIN_INTERVAL_MS,
  DOT_TICK_MS,
  getAttackIntervalMs,
  getSkillCooldownMs,
  type BattleEvent,
  type BattleEventWithTime,
  type CombatSnapshot,
  type CombatResult
} from './scheduler';

// Re-export skill effect helper types for downstream consumers.
export type { BuffEffect, SummonEffect } from '../skills/effects';
