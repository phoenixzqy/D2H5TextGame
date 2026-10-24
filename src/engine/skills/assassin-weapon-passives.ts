import skills from '../../data/skills/assassin.json';
import type { Handedness, WeaponType } from '../types/items';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

/** Exact authored and persisted identities; duplicate aliases never stack. */
export const ASSASSIN_WEAPON_PASSIVE_IDENTITIES = {
  claw: ['skills-assassin-claw-mastery', 'assassin.claw_mastery'],
  block: ['skills-assassin-weapon-block', 'assassin.weapon_block'],
} as const;
type PassiveKey = keyof typeof ASSASSIN_WEAPON_PASSIVE_IDENTITIES;
const statKeys = ['attackPct', 'critChancePct', 'physDodgePct', 'magicDodgePct'] as const;

/** Copied JSON unlock, cap, equipment requirement and per-rank tuning. */
export interface AssassinWeaponPassiveDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: Readonly<Record<typeof statKeys[number], number>>;
  readonly weaponType?: WeaponType;
  readonly handedness?: Handedness;
}
export type AssassinWeaponPassiveDefinitions = Readonly<Record<PassiveKey, AssassinWeaponPassiveDefinition>>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate exactly one authored row per passive; retain independent immutable tuning. */
export function resolveAssassinWeaponPassiveDefinitions(rows: readonly unknown[]): AssassinWeaponPassiveDefinitions {
  const read = (key: PassiveKey): AssassinWeaponPassiveDefinition => {
    const id = ASSASSIN_WEAPON_PASSIVE_IDENTITIES[key][0];
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    if (matches.length !== 1) throw new Error('Expected exactly one authored ' + id);
    const row = matches[0];
    if (!validate(row)) throw new Error('Invalid authored ' + id);
    const source = row.scaling?.passiveStatsPerLevel;
    const weaponType = row.requires?.weaponType?.[0], handedness = row.requires?.handedness?.[0];
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      ...(weaponType ? { weaponType } : {}), ...(handedness ? { handedness } : {}),
      perRank: Object.freeze({ attackPct: source?.attackPct ?? 0, critChancePct: source?.critChancePct ?? 0,
        physDodgePct: source?.physDodgePct ?? 0, magicDodgePct: source?.magicDodgePct ?? 0 }) });
  };
  return Object.freeze({ claw: read('claw'), block: read('block') });
}

export const ASSASSIN_WEAPON_PASSIVE_DEFINITIONS = resolveAssassinWeaponPassiveDefinitions(skills);

/** Fresh hero-only weapon bonuses, with no resource mutation, actions or RNG. */
export function composeAssassinWeaponPassives(input: {
  readonly classId: string; readonly level: number;
  readonly skillLevels?: Readonly<Record<string, number>>;
  readonly weaponType?: WeaponType; readonly handedness?: Handedness;
  readonly dualWielding: boolean;
}, definitions: AssassinWeaponPassiveDefinitions = ASSASSIN_WEAPON_PASSIVE_DEFINITIONS): {
  readonly attackMultiplier: number; readonly critChanceBonus: number;
  readonly physDodgeBonus: number; readonly magicDodgeBonus: number;
} {
  const rank = (key: PassiveKey) => {
    const definition = definitions[key];
    if (input.classId !== 'assassin' || !Number.isFinite(input.level) || input.level < definition.requiredLevel) return 0;
    let allocated = 0;
    for (const id of ASSASSIN_WEAPON_PASSIVE_IDENTITIES[key]) {
      const value = input.skillLevels?.[id];
      if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
        allocated = Math.max(allocated, Math.min(value, definition.maxRank));
      }
    }
    return allocated;
  };
  const clawRank = rank('claw');
  const claw = input.weaponType === definitions.claw.weaponType && input.handedness === definitions.claw.handedness
    ? clawRank : 0;
  const block = clawRank > 0 && input.dualWielding ? rank('block') : 0;
  return Object.freeze({ attackMultiplier: 1 + claw * definitions.claw.perRank.attackPct,
    critChanceBonus: claw * definitions.claw.perRank.critChancePct,
    physDodgeBonus: block * definitions.block.perRank.physDodgePct,
    magicDodgeBonus: block * definitions.block.perRank.magicDodgePct });
}
