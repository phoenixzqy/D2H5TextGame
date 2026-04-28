/**
 * Cooldown tracking system
 * Pure, immutable cooldown management
 * @module engine/cooldown
 */

import type { CooldownState } from './types/skills';

/**
 * Cooldown tracker - immutable state container for skill cooldowns
 */
export interface CooldownTracker {
  readonly cooldowns: readonly CooldownState[];
}

/**
 * Create an empty cooldown tracker
 */
export function createCooldownTracker(): CooldownTracker {
  return { cooldowns: [] };
}

/**
 * Start a cooldown for a skill
 * @param tracker Current tracker
 * @param skillId Skill ID
 * @param duration Cooldown duration in turns
 * @returns New tracker with cooldown started
 */
export function startCooldown(
  tracker: CooldownTracker,
  skillId: string,
  duration: number
): CooldownTracker {
  if (duration <= 0) {
    return tracker; // No cooldown to track
  }

  // Remove any existing cooldown for this skill
  const filtered = tracker.cooldowns.filter((cd) => cd.skillId !== skillId);

  // Add new cooldown
  const newCooldown: CooldownState = {
    skillId,
    remaining: duration,
    total: duration
  };

  return {
    cooldowns: [...filtered, newCooldown]
  };
}

/**
 * Tick all cooldowns (reduce by 1 turn)
 * @param tracker Current tracker
 * @returns New tracker with cooldowns decremented
 */
export function tickCooldowns(tracker: CooldownTracker): CooldownTracker {
  const updated = tracker.cooldowns
    .map((cd) => ({
      ...cd,
      remaining: cd.remaining - 1
    }))
    .filter((cd) => cd.remaining > 0); // Remove expired cooldowns

  return { cooldowns: updated };
}

/**
 * Check if a skill is ready (not on cooldown)
 * @param tracker Current tracker
 * @param skillId Skill ID to check
 * @returns True if skill is ready, false if on cooldown
 */
export function isReady(tracker: CooldownTracker, skillId: string): boolean {
  return !tracker.cooldowns.some((cd) => cd.skillId === skillId);
}

/**
 * Get remaining cooldown for a skill
 * @param tracker Current tracker
 * @param skillId Skill ID to check
 * @returns Remaining turns, or 0 if ready
 */
export function getRemaining(
  tracker: CooldownTracker,
  skillId: string
): number {
  const cd = tracker.cooldowns.find((c) => c.skillId === skillId);
  return cd?.remaining ?? 0;
}

/**
 * Reset all cooldowns
 * @returns New tracker with all cooldowns cleared
 */
export function resetCooldowns(): CooldownTracker {
  return { cooldowns: [] };
}

/**
 * Reset a specific cooldown
 * @param tracker Current tracker
 * @param skillId Skill ID to reset
 * @returns New tracker with specified cooldown cleared
 */
export function resetCooldown(
  tracker: CooldownTracker,
  skillId: string
): CooldownTracker {
  return {
    cooldowns: tracker.cooldowns.filter((cd) => cd.skillId !== skillId)
  };
}
