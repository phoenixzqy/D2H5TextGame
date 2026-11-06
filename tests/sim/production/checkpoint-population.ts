import assert from 'node:assert/strict';
import type { WavePlan, WaveSpec } from '@/engine/combat/sub-area-run';
import { CHECKPOINT_SEED_PARTITIONS, type CheckpointFixture } from './checkpoint-fixture';
import type { CheckpointAttempt, CheckpointWave } from './checkpoint-attempt';

/** Settled native observations only; no store, gameplay or saved-state imports at runtime. */
export interface CheckpointPopulationAttempt {
  fixture: CheckpointFixture;
  handle: { totalWaves: number };
  /** Exact installed plan when recorded. Never reconstruct missing historical plans. */
  plan?: Pick<WavePlan, 'subAreaId' | 'mode' | 'seed'> & {
    waves: readonly Pick<WaveSpec, 'presentation'>[];
  };
  waves: readonly {
    index: number;
    presentation: CheckpointWave['presentation'];
    advanceResult: CheckpointWave['advanceResult'];
    metrics: Pick<CheckpointWave['metrics'], 'outcome' | 'logicalMs' | 'victoryOnlyTtkMs' |
      'heroDied' | 'heroEntryLife' | 'heroEntryMana' | 'heroLife' | 'heroMana' |
      'minimumObservedMana' | 'directDamageBySource' | 'periodicDamageByTarget'> &
      /** Absent historical metrics do not establish that no periodic damage occurred. */
      Partial<Pick<CheckpointWave['metrics'], 'periodicProvenance'>>;
  }[];
  completeVictory: boolean;
  unreachedWaveCount: number;
  logicalMs: number;
  actualDelta: CheckpointAttempt['actualDelta'];
}

function context(fixture: CheckpointFixture) {
  return { fixtureVersion: fixture.fixtureVersion, checkpoint: fixture.checkpoint, build: fixture.build,
    scenario: fixture.scenario, clockEpochMs: fixture.clockEpochMs, stage: fixture.sample.stage };
}

function percentiles(values: readonly number[]) {
  assert.ok(values.every(value => Number.isFinite(value) && value >= 0), 'Invalid observed measurement');
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p: number) => sorted.length ? sorted[Math.ceil(sorted.length * p) - 1] ?? null : null;
  return { n: sorted.length, p10: at(0.1), p50: at(0.5), p90: at(0.9), p95: at(0.95) };
}

/** Unadjusted 95% Wilson score interval for independent seed-trial outcomes. */
function rate(successes: number, n: number) {
  if (!n) return { n, successes, estimate: null, lower95: null, upper95: null };
  const estimate = successes / n, z2 = 1.959963984540054 ** 2;
  const denominator = 1 + z2 / n;
  const center = (estimate + z2 / (2 * n)) / denominator;
  const radius = Math.sqrt(z2 * (estimate * (1 - estimate) / n + z2 / (4 * n * n))) / denominator;
  return { n, successes, estimate, lower95: successes === 0 ? 0 : Math.max(0, center - radius),
    upper95: successes === n ? 1 : Math.min(1, center + radius) };
}

function sumRecords(records: readonly Readonly<Record<string, number>>[]) {
  const sums = new Map<string, number>();
  for (const record of records) for (const [key, value] of Object.entries(record)) {
    assert.ok(Number.isFinite(value), 'Invalid observed ledger or damage');
    sums.set(key, (sums.get(key) ?? 0) + value);
  }
  return Object.fromEntries([...sums].sort(([a], [b]) => a.localeCompare(b)));
}

function validateAttempt(attempt: CheckpointPopulationAttempt) {
  const { waves, handle, plan } = attempt, last = waves.at(-1);
  assert.ok(Number.isSafeInteger(handle.totalWaves) && handle.totalWaves > 0);
  assert.ok(last && waves.length <= handle.totalWaves, 'Missing settled terminal wave');
  assert.equal(attempt.unreachedWaveCount, handle.totalWaves - waves.length);
  if (plan !== undefined) {
    assert.equal(plan.subAreaId, attempt.fixture.scenario.subAreaId, 'Native plan area mismatch');
    assert.equal(plan.mode, attempt.fixture.scenario.mode, 'Native plan mode mismatch');
    assert.equal(plan.seed, attempt.fixture.sample.seed, 'Native plan seed mismatch');
    assert.equal(plan.waves.length, handle.totalWaves, 'Native plan length mismatch');
    for (const wave of plan.waves)
      assert.ok(wave.presentation && ['trash', 'elite', 'boss'].includes(wave.presentation.kind),
        'Missing native plan wave role');
  }
  for (const [index, wave] of waves.entries()) {
    const m = wave.metrics;
    assert.equal(wave.index, index, 'Noncontiguous wave observations');
    assert.ok(wave.presentation && ['trash', 'elite', 'boss'].includes(wave.presentation.kind),
      'Missing native wave role');
    if (plan !== undefined)
      assert.deepEqual(wave.presentation, plan.waves[index]?.presentation, 'Native plan presentation mismatch');
    assert.ok(['victory', 'defeat', 'draw'].includes(m.outcome), 'Unknown settled outcome');
    assert.ok(Number.isFinite(m.logicalMs) && m.logicalMs >= 0, 'Invalid logical duration');
    assert.equal(m.heroDied, m.heroLife <= 0, 'Inconsistent observed hero death');
    assert.equal(m.victoryOnlyTtkMs, m.outcome === 'victory' ? m.logicalMs : null);
    if (m.outcome === 'victory') assert.equal(m.heroDied, false);
    if (index < waves.length - 1) {
      assert.equal(wave.advanceResult, 'next-wave', 'Observation continues after terminal wave');
      assert.equal(m.outcome, 'victory', 'Observation continues after a nonwin');
    }
  }
  assert.ok(last.advanceResult === 'victory' || last.advanceResult === 'defeat', 'Unsettled terminal wave');
  const won = last.advanceResult === 'victory';
  assert.equal(attempt.completeVictory, won, 'Inconsistent area victory');
  if (won) {
    assert.equal(waves.length, handle.totalWaves);
    assert.ok(waves.every(wave => wave.metrics.outcome === 'victory'));
  } else assert.notEqual(last.metrics.outcome, 'victory', 'Area failure lacks a terminal nonwin');
  assert.equal(attempt.logicalMs, waves.reduce((sum, wave) => sum + wave.metrics.logicalMs, 0));
}

/**
 * Summarize one exact cell and a prospectively declared seed set, including partial
 * populations. Consumes validated native attempts; does not execute gameplay.
 * Whole-area rates use independent started seeds. Target wave durations/counts
 * are descriptive, correlated observations. Only a recorded native plan can
 * distinguish an absent role from one blocked by a failed prefix; missing
 * historical plans remain unknown. A missing role is never a role loss.
 * Logical combat-hour yields omit player decisions and cannot establish pacing.
 */
export function summarizeCheckpointPopulation(
  reference: CheckpointFixture,
  expectedSeeds: readonly number[],
  targetRole: 'trash' | 'elite' | 'boss',
  attempts: readonly CheckpointPopulationAttempt[]
) {
  const cell = context(reference), [minimum, maximum] = CHECKPOINT_SEED_PARTITIONS[cell.stage];
  assert.ok(expectedSeeds.length > 0, 'Declare at least one seed');
  const expected = new Set<number>();
  for (const seed of expectedSeeds) {
    assert.ok(Number.isSafeInteger(seed) && seed >= minimum && seed <= maximum,
      'Expected seed outside declared partition');
    assert.ok(!expected.has(seed), 'Duplicate expected seed');
    expected.add(seed);
  }
  const seen = new Set<number>();
  for (const attempt of attempts) {
    assert.deepEqual(context(attempt.fixture), cell, 'Mixed checkpoint population context');
    const seed = attempt.fixture.sample.seed;
    assert.ok(expected.has(seed) && !seen.has(seed), 'Duplicate or undeclared observed seed');
    seen.add(seed);
    validateAttempt(attempt);
  }
  const ordered = [...attempts].sort((a, b) => a.fixture.sample.seed - b.fixture.sample.seed);
  const rows = ordered.map(attempt => {
    const first = attempt.waves[0], last = attempt.waves.at(-1);
    assert.ok(first && last);
    const plannedTargetWaveIndices = attempt.plan === undefined ? null : attempt.plan.waves
      .flatMap((wave, index) => wave.presentation?.kind === targetRole ? [index] : []);
    return {
      seed: attempt.fixture.sample.seed, outcome: attempt.completeVictory ? 'victory' as const : last.metrics.outcome,
      heroDied: attempt.waves.some(wave => wave.metrics.heroDied), logicalMs: attempt.logicalMs,
      plannedWaves: attempt.handle.totalWaves, observedWaves: attempt.waves.length,
      unreachedWaves: attempt.unreachedWaveCount,
      entryLife: first.metrics.heroEntryLife, entryMana: first.metrics.heroEntryMana,
      finalLife: last.metrics.heroLife, finalMana: last.metrics.heroMana,
      minimumMana: Math.min(...attempt.waves.map(wave => wave.metrics.minimumObservedMana)),
      plannedTargetWaveIndices,
      unreachedTargetWaveIndices: plannedTargetWaveIndices?.filter(index => index >= attempt.waves.length) ?? null,
      targetWaves: attempt.waves.filter(wave => wave.presentation?.kind === targetRole)
        .map(wave => ({ index: wave.index, presentation: wave.presentation,
          advanceResult: wave.advanceResult, metrics: wave.metrics }))
    };
  });
  const n = rows.length, wins = rows.filter(row => row.outcome === 'victory').length;
  const heroDeaths = rows.filter(row => row.heroDied).length;
  const targetWaves = rows.flatMap(row => row.targetWaves);
  const reachedSeeds = rows.filter(row => row.targetWaves.length).map(row => row.seed);
  const logicalMs = rows.reduce((sum, row) => sum + row.logicalMs, 0);
  const deltas = ordered.map(attempt => attempt.actualDelta);
  const xp = deltas.reduce((sum, delta) => { assert.ok(Number.isFinite(delta.xp)); return sum + delta.xp; }, 0);
  const itemsByRarity = sumRecords(deltas.map(delta => sumRecords(delta.addedItems.map(item => ({ [item.rarity]: 1 })))));
  const perHour = (amount: number) => logicalMs > 0 ? amount * 3600000 / logicalMs : null;
  const waves = ordered.flatMap(attempt => attempt.waves);
  const origins = waves.flatMap(wave => wave.metrics.periodicProvenance ? [wave.metrics.periodicProvenance] : []);
  return structuredClone({
    reportVersion: 2,
    scope: { balanceAcceptance: false, clock: 'logical-combat', interval: '95%-Wilson-unadjusted-seed-trials',
      timeoutClassification: 'unavailable-in-native-observations', waveSamplesIndependent: false,
      roleReachDenominator: 'all-started-seed-trials' },
    context: cell, targetRole, expectedSeeds: [...expected].sort((a, b) => a - b),
    observedSeeds: rows.map(row => row.seed), missingSeeds: [...expected].filter(seed => !seen.has(seed)).sort((a, b) => a - b),
    populationComplete: n === expected.size,
    wholeArea: { n, wins, defeats: rows.filter(row => row.outcome === 'defeat').length,
      draws: rows.filter(row => row.outcome === 'draw').length, timeouts: null, heroDeaths,
      winRate: rate(wins, n), heroDeathRate: rate(heroDeaths, n),
      allLogicalMs: percentiles(rows.map(row => row.logicalMs)),
      victoryOnlyLogicalMs: percentiles(rows.filter(row => row.outcome === 'victory').map(row => row.logicalMs)),
      failedLogicalMs: percentiles(rows.filter(row => row.outcome !== 'victory').map(row => row.logicalMs)) },
    target: { reachedSeeds, notObservedSeeds: rows.filter(row => !row.targetWaves.length).map(row => row.seed),
      plannedSeeds: rows.filter(row => row.plannedTargetWaveIndices?.length).map(row => row.seed),
      absentSeeds: rows.filter(row => row.plannedTargetWaveIndices?.length === 0).map(row => row.seed),
      unreachedSeeds: rows.filter(row => row.plannedTargetWaveIndices?.length && !row.targetWaves.length).map(row => row.seed),
      planUnavailableSeeds: rows.filter(row => row.plannedTargetWaveIndices === null).map(row => row.seed),
      plannedWaveCount: rows.reduce((sum, row) => sum + (row.plannedTargetWaveIndices?.length ?? 0), 0),
      unreachedWaveCount: rows.reduce((sum, row) => sum + (row.unreachedTargetWaveIndices?.length ?? 0), 0),
      reachedRate: rate(reachedSeeds.length, n),
      waveOutcomes: { victory: targetWaves.filter(wave => wave.metrics.outcome === 'victory').length,
        defeat: targetWaves.filter(wave => wave.metrics.outcome === 'defeat').length,
        draw: targetWaves.filter(wave => wave.metrics.outcome === 'draw').length },
      victoryOnlyWaveLogicalMs: percentiles(targetWaves.flatMap(wave =>
        wave.metrics.victoryOnlyTtkMs === null ? [] : [wave.metrics.victoryOnlyTtkMs])) },
    resources: { entryLife: percentiles(rows.map(row => row.entryLife)), entryMana: percentiles(rows.map(row => row.entryMana)),
      finalLife: percentiles(rows.map(row => row.finalLife)), finalMana: percentiles(rows.map(row => row.finalMana)),
      minimumMana: percentiles(rows.map(row => row.minimumMana)) },
    damage: { directBySource: sumRecords(ordered.flatMap(attempt => attempt.waves.map(wave => wave.metrics.directDamageBySource))),
      periodicByTarget: sumRecords(ordered.flatMap(attempt => attempt.waves.map(wave => wave.metrics.periodicDamageByTarget))),
      periodicProvenance: { unknownWaveCount: waves.length - origins.length,
        eventCount: origins.reduce((sum, origin) => sum + origin.eventCount, 0),
        missingEventCount: origins.reduce((sum, origin) => sum + origin.missingEventCount, 0),
        hpMsBySource: sumRecords(origins.map(origin => origin.hpMsBySource)),
        hpMsByDamageType: sumRecords(origins.map(origin => origin.hpMsByDamageType)) } },
    rewards: { xp, xpPerLogicalHour: perHour(xp), itemsByRarity,
      itemsPerLogicalHourByRarity: Object.fromEntries(Object.entries(itemsByRarity).map(([key, count]) => [key, perHour(count)])),
      materials: sumRecords(deltas.map(delta => delta.materials)), currencies: sumRecords(deltas.map(delta => delta.currencies)),
      mercXp: sumRecords(deltas.map(delta => delta.mercXp)), removedItemCount: deltas.reduce((sum, delta) => sum + delta.removedItemIds.length, 0) },
    trials: rows
  });
}
