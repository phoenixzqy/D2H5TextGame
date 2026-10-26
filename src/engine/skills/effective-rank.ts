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
