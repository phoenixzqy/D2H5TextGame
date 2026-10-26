import type { WeaponType } from '../types/items';
import { composeBarbarianEndurance } from './barbarian-endurance';
import { composeBarbarianWarcries } from './barbarian-warcries';
import { composeBarbarianWeaponMasteries } from './barbarian-weapon-masteries';
import { composeIronSkinRank, IRON_SKIN_DEFINITION } from './iron-skin';

/** Fresh learned configuration; temporary potency never changes these allocations. */
export interface BarbarianPassiveInput {
  readonly classId: string;
  readonly level: number;
  readonly weaponType?: WeaponType;
  readonly skillLevels?: Readonly<Record<string, number>>;
  readonly temporarySkillRankBonus?: number;
}

/**
 * Compose the native Barbarian's personal passive modifiers from one fresh input.
 * Consumers retain their existing stat arithmetic and resource-clamping order.
 */
export function composeBarbarianPassives(input: BarbarianPassiveInput) {
  return Object.freeze({
    endurance: composeBarbarianEndurance(input),
    mastery: composeBarbarianWeaponMasteries(input),
    warcries: composeBarbarianWarcries(input),
    ironSkinDefenseBonus: IRON_SKIN_DEFINITION.defensePctPerRank * composeIronSkinRank(input),
  });
}
