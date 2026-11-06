import { expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadAwardPools } from '@/data/loaders/loot';
import { materialRecipeRules } from '@/data/loaders/material-recipes';
import * as drops from '@/engine/loot/drop-roller';
import { collectSourceState, assertSourceStable, validateOutputPath, writeNewReport } from './provenance';

it('censuses live multi-table sources and reconciles each native reward-to-salvage sample', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.EQUIPMENT_SOURCE_BUDGET_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const before = collectSourceState(root);
  const { enumerateEquipmentRewardContexts, measureEquipmentRewardSources } = await import('./equipment-source-budget');
  const census = enumerateEquipmentRewardContexts();
  expect(census.areaIds).toHaveLength(29);
  expect(census.scan.ordinals).toEqual(Array.from({ length: 13 }, (_, index) => index));
  expect(census.scan.seed).toBe(7);
  expect(census.contexts.length).toBeGreaterThan(100);
  expect(new Set(census.contexts.map(row => JSON.stringify(row.input))).size).toBe(census.contexts.length);
  expect(new Set(census.contexts.map(row => row.input.act))).toEqual(new Set([1, 2, 3, 4, 5]));
  expect(new Set(census.contexts.map(row => row.input.difficulty))).toEqual(new Set(['normal', 'nightmare', 'hell']));
  expect(new Set(census.contexts.map(row => row.witness.mode))).toEqual(new Set(['manual', 'idle']));
  const pools = loadAwardPools();
  const report = measureEquipmentRewardSources(census, pools);
  expect(report.rows).toHaveLength(census.contexts.length);
  expect(report.rows.some(row => row.tables.length > 1)).toBe(true);
  expect(report.scope).toBe('live-projections-and-conditional-salvage-samples');
  for (const row of report.rows) {
    expect(row.tables.length).toBeGreaterThan(0);
    for (const table of row.tables) {
      expect(table.eligible).toEqual(table.picks.filter(pick => pick.weight > 0 &&
        row.input.monsterLevel >= pick.qlvlMin && row.input.monsterLevel <= pick.qlvlMax));
      if (table.numPicks !== null) expect(table.selected.length).toBeLessThanOrEqual(table.numPicks);
    }
    const raw = pools.treasureClasses.get(row.input.treasureClassId);
    expect(row.rawNonEquipmentPicks).toEqual(raw?.picks.filter(pick => (pick.type ?? 'item') !== 'item'));
    const scrap = row.sample.items.reduce((sum, item) => sum + materialRecipeRules.salvage.rarityYields[item.rarity] *
      (1 + Math.floor((item.ilvl - 1) / materialRecipeRules.salvage.levelBandSize)), 0);
    expect(row.sample.salvageMaterials).toEqual(scrap ? { [materialRecipeRules.salvage.materialId]: scrap } : {});
    expect(row.sample.items.every(item => pools.bases.has(item.baseId))).toBe(true);
    expect(row.sample.inputUnchanged).toBe(true);
    expect(row.sample.remainingItems).toBe(0);
    expect(row.sample.salvageOrdinal).toBe(row.sample.items.length ? 1 : 0);
    expect(row).not.toHaveProperty('expectedScrapPerKill');
    expect(row).not.toHaveProperty('completionHours');
  }
  expect(report.rows.some(row => row.rawNonEquipmentPicks.length > 0 &&
    row.tables.every(table => table.eligible.every(pick => (pick.type ?? 'item') === 'item')))).toBe(true);
  expect(vi.isMockFunction(drops.rollDrops)).toBe(false);
  assertSourceStable(before, collectSourceState(root));
  if (output !== undefined) writeNewReport(root, output, { ...report, sourceState: before });
}, 30_000);

it('keeps projected boss materials distinct and native guarantees in the salvage sample', async () => {
  const { measureEquipmentRewardSources } = await import('./equipment-source-budget');
  const { materialEconomy } = await import('@/data/loaders/materials');
  const census = { scan: { seed: 7, ordinals: [0], modes: ['manual'] as const,
    difficulties: ['normal'] as const }, areaIds: ['constructed-act1'], contexts: [{
    input: { tier: 'chapter-boss' as const, monsterLevel: 14, treasureClassId: 'loot/act1-boss',
      magicFind: 0, goldFind: 0, act: 1 as const, difficulty: 'normal' as const },
    witness: { areaId: 'constructed-act1', mode: 'manual' as const, ordinal: 0 }, plannedOccurrences: 1
  }] };
  const report = measureEquipmentRewardSources(census, loadAwardPools());
  const row = report.rows[0];
  if (!row) throw new Error('Missing native boss sample');
  expect(row.tables).toHaveLength(2);
  expect(row.tables.every(table => table.picks.every(pick => (pick.type ?? 'item') === 'item'))).toBe(true);
  expect(row.tables.flatMap(table => table.selected).filter(drop => drop.kind === 'direct')).toEqual([]);
  expect(row.sample.materials).not.toHaveProperty(materialRecipeRules.salvage.materialId);
  const bundle = materialEconomy.chapterBossMaterials['loot/act1-boss'];
  expect(row.sample.runes).toBe(bundle?.runeQuantityMin);
  expect(row.sample.gems).toBe(bundle?.gemQuantity);
  expect(row.tables.every(table => table.numPicks !== null)).toBe(true);
  expect(row.sample.items.length).toBeGreaterThanOrEqual(row.tables.reduce((sum, table) => sum + (table.numPicks ?? 0), 0));
  expect(row.sample.salvageMaterials[materialRecipeRules.salvage.materialId]).toBeGreaterThan(0);
});

it('restores the original observer after native reward refusal and rejects nested observers', async () => {
  const { enumerateEquipmentRewardContexts, measureEquipmentRewardSources } = await import('./equipment-source-budget');
  const all = enumerateEquipmentRewardContexts(), first = all.contexts.find(row => row.input.tier === 'chapter-boss');
  if (!first) throw new Error('Missing native boss context');
  const census = { ...all, contexts: [first] }, pools = loadAwardPools();
  const missing = new Map(pools.treasureClasses);
  const group = pools.chapterBossEquipment?.get(first.input.treasureClassId)?.groups[0];
  if (!group) throw new Error('Missing production equipment source');
  missing.delete(group.sourceTableId);
  const original = drops.rollDrops;
  expect(() => measureEquipmentRewardSources(census, { ...pools, treasureClasses: missing })).toThrow();
  expect(drops.rollDrops).toBe(original);
  const spy = vi.spyOn(drops, 'rollDrops');
  try { expect(() => measureEquipmentRewardSources(census, pools)).toThrow('original drop export'); }
  finally { spy.mockRestore(); }
  expect(drops.rollDrops).toBe(original);
});
