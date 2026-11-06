/** Conditional recipe-material model; no campaign, time or affordability credit. */
import { loadAwardPools } from '@/data/loaders/loot';
import { materialEconomy } from '@/data/loaders/materials';
import { analyzeIndependentMaterialContext } from './material-acquisition';
import { analyzeMaterialBundle, catalogMaterialDemand } from './material-source-budgets';
import { analyzeMixedTcSource } from './mixed-tc-budgets';
import { measureEquipmentRewardSources } from './equipment-source-budget';
import type { measurePlannedMaterialBudgets } from './planned-material-budget';

interface MaterialOutcome {
  readonly materialId: string | null;
  readonly quantity: number;
  readonly probability: number;
}
/** One settlement's independent channels; identities within each draw are exclusive. */
export interface RecipeSupply {
  readonly count: number;
  readonly channels: readonly {
    readonly draws: readonly { readonly count: number; readonly probability: number }[];
    readonly outcomes: readonly MaterialOutcome[];
  }[];
}

function validateProbabilities(rows: readonly { readonly probability: number }[]) {
  if (!rows.length || rows.some(row => !Number.isFinite(row.probability) || row.probability < 0 || row.probability > 1) ||
    Math.abs(rows.reduce((sum, row) => sum + row.probability, 0) - 1) > 1e-12) {
    throw new Error('Invalid probability distribution');
  }
}

function valueAt<T>(values: ArrayLike<T>, index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error('Missing joint inventory state');
  return value;
}

/**
 * Capped joint inventory convolution from empty stock over repeated identical plans.
 * Quantity mixtures retain dependence between material counts. All output draws,
 * channels, settlements and clears are assumed independent uniform variates.
 */
export function analyzeRecipeAcquisition(demand: Readonly<Record<string, number>>,
  supplies: readonly RecipeSupply[], horizon: number) {
  if (!Number.isSafeInteger(horizon) || horizon < 1 || horizon > 10_000) throw new Error('Invalid analysis horizon');
  const entries = Object.entries(demand);
  if (!entries.length || entries.some(([id, count]) => !id || !Number.isSafeInteger(count) || count < 1)) {
    throw new Error('Invalid material demand');
  }
  const strides: number[] = [];
  let size = 1;
  for (const [, cap] of entries) {
    strides.push(size);
    size *= cap + 1;
    if (size > 256) throw new Error('Joint inventory state capacity exceeded');
  }
  const inventory = Array.from({ length: size }, (_, state) => entries.map(([, cap], dimension) =>
    Math.floor(state / valueAt(strides, dimension)) % (cap + 1)));
  const transitions = inventory.map(left => inventory.map(right => entries.reduce((sum, [, cap], dimension) =>
    sum + Math.min(cap, valueAt(left, dimension) + valueAt(right, dimension)) * valueAt(strides, dimension), 0)));
  const empty = () => { const pmf = new Float64Array(size); pmf[0] = 1; return pmf; };
  const combine = (left: Float64Array, right: Float64Array) => {
    const result = new Float64Array(size);
    for (let a = 0; a < size; a++) if (left[a]) {
      for (let b = 0; b < size; b++) if (right[b]) {
        const target = valueAt(valueAt(transitions, a), b);
        result[target] = valueAt(result, target) + valueAt(left, a) * valueAt(right, b);
      }
    }
    return result;
  };
  const power = (pmf: Float64Array, count: number) => {
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid draw count');
    let result = empty(), base = pmf;
    while (count > 0) {
      if (count % 2 === 1) result = combine(result, base);
      count = Math.floor(count / 2);
      if (count) base = combine(base, base);
    }
    return result;
  };
  let plan = empty();
  for (const supply of supplies) {
    if (!Number.isSafeInteger(supply.count) || supply.count < 1) throw new Error('Invalid settlement count');
    let settlement = empty();
    for (const channel of supply.channels) {
      validateProbabilities(channel.outcomes);
      validateProbabilities(channel.draws);
      const draw = new Float64Array(size);
      for (const outcome of channel.outcomes) {
        if (!Number.isSafeInteger(outcome.quantity) || outcome.quantity < 0 ||
          (outcome.materialId === null ? outcome.quantity !== 0 : !outcome.materialId || outcome.quantity < 1)) {
          throw new Error('Invalid material outcome quantity');
        }
        const dimension = entries.findIndex(([id]) => id === outcome.materialId);
        const state = dimension < 0 ? 0 : Math.min(valueAt(entries, dimension)[1], outcome.quantity) * valueAt(strides, dimension);
        draw[state] = valueAt(draw, state) + outcome.probability;
      }
      const mixture = new Float64Array(size);
      for (const quantity of channel.draws) {
        const pmf = power(draw, quantity.count);
        for (let state = 0; state < size; state++) mixture[state] = valueAt(mixture, state) + quantity.probability * valueAt(pmf, state);
      }
      settlement = combine(settlement, mixture);
    }
    plan = combine(plan, power(settlement, supply.count));
  }
  let current = empty(), restrictedMeanClears = 0;
  const completionByClear = Array.from({ length: horizon }, (_, index) => {
    restrictedMeanClears += 1 - valueAt(current, size - 1);
    current = combine(current, plan);
    if (Math.abs(current.reduce((sum, p) => sum + p, 0) - 1) > 1e-8) throw new Error('Joint probability mass drift');
    return { clear: index + 1, probability: Math.max(0, Math.min(1, valueAt(current, size - 1))) };
  });
  return { demand: { ...demand }, stateCount: size, horizon, completionByClear,
    medianClear: completionByClear.find(row => row.probability >= .5)?.clear ?? null,
    p95Clear: completionByClear.find(row => row.probability >= .95)?.clear ?? null,
    restrictedMeanClears, unresolvedProbability: 1 - valueAt(completionByClear, horizon - 1).probability };
}

function withNoMaterial(outcomes: readonly MaterialOutcome[]): MaterialOutcome[] {
  const mass = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
  if (mass > 1 + 1e-12) throw new Error('Material outcome probability exceeds one');
  return [...outcomes, { materialId: null, quantity: 0, probability: Math.max(0, 1 - mass) }];
}

/** Native joint reward channels for eight fixed Normal/manual plans. */
export function measurePlannedRecipeSources(planned: ReturnType<typeof measurePlannedMaterialBudgets>) {
  const areaIds = ['areas/act1-blood-moor', 'areas/act1-den-of-evil', 'areas/act1-cold-plains', 'areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
    'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary', 'areas/act5-throne-of-destruction'];
  const plans = planned.encounters.filter(row => row.ordinal === 0 && areaIds.includes(row.areaId));
  if (plans.length !== areaIds.length) throw new Error('Incomplete representative plans');
  const selectedIds = new Set(plans.flatMap(plan => plan.kills.map(kill => kill.sourceId)));
  const contexts = planned.contexts.filter(row => selectedIds.has(row.id)).map(row => {
    const witness = plans.find(plan => plan.kills.some(kill => kill.sourceId === row.id));
    if (!witness) throw new Error('Missing source witness');
    return { ...row, witness: { areaId: witness.areaId, mode: 'manual' as const, ordinal: witness.ordinal },
      plannedOccurrences: plans.flatMap(plan => plan.kills).filter(kill => kill.sourceId === row.id)
        .reduce((sum, kill) => sum + kill.count, 0) };
  });
  const native = measureEquipmentRewardSources({ scan: planned.scan, areaIds, contexts }, loadAwardPools());
  const sources = native.rows.map((row, index) => {
    const context = valueAt(contexts, index), { input } = row;
    const source = input.treasureClassId === materialEconomy.treasureGoblin.treasureClassId ? 'treasure-goblin'
      : input.tier === 'chapter-boss' && materialEconomy.chapterBossMaterials[input.treasureClassId] ? 'chapter-boss' : null;
    const channels: (RecipeSupply['channels'][number] & { readonly source: string })[] = [];
    if (source) {
      const bundle = analyzeMaterialBundle(source, input.act, input.difficulty ?? 'normal');
      for (const kind of ['rune', 'gem'] as const) channels.push({ source: `bundle-${kind}`,
        draws: bundle.quantities[kind].pmf.map(quantity => ({ count: quantity.quantity, probability: quantity.probability })),
        outcomes: withNoMaterial(bundle.materials.filter(material => material.kind === kind && material.probabilityPerDraw > 0)
          .map(material => ({ materialId: material.materialId, quantity: 1, probability: material.probabilityPerDraw }))) });
    } else {
      const ordinary = analyzeIndependentMaterialContext({ act: input.act, tier: input.tier,
        difficulty: input.difficulty ?? 'normal' });
      for (const kind of ['rune', 'gem'] as const) channels.push({ source: `independent-${kind}`,
        draws: [{ count: 1, probability: 1 }],
        outcomes: withNoMaterial(ordinary.materials.filter(material => material.kind === kind && material.probabilityPerKill > 0)
          .map(material => ({ materialId: material.materialId, quantity: 1, probability: material.probabilityPerKill }))) });
    }
    for (const table of row.tables) {
      if (!table.eligible.some(pick => pick.type === 'rune' || pick.type === 'gem')) continue;
      const analysis = analyzeMixedTcSource(input, { id: table.id, picks: table.picks,
        ...(table.numPicks === null ? {} : { numPicks: table.numPicks }),
        ...(table.noDropChance === null ? {} : { noDropChance: table.noDropChance }) });
      channels.push({ source: 'treasureClass', draws: [{ count: 1, probability: 1 }],
        outcomes: withNoMaterial(analysis.intervals.flatMap(material => {
          if (material.materialId === null || material.probabilityPerKill === 0) return [];
          const materialId = material.materialId;
          if (!material.quantity || material.quantity.min < 1) throw new Error('Unsupported TC material quantity');
          return material.quantity.pmf.map(quantity => ({ materialId, quantity: quantity.quantity,
            probability: material.probabilityPerKill * quantity.outcomes / analysis.gridOutcomes }));
        })) });
    }
    return { id: context.id, input, count: 1, channels };
  });
  return { plans, sources };
}

/** Native joint rune/gem demand for seven authored recipes across eight fixed plans. */
export function measurePlannedRecipeBudgets(planned: ReturnType<typeof measurePlannedMaterialBudgets>) {
  const { plans, sources } = measurePlannedRecipeSources(planned);
  const catalog = catalogMaterialDemand();
  const demands = [
    ...['runewords/stealth', 'runewords/insight', 'runewords/spirit', 'runewords/infinity', 'runewords/last-wish']
      .map(id => { const demand = catalog.runewords.find(row => row.id === id);
        if (!demand) throw new Error('Missing representative runeword'); return demand; }),
    ...['recipes/rune-fusion/el', 'recipes/gem-fusion/ruby/chipped'].map(id => {
      const demand = catalog.recipes.find(row => row.id === id);
      if (!demand) throw new Error('Missing representative fusion recipe'); return demand;
    })
  ];
  const sourceIndex = new Map(sources.map(row => [row.id, row]));
  return { version: 1, scope: 'joint-direct-recipe-rune-gem-demand-under-repeated-fixed-plans',
    probabilityModel: 'independent-uniform-32-bit-output-draws', openingStock: 'empty', horizon: 128,
    scan: planned.scan, plans: plans.map(({ materials: _materials, ...plan }) => plan), sources, demands,
    results: plans.flatMap(plan => demands.map(demand => ({ areaId: plan.areaId, ordinal: plan.ordinal,
      recipeId: demand.id, ...analyzeRecipeAcquisition(demand.costs.materials, plan.kills.map(kill => {
        const supply = sourceIndex.get(kill.sourceId);
        if (!supply) throw new Error('Missing recipe supply source');
        return { count: kill.count, channels: supply.channels };
      }), 128) }))),
    limitations: [
      'Each clear repeats an identical fixed native plan with every planned spawn receiving one authorized repeatable settlement.',
      'This is a conditional joint distribution, not observed encounter frequency, combat success, campaign progress or PRNG seed-population evidence.',
      'Rune/gem identities in each draw are mutually exclusive; bundle quantity mixtures and direct TC quantities retain their joint counts.',
      'Replacement bundles exclude the ordinary material channel; only native live TC projections contribute.',
      'Completion means owning direct rune/gem inputs from empty stock while retaining every drop; no intervening spending or fusion strategy is modeled.',
      'Currency costs, owned bases, sockets, level/target predicates, salvage and other sinks remain necessary and are not proved affordable.',
      'Find Item, dynamic summons, once-only quest/first-kill/endgame rewards and quest-specific replacement settlements are excluded.',
      'Null quantiles mean the threshold was not reached by the horizon; restricted mean is E[min(T, horizon)], not uncensored expected completion.',
      'No player hours, all-source affordability, final pacing or formal balance acceptance.'
    ] };
}
