import necromancer from '../../data/skills/necromancer.json';
import druid from '../../data/skills/druid.json';
import type { DamageType } from '../types/attributes';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

/** Exact player identities; these passives do not transfer to summons or mercs. */
export const DAMAGE_MASTERY_IDENTITIES = {
  poison: { authored: 'skills-necromancer-poison-mastery', canonical: 'necromancer.poison_mastery', classId: 'necromancer' },
  elemental: { authored: 'skills-druid-elemental-mastery', canonical: 'druid.elemental_mastery', classId: 'druid' },
} as const;
type MasteryKey = keyof typeof DAMAGE_MASTERY_IDENTITIES;
const statKeys = ['poisonDamagePct', 'arcaneDamagePct', 'elementalDamagePct', 'magicDodgePct'] as const;
/** Immutable JSON tuning for one automatically composed player mastery. */
export interface DamageMasteryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: Readonly<Record<typeof statKeys[number], number>>;
}
export type DamageMasteryDefinitions = Readonly<Record<MasteryKey, DamageMasteryDefinition>>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate exact authored identities and copy primitive tuning without retaining caller rows. */
export function resolveDamageMasteryDefinitions(rows: readonly unknown[]): DamageMasteryDefinitions {
  const read = (key: MasteryKey): DamageMasteryDefinition => {
    const { authored } = DAMAGE_MASTERY_IDENTITIES[key];
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === authored);
    if (matches.length !== 1) throw new Error('Expected exactly one authored ' + authored);
    const row = matches[0];
    if (!validate(row)) throw new Error('Invalid authored ' + authored);
    const perRank = row.scaling?.passiveStatsPerLevel;
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      perRank: Object.freeze({ poisonDamagePct: perRank?.poisonDamagePct ?? 0,
        arcaneDamagePct: perRank?.arcaneDamagePct ?? 0, elementalDamagePct: perRank?.elementalDamagePct ?? 0,
        magicDodgePct: perRank?.magicDodgePct ?? 0 }) });
  };
  return Object.freeze({ poison: read('poison'), elemental: read('elemental') });
}
/** Independent tuning snapshots; the catalog and registry remain mutable as before. */
export const DAMAGE_MASTERY_DEFINITIONS = resolveDamageMasteryDefinitions([...necromancer, ...druid]);

/** Fresh personal bonuses; damage uses the existing direct-hit and hit-derived DoT pipeline. */
export interface DamageMasteryModifiers {
  readonly increasedDamagePct: Readonly<Partial<Record<DamageType, number>>>;
  readonly magicDodgeBonus: number;
}
/** Compose max-once exact allocated ranks, guarded by their own class and authored unlock. */
export function composeDamageMasteries(
  input: { readonly classId: string; readonly level: number; readonly skillLevels?: Readonly<Record<string, number>> },
  definitions: DamageMasteryDefinitions = DAMAGE_MASTERY_DEFINITIONS,
): DamageMasteryModifiers {
  const rank = (key: MasteryKey): number => {
    const definition = definitions[key], identity = DAMAGE_MASTERY_IDENTITIES[key];
    if (input.classId !== identity.classId || !Number.isFinite(input.level) || input.level < definition.requiredLevel) return 0;
    let rank = 0;
    for (const alias of [identity.authored, identity.canonical]) {
      const value = input.skillLevels?.[alias];
      if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
        rank = Math.max(rank, Math.min(definition.maxRank, value));
      }
    }
    return rank;
  };
  const poison = rank('poison'), elemental = rank('elemental');
  const damage: Partial<Record<DamageType, number>> = {};
  if (poison > 0) {
    damage.poison = definitions.poison.perRank.poisonDamagePct * poison;
    damage.arcane = definitions.poison.perRank.arcaneDamagePct * poison;
  }
  if (elemental > 0) {
    damage.fire = definitions.elemental.perRank.elementalDamagePct * elemental;
    damage.cold = definitions.elemental.perRank.elementalDamagePct * elemental;
  }
  return Object.freeze({ increasedDamagePct: Object.freeze(damage),
    magicDodgeBonus: definitions.elemental.perRank.magicDodgePct * elemental });
}
