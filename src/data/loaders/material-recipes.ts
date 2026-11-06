import Ajv2020 from 'ajv/dist/2020';
import json from '../items/material-recipes.json';
import { compileAuthoredValidator } from '../authored-validators';
import { isMaterialLedger, type MaterialLedger } from '@/engine/loot/materials';
import { materialEconomy } from './materials';
import type { EquipmentSlot, Rarity } from '@/engine/types/items';

/** Only these conserved balances participate in player crafting. */
export type CraftingCurrencies = Readonly<Partial<Record<'rune-shard' | 'gem-shard', number>>>;
/** Closed material/currency bag; empty maps are explicit. */
export interface CraftingBag { readonly materials: MaterialLedger; readonly currencies: CraftingCurrencies }
interface RecipeBase { readonly id: string; readonly nameKey: string; readonly costs: CraftingBag }
/** Data-backed target restrictions; all transforms require owned unequipped backpack gear. */
export interface RecipeTarget {
  readonly type: 'gear' | 'armor' | 'jewelry';
  readonly slot?: EquipmentSlot;
  readonly rarities: readonly Rarity[];
  readonly emptyContents: boolean;
  readonly identified?: boolean;
}
export type MaterialRecipe = (RecipeBase & {
  readonly kind: 'rune-fusion' | 'gem-fusion' | 'gem-dismantle'; readonly output: CraftingBag;
}) | (RecipeBase & { readonly kind: 'socket-armor'; readonly target: RecipeTarget; readonly minimumSockets: number })
  | (RecipeBase & { readonly kind: 'socket-clear'; readonly target: RecipeTarget })
  | (RecipeBase & { readonly kind: 'caster-amulet'; readonly target: RecipeTarget;
    readonly fixedAffix: { readonly affixId: string; readonly values: Readonly<Record<string, number>> } });
/** Complete v1 recipe and shared salvage/insertion rules. */
export interface MaterialRecipeRules {
  readonly version: 1;
  readonly recipes: readonly MaterialRecipe[];
  readonly salvage: { readonly materialId: string; readonly levelBandSize: number;
    readonly rarityYields: Readonly<Record<Rarity, number>> };
  readonly insertion: { readonly quantity: number };
}

const check = compileAuthoredValidator<MaterialRecipeRules>(new Ajv2020({ strict: true, allErrors: true }), 'recipes');
const onlyEntry = (ledger: MaterialLedger): readonly [string, number] | undefined => {
  const entries = Object.entries(ledger);
  return entries.length === 1 ? entries[0] : undefined;
};

/** Validate the closed document, all material IDs, complete families and adjacent upgrades. */
export function validateMaterialRecipes(value: unknown): MaterialRecipeRules {
  if (!check(value)) throw new Error('Invalid material recipe catalog');
  const expected = new Set([
    ...materialEconomy.gemTypes.flatMap(type => materialEconomy.gemQualities.flatMap((quality, index) => [
      `recipes/gem-dismantle/${type}/${quality}`,
      ...(index < materialEconomy.gemQualities.length - 1 ? [`recipes/gem-fusion/${type}/${quality}`] : [])
    ])),
    ...materialEconomy.runeOrder.slice(0, -1).map(id => `recipes/rune-fusion/${id.slice('runes/'.length)}`),
    'recipes/socket-armor', 'recipes/socket-clear', 'recipes/caster-amulet'
  ]);
  for (const recipe of value.recipes) {
    if (!expected.delete(recipe.id) || !isMaterialLedger(recipe.costs.materials)) throw new Error('Invalid recipe identity or costs');
    if (!('output' in recipe)) {
      if (recipe.id !== `recipes/${recipe.kind}`) throw new Error('Invalid transform identity');
      continue;
    }
    if (!isMaterialLedger(recipe.output.materials)) throw new Error('Invalid recipe outputs');
    const input = onlyEntry(recipe.costs.materials), output = onlyEntry(recipe.output.materials);
    if (!input) throw new Error('Invalid exchange input');
    const [source] = input;
    let expectedId: string, destination: string | undefined;
    if (recipe.kind === 'rune-fusion') {
      const index = materialEconomy.runeOrder.indexOf(source);
      expectedId = `recipes/rune-fusion/${source.slice('runes/'.length)}`;
      destination = index >= 0 ? materialEconomy.runeOrder[index + 1] : undefined;
    } else {
      const [namespace, type, quality] = source.split('/');
      const index = materialEconomy.gemQualities.indexOf(quality ?? '');
      if (namespace !== 'gems' || !type || index < 0) throw new Error('Invalid gem exchange input');
      expectedId = `recipes/${recipe.kind}/${type}/${quality ?? ''}`;
      destination = materialEconomy.gemQualities[index + 1] ? `gems/${type}/${materialEconomy.gemQualities[index + 1] ?? ''}` : undefined;
      if (recipe.kind === 'gem-dismantle') {
        if (Object.keys(recipe.output.materials).length || recipe.output.currencies['gem-shard'] !== index + 1
          || Object.keys(recipe.output.currencies).length !== 1) throw new Error('Invalid dismantling output');
        if (recipe.id !== expectedId) throw new Error('Invalid dismantling identity');
        continue;
      }
    }
    if (recipe.id !== expectedId || !destination || !output || output[0] !== destination || output[1] !== 1
      || Object.keys(recipe.output.currencies).length) throw new Error('Nonadjacent material fusion');
  }
  if (expected.size) throw new Error('Incomplete material recipe catalog');
  return value;
}

/** Validated quantities, predicates and salvage progression authored in JSON. */
export const materialRecipeRules = validateMaterialRecipes(json);
/** All98 complete recipes in authored stable UI order. */
export const materialRecipes: ReadonlyMap<string, MaterialRecipe> = new Map(materialRecipeRules.recipes.map(row => [row.id, row]));
