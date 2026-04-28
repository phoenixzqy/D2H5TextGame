/**
 * Online tick: pure function for one 6-second combat slice.
 *
 * The engine never schedules its own timers; the host (UI thread / Web Worker)
 * is responsible for calling {@link onlineTick} at the configured interval.
 *
 * @module engine/idle/online-tick
 */

import type { IdleBonus } from './offline-bonus';
import { bonusMultiplier, consumeOnlineSession } from './offline-bonus';

/** A combat-tick reward summary. */
export interface TickReward {
  /** Raw XP gained this tick (post-multiplier, pre-cap). */
  readonly xp: number;
  /** Raw gold this tick. */
  readonly gold: number;
  /** Effective MF used on this tick. */
  readonly effectiveMagicFind: number;
  /** Wishstones, runes, gems collected this tick. */
  readonly currencies: Readonly<Record<string, number>>;
}

/** Empty reward. */
export const EMPTY_REWARD: TickReward = {
  xp: 0,
  gold: 0,
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
): { readonly reward: TickReward; readonly bonus: IdleBonus } {
  const mult = bonusMultiplier(bonus);
  const reward: TickReward = {
    xp: Math.floor(rawReward.xp * mult),
    gold: rawReward.gold,
    effectiveMagicFind: Math.floor(config.baseMagicFind * mult),
    currencies: rawReward.currencies
  };
  const advanced = consumeOnlineSession(config.tickSeconds * 1000, bonus);
  return { reward, bonus: advanced };
}
