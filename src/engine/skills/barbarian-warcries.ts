import skills from '../../data/skills/barbarian.json';
import type { SkillDef } from '../types/skills';
import { createSkillValidator } from './skill-validator';

/** Exact allocation identities; no item grants or inferred combo ranks. */
export const BARBARIAN_WARCRY_IDENTITIES = {
  shout: ['skills-barbarian-shout', 'barbarian.shout'],
  orders: ['skills-barbarian-battle-orders', 'barbarian.battle_orders'],
} as const;
type WarcryKey = keyof typeof BARBARIAN_WARCRY_IDENTITIES;
/** Primitive JSON tuning copied independently of mutable catalog/registry rows. */
export interface BarbarianWarcryDefinition {
  readonly requiredLevel: number;
  readonly maxRank: number;
  readonly perRank: Readonly<{ lifePct: number; defensePct: number; manaRegenPct: number }>;
}
export type BarbarianWarcryDefinitions = Readonly<Record<WarcryKey, BarbarianWarcryDefinition>>;
const validate = createSkillValidator<SkillDef & { readonly requiredLevel: number }>();

/** Validate exactly one of each supported authored row, then copy and freeze. */
export function resolveBarbarianWarcryDefinitions(rows: readonly unknown[]): BarbarianWarcryDefinitions {
  const read = (key: WarcryKey): BarbarianWarcryDefinition => {
    const id = BARBARIAN_WARCRY_IDENTITIES[key][0];
    const matches = rows.filter(row => typeof row === 'object' && row !== null && 'id' in row && row.id === id);
    if (matches.length !== 1) throw new Error('Expected exactly one authored ' + id);
    const row = matches[0];
    if (!validate(row)) throw new Error('Invalid authored ' + id);
    const source = row.scaling?.passiveStatsPerLevel;
    return Object.freeze({ requiredLevel: row.requiredLevel, maxRank: row.maxLevel,
      perRank: Object.freeze({ lifePct: source?.lifePct ?? 0, defensePct: source?.defensePct ?? 0,
        manaRegenPct: source?.manaRegenPct ?? 0 }) });
  };
  return Object.freeze({ shout: read('shout'), orders: read('orders') });
}
/** Immutable authored coefficients used by native composition and localized details. */
export const BARBARIAN_WARCRY_DEFINITIONS = resolveBarbarianWarcryDefinitions(skills);

/** Resolve MAX of valid allocated aliases once; native learning owns prerequisites. */
export function resolveBarbarianWarcryRank(key: WarcryKey, levels?: Readonly<Record<string, number>>,
  definitions: BarbarianWarcryDefinitions = BARBARIAN_WARCRY_DEFINITIONS): number {
  let rank = 0;
  for (const id of BARBARIAN_WARCRY_IDENTITIES[key]) {
    const allocated = levels?.[id];
    if (typeof allocated === 'number' && Number.isFinite(allocated) && Number.isInteger(allocated) && allocated > 0) {
      rank = Math.max(rank, Math.min(definitions[key].maxRank, allocated));
    }
  }
  return rank;
}

/** Additive personal bonuses, composed once over fresh equipment/quest baselines. */
export function composeBarbarianWarcries(input: { readonly classId: string; readonly level: number;
  readonly skillLevels?: Readonly<Record<string, number>> },
  definitions: BarbarianWarcryDefinitions = BARBARIAN_WARCRY_DEFINITIONS) {
  const rank = (key: WarcryKey): number => input.classId === 'barbarian' && Number.isInteger(input.level) &&
    input.level >= definitions[key].requiredLevel ? resolveBarbarianWarcryRank(key, input.skillLevels, definitions) : 0;
  const shout = rank('shout'), orders = rank('orders');
  return Object.freeze({ defenseBonus: shout * definitions.shout.perRank.defensePct,
    lifeBonus: orders * definitions.orders.perRank.lifePct,
    manaRegenBonus: orders * definitions.orders.perRank.manaRegenPct });
}
