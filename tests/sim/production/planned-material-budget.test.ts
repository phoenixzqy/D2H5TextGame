import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { materialEconomy } from '@/data/loaders/materials';
import { combinePlannedMaterials, measurePlannedMaterialBudgets, type MaterialSupplyContext } from './planned-material-budget';
import { assertSourceStable, collectSourceState, validateOutputPath, writeNewReport } from './provenance';

const sources: MaterialSupplyContext[] = [{ id: 'ordinary', input: { tier: 'trash', monsterLevel: 10,
  act: 1, difficulty: 'normal', magicFind: 0, goldFind: 0, treasureClassId: 'constructed' }, channels: [
  { source: 'independent', materials: [{ materialId: 'runes/el', mean: .2, chance: .2 }] },
  { source: 'treasureClass', materials: [{ materialId: 'runes/el', mean: .3, chance: .1 }] }
] }, { id: 'boss', input: { tier: 'chapter-boss', monsterLevel: 14, act: 1,
  difficulty: 'normal', magicFind: 0, goldFind: 0, treasureClassId: 'loot/act1-boss' }, channels: [
  { source: 'bundle', materials: [{ materialId: 'runes/el', mean: 1, chance: 1 }] }
] }];

it('weights source means and marginal no-drop products by actual kill counts', () => {
  const ordinary = combinePlannedMaterials([{ sourceId: 'ordinary', count: 2 }], sources);
  expect(ordinary).toHaveLength(1);
  expect(ordinary[0]).toMatchObject({ materialId: 'runes/el', independentMean: .4, treasureClassMean: .6,
    bundleMean: 0, totalMean: 1 });
  expect(ordinary[0]?.chanceAtLeastOne).toBeCloseTo(1 - .8 ** 2 * .9 ** 2, 14);
  const withBoss = combinePlannedMaterials([{ sourceId: 'ordinary', count: 2 }, { sourceId: 'boss', count: 1 }], sources);
  expect(withBoss[0]).toMatchObject({ independentMean: .4, treasureClassMean: .6, bundleMean: 1,
    totalMean: 2, chanceAtLeastOne: 1 });
});

it('refuses missing sources, malformed counts/probabilities and overlapping replacement channels', () => {
  expect(() => combinePlannedMaterials([{ sourceId: 'absent', count: 1 }], sources)).toThrow(/source/i);
  for (const count of [0, -1, .5, NaN, Infinity]) {
    expect(() => combinePlannedMaterials([{ sourceId: 'ordinary', count }], sources)).toThrow(/count/i);
  }
  const first = sources[0];
  if (!first) throw new Error('Missing fixture');
  expect(() => combinePlannedMaterials([{ sourceId: first.id, count: 1 }], [first, first])).toThrow(/duplicate/i);
  for (const chance of [-.1, 1.1, NaN]) {
    expect(() => combinePlannedMaterials([{ sourceId: first.id, count: 1 }], [{ ...first,
      channels: [{ source: 'independent', materials: [{ materialId: 'runes/el', mean: 2, chance }] }] }])).toThrow(/material/i);
  }
  expect(() => combinePlannedMaterials([{ sourceId: first.id, count: 1 }], [{ ...first,
    channels: [...first.channels, { source: 'bundle', materials: [] }] }])).toThrow(/replace/i);
});

it('budgets every native Normal manual plan without adding suppressed TC or ordinary boss materials', () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url)), output = process.env.PLANNED_MATERIAL_BUDGET_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const before = collectSourceState(root), report = measurePlannedMaterialBudgets();
  expect(report.encounters).toHaveLength(subAreas.length * report.scan.ordinals.length);
  expect(new Set(report.encounters.map(row => row.areaId)).size).toBe(subAreas.length);
  const index = new Map(report.contexts.map(context => [context.id, context]));
  const fallback = monsters[0];
  if (!fallback) throw new Error('Missing monsters');
  for (const row of report.encounters) {
    const subArea = subAreas.find(area => area.id === row.areaId);
    if (!subArea) throw new Error('Missing source area');
    const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
      fallbackLevel: subArea.areaLevel, seed: report.scan.seed, challengeOrdinal: row.ordinal, mode: 'manual' });
    const actual = plan.waves.flatMap(wave => wave.spawns.map(spawn => ({ tier: spawn.tier, monsterLevel: spawn.level,
      treasureClassId: wave.lootTable ?? plan.defaultLootTable, act: Number(subArea.actId.slice(-1)),
      difficulty: 'normal', magicFind: 0, goldFind: 0 })));
    const counted = new Map<string, number>();
    for (const input of actual) {
      const key = JSON.stringify(input); counted.set(key, (counted.get(key) ?? 0) + 1);
    }
    expect(row.spawnCount).toBe(actual.length);
    expect(row.kills.reduce((sum, kill) => sum + kill.count, 0)).toBe(actual.length);
    expect(new Map(row.kills.map(kill => [JSON.stringify(index.get(kill.sourceId)?.input), kill.count]))).toEqual(counted);
    for (const material of row.materials) {
      expect(material.totalMean).toBeCloseTo(material.independentMean + material.bundleMean + material.treasureClassMean, 12);
      expect(material.chanceAtLeastOne).toBeGreaterThanOrEqual(0);
      expect(material.chanceAtLeastOne).toBeLessThanOrEqual(1);
    }
  }
  expect(report.contexts.some(row => row.channels.some(channel => channel.source === 'treasureClass'))).toBe(true);
  expect(report.contexts.some(row => row.channels.some(channel => channel.source === 'bundle'))).toBe(true);
  for (const row of report.contexts) {
    const bundle = row.input.tier === 'chapter-boss' && materialEconomy.chapterBossMaterials[row.input.treasureClassId];
    if (bundle) {
      expect(row.channels.map(channel => channel.source)).toEqual(['bundle']);
      expect(row.channels[0]?.materials.filter(material => material.materialId.startsWith('runes/'))
        .reduce((sum, material) => sum + material.mean, 0)).toBeGreaterThanOrEqual(bundle.runeQuantityMin);
    }
  }
  expect(report).not.toHaveProperty('completionHours');
  assertSourceStable(before, collectSourceState(root));
  if (output !== undefined) writeNewReport(root, output, { ...report, sourceState: before });
}, 30_000);
