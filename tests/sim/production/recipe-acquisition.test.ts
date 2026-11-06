import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { analyzeRecipeAcquisition, measurePlannedRecipeBudgets, type RecipeSupply } from './recipe-acquisition';
import { measurePlannedMaterialBudgets } from './planned-material-budget';
import { assertSourceStable, collectSourceState, validateOutputPath, writeNewReport } from './provenance';

const oneDraw = [{ count: 1, probability: 1 }];
const categorical = { draws: oneDraw, outcomes: [
  { materialId: 'a', quantity: 1, probability: .5 },
  { materialId: 'b', quantity: 1, probability: .5 }
] };
const eitherRune: RecipeSupply = { count: 1, channels: [categorical] };

it('preserves mutually exclusive identities instead of multiplying marginal chances', () => {
  const result = analyzeRecipeAcquisition({ a: 1, b: 1 }, [eitherRune], 6);
  expect(result.completionByClear.map(row => row.probability)).toEqual([0, .5, .75, .875, .9375, .96875]);
  expect(result.medianClear).toBe(2);
  expect(result.p95Clear).toBe(6);
  expect(result.restrictedMeanClears).toBe(2.9375);
  expect(result.unresolvedProbability).toBe(.03125);
});

it('requires all repeated inputs and retains quantity-mixture correlation within bundles', () => {
  const repeated = analyzeRecipeAcquisition({ a: 3 }, [eitherRune], 4);
  expect(repeated.completionByClear.map(row => row.probability)).toEqual([0, 0, .125, .3125]);
  expect(repeated.medianClear).toBeNull();
  const bundle: RecipeSupply = { count: 1, channels: [{ ...categorical,
    draws: [{ count: 1, probability: .5 }, { count: 2, probability: .5 }] }] };
  expect(analyzeRecipeAcquisition({ a: 1, b: 1 }, [bundle], 1)
    .completionByClear[0]?.probability).toBe(.25);
  const fixedTwo: RecipeSupply = { count: 1, channels: [{ ...categorical,
    draws: [{ count: 2, probability: 1 }] }] };
  expect(analyzeRecipeAcquisition({ a: 1, b: 1 }, [fixedTwo], 1)
    .completionByClear[0]?.probability).toBe(.5);
});

it('combines independent channels, direct quantities and counted settlements', () => {
  const channels: RecipeSupply = { count: 1, channels: ['a', 'b'].map(materialId => ({ draws: oneDraw,
    outcomes: [{ materialId, quantity: 1, probability: .5 },
      { materialId: null, quantity: 0, probability: .5 }] })) };
  expect(analyzeRecipeAcquisition({ a: 1, b: 1 }, [channels], 1)
    .completionByClear[0]?.probability).toBe(.25);
  const tc: RecipeSupply = { count: 2, channels: [{ draws: oneDraw, outcomes: [
    { materialId: 'a', quantity: 2, probability: .25 },
    { materialId: null, quantity: 0, probability: .75 }
  ] }] };
  expect(analyzeRecipeAcquisition({ a: 3 }, [tc], 1).completionByClear[0]?.probability).toBe(.0625);
  expect(analyzeRecipeAcquisition({ absent: 1 }, [eitherRune], 3)).toMatchObject({
    unresolvedProbability: 1, medianClear: null, p95Clear: null, restrictedMeanClears: 3
  });
});

it('refuses malformed demands, probabilities, quantities and unbounded analyses', () => {
  for (const demand of [{}, { a: 0 }, { a: -1 }, { a: .5 }, { a: NaN }, { a: 256 }]) {
    expect(() => analyzeRecipeAcquisition(demand, [eitherRune], 1)).toThrow(/demand|state/i);
  }
  for (const horizon of [0, -1, .5, NaN, 10_001]) {
    expect(() => analyzeRecipeAcquisition({ a: 1 }, [eitherRune], horizon)).toThrow(/horizon/i);
  }
  for (const count of [0, -1, .5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => analyzeRecipeAcquisition({ a: 1 }, [{ ...eitherRune, count }], 1)).toThrow(/count/i);
  }
  for (const probability of [-1, NaN, Infinity, .7]) {
    expect(() => analyzeRecipeAcquisition({ a: 1 }, [{ count: 1, channels: [{ draws: oneDraw,
      outcomes: [{ materialId: 'a', quantity: 1, probability }] }] }], 1)).toThrow(/probabilit/i);
  }
  for (const quantity of [-1, .5, NaN]) {
    expect(() => analyzeRecipeAcquisition({ a: 1 }, [{ count: 1, channels: [{ draws: oneDraw,
      outcomes: [{ materialId: 'a', quantity, probability: 1 }] }] }], 1)).toThrow(/quantity/i);
  }
  expect(() => analyzeRecipeAcquisition({ a: 1 }, [{ count: 1, channels: [{ draws: oneDraw,
    outcomes: [{ materialId: null, quantity: 1, probability: 1 }] }] }], 1)).toThrow(/quantity/i);
  expect(() => analyzeRecipeAcquisition({ a: 1 }, [{ count: 1, channels: [{
    draws: [{ count: -1, probability: 1 }], outcomes: categorical.outcomes }] }], 1)).toThrow(/count/i);
});

it('reconciles native joint channels with prior one-material marginals and retains direct recipe predicates', () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.RECIPE_ACQUISITION_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const before = collectSourceState(root), planned = measurePlannedMaterialBudgets();
  const report = measurePlannedRecipeBudgets(planned);
  expect(report.plans).toHaveLength(8);
  expect(report.demands).toHaveLength(7);
  expect(report.results).toHaveLength(56);
  expect(report.sources.some(row => row.channels.some(channel => channel.source === 'treasureClass'))).toBe(true);
  expect(report.sources.some(row => row.channels.some(channel => channel.source === 'bundle-rune'))).toBe(true);
  expect(report.sources.find(row => row.input.treasureClassId === 'loot/treasure-goblin')?.channels
    .some(channel => channel.source === 'bundle-rune' && channel.draws.length > 1)).toBe(true);
  for (const source of report.sources) {
    const marginal = planned.contexts.find(context => context.id === source.id);
    if (!marginal) throw new Error('Missing marginal source');
    for (const materialId of ['runes/tal', 'runes/sol', 'runes/ber', 'gems/ruby/chipped']) {
      const noDrop = marginal.channels.reduce((product, channel) => product *
        (1 - (channel.materials.find(row => row.materialId === materialId)?.chance ?? 0)), 1);
      expect(analyzeRecipeAcquisition({ [materialId]: 1 }, [source], 1)
        .completionByClear[0]?.probability).toBeCloseTo(1 - noDrop, 12);
    }
    const labels = source.channels.map(channel => channel.source);
    expect(labels.includes('bundle-rune') && labels.includes('independent-rune')).toBe(false);
  }
  expect(report.demands.find(row => row.id === 'runewords/infinity')?.costs.materials['runes/ber']).toBe(2);
  expect(report.demands.find(row => row.id === 'runewords/last-wish')?.costs.materials['runes/jah']).toBe(3);
  expect(report.demands.find(row => row.id === 'recipes/gem-fusion/ruby/chipped'))
    .toMatchObject({ costs: { currencies: { 'gem-shard': 1 } } });
  expect(report.demands.find(row => row.id === 'runewords/insight')).toHaveProperty('target');
  for (const row of report.results) {
    expect(row.completionByClear).toHaveLength(128);
    let previous = 0;
    for (const point of row.completionByClear) {
      expect(point.probability + 1e-12).toBeGreaterThanOrEqual(previous);
      expect(point.probability).toBeLessThanOrEqual(1);
      previous = point.probability;
    }
    if (row.recipeId === 'runewords/infinity' || row.recipeId === 'runewords/last-wish') {
      expect(row.unresolvedProbability).toBe(1);
      expect(row.medianClear).toBeNull();
    }
  }
  expect(report).not.toHaveProperty('completionHours');
  assertSourceStable(before, collectSourceState(root));
  if (output !== undefined) writeNewReport(root, output, { ...report, sourceState: before });
}, 30_000);
