import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { materialRecipes } from '@/data/loaders/material-recipes';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import { materialCatalog } from '@/data/loaders/materials';
import { planMaterialAction, prepareMaterialAction, validateMaterialActionSelection,
  type MaterialActionContext, type MaterialActionInventory } from '@/engine/crafting/material-actions';
import { analyzeGemFusionAcquisition, measurePlannedGemFusionBudgets } from './gem-fusion-acquisition';
import { measurePlannedMaterialBudgets } from './planned-material-budget';
import { type RecipeSupply } from './recipe-acquisition';
import { assertSourceStable, collectSourceState, validateOutputPath, writeNewReport } from './provenance';

const recipeId = 'recipes/gem-fusion/ruby/chipped';
const target = 'gems/ruby/chipped', other = 'gems/diamond/perfect';
const oneDraw = [{ count: 1, probability: 1 }];

it('reserves the fusion inputs and pays its catalyst from a distinct acquired gem', () => {
  const supply: RecipeSupply = { count: 1, channels: [{ draws: oneDraw, outcomes: [
    { materialId: target, quantity: 1, probability: .5 },
    { materialId: other, quantity: 1, probability: .25 },
    { materialId: 'runes/el', quantity: 1, probability: .25 }
  ] }] };
  const result = analyzeGemFusionAcquisition(recipeId, [supply], 4);
  expect(result.materialOnly.completionByClear.map(row => row.probability)).toEqual([0, 0, .125, .3125]);
  // Four draws: TTTT, or one of four permutations of TTTO. A rune cannot pay the fee.
  expect(result.completeCost.completionByClear.map(row => row.probability)).toEqual([0, 0, 0, .1875]);
  expect(result.completeCost.medianClear).toBeNull();
  expect(result.completeCost.restrictedMeanClears).toBe(4);
});

it('allows a fourth target gem to pay the fee without counting the same gem twice', () => {
  const supply: RecipeSupply = { count: 1, channels: [{ draws: oneDraw, outcomes: [
    { materialId: target, quantity: 1, probability: .5 },
    { materialId: null, quantity: 0, probability: .5 }
  ] }] };
  const result = analyzeGemFusionAcquisition(recipeId, [supply], 5);
  expect(result.completeCost.completionByClear.map(row => row.probability)).toEqual([0, 0, 0, .0625, .1875]);
});

it('retains exclusive multi-unit rewards and random draw quantities', () => {
  const quantity: RecipeSupply = { count: 1, channels: [{ draws: oneDraw, outcomes: [
    { materialId: target, quantity: 3, probability: .5 },
    { materialId: other, quantity: 1, probability: .5 }
  ] }] };
  expect(analyzeGemFusionAcquisition(recipeId, [quantity], 2).completeCost.completionByClear
    .map(row => row.probability)).toEqual([0, .75]);
  const bundle: RecipeSupply = { count: 1, channels: [{
    draws: [{ count: 3, probability: .5 }, { count: 4, probability: .5 }], outcomes: [
      { materialId: target, quantity: 1, probability: .5 },
      { materialId: other, quantity: 1, probability: .5 }
    ]
  }] };
  expect(analyzeGemFusionAcquisition(recipeId, [bundle], 1).completeCost.completionByClear[0]?.probability)
    .toBe(.15625);
});

it('refuses other recipe families and malformed supplies instead of dropping invalid outcomes', () => {
  for (const id of ['absent', 'recipes/gem-dismantle/ruby/chipped', 'recipes/rune-fusion/el']) {
    expect(() => analyzeGemFusionAcquisition(id, [], 1)).toThrow(/gem.fusion/i);
  }
  expect(() => analyzeGemFusionAcquisition(recipeId, [{ count: 1, channels: [{ draws: oneDraw,
    outcomes: [{ materialId: 'runes/el', quantity: -1, probability: 1 }] }] }], 1)).toThrow(/quantity/i);
  expect(() => analyzeGemFusionAcquisition(recipeId, [], 0)).toThrow(/horizon/i);
});

it('matches native paid dismantle then fusion for every authored gem-fusion recipe', () => {
  const context: MaterialActionContext = { characterId: 'numeric-gem-check', highestUnlockedAct: 1,
    difficulty: 'normal', backpackCapacity: 100, stashCapacity: 500, reservedItemIds: new Set(),
    otherOwnedItemIds: new Set(), bases: loadItemBases(), affixes: loadAffixPool() };
  const recipes = [...materialRecipes.values()].filter(row => row.kind === 'gem-fusion');
  expect(recipes).toHaveLength(28);
  const pay = (state: MaterialActionInventory, id: string) => {
    const plan = planMaterialAction(state, context, prepareMaterialAction(state, context, { recipeId: id }));
    if (!plan.next) throw new Error('Missing paid crafting projection');
    return plan.next;
  };
  for (const recipe of recipes) {
    const input = Object.entries(recipe.costs.materials)[0];
    if (!input || !('output' in recipe)) throw new Error('Missing fusion input/output');
    const [gem, count] = input;
    const empty: MaterialActionInventory = { backpack: [], stash: [], quarantine: [],
      materialActionOrdinal: 0, materials: { [gem]: count }, currencies: {} };
    expect(() => {
      validateMaterialActionSelection(empty, context, { recipeId: recipe.id });
    }).toThrow(/currency/i);
    for (const sacrifice of [gem, other]) {
      const acquired = { ...empty, materials: { [gem]: count, [sacrifice]: sacrifice === gem ? count + 1 : 1 } };
      const before = structuredClone(acquired);
      const catalyst = materialRecipes.get(`recipes/gem-dismantle/${sacrifice.slice('gems/'.length)}`);
      if (!catalyst || !('output' in catalyst)) throw new Error('Missing sacrifice recipe');
      const dismantled = pay(acquired, catalyst.id), fused = pay(dismantled, recipe.id);
      expect(dismantled.materials[gem]).toBe(count);
      expect(fused.materials).toEqual(recipe.output.materials);
      expect(fused.currencies['gem-shard']).toBe((catalyst.output.currencies['gem-shard'] ?? 0) -
        (recipe.costs.currencies['gem-shard'] ?? 0));
      expect(fused.materialActionOrdinal).toBe(2);
      expect(acquired).toEqual(before);
    }
  }
  expect([...materialCatalog.values()].filter(row => row.kind === 'gem')).toHaveLength(35);
});

it('reports complete-cost distributions for all28 recipes over the eight native plans', () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.GEM_FUSION_ACQUISITION_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const before = collectSourceState(root), planned = measurePlannedMaterialBudgets();
  const report = measurePlannedGemFusionBudgets(planned);
  expect(report.plans).toHaveLength(8);
  expect(report.recipes).toHaveLength(28);
  expect(report.results).toHaveLength(224);
  expect(report.dismantles).toHaveLength(35);
  for (const row of report.results) {
    expect(row.completeCost.completionByClear).toHaveLength(128);
    let previous = 0;
    for (const [index, point] of row.completeCost.completionByClear.entries()) {
      expect(point.probability).toBeGreaterThanOrEqual(-1e-12);
      expect(point.probability + 1e-12).toBeGreaterThanOrEqual(previous);
      expect(point.probability).toBeLessThanOrEqual((row.materialOnly.completionByClear[index]?.probability ?? 0) + 1e-12);
      previous = point.probability;
    }
  }
  expect(report).not.toHaveProperty('completionHours');
  assertSourceStable(before, collectSourceState(root));
  if (output !== undefined) writeNewReport(root, output, { ...report, sourceState: before });
}, 30_000);
