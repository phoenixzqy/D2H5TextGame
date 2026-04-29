/**
 * Experience and level progression curve.
 *
 * Source: docs/design/progression-curve.md §2 / §9.
 *  xpRequired(L) = floor(100 * L^2.5)   (XP to advance L → L+1)
 *  Level cap is 90.
 *
 * @module engine/progression/xp
 */

/** Hard player level cap for v1. */
export const LEVEL_CAP = 90;

/**
 * XP needed to advance from `level` to `level + 1`.
 * Throws on non-positive level.
 */
export function xpRequired(level: number): number {
  if (!Number.isFinite(level) || level < 1) {
    throw new Error(`xpRequired: level must be ≥ 1, got ${String(level)}`);
  }
  return Math.floor(100 * Math.pow(level, 2.5));
}

/**
 * Cumulative XP needed to *reach* `level` from level 1.
 * `xpTotal(1) === 0`.
 */
export function xpTotal(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let k = 1; k < level; k++) {
    total += xpRequired(k);
  }
  return total;
}

/**
 * Resolve the level corresponding to a cumulative XP value.
 * Clamped at {@link LEVEL_CAP}.
 */
export function levelForXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  let level = 1;
  let acc = 0;
  while (level < LEVEL_CAP) {
    const need = xpRequired(level);
    if (acc + need > totalXp) break;
    acc += need;
    level += 1;
  }
  return level;
}

/**
 * Anti-power-leveling XP scale.
 * Source: progression-curve §2.3.
 */
export function xpScale(playerLevel: number, monsterLevel: number): number {
  const diff = playerLevel - monsterLevel;
  if (diff <= 5) return 1;
  return Math.max(0.1, 1 - (diff - 5) * 0.1);
}

/**
 * XP awarded for slaying a monster of `monsterLevel`.
 * v1 baseline: `max(5, round(10 * monsterLevel))`.
 */
export function xpForKill(monsterLevel: number): number {
  if (!Number.isFinite(monsterLevel) || monsterLevel < 1) return 5;
  return Math.max(5, Math.round(10 * monsterLevel));
}

/** Result of awarding XP to a player. */
export interface AwardXpResult {
  /** Total XP after applying the award. */
  readonly totalXp: number;
  /** New level after the award. */
  readonly level: number;
  /** Levels gained (≥0). */
  readonly levelsGained: number;
  /** Stat points granted (5 per level). */
  readonly statPointsGranted: number;
  /** Skill points granted (1/level + milestones at L12/L24/L36). */
  readonly skillPointsGranted: number;
}

/**
 * Apply an XP award and report level-up rewards.
 *
 * Stat-point quest bonuses and skill-point quest bonuses are NOT included here;
 * those are tracked separately in the player save.
 */
export function awardXp(
  currentXp: number,
  amount: number
): AwardXpResult {
  if (amount < 0) {
    throw new Error('awardXp: amount must be ≥ 0');
  }
  const startLevel = levelForXp(currentXp);
  const totalXp = currentXp + amount;
  const newLevel = levelForXp(totalXp);
  const levelsGained = newLevel - startLevel;
  let skillPointsGranted = levelsGained; // 1 per level
  for (const milestone of [12, 24, 36]) {
    if (startLevel < milestone && newLevel >= milestone) {
      skillPointsGranted += 1;
    }
  }
  return {
    totalXp,
    level: newLevel,
    levelsGained,
    statPointsGranted: levelsGained * 5,
    skillPointsGranted
  };
}
