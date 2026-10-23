import Ajv2020 from 'ajv/dist/2020';
import gemJson from '../items/gem-effects.json';
import runeJson from '../items/runes.json';
import wordJson from '../items/runewords.json';
import gemSchema from '../schema/gem-effects.schema.json';
import runeSchema from '../schema/rune.schema.json';
import wordSchema from '../schema/runeword.schema.json';
import { materialCatalog } from './materials';
import type { ItemBonusStats, Rune, RuneWord } from '@/engine/types/items';

/** Concrete, schema-validated bonuses for each quality of a socketable gem. */
export interface GemEffectDefinition {
  readonly id: string;
  readonly weaponEffect: ItemBonusStats;
  readonly armorEffect: ItemBonusStats;
  readonly shieldEffect: ItemBonusStats;
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const checkGems = ajv.compile<GemEffectDefinition[]>(gemSchema);
const checkRune = ajv.compile<Rune>(runeSchema);
const checkWord = ajv.compile<RuneWord>(wordSchema);

/** Reject missing, duplicate, unknown or malformed effects before exposing a catalog. */
export function validateGemEffects(value: unknown): ReadonlyMap<string, GemEffectDefinition> {
  if (!checkGems(value)) throw new Error('Invalid gem effect catalog');
  const map = new Map(value.map(gem => [gem.id, gem]));
  const ids = [...materialCatalog.values()].filter(material => material.kind === 'gem').map(material => material.id);
  if (map.size !== value.length || map.size !== ids.length || ids.some(id => !map.has(id))) {
    throw new Error('Inconsistent gem effect identities');
  }
  return map;
}

if (!runeJson.every(rune => checkRune(rune)) || !wordJson.every(word => checkWord(word))) {
  throw new Error('Invalid rune or runeword effect catalog');
}
/** Validated canonical gem effects, separate from material ownership identities. */
export const gemEffects = validateGemEffects(gemJson);
/** Validated plain rune packages. */
export const runeEffects: ReadonlyMap<string, Rune> = new Map(runeJson.map(rune => [rune.id, rune as Rune]));
/** Validated complete live runeword predicates and packages. */
export const socketRunewords: readonly RuneWord[] = wordJson as RuneWord[];
