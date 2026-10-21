/** JSON-authored hero recovery and learned Sorceress passive modifiers; no resource changes. */
import sorceressSkills from '../../data/skills/sorceress.json';
import { RECOVERY_DEFINITION } from '../combat/recovery-definition';
import { FIRE_MASTERY_DEFINITION, resolveFireMasteryRank } from '../skills/fire-mastery';
import { LIGHTNING_MASTERY_DEFINITION, resolveLightningMasteryRank } from '../skills/lightning-mastery';
import type { DamageType } from '../types/attributes';

const warmth = sorceressSkills.find(skill => skill.id === 'skills-sorceress-warmth');
if (!warmth?.scaling.passiveStatsPerLevel || warmth.trigger !== 'passive') {
  throw new Error('Missing authored passive Warmth definition');
}
const definition = warmth;
const coefficients = warmth.scaling.passiveStatsPerLevel;
if (coefficients.manaRegenPct === undefined || coefficients.fireDamagePct === undefined) {
  throw new Error('Missing authored Warmth recovery or fire coefficient');
}
const manaRegenPerRank: number = coefficients.manaRegenPct;
const fireDamagePerRank: number = coefficients.fireDamagePct;
const warmthAliases = [definition.id, 'sorceress.warmth'] as const;

/** Authoritative hero inputs; Energy has already had equipment and the softcap applied once. */
export interface HeroRecoveryInput {
  readonly classId: string;
  readonly level: number;
  readonly effectiveEnergy: number;
  readonly skillLevels?: Readonly<Record<string, number>>;
}

/** Explicit zero modifiers clear removed allocations at the adapter boundary. */
export interface HeroRecoveryModifiers {
  readonly manaRegenPerSecond: number;
  readonly increasedDamagePct: Readonly<Partial<Record<DamageType, number>>>;
}

/** Compose an independent immutable snapshot without inferring an unallocated passive rank. */
export function composeHeroRecovery(input: HeroRecoveryInput): HeroRecoveryModifiers {
  let rank = 0;
  if (input.classId === 'sorceress' && Number.isFinite(input.level) &&
    input.level >= definition.requiredLevel) {
    for (const alias of warmthAliases) {
      const learned = input.skillLevels?.[alias];
      if (typeof learned === 'number' && Number.isFinite(learned) && Number.isInteger(learned) && learned > 0) {
        rank = Math.max(rank, Math.min(definition.maxLevel, learned));
      }
    }
  }
  const masteryRank = input.classId === 'sorceress' && Number.isFinite(input.level) &&
    input.level >= FIRE_MASTERY_DEFINITION.requiredLevel
    ? resolveFireMasteryRank(input.skillLevels) : 0;
  const lightningMasteryRank = input.classId === 'sorceress' && Number.isFinite(input.level) &&
    input.level >= LIGHTNING_MASTERY_DEFINITION.requiredLevel
    ? resolveLightningMasteryRank(input.skillLevels) : 0;
  const energy = Number.isFinite(input.effectiveEnergy) ? Math.max(0, input.effectiveEnergy) : 0;
  return Object.freeze({
    manaRegenPerSecond: RECOVERY_DEFINITION.heroManaPerEffectiveEnergyPerSecond * energy *
      (1 + manaRegenPerRank * rank),
    increasedDamagePct: Object.freeze({ fire: fireDamagePerRank * rank +
      FIRE_MASTERY_DEFINITION.fireDamagePctPerRank * masteryRank,
      lightning: LIGHTNING_MASTERY_DEFINITION.lightningDamagePctPerRank * lightningMasteryRank })
  });
}
