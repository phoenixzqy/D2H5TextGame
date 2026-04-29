/**
 * Online tick: pure function for one 6-second combat slice.
 *
 * The engine never schedules its own timers; the host (UI thread / Web Worker)
 * is responsible for calling {@link onlineTick} at the configured interval.
 *
 * # Contract for idle consumers (Bug #6)
 *
 * `onlineTick(raw, bonus, config)` returns a **per-tick delta**, not a running
 * total. The consumer MUST apply the delta on every call:
 *   1. `playerStore.gainExperience(result.reward.xp)` when xp > 0.
 *   2. `inventoryStore.addCurrency('rune-shard', result.reward.runeShards)`
 *      when runeShards > 0, and similarly for any other rolled currencies.
 *   3. Loot drops are NOT produced here — the consumer rolls loot via
 *      {@link import('../loot/award').rollKillRewards} and feeds drops into
 *      `inventoryStore.addItem(...)` per tick. Loot RNG MUST advance between
 *      ticks (use `tickCount` in the seed string) or every tick re-rolls
 *      the same outcome.
 *   4. Persist the returned `bonus` into the ticker store so the next tick
 *      sees the advanced window — without this, the window never decays.
 *
 * The returned object is fresh each call; consumers can safely retain it
 * without aliasing engine state.
 *
 * @module engine/idle/online-tick
 */

import type { IdleBonus } from './offline-bonus';
import { bonusMultiplier, consumeOnlineSession } from './offline-bonus';

/** A combat-tick reward summary (per-tick delta, not a running total). */
export interface TickReward {
  /** XP delta this tick (post-multiplier, pre-cap). Apply once per tick. */
  readonly xp: number;
  /** Rune-shard delta this tick (replaces gold per GDD §8). */
  readonly runeShards: number;
  /** Effective MF used on this tick (display only — not a delta to apply). */
  readonly effectiveMagicFind: number;
  /** Wishstones, runes, gems collected this tick. */
  readonly currencies: Readonly<Record<string, number>>;
}

/** Empty reward. */
export const EMPTY_REWARD: TickReward = {
  xp: 0,
  runeShards: 0,
  effectiveMagicFind: 0,
  currencies: Object.freeze({})
};

/** Tick configuration (data-driven from the host). */
export interface OnlineTickConfig {
  /** Base seconds per tick (default 6). */
  readonly tickSeconds: number;
  /** Player magic find before bonus. */
  readonly baseMagicFind: number;
}

/** Result of one {@link onlineTick} call. */
export interface OnlineTickResult {
  /** Reward delta to apply this tick (xp, runeShards, currencies). */
  readonly reward: TickReward;
  /** Advanced bonus snapshot (window decays one tick). Persist this. */
  readonly bonus: IdleBonus;
}

/**
 * Apply a single tick of accumulated reward, multiplied by current idle bonus.
 *
 * This function is pure: it does not invoke combat itself. The caller assembles
 * raw rewards from {@link runBattle} and passes them in here so that the bonus
 * is applied consistently in one place.
 */
export function onlineTick(
  rawReward: TickReward,
  bonus: IdleBonus,
  config: OnlineTickConfig
): OnlineTickResult {
  const mult = bonusMultiplier(bonus);
  const reward: TickReward = {
    xp: Math.floor(rawReward.xp * mult),
    runeShards: rawReward.runeShards,
    effectiveMagicFind: Math.floor(config.baseMagicFind * mult),
    currencies: rawReward.currencies
  };
  const advanced = consumeOnlineSession(config.tickSeconds * 1000, bonus);
  return { reward, bonus: advanced };
}
