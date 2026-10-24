import Ajv2020 from 'ajv/dist/2020';
import amazonSkills from '../../data/skills/amazon.json';
import skillSchema from '../../data/schema/skill.schema.json';
import type { SkillDef } from '../types/skills';

const statKeys = ['critChancePct', 'attackPct', 'physDodgePct', 'magicDodgePct', 'physicalDamagePct'] as const;

/** Copied JSON tuning for one automatically composed player passive. */
export interface AmazonPassiveDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: Readonly<Record<typeof statKeys[number], number>>;
}

const identities = {
  criticalStrike: { authored: 'skills-amazon-critical-strike',
    canonical: 'amazon.critical_strike' },
  penetrate: { authored: 'skills-amazon-penetrate',
    canonical: 'amazon.penetrate' },
  dodge: { authored: 'skills-amazon-dodge',
    canonical: 'amazon.dodge' },
  avoid: { authored: 'skills-amazon-avoid', canonical: 'amazon.avoid' },
  evade: { authored: 'skills-amazon-evade', canonical: 'amazon.evade' },
  pierce: { authored: 'skills-amazon-pierce', canonical: 'amazon.pierce' },
} as const;
type PassiveKey = keyof typeof identities;
/** Exact skill keys shared by composition and bilingual detail rendering. */
export const AMAZON_PASSIVE_KEYS = ['criticalStrike', 'penetrate', 'dodge', 'avoid', 'evade', 'pierce'] as const;
export const AMAZON_PASSIVE_IDENTITIES = identities;
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
    const source = row.scaling?.passiveStatsPerLevel;
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      perRank: Object.freeze({ critChancePct: source?.critChancePct ?? 0, attackPct: source?.attackPct ?? 0,
        physDodgePct: source?.physDodgePct ?? 0, magicDodgePct: source?.magicDodgePct ?? 0,
        physicalDamagePct: source?.physicalDamagePct ?? 0 }) });
  };
  return Object.freeze({ criticalStrike: read('criticalStrike'),
    penetrate: read('penetrate'), dodge: read('dodge'),
    avoid: read('avoid'), evade: read('evade'), pierce: read('pierce') });
}

/** Authored tuning independent of subsequent mutable catalog/registry changes. */
export const AMAZON_PASSIVE_DEFINITIONS = resolveAmazonPassiveDefinitions(amazonSkills);

/** Fresh stat modifiers; passive composition never changes resources or consumes RNG. */
export interface AmazonPassiveModifiers {
  readonly critChanceBonus: number;
  readonly attackMultiplier: number;
  readonly physDodgeBonus: number;
  readonly magicDodgeBonus: number;
  readonly physicalDamagePct: number;
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
  const bonus = (key: PassiveKey, stat: typeof statKeys[number]) => rank(key) * definitions[key].perRank[stat];
  return Object.freeze({
    critChanceBonus: bonus('criticalStrike', 'critChancePct'),
    attackMultiplier: 1 + bonus('penetrate', 'attackPct') + bonus('pierce', 'attackPct'),
    physDodgeBonus: bonus('dodge', 'physDodgePct') + bonus('evade', 'physDodgePct'),
    magicDodgeBonus: bonus('avoid', 'magicDodgePct') + bonus('evade', 'magicDodgePct'),
    physicalDamagePct: bonus('pierce', 'physicalDamagePct'),
  });
}
