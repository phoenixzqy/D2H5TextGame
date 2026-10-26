import { createSkillValidator } from './skill-validator';
import skills from '../../data/skills/barbarian.json';
import type { SkillDef } from '../types/skills';
import type { WeaponType } from '../types/items';
import { effectiveLearnedSkillRank } from './effective-rank';

/** Exact authored/canonical identities; equipment requirements remain in JSON. */
export const BARBARIAN_WEAPON_MASTERY_IDENTITIES = {
  sword: ['skills-barbarian-sword-mastery', 'barbarian.sword_mastery'],
  axe: ['skills-barbarian-axe-mastery', 'barbarian.axe_mastery'],
  mace: ['skills-barbarian-mace-mastery', 'barbarian.mace_mastery'],
  polearm: ['skills-barbarian-pole-arm-mastery', 'barbarian.pole_arm_mastery'],
  spear: ['skills-barbarian-spear-mastery', 'barbarian.spear_mastery'],
  throwing: ['skills-barbarian-throwing-mastery', 'barbarian.throwing_mastery'],
} as const;
type MasteryKey = keyof typeof BARBARIAN_WEAPON_MASTERY_IDENTITIES;
export const BARBARIAN_WEAPON_MASTERY_KEYS = ['sword', 'axe', 'mace', 'polearm', 'spear', 'throwing'] as const;

/** Immutable authored unlock, cap, required weapon and fractional per-rank tuning. */
export interface BarbarianWeaponMasteryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly weaponType: WeaponType;
  readonly physicalDamagePctPerRank: number;
  readonly critChancePctPerRank: number;
  readonly attackSpeedPctPerRank: number;
}
export type BarbarianWeaponMasteryDefinitions = Readonly<Record<MasteryKey, BarbarianWeaponMasteryDefinition>>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate one exact authored row per mastery and copy/freeze primitive tuning. */
export function resolveBarbarianWeaponMasteryDefinitions(rows: readonly unknown[]): BarbarianWeaponMasteryDefinitions {
  const read = (key: MasteryKey): BarbarianWeaponMasteryDefinition => {
    const id = BARBARIAN_WEAPON_MASTERY_IDENTITIES[key][0];
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    if (matches.length !== 1) throw new Error('Expected exactly one authored ' + id);
    const row = matches[0];
    if (!validate(row)) throw new Error('Invalid authored ' + id);
    const weaponType = row.requires?.weaponType?.[0];
    const physicalDamagePctPerRank = row.scaling?.passiveStatsPerLevel?.physicalDamagePct;
    const critChancePctPerRank = row.scaling?.passiveStatsPerLevel?.critChancePct ?? 0;
    const attackSpeedPctPerRank = row.scaling?.passiveStatsPerLevel?.attackSpeedPct ?? 0;
    if (weaponType === undefined || physicalDamagePctPerRank === undefined) {
      throw new Error('Missing authored weapon-mastery metadata');
    }
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      weaponType, physicalDamagePctPerRank, critChancePctPerRank, attackSpeedPctPerRank });
  };
  return Object.freeze({ sword: read('sword'), axe: read('axe'), mace: read('mace'),
    polearm: read('polearm'), spear: read('spear'), throwing: read('throwing') });
}

/** Tuning independent of subsequent mutable catalog/registry changes. */
export const BARBARIAN_WEAPON_MASTERY_DEFINITIONS = resolveBarbarianWeaponMasteryDefinitions(skills);

/** Maximum valid positive integer alias, capped once; never add alias duplicates. */
export function resolveBarbarianWeaponMasteryRank(key: MasteryKey, levels?: Readonly<Record<string, number>>,
  definitions: BarbarianWeaponMasteryDefinitions = BARBARIAN_WEAPON_MASTERY_DEFINITIONS): number {
  let rank = 0;
  for (const id of BARBARIAN_WEAPON_MASTERY_IDENTITIES[key]) {
    const allocated = levels?.[id];
    if (typeof allocated === 'number' && Number.isFinite(allocated) && Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definitions[key].maxRank, allocated));
    }
  }
  return rank;
}

/** Player-only fresh-wave bonuses for the matching canonical weapon snapshot. */
export function composeBarbarianWeaponMasteries(input: { readonly classId: string; readonly level: number;
  readonly weaponType?: WeaponType; readonly skillLevels?: Readonly<Record<string, number>>;
  readonly temporarySkillRankBonus?: number },
  definitions: BarbarianWeaponMasteryDefinitions = BARBARIAN_WEAPON_MASTERY_DEFINITIONS
): { readonly physicalDamagePct: number; readonly critChanceBonus: number; readonly attackSpeedMultiplier: number } {
  if (input.classId === 'barbarian' && Number.isFinite(input.level)) {
    for (const key of BARBARIAN_WEAPON_MASTERY_KEYS) {
      const definition = definitions[key];
      if (input.weaponType !== definition.weaponType || input.level < definition.requiredLevel) continue;
      const rank = effectiveLearnedSkillRank(resolveBarbarianWeaponMasteryRank(key, input.skillLevels, definitions),
        input.temporarySkillRankBonus);
      return Object.freeze({ physicalDamagePct: rank * definition.physicalDamagePctPerRank,
        critChanceBonus: rank * definition.critChancePctPerRank,
        attackSpeedMultiplier: 1 + rank * definition.attackSpeedPctPerRank });
    }
  }
  return Object.freeze({ physicalDamagePct: 0, critChanceBonus: 0, attackSpeedMultiplier: 1 });
}
