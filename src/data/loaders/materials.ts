import { compileAuthoredValidator } from '../authored-validators';
import Ajv2020 from 'ajv/dist/2020';
import catalogJson from '../items/materials.json';
import runesJson from '../items/runes.json';
import economyJson from '../loot/material-economy.json';
import type { MonsterTier } from '@/engine/combat/types';

/** Canonical stack definition; effects and crafting remain separate catalogs. */
export interface MaterialDefinition {
  readonly id: string;
  readonly kind: 'rune' | 'gem' | 'scrap';
  readonly nameKey: string;
}

/** Authored acquisition context, independent of table names and monster levels. */
export interface MaterialProfile {
  readonly act: 1 | 2 | 3 | 4 | 5;
  readonly difficulty: 'normal' | 'nightmare' | 'hell';
}

/** Authored secondary currency amounts; no persisted currency identity changes. */
export interface CurrencyRewardRules {
  readonly runeShards: {
    readonly basePerLevel: number;
    readonly tierMultipliers: Readonly<Record<MonsterTier, number>>;
    readonly varianceMin: number;
    readonly varianceSpan: number;
  };
  readonly wishstones: {
    /** Guaranteed ordinary-area first-clear award, once per difficulty ledger. */
    readonly firstClearAmount: number;
    /** Probability of retaining a kill's combined direct and secondary wishes. */
    readonly killChance: number;
    readonly championChance: number;
    readonly byTierAndAct: Readonly<Record<MonsterTier, readonly number[]>>;
    readonly bossDifficultyMultipliers: Readonly<Record<MaterialProfile['difficulty'], number>>;
  };
}

/** Complete independent material bundle; omitted gem maximum means fixed count. */
export interface MaterialRewardBundle {
  readonly runePoolAct: MaterialProfile['act'];
  readonly runeQuantityMin: number;
  readonly runeQuantityMax: number;
  readonly runeMinOrdinal: number;
  readonly runeMaxOrdinal: number;
  readonly gemQuantity: number;
  readonly gemQuantityMax?: number;
}

/** Complete materials for one live chapter-boss table; ordinary drops are separate. */
export interface ChapterBossMaterialBundle extends MaterialRewardBundle {
  readonly act: MaterialProfile['act'];
}

/** Bounded live goblin equipment, material and gated wishstone policy; caches use the raw table. */
export interface TreasureGoblinRewardPolicy {
  readonly treasureClassId: string;
  readonly equipmentPicks: number;
  readonly terminalLevelCap: number;
  readonly runePoolActOffset: number;
  readonly runeQuantityMin: number;
  readonly runeQuantityMax: number;
  readonly gemQuantityMin: number;
  readonly gemQuantityMax: number;
  readonly wishstoneQuantityMin: number;
  readonly wishstoneQuantityMax: number;
}

/** Stable version-one pool order and weights from the accepted D10 contract. */
export interface MaterialEconomy {
  readonly version: 1;
  readonly currencyRewards: CurrencyRewardRules;
  readonly chapterBossMaterials: Readonly<Record<string, ChapterBossMaterialBundle>>;
  readonly treasureGoblin: TreasureGoblinRewardPolicy;
  /** Independent per-kill gates; identity pools are sampled only on success. */
  readonly independentDropChances: Readonly<Record<MonsterTier, {
    readonly rune: number;
    readonly gem: number;
  }>>;
  readonly runeOrder: readonly string[];
  readonly runeWeights: readonly number[];
  readonly actRuneCaps: readonly number[];
  readonly nonHellRuneCap: number;
  readonly highRuneMinOrdinal: number;
  readonly highRuneAllowedTiers: readonly MonsterTier[];
  readonly gemTypes: readonly string[];
  readonly gemQualities: readonly string[];
  readonly actGemCaps: readonly number[];
  readonly nonHellGemCap: number;
  readonly gemQualityWeights: Readonly<Record<MonsterTier, readonly number[]>>;
  readonly profiles: Readonly<Record<string, MaterialProfile>>;
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateCatalog = compileAuthoredValidator<MaterialDefinition[]>(ajv, 'materials');
const validateEconomy = compileAuthoredValidator<MaterialEconomy>(ajv, 'economy');

/** Validate JSON shape and all cross-catalog identities before exposing pools. */
export function validateMaterialDefinitions(catalog: unknown, economy: unknown): {
  readonly catalog: ReadonlyMap<string, MaterialDefinition>;
  readonly economy: MaterialEconomy;
} {
  if (!validateCatalog(catalog) || !validateEconomy(economy)) throw new Error('Invalid material definitions');
  const goblin = economy.treasureGoblin;
  if (goblin.runeQuantityMin > goblin.runeQuantityMax || goblin.gemQuantityMin > goblin.gemQuantityMax) {
    throw new Error('Inconsistent treasure-goblin material bundle');
  }
  if (goblin.wishstoneQuantityMin > goblin.wishstoneQuantityMax) {
    throw new Error('Inconsistent treasure-goblin wishstone range');
  }
  const map = new Map(catalog.map(def => [def.id, Object.freeze({ ...def })]));
  const expected = new Map<string, MaterialDefinition['kind']>([
    ...runesJson.map(rune => [rune.id, 'rune'] as const),
    ...economy.gemTypes.flatMap(type => economy.gemQualities.map(quality =>
      [`gems/${type}/${quality}`, 'gem'] as const)),
    ['materials/scrap', 'scrap']
  ]);
  if (Object.entries(economy.chapterBossMaterials).some(([id, rule]) =>
    id !== `loot/act${String(rule.act)}-boss` || rule.runeQuantityMin > rule.runeQuantityMax ||
    rule.runeMinOrdinal > rule.runeMaxOrdinal ||
    rule.runeMaxOrdinal > (economy.actRuneCaps[rule.runePoolAct - 1] ?? 0) ||
    rule.runeMinOrdinal > Math.min(economy.nonHellRuneCap, economy.highRuneMinOrdinal - 1))) {
    throw new Error('Inconsistent chapter-boss material bundle');
  }
  if (map.size !== catalog.length || map.size !== expected.size ||
    [...expected].some(([id, kind]) => map.get(id)?.kind !== kind) ||
    economy.runeOrder.some((id, index) => id !== runesJson[index]?.id) ||
    !Number.isSafeInteger(economy.runeWeights.reduce((sum, weight) => sum + weight, 0)) ||
    Object.values(economy.gemQualityWeights).some(weights => {
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      return total <= 0 || !Number.isSafeInteger(total);
    })) throw new Error('Inconsistent material catalogs or pools');
  return { catalog: map, economy };
}

const validated = validateMaterialDefinitions(catalogJson, economyJson);
/** Schema-validated closed set of ownable materials. */
export const materialCatalog = validated.catalog;
/** Schema-validated deterministic acquisition parameters. */
export const materialEconomy = validated.economy;
