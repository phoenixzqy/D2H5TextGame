/** Complete direct gem-fusion inputs, conditional on fixed repeatable settlements. */
import { materialRecipes } from '@/data/loaders/material-recipes';
import { materialCatalog } from '@/data/loaders/materials';
import { analyzeRecipeAcquisition, measurePlannedRecipeSources, type RecipeSupply } from './recipe-acquisition';
import type { measurePlannedMaterialBudgets } from './planned-material-budget';

const surplus = 'surplus-gem';

function fusionDemand(recipeId: string) {
  const recipe = materialRecipes.get(recipeId), input = recipe && Object.entries(recipe.costs.materials)[0];
  if (!recipe || recipe.kind !== 'gem-fusion' || !input || Object.keys(recipe.costs.materials).length !== 1 ||
    materialCatalog.get(input[0])?.kind !== 'gem' || recipe.costs.currencies['gem-shard'] !== 1 ||
    Object.keys(recipe.costs.currencies).length !== 1) throw new Error('Unsupported gem-fusion cost contract');
  // One extra gem pays the fee exactly when every gem has a free, one-gem dismantle yielding >=1 shard.
  for (const gem of materialCatalog.values()) {
    if (gem.kind !== 'gem') continue;
    const dismantle = materialRecipes.get(`recipes/gem-dismantle/${gem.id.slice('gems/'.length)}`);
    if (!dismantle || dismantle.kind !== 'gem-dismantle' || !('output' in dismantle) ||
      dismantle.costs.materials[gem.id] !== 1 || Object.keys(dismantle.costs.materials).length !== 1 ||
      Object.keys(dismantle.costs.currencies).length || Object.keys(dismantle.output.materials).length ||
      Object.keys(dismantle.output.currencies).length !== 1 || (dismantle.output.currencies['gem-shard'] ?? 0) < 1) {
      throw new Error('Unsupported gem-fusion catalyst contract');
    }
  }
  return { recipe, target: input[0], count: input[1] };
}

/**
 * From empty materials/currency, reserve the direct fusion input and dismantle one
 * surplus gem. Completion is (target>=k and other>=1) OR target>=k+1. The existing
 * joint model retains exclusive identities, quantity mixtures and their overlap.
 * Lower-quality fusion chains and competing spending are outside this policy.
 */
export function analyzeGemFusionAcquisition(recipeId: string, supplies: readonly RecipeSupply[], horizon: number) {
  const { target, count } = fusionDemand(recipeId);
  // Also validates original quantities before irrelevant non-gem outcomes are collapsed.
  const materialOnly = analyzeRecipeAcquisition({ [target]: count }, supplies, horizon);
  const gemSupplies = supplies.map(supply => ({ ...supply, channels: supply.channels.map(channel => ({
    ...channel, outcomes: channel.outcomes.map(outcome => materialCatalog.get(outcome.materialId ?? '')?.kind === 'gem'
      ? { ...outcome, materialId: outcome.materialId === target ? target : surplus }
      : { ...outcome, materialId: null, quantity: 0 })
  })) }));
  const otherGem = analyzeRecipeAcquisition({ [target]: count, [surplus]: 1 }, gemSupplies, horizon);
  const extraTarget = analyzeRecipeAcquisition({ [target]: count + 1 }, gemSupplies, horizon);
  const overlap = analyzeRecipeAcquisition({ [target]: count + 1, [surplus]: 1 }, gemSupplies, horizon);
  const completionByClear = materialOnly.completionByClear.map((point, index) => {
    const a = otherGem.completionByClear[index], b = extraTarget.completionByClear[index], c = overlap.completionByClear[index];
    if (!a || !b || !c) throw new Error('Incomplete gem-fusion distribution');
    const probability = a.probability + b.probability - c.probability;
    if (probability < -1e-10 || probability > point.probability + 1e-10) throw new Error('Gem-fusion probability drift');
    return { clear: point.clear, probability: Math.max(0, Math.min(point.probability, probability)) };
  });
  const last = completionByClear.at(-1);
  if (!last) throw new Error('Missing gem-fusion horizon');
  const completeCost = { horizon, completionByClear,
    medianClear: completionByClear.find(point => point.probability >= .5)?.clear ?? null,
    p95Clear: completionByClear.find(point => point.probability >= .95)?.clear ?? null,
    restrictedMeanClears: 1 + completionByClear.slice(0, -1).reduce((sum, point) => sum + 1 - point.probability, 0),
    unresolvedProbability: 1 - last.probability };
  return { recipeId, materialOnly, completeCost };
}

/** All28 native direct gem-fusion recipes, including their dismantling-funded catalyst. */
export function measurePlannedGemFusionBudgets(planned: ReturnType<typeof measurePlannedMaterialBudgets>) {
  const { plans, sources } = measurePlannedRecipeSources(planned);
  const recipes = [...materialRecipes.values()].filter(recipe => recipe.kind === 'gem-fusion');
  const sourceIndex = new Map(sources.map(source => [source.id, source]));
  return { version: 1, scope: 'direct-gem-fusion-with-surplus-gem-catalyst',
    probabilityModel: 'independent-uniform-32-bit-output-draws', openingStock: { materials: {}, currencies: {} },
    policy: 'reserve-direct-inputs-then-dismantle-one-surplus-gem-v1', horizon: 128, scan: planned.scan,
    plans: plans.map(({ materials: _materials, ...plan }) => plan), sources, recipes,
    dismantles: [...materialRecipes.values()].filter(recipe => recipe.kind === 'gem-dismantle'),
    results: plans.flatMap(plan => recipes.map(recipe => ({ areaId: plan.areaId, ordinal: plan.ordinal,
      ...analyzeGemFusionAcquisition(recipe.id, plan.kills.map(kill => {
        const source = sourceIndex.get(kill.sourceId);
        if (!source) throw new Error('Missing gem-fusion supply source');
        return { count: kill.count, channels: source.channels };
      }), 128) }))),
    limitations: [
      'Every clear repeats its fixed native plan with one authorized repeatable settlement per planned spawn; combat success and encounter frequency are conditional.',
      'All draws, settlements and clears assume independent uniform outputs, not measured PRNG seed populations.',
      'A distinct surplus gem is dismantled to pay the whole one-shard fee; fusion inputs cannot simultaneously fund their catalyst.',
      'Opening materials and currencies are empty; every acquired gem is retained until this single craft, with no competing spending.',
      'Only direct input acquisition is modeled: lower-quality fusion chains, other recipes, gear and existing currency are excluded.',
      'Find Item, summoned enemies, first-kill/quest/endgame rewards and quest-specific replacement settlements are excluded.',
      'Completion counts full clears before dismantle/fusion actions; no menu/decision time or player hours is inferred.',
      'Null quantiles do not reach the threshold within128 clears; restricted mean is E[min(T,128)].',
      'This does not establish all-source affordability, final pacing, earned campaign progress or formal balance acceptance.'
    ] };
}
