import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { collectSourceState, assertSourceStable, validateOutputPath, writeNewReport } from './provenance';

it('measures all 21 live mixed sources and combines material means without duplicating baseline rewards', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.MIXED_TC_BUDGET_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const before = collectSourceState(root);
  const { measureMixedTcBudgets, probeMixedTcSource } = await import('./mixed-tc-budgets');
  const report = measureMixedTcBudgets();
  expect(report.rows).toHaveLength(21);
  expect(report.baselineContexts).toHaveLength(12);
  expect(report.rows.filter(row => row.input.difficulty === 'normal')).toHaveLength(7);
  for (const row of report.rows) {
    expect(row.input.tier).toBe('trash');
    expect(row.analysis.noDrop.probability).toBeCloseTo(.6, 8);
    expect(row.analysis.intervals.reduce((sum, entry) => sum + entry.outcomes, 0)).toBe(2 ** 32);
    for (const entry of row.analysis.intervals.filter(entry => entry.outcomes > 0)) {
      const readKey = (n: number) => probeMixedTcSource(row.input, row.table, n).key;
      expect(readKey(entry.first)).toBe(entry.key);
      expect(readKey(entry.endExclusive - 1)).toBe(entry.key);
      if (entry.first > 0) expect(readKey(entry.first - 1)).not.toBe(entry.key);
      if (entry.endExclusive < 2 ** 32) expect(readKey(entry.endExclusive)).not.toBe(entry.key);
      if (entry.quantity) {
        expect(entry.quantity.pmf.reduce((sum, point) => sum + point.outcomes, 0)).toBe(2 ** 32);
        for (const point of entry.quantity.pmf) {
          expect(probeMixedTcSource(row.input, row.table, entry.first, point.first).drop.quantity).toBe(point.quantity);
          expect(probeMixedTcSource(row.input, row.table, entry.first, point.endExclusive - 1).drop.quantity).toBe(point.quantity);
        }
      }
    }
    const baseline = report.baselineContexts.find(entry => entry.id === row.baselineId);
    if (!baseline) throw new Error('Missing unique baseline context');
    expect(row.combinedMaterialMeans).toHaveLength(68);
    for (const material of row.combinedMaterialMeans) {
      const ordinary = baseline.analysis.materials.find(entry => entry.materialId === material.materialId);
      const tc = row.analysis.intervals.filter(entry => entry.materialId === material.materialId)
        .reduce((sum, entry) => sum + (entry.modeledMeanUnitsPerKill ?? 0), 0);
      expect(material.modeledMeanUnitsPerKill).toBe((ordinary?.probabilityPerKill ?? 0) + tc);
      if (row.input.difficulty !== 'normal' && material.materialId.startsWith('runes/')) expect(tc).toBe(0);
    }
  }
  expect(report).not.toHaveProperty('completionHours');
  assertSourceStable(before, collectSourceState(root));
  if (output !== undefined) writeNewReport(root, output, { ...report, sourceState: before });
}, 30_000);

const input = { act: 1, difficulty: 'normal', tier: 'trash', monsterLevel: 7,
  treasureClassId: 'constructed/mixed', magicFind: 0, goldFind: 0 } as const;
const table = { id: input.treasureClassId, numPicks: 1, noDropChance: .25, picks: [
  { type: 'item' as const, baseId: 'items/base/helm-cap', rarity: 'normal' as const, weight: 2, qlvlMin: 1, qlvlMax: 10 },
  { type: 'currency' as const, itemId: 'currency/wishstone', weight: 3, qlvlMin: 1, qlvlMax: 10, quantityMin: 2, quantityMax: 4 }
] };

it('matches separate arithmetic at TC <= boundaries and inclusive quantity bins', async () => {
  const { analyzeMixedTcSource, probeMixedTcSource } = await import('./mixed-tc-budgets');
  const result = analyzeMixedTcSource(input, table);
  const currency = result.intervals.find(entry => entry.key === 'direct:wishstones:currency/wishstone');
  expect(result.noDrop).toMatchObject({ outcomes: 1_073_741_824, probability: .25 });
  expect(currency).toMatchObject({ first: 1_717_986_919, endExclusive: 2 ** 32, outcomes: 2_576_980_377 });
  expect(currency?.modeledMeanUnitsPerKill).toBeCloseTo(.75 * (2_576_980_377 / 2 ** 32) * (3 - 1 / 2 ** 32), 14);
  expect(probeMixedTcSource(input, table, 0, 0, 1_073_741_823).key).toBe('no-drop');
  expect(probeMixedTcSource(input, table, 0, 0, 1_073_741_824).key).toBe('item:items/base/helm-cap');
});

it('refuses unsupported attempts and ambiguous outcome order instead of inventing source probabilities', async () => {
  const { analyzeMixedTcSource } = await import('./mixed-tc-budgets');
  const firstPick = table.picks[0];
  if (!firstPick) throw new Error('Missing duplicate-pick fixture');
  expect(() => analyzeMixedTcSource(input, { ...table, numPicks: 2 })).toThrow('one trash-tier attempt');
  expect(() => analyzeMixedTcSource({ ...input, tier: 'champion' }, table)).toThrow('one trash-tier attempt');
  expect(() => analyzeMixedTcSource(input, { ...table, picks: [...table.picks, firstPick] })).toThrow('Ambiguous');
});
