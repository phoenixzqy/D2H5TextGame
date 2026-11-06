import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { collectSourceState, assertSourceStable, validateOutputPath, writeNewReport } from './provenance';

// Freeze source identity before dynamically importing the actual reward code.
it('measures all independent material intervals and emits an optional external report', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.MATERIAL_ACQUISITION_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const before = collectSourceState(root);
  const { measureIndependentMaterialAcquisition } = await import('./material-acquisition');
  const report = measureIndependentMaterialAcquisition();
  const { rollCurrencyDrops } = await import('@/engine/loot/orbs-and-currency');
  const { materialCatalog } = await import('@/data/loaders/materials');
  const after = collectSourceState(root);
  assertSourceStable(before, after);
  expect(report.scope).toBe('ordinary-independent-rune-gem-channel');
  expect(report.probabilityModel).toBe('uniform-32-bit-output-grid');
  expect(report.waitingModel).toBe('independent-identically-distributed-kills');
  expect(report.excludedSources).toEqual([
    'treasure-class-picks', 'chapter-boss-material-bundles', 'treasure-goblin-bundles',
    'first-kill-bonuses', 'quest-rewards', 'crafting', 'endgame-rewards', 'find-item'
  ]);
  expect(report.contexts).toHaveLength(105);
  expect(new Set(report.contexts.map(row => JSON.stringify(row.context))).size).toBe(105);
  for (const context of report.contexts) {
    expect(context.materials).toHaveLength(68);
    expect(new Set(context.materials.map(row => row.materialId)).size).toBe(68);
    for (const kind of ['rune', 'gem'] as const) {
      const rows = context.materials.filter(row => row.kind === kind);
      const noDrop = context.channels[kind].noDrop;
      expect(noDrop.first).toBe(Math.ceil(context.channels[kind].authoredGateChance * 2 ** 32));
      expect(rows.reduce((sum, row) => sum + row.outcomes, noDrop.outcomes)).toBe(2 ** 32);
      expect(rows[0]?.first).toBe(0);
      expect(rows.at(-1)?.endExclusive).toBe(noDrop.first);
      expect(noDrop.endExclusive).toBe(2 ** 32);
      rows.forEach((row, index) => {
        expect(row.outcomes).toBe(row.endExclusive - row.first);
        expect(row.probabilityPerKill).toBe(row.outcomes / 2 ** 32);
        if (index > 0) expect(row.first).toBe(rows[index - 1]?.endExclusive);
        if (row.outcomes === 0) expect(row.iidWaitingKills).toBeNull();
      });
      // Check each finite interval against native rewards, including strict
      // boundaries. This does not rely on the report's rank-search helper.
      const observed = new Map<number, string | undefined>();
      const nativeIdentity = (numerator: number) => {
        if (observed.has(numerator)) return observed.get(numerator);
        const values = [...(context.context.tier === 'champion' ? [.9] : []),
          kind === 'rune' ? numerator / 2 ** 32 : 0,
          kind === 'gem' ? numerator / 2 ** 32 : 0, .5];
        const next = () => {
          const value = values.shift();
          if (value === undefined) throw new Error('Unexpected native draw');
          return value;
        };
        const unsupported = (): never => { throw new Error('Unexpected native RNG operation'); };
        const { act, difficulty, tier } = context.context;
        const drop = rollCurrencyDrops(10, tier, act, difficulty, 0, {
          next, chance: p => next() < p, nextInt: unsupported, pick: unsupported, fork: unsupported
        });
        expect(values).toHaveLength(0);
        const id = Object.keys(drop.materials).find(id => materialCatalog.get(id)?.kind === kind);
        observed.set(numerator, id);
        return id;
      };
      for (const row of rows.filter(row => row.outcomes > 0)) {
        expect(nativeIdentity(row.first)).toBe(row.materialId);
        expect(nativeIdentity(row.endExclusive - 1)).toBe(row.materialId);
        if (row.first > 0) expect(nativeIdentity(row.first - 1)).not.toBe(row.materialId);
        if (row.endExclusive < 2 ** 32) expect(nativeIdentity(row.endExclusive)).not.toBe(row.materialId);
      }
      if (noDrop.outcomes > 0) {
        expect(nativeIdentity(noDrop.first)).toBeUndefined();
        expect(nativeIdentity(2 ** 32 - 1)).toBeUndefined();
      }
    }
  }
  if (output !== undefined) writeNewReport(root, output, { ...report, sourceState: before });
}, 30_000);

it('matches independently calculated Act I trash rune and folded gem intervals', async () => {
  const { analyzeIndependentMaterialContext } = await import('./material-acquisition');
  const row = analyzeIndependentMaterialContext({ act: 1, difficulty: 'normal', tier: 'trash' });
  const el = row.materials.find(material => material.materialId === 'runes/el');
  const eld = row.materials.find(material => material.materialId === 'runes/eld');
  // El weight 10000 / 53500; strict gate u < .006, then identity u/.006.
  expect(el).toMatchObject({ first: 0, endExclusive: 4_816_786, outcomes: 4_816_786 });
  expect(eld).toMatchObject({ first: 4_816_786, endExclusive: 9_151_893, outcomes: 4_335_107 });
  expect(row.channels.rune.noDrop.first).toBe(25_769_804);
  expect(row.channels.gem.noDrop.first).toBe(64_424_510);
  // Act I folds normal-quality weight into flawed: 70 chipped + 30 flawed per type.
  expect(row.materials.find(material => material.materialId === 'gems/amethyst/chipped'))
    .toMatchObject({ first: 0, endExclusive: 6_442_451 });
  expect(row.materials.find(material => material.materialId === 'gems/amethyst/flawed'))
    .toMatchObject({ first: 6_442_451, endExclusive: 9_203_502 });
  expect(row.materials.find(material => material.materialId === 'gems/amethyst/normal')?.outcomes).toBe(0);
});

it('distinguishes modeled waiting times from observed playtime and unreachable sources', async () => {
  const { analyzeIndependentMaterialContext } = await import('./material-acquisition');
  const row = analyzeIndependentMaterialContext({ act: 5, difficulty: 'hell', tier: 'elite' });
  const zod = row.materials.find(material => material.materialId === 'runes/zod');
  expect(zod?.outcomes).toBeGreaterThan(0);
  if (!zod?.iidWaitingKills) throw new Error('Missing attainable Zod estimate');
  const p = zod.probabilityPerKill;
  expect(zod.iidWaitingKills.mean).toBe(1 / p);
  for (const [quantile, kills] of [[.5, zod.iidWaitingKills.median], [.95, zod.iidWaitingKills.p95]]) {
    if (quantile === undefined || kills === undefined) throw new Error('Missing quantile');
    expect(-Math.expm1(kills * Math.log1p(-p))).toBeGreaterThanOrEqual(quantile);
    expect(-Math.expm1((kills - 1) * Math.log1p(-p))).toBeLessThan(quantile);
  }
  expect(zod).not.toHaveProperty('hours');
  const normal = analyzeIndependentMaterialContext({ act: 5, difficulty: 'normal', tier: 'boss' });
  expect(normal.channels.rune.noDrop.outcomes).toBe(0);
  expect(normal.channels.gem.noDrop.outcomes).toBe(0);
  expect(normal.materials.find(material => material.materialId === 'runes/zod'))
    .toMatchObject({ outcomes: 0, probabilityPerKill: 0, iidWaitingKills: null });
  expect(normal.materials.find(material => material.materialId === 'gems/topaz/perfect')?.outcomes).toBe(0);
});
