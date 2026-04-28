/**
 * Skill-tree allocation and prerequisite checks.
 *
 * Source: docs/design/progression-curve.md §5.2; skills-spec.md §3.
 *
 * @module engine/progression/skill-tree
 */

import { totalSkillPoints } from './stats';

/** A skill-rank record: skillId → rank (1..maxRank). */
export type SkillRanks = Readonly<Record<string, number>>;

/** Minimum gating data the tree needs about a skill. */
export interface SkillTreeNode {
  readonly id: string;
  /** Player level at which the skill becomes selectable. */
  readonly minLevel: number;
  /** Other skills (and rank ≥ requiredRank) required to invest. */
  readonly prerequisites?: readonly { readonly skillId: string; readonly rank: number }[];
  /** Cap on rank (default 20). */
  readonly maxRank?: number;
}

/** Default cap. */
export const DEFAULT_MAX_RANK = 20;

/** Sum of ranks invested in a build. */
export function pointsSpent(ranks: SkillRanks): number {
  let total = 0;
  for (const v of Object.values(ranks)) total += v;
  return total;
}

/**
 * Test whether one more point may be allocated to `node` given current ranks
 * and the player's level. Returns `null` if allocation is allowed, else a
 * machine-readable reason code.
 */
export function canAllocate(
  node: SkillTreeNode,
  ranks: SkillRanks,
  playerLevel: number,
  questBonusSkill = 0
): null | 'level' | 'maxRank' | 'prereq' | 'noPoints' | 'rankLevel' {
  if (playerLevel < node.minLevel) return 'level';
  const cap = node.maxRank ?? DEFAULT_MAX_RANK;
  const current = ranks[node.id] ?? 0;
  if (current >= cap) return 'maxRank';
  // Ranks 6..10 require prereq ≥ 3 (per progression-curve §5.2)
  // Ranks 11..20 require playerLevel ≥ minLevel + 2*(rank-10)
  const nextRank = current + 1;
  if (nextRank >= 6 && node.prerequisites) {
    for (const pr of node.prerequisites) {
      const prRank = ranks[pr.skillId] ?? 0;
      if (prRank < pr.rank) return 'prereq';
    }
  }
  if (nextRank >= 11) {
    const need = node.minLevel + 2 * (nextRank - 10);
    if (playerLevel < need) return 'rankLevel';
  }
  const available = totalSkillPoints(playerLevel, questBonusSkill) - pointsSpent(ranks);
  if (available <= 0) return 'noPoints';
  return null;
}

/**
 * Allocate one point to a skill, returning the new ranks map.
 * Throws with a descriptive message if not allowed.
 */
export function allocatePoint(
  node: SkillTreeNode,
  ranks: SkillRanks,
  playerLevel: number,
  questBonusSkill = 0
): SkillRanks {
  const reason = canAllocate(node, ranks, playerLevel, questBonusSkill);
  if (reason !== null) {
    throw new Error(`Cannot allocate to ${node.id}: ${reason}`);
  }
  const current = ranks[node.id] ?? 0;
  return { ...ranks, [node.id]: current + 1 };
}

/**
 * Reset all ranks (free respec). Caller is responsible for charging the cost.
 */
export function respec(): SkillRanks {
  return {};
}
