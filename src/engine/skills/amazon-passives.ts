import Ajv2020 from 'ajv/dist/2020';
import amazonSkills from '../../data/skills/amazon.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';

/** Copied JSON tuning for one automatically composed player passive. */
export interface AmazonPassiveDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: number;
}

const identities = {
  criticalStrike: { authored: 'skills-amazon-critical-strike',
    canonical: 'amazon.critical_strike', coefficient: 'critChancePct' },
  penetrate: { authored: 'skills-amazon-penetrate',
    canonical: 'amazon.penetrate', coefficient: 'attackPct' },
  dodge: { authored: 'skills-amazon-dodge',
    canonical: 'amazon.dodge', coefficient: 'physDodgePct' },
} as const;
type PassiveKey = keyof typeof identities;
export type AmazonPassiveDefinitions = Readonly<Record<PassiveKey, AmazonPassiveDefinition>>;

const validate = new Ajv2020({ strict: true, allErrors: true })
  .compile<SkillDef & { readonly requiredLevel: number }>(skillSchema);

/** Validate exactly one authored row per passive and copy/freeze primitive tuning. */
export function resolveAmazonPassiveDefinitions(rows: readonly unknown[]): AmazonPassiveDefinitions {
  const read = (key: PassiveKey): AmazonPassiveDefinition => {
    const identity = identities[key];
    const matches = rows.filter(row => typeof row === 'object' && row !== null &&
      'id' in row && row.id === identity.authored);
    if (matches.length !== 1) throw new Error('Expected exactly one authored ' + identity.authored);
    const row = matches[0];
    if (!validate(row)) throw new Error('Invalid authored ' + identity.authored);
    const perRank = row.scaling?.passiveStatsPerLevel?.[identity.coefficient];
    if (perRank === undefined) throw new Error('Missing coefficient for ' + identity.authored);
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel, perRank });
  };
  return Object.freeze({ criticalStrike: read('criticalStrike'),
    penetrate: read('penetrate'), dodge: read('dodge') });
}

/** Authored tuning independent of subsequent mutable catalog/registry changes. */
export const AMAZON_PASSIVE_DEFINITIONS = resolveAmazonPassiveDefinitions(amazonSkills);

/** Fresh stat modifiers; passive composition never changes resources or consumes RNG. */
export interface AmazonPassiveModifiers {
  readonly critChanceBonus: number;
  readonly attackMultiplier: number;
  readonly physDodgeBonus: number;
}

/** Compose eligible player allocations once; native ordinary learning owns prerequisites. */
export function composeAmazonPassives(
  input: { readonly classId: string; readonly level: number;
    readonly skillLevels?: Readonly<Record<string, number>> },
  definitions: AmazonPassiveDefinitions = AMAZON_PASSIVE_DEFINITIONS,
): AmazonPassiveModifiers {
  const rank = (key: PassiveKey): number => {
    const definition = definitions[key];
    if (input.classId !== 'amazon' || !Number.isFinite(input.level) ||
      input.level < definition.requiredLevel) return 0;
    let allocated = 0;
    for (const id of [identities[key].authored, identities[key].canonical]) {
      const value = input.skillLevels?.[id];
      if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
        allocated = Math.max(allocated, Math.min(definition.maxRank, value));
      }
    }
    return allocated;
  };
  return Object.freeze({
    critChanceBonus: rank('criticalStrike') * definitions.criticalStrike.perRank,
    attackMultiplier: 1 + rank('penetrate') * definitions.penetrate.perRank,
    physDodgeBonus: rank('dodge') * definitions.dodge.perRank,
  });
}
