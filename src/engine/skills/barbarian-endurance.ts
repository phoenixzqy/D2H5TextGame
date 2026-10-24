import { createSkillValidator } from './skill-validator';
import skills from '../../data/skills/barbarian.json';
import type { SkillDef } from '../types/skills';

/** The only supported authored/canonical identities for this passive group. */
export const BARBARIAN_ENDURANCE_IDENTITIES = {
  stamina: ['skills-barbarian-increased-stamina', 'barbarian.increased_stamina'],
  speed: ['skills-barbarian-increased-speed', 'barbarian.increased_speed'],
  resistance: ['skills-barbarian-natural-resistance', 'barbarian.natural_resistance'],
} as const;
type PassiveKey = keyof typeof BARBARIAN_ENDURANCE_IDENTITIES;
const statKeys = ['lifePct', 'attackSpeedPct', 'physDodgePct', 'resistAllPct', 'magicDodgePct'] as const;

/** Copied JSON unlock/cap and fractional stat bonuses; unused fields are zero. */
export interface BarbarianEnduranceDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: Readonly<Record<typeof statKeys[number], number>>;
}
export type BarbarianEnduranceDefinitions = Readonly<Record<PassiveKey, BarbarianEnduranceDefinition>>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate exact identities and copy/freeze primitives without retaining caller rows. */
export function resolveBarbarianEnduranceDefinitions(rows: readonly unknown[]): BarbarianEnduranceDefinitions {
  const read = (key: PassiveKey): BarbarianEnduranceDefinition => {
    const id = BARBARIAN_ENDURANCE_IDENTITIES[key][0];
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    if (matches.length !== 1) throw new Error('Expected exactly one authored ' + id);
    const row = matches[0];
    if (!validate(row)) throw new Error('Invalid authored ' + id);
    const source = row.scaling?.passiveStatsPerLevel;
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      perRank: Object.freeze({ lifePct: source?.lifePct ?? 0, attackSpeedPct: source?.attackSpeedPct ?? 0,
        physDodgePct: source?.physDodgePct ?? 0, resistAllPct: source?.resistAllPct ?? 0,
        magicDodgePct: source?.magicDodgePct ?? 0 }) });
  };
  return Object.freeze({ stamina: read('stamina'), speed: read('speed'), resistance: read('resistance') });
}

/** Authored tuning insulated from subsequent mutable catalog/registry edits. */
export const BARBARIAN_ENDURANCE_DEFINITIONS = resolveBarbarianEnduranceDefinitions(skills);

/** Resolve the maximum valid allocated alias once; native learning owns prerequisites. */
export function resolveBarbarianEnduranceRank(key: PassiveKey, levels?: Readonly<Record<string, number>>,
  definitions: BarbarianEnduranceDefinitions = BARBARIAN_ENDURANCE_DEFINITIONS): number {
  let rank = 0;
  for (const id of BARBARIAN_ENDURANCE_IDENTITIES[key]) {
    const allocated = levels?.[id];
    if (typeof allocated === 'number' && Number.isFinite(allocated) && Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definitions[key].maxRank, allocated));
    }
  }
  return rank;
}

/** Fresh player-only modifiers. Resistance uses percentage points; dodge uses fractions. */
export function composeBarbarianEndurance(input: { readonly classId: string; readonly level: number;
  readonly skillLevels?: Readonly<Record<string, number>> },
  definitions: BarbarianEnduranceDefinitions = BARBARIAN_ENDURANCE_DEFINITIONS) {
  const bonus = (key: PassiveKey, stat: typeof statKeys[number]): number => {
    const definition = definitions[key];
    if (input.classId !== 'barbarian' || !Number.isFinite(input.level) || input.level < definition.requiredLevel) return 0;
    return resolveBarbarianEnduranceRank(key, input.skillLevels, definitions) * definition.perRank[stat];
  };
  return Object.freeze({
    lifeMultiplier: 1 + bonus('stamina', 'lifePct'),
    attackSpeedMultiplier: 1 + bonus('speed', 'attackSpeedPct'),
    physDodgeBonus: bonus('speed', 'physDodgePct'),
    magicDodgeBonus: bonus('resistance', 'magicDodgePct'),
    resistAllBonus: bonus('resistance', 'resistAllPct') * 100,
  });
}
