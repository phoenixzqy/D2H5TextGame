import { loadMercPool } from '../../data/loaders/mercs';
import type { CombatUnit } from '../combat/types';
import type { Mercenary } from '../types/entities';
import { mercSignatureRank } from '../progression/merc-stars';
import type { SkillEffect } from './effects';

const pool = loadMercPool();
const signatures = new Map(pool.pool.map(merc => [merc.id, merc.signatureSkillId]));
const tuning = Object.freeze({ ...pool.banner.shardConversion.starBonuses });

/** Copy only a canonical owned signature's earned rank; secondary abilities retain their base tuning. */
export function composeMercSignature(merc: Mercenary, stars: number): CombatUnit['mercSignature'] {
  const rank = mercSignatureRank(stars), skillId = signatures.get(merc.id.split('#')[0] ?? merc.id);
  return stars > 0 && skillId && merc.signatureSkillId === skillId ? Object.freeze({ skillId, rank }) : undefined;
}

/** Potency may be read from a dead source for its already-paid finite debuff. Living aura gates remain separate. */
export function mercSignatureFactor(unit: CombatUnit | undefined, skillId: string): number {
  const signature = unit?.mercSignature;
  if (!unit || !signature || unit.kind !== 'merc' || unit.side !== 'player' || unit.summon === true ||
    unit.ownerId !== undefined || unit.summonOwnerId !== undefined || unit.summonTemplateId !== undefined ||
    signature.skillId !== skillId || !Number.isInteger(signature.rank) || signature.rank < 1 ||
    signature.rank > 1 + tuning.skillRankCapAboveBase) return 1;
  return 1 + (signature.rank - 1) * tuning.signatureEffectPerRank;
}

/** Scale the primary paid primitive without changing registry identity, RNG consumption, cadence or secondary skills. */
export function scaleMercSignatureEffect(effect: SkillEffect, skillId: string, factor: number): SkillEffect {
  if (factor === 1) return effect;
  if (effect.kind === 'damage') return { ...effect,
    base: [effect.base[0] * factor, effect.base[1] * factor],
    ...(effect.attackDamagePct !== undefined ? { attackDamagePct: effect.attackDamagePct * factor } : {}) };
  if (effect.kind === 'heal') return { ...effect,
    ...(effect.amountRange ? { amountRange: [Math.floor(effect.amountRange[0] * factor), Math.floor(effect.amountRange[1] * factor)] as const } : {}),
    ...(effect.amount !== undefined ? { amount: effect.amount * factor } : {}) };
  if (effect.kind === 'debuff' && skillId === 'mskill-war-cry') return { ...effect,
    ...(effect.durationMs !== undefined ? { durationMs: effect.durationMs * factor } : {}),
    ...(effect.duration !== undefined ? { duration: effect.duration * factor } : {}) };
  return effect;
}
