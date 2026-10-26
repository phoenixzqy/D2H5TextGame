/**
 * Apply an explicit temporary potency bonus to an already-authorized learned rank.
 * Allocation caps and class/level/weapon gates belong to the caller. This never
 * grants an unlearned skill, changes allocation, or caps a valid effective rank.
 * Malformed or overflowing bonuses preserve the learned rank.
 */
export function effectiveLearnedSkillRank(learnedRank: number, temporaryBonus = 0): number {
  if (!Number.isSafeInteger(learnedRank) || learnedRank <= 0) return 0;
  if (!Number.isSafeInteger(temporaryBonus) || temporaryBonus < 0) return learnedRank;
  const effectiveRank = learnedRank + temporaryBonus;
  return Number.isSafeInteger(effectiveRank) ? effectiveRank : learnedRank;
}

/**
 * Validate potency captured at payment against its separate allocation cap.
 * The optional +1 provenance is carried by a paid effect, never live allocation.
 * Legacy payloads without provenance retain their original allocation bounds.
 */
export function validCapturedSkillRank(rank: unknown, allocationCap: number, rankBonus?: unknown): rank is number {
  if (typeof rank !== 'number' || !Number.isSafeInteger(rank) ||
    !Number.isSafeInteger(allocationCap) || allocationCap < 1 ||
    (rankBonus !== undefined && rankBonus !== 1)) return false;
  const learned = rank - (rankBonus === 1 ? 1 : 0);
  return learned >= 1 && learned <= allocationCap;
}
