/**
 * Runeword resolution.
 *
 * Source: docs/design/items-spec.md §9.
 *
 * A runeword is recognized when:
 *  - The base item is white,
 *  - has exactly the required socket count,
 *  - the socketed runes match the recipe sequence in order,
 *  - and the base type is in the recipe's allowedBases list.
 *
 * @module engine/loot/runeword
 */

import type { ItemBaseType, RuneWord } from '../types/items';

/** Recipe descriptor for the engine matcher. */
export interface RunewordRecipe {
  readonly id: string;
  readonly name: string;
  readonly runes: readonly string[];
  readonly sockets: number;
  readonly allowedBases: readonly ItemBaseType[];
  readonly reqLevel: number;
}

/** Built-in minimum-set recipes (Stealth, Spirit, Enigma). */
export const BUILTIN_RUNEWORDS: readonly RunewordRecipe[] = Object.freeze([
  {
    id: 'rw_stealth',
    name: 'Stealth',
    runes: ['tal', 'eth'],
    sockets: 2,
    allowedBases: ['armor'],
    reqLevel: 17
  },
  {
    id: 'rw_spirit',
    name: 'Spirit',
    runes: ['tal', 'thul', 'ort', 'amn'],
    sockets: 4,
    allowedBases: ['weapon'],
    reqLevel: 25
  },
  {
    id: 'rw_enigma',
    name: 'Enigma',
    runes: ['jah', 'ith', 'ber'],
    sockets: 3,
    allowedBases: ['armor'],
    reqLevel: 65
  }
]);

/** Input describing a candidate item for runeword matching. */
export interface RunewordCandidate {
  readonly baseType: ItemBaseType;
  readonly sockets: number;
  /** Inserted runes in socket order. */
  readonly runes: readonly string[];
  /** Must be a white (normal) base for D2-style runewords. */
  readonly isWhiteBase: boolean;
}

/**
 * Try to match a candidate against a recipe pool.
 * Returns the recipe id on match, else `undefined`.
 */
export function matchRuneword(
  candidate: RunewordCandidate,
  recipes: readonly RunewordRecipe[] = BUILTIN_RUNEWORDS
): string | undefined {
  if (!candidate.isWhiteBase) return undefined;
  for (const recipe of recipes) {
    if (recipe.sockets !== candidate.sockets) continue;
    if (recipe.runes.length !== candidate.runes.length) continue;
    if (!recipe.allowedBases.includes(candidate.baseType)) continue;
    let ok = true;
    for (let i = 0; i < recipe.runes.length; i++) {
      if (recipe.runes[i] !== candidate.runes[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return recipe.id;
  }
  return undefined;
}

/** Adapt a {@link RuneWord} (game-data) to a {@link RunewordRecipe}. */
export function recipeFromData(rw: RuneWord): RunewordRecipe {
  return {
    id: rw.id,
    name: rw.name,
    runes: rw.runes,
    sockets: rw.sockets,
    allowedBases: rw.allowedBases,
    reqLevel: rw.reqLevel
  };
}
