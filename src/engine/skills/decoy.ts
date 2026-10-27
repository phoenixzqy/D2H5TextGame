import rows from '../../data/skills/amazon.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';
import { validCapturedSkillRank } from './effective-rank';
import { MITIGATION_DEFINITION } from '../combat/mitigation-definition';

export const DECOY_IDS = ['skills-amazon-decoy', 'amazon.decoy'] as const;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();
/** Validate the unique complete Decoy row, then copy/freeze only privately owned data. */
export function resolveDecoyDefinition(input: readonly unknown[]) {
  const matches = input.filter(
    (row) => typeof row === 'object' && row !== null && 'id' in row && row.id === DECOY_IDS[0]
  );
  const row = matches[0];
  if (
    matches.length !== 1 ||
    !validate(row) ||
    !row.decoy ||
    !row.scaling ||
    row.cost.mana === undefined
  )
    throw new Error('Invalid authored Decoy');
  return Object.freeze({
    ...row.decoy,
    requiredLevel: row.requiredLevel,
    maxRank: row.maxLevel,
    manaCost: row.cost.mana,
    cooldown: row.cooldown,
    manaCostPerRank: row.scaling.costPerLevel ?? 0,
    cooldownPerRank: row.scaling.cooldownPerLevel ?? 0,
    bodyStats: Object.freeze({
      ...row.decoy.bodyStats,
      resistances: Object.freeze({ ...row.decoy.bodyStats.resistances })
    })
  });
}
export const DECOY_DEFINITION = resolveDecoyDefinition(rows);
function rankOffset(rank: number, rankBonus?: 1) {
  if (!validCapturedSkillRank(rank, DECOY_DEFINITION.maxRank, rankBonus))
    throw new Error('Invalid paid Decoy rank');
  return rank - 1;
}
/** Fresh mutable body stats; no player equipment or unrelated summon mastery is inherited. */
export function decoyBodyStats(rank: number, rankBonus?: 1) {
  const d = DECOY_DEFINITION,
    life = d.bodyStats.lifeMax + d.lifePerRank * rankOffset(rank, rankBonus);
  return {
    ...d.bodyStats,
    life,
    lifeMax: life,
    mana: d.bodyStats.manaMax,
    magicResist: Math.max(0, Math.floor(MITIGATION_DEFINITION.friendlyBase.summon)),
    resistances: { ...d.bodyStats.resistances }
  };
}
/** Half-open lifetime captured once at the paid effective rank. */
export function decoyDuration(rank: number, rankBonus?: 1): number {
  return (
    DECOY_DEFINITION.durationMs + DECOY_DEFINITION.durationPerRankMs * rankOffset(rank, rankBonus)
  );
}
