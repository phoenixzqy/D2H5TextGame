import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import type { Rng } from '@/engine/rng';
import { collectSourceState, assertSourceStable, validateOutputPath, writeNewReport } from './provenance';

const GRID = 2 ** 32;
function nativeRng(unit: number): Rng {
  return { next: () => unit, chance: p => unit < p,
    nextInt: (min, max) => min + Math.floor(unit * (max - min + 1)),
    pick: <T>(values: readonly T[]): T => {
      const value = values[Math.floor(unit * values.length)];
      if (value === undefined) throw new Error('Empty native test pick');
      return value;
    },
    fork: () => { throw new Error('Unexpected material fork'); } };
}

it('measures every bundle interval, quantity and native source selection with frozen provenance', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.MATERIAL_SOURCE_BUDGET_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const before = collectSourceState(root);
  const { measureSpecialMaterialBudgets } = await import('./material-source-budgets');
  const { rollCurrencyDrops } = await import('@/engine/loot/orbs-and-currency');
  const { rollKillRewards } = await import('@/engine/loot/award');
  const { loadAwardPools } = await import('@/data/loaders/loot');
  const report = measureSpecialMaterialBudgets(), pools = loadAwardPools();
  expect(report.bundles).toHaveLength(30);
  expect(new Set(report.bundles.map(row => row.id)).size).toBe(30);
  for (const row of report.bundles) {
    expect(row.materials).toHaveLength(68);
    const { act, difficulty, tier } = row.context;
    for (const kind of ['rune', 'gem'] as const) {
      const materials = row.materials.filter(material => material.kind === kind);
      expect(materials.reduce((sum, material) => sum + material.outcomes, 0)).toBe(GRID);
      expect(materials[0]?.first).toBe(0);
      expect(materials.at(-1)?.endExclusive).toBe(GRID);
      for (const [index, material] of materials.entries()) {
        if (index > 0) expect(material.first).toBe(materials[index - 1]?.endExclusive);
        expect(material.probabilityPerDraw).toBe(material.outcomes / GRID);
        if (material.outcomes === 0) continue;
        const probe = (n: number) => rollCurrencyDrops(1, tier, act, difficulty, 0, nativeRng(n / GRID), row.policy);
        for (const n of [material.first, material.endExclusive - 1]) expect(probe(n).materials[material.materialId]).toBeGreaterThan(0);
        if (material.first > 0) expect(probe(material.first - 1).materials[material.materialId]).toBeUndefined();
        if (material.endExclusive < GRID) expect(probe(material.endExclusive).materials[material.materialId]).toBeUndefined();
        const quantity = row.quantities[kind];
        expect(material.modeledMeanUnitsPerSettlement).toBeCloseTo(quantity.modeledMean * material.probabilityPerDraw, 14);
        const chance = quantity.pmf.reduce((sum, q) => sum + q.probability * (1 - (1 - material.probabilityPerDraw) ** q.quantity), 0);
        expect(material.modeledChanceAtLeastOnePerSettlement).toBeCloseTo(chance, 14);
      }
      const quantity = row.quantities[kind];
      expect(quantity.pmf.reduce((sum, q) => sum + q.outcomes, 0)).toBe(GRID);
      expect(quantity.pmf.map(q => q.quantity)).toEqual(Array.from({ length: quantity.max - quantity.min + 1 }, (_, i) => quantity.min + i));
      for (const q of quantity.pmf) for (const n of [q.first, q.endExclusive - 1]) {
        const native = rollCurrencyDrops(1, tier, act, difficulty, 0, nativeRng(n / GRID), row.policy);
        expect(kind === 'rune' ? native.runes : native.gems).toBe(q.quantity);
      }
    }
    // The full orchestrator supplies the tier/act override and suppresses TC
    // materials. This check is independent of the diagnostic's policy assembly.
    const monsterLevel = [14, 27, 42, 57, 78][act - 1];
    if (monsterLevel === undefined) throw new Error('Missing native boss level');
    for (const unit of [0, (GRID - 1) / GRID]) {
      const native = rollKillRewards({ act, difficulty, tier: row.source === 'treasure-goblin' ? 'elite' : 'chapter-boss',
        treasureClassId: row.tableId, monsterLevel, magicFind: 0, goldFind: 0 }, pools, nativeRng(unit));
      const bundle = rollCurrencyDrops(monsterLevel, tier, act, difficulty, 0, nativeRng(unit), row.policy);
      expect(native.materials).toEqual(bundle.materials);
      expect(native.runes).toBe(bundle.runes);
      expect(native.gems).toBe(bundle.gems);
    }
  }
  const after = collectSourceState(root);
  assertSourceStable(before, after);
  expect(report.probabilityModel).toBe('uniform-32-bit-output-grid');
  expect(report.combinationModel).toBe('independent-draws-within-settlement');
  expect(report.excludedSources).toContain('endgame-rewards');
  expect(report.excludedSources).toContain('find-item');
  if (output !== undefined) writeNewReport(root, output, { ...report, sourceState: before });
}, 30_000);

it('matches independent boss/caches arithmetic and the quantized native nextInt range', async () => {
  const { analyzeMaterialBundle, measureOnceOnlyMaterials } = await import('./material-source-budgets');
  const { createRng } = await import('@/engine/rng');
  const boss = analyzeMaterialBundle('chapter-boss', 1, 'normal');
  expect(boss.materials.find(row => row.materialId === 'runes/ith'))
    .toMatchObject({ first: 0, endExclusive: 2_260_509_104 });
  expect(boss.materials.find(row => row.materialId === 'runes/tal'))
    .toMatchObject({ first: 2_260_509_104, endExclusive: GRID });
  expect(boss.quantities.rune.modeledMean).toBe(1);
  expect(boss.quantities.gem.modeledMean).toBe(2);
  const act5 = analyzeMaterialBundle('chapter-boss', 5, 'normal');
  expect(act5.quantities.rune.pmf.map(row => row.outcomes)).toEqual([1_431_655_766, 1_431_655_765, 1_431_655_765]);
  expect(act5.materials.find(row => row.materialId === 'runes/mal')?.outcomes).toBe(0);
  expect(act5.materials.find(row => row.materialId === 'gems/topaz/perfect')?.outcomes).toBe(0);
  for (const row of act5.quantities.rune.pmf) expect(row.outcomes).toBeGreaterThan(0);
  for (const seed of [0, 1, 123, 123456789]) {
    const unit = createRng(seed).next();
    const expected = act5.quantities.rune.pmf.find(q => unit * GRID >= q.first && unit * GRID < q.endExclusive)?.quantity;
    expect(createRng(seed).nextInt(act5.quantities.rune.min, act5.quantities.rune.max)).toBe(expected);
  }
  const once = measureOnceOnlyMaterials();
  expect(once.find(row => row.tableId === 'loot/countess-runes')?.materials.find(row => row.materialId === 'runes/ral'))
    .toMatchObject({ first: 0, endExclusive: 858_993_460 });
  expect(once.find(row => row.tableId === 'loot/hellforge-runes')?.materials.find(row => row.materialId === 'runes/hel'))
    .toMatchObject({ first: 0, endExclusive: 954_437_177 });
});

it('keeps once-only caches and Hell first-kill materials conditional, with native identity boundaries', async () => {
  const { measureOnceOnlyMaterials } = await import('./material-source-budgets');
  const { rollQuestTableRewards } = await import('@/engine/loot/award');
  const { rollChapterBossFirstKill } = await import('@/engine/loot/chapter-boss-first-kills');
  const { loadAwardPools } = await import('@/data/loaders/loot');
  const { loadJamellaQuestAwardPools } = await import('@/data/loaders/quest-table-rewards');
  const once = measureOnceOnlyMaterials();
  expect(once).toHaveLength(4);
  for (const row of once) {
    expect(row.repeatable).toBe(false);
    expect(row).not.toHaveProperty('waitingKills');
    expect(row.materials.reduce((sum, material) => sum + material.outcomes, 0)).toBe(GRID);
    const probe = (n: number) => row.source === 'quest-cache'
      ? rollQuestTableRewards(row.input, row.tableId === 'loot/side-jamella-perfect-gem' ? loadJamellaQuestAwardPools() : loadAwardPools(), nativeRng(n / GRID))
      : rollChapterBossFirstKill({ firstKillBonus: true, act: row.act, tier: 'chapter-boss',
        treasureClassId: row.tableId, monsterLevel: 99, difficulty: 'hell' }, loadAwardPools(), nativeRng(n / GRID));
    for (const material of row.materials.filter(material => material.outcomes > 0)) {
      for (const n of [material.first, material.endExclusive - 1]) expect(probe(n)?.materials).toEqual({ [material.materialId]: 1 });
      if (material.first > 0) expect(probe(material.first - 1)?.materials[material.materialId]).toBeUndefined();
      if (material.endExclusive < GRID) expect(probe(material.endExclusive)?.materials[material.materialId]).toBeUndefined();
    }
  }
  const first = once.find(row => row.source === 'first-kill-hell-rune');
  if (!first) throw new Error('Missing once-only Hell source');
  for (const firstKillBonus of [false, true]) for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
    const result = rollChapterBossFirstKill({ firstKillBonus, act: first.act, tier: 'chapter-boss',
      treasureClassId: first.tableId, monsterLevel: 99, difficulty }, loadAwardPools(), nativeRng(0));
    expect(result.runes).toBe(firstKillBonus && difficulty === 'hell' ? 1 : 0);
  }
});

it('retains all recipe costs, outputs and targets and counts repeated runes without inferring completion time', async () => {
  const { catalogMaterialDemand } = await import('./material-source-budgets');
  const { materialRecipeRules } = await import('@/data/loaders/material-recipes');
  const { socketRunewords } = await import('@/data/loaders/socket-effects');
  const demand = catalogMaterialDemand();
  expect(demand.recipes).toEqual(materialRecipeRules.recipes);
  expect(demand.recipes).toHaveLength(98);
  expect(demand.salvage).toEqual(materialRecipeRules.salvage);
  expect(demand.insertion).toEqual(materialRecipeRules.insertion);
  expect(demand.runewords).toHaveLength(35);
  for (const word of demand.runewords) {
    const native = socketRunewords.find(row => row.id === word.id);
    expect(word.runeSequence).toEqual(native?.runes);
    expect(Object.values(word.costs.materials).reduce((sum, count) => sum + count, 0)).toBe(native?.sockets);
    expect(word.costs.currencies).toEqual({});
    expect(word).not.toHaveProperty('completionHours');
  }
  expect(demand.runewords.find(word => word.id === 'runewords/infinity')?.costs.materials['runes/ber']).toBe(2);
  expect(demand.runewords.find(word => word.id === 'runewords/last-wish')?.costs.materials['runes/jah']).toBe(3);
  expect(demand.runewords.find(word => word.id === 'runewords/phoenix')?.costs.materials['runes/vex']).toBe(2);
  expect(demand.recipes.find(row => row.kind === 'caster-amulet')?.costs).toEqual({ materials: {
    'runes/ral': 1, 'gems/amethyst/perfect': 1, 'materials/scrap': 20 }, currencies: { 'rune-shard': 1000 } });
});
