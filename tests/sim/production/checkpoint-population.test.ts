import { expect, it } from 'vitest';
import type { CheckpointFixture } from './checkpoint-fixture';
import {
  summarizeCheckpointPopulation, type CheckpointPopulationAttempt
} from './checkpoint-population';

const fixture: CheckpointFixture = {
  fixtureVersion: 3, id: 'population-control',
  checkpoint: { kind: 'constructed-control', sha256: 'a'.repeat(64), evidence: 'unit-control' },
  build: { id: 'cold-control', classId: 'sorceress', level: 13 },
  scenario: { act: 1, subAreaId: 'areas/act1-blood-moor', mode: 'manual',
    difficulty: 'normal', challengeOrdinal: 117, idleEliteMisses: 0 },
  sample: { stage: 'screening', seed: 1 }, clockEpochMs: 1793304000000
};

function wave(index: number, kind: 'trash' | 'elite' | 'boss',
  outcome: 'victory' | 'defeat' | 'draw', logicalMs: number,
  advanceResult: 'victory' | 'defeat' | 'next-wave'
): CheckpointPopulationAttempt['waves'][number] {
  return {
    index, presentation: { kind, ...(kind === 'boss' ? { isActBoss: true } : {}) }, advanceResult,
    metrics: { outcome, logicalMs, victoryOnlyTtkMs: outcome === 'victory' ? logicalMs : null,
      heroDied: outcome === 'defeat', heroEntryLife: 100, heroEntryMana: 80,
      heroLife: outcome === 'defeat' ? 0 : 60, heroMana: 50, minimumObservedMana: 40,
      directDamageBySource: { hero: 12, enemy: 4 }, periodicDamageByTarget: { enemy: 3 } }
  };
}

function attempt(seed: number, won: boolean): CheckpointPopulationAttempt {
  const waves = won
    ? [wave(0, 'trash', 'victory', 1000, 'next-wave'), wave(1, 'boss', 'victory', 3000, 'victory')]
    : [wave(0, 'trash', 'defeat', 2000, 'defeat')];
  return {
    fixture: { ...fixture, sample: { ...fixture.sample, seed } },
    handle: { totalWaves: 2 }, waves, completeVictory: won, unreachedWaveCount: won ? 0 : 1,
    logicalMs: waves.reduce((sum, entry) => sum + entry.metrics.logicalMs, 0),
    actualDelta: { xp: won ? 30 : 0, mercXp: {}, addedItems: [], removedItemIds: [],
      materials: won ? { rune: 1 } : {}, currencies: {}, addedClears: [] }
  };
}

it('keeps early deaths in a partial population and separates victory time from failed time', () => {
  const result = summarizeCheckpointPopulation(fixture, [1, 2, 3], 'boss', [attempt(2, false), attempt(1, true)]);
  expect(result.observedSeeds).toEqual([1, 2]);
  expect(result.missingSeeds).toEqual([3]);
  expect(result.populationComplete).toBe(false);
  expect(result.wholeArea).toMatchObject({ n: 2, wins: 1, defeats: 1, draws: 0, heroDeaths: 1,
    winRate: { estimate: 0.5 }, victoryOnlyLogicalMs: { n: 1, p50: 4000 },
    failedLogicalMs: { n: 1, p50: 2000 } });
  expect(result.wholeArea.winRate.lower95).toBeCloseTo(0.0945312);
  expect(result.wholeArea.winRate.upper95).toBeCloseTo(0.9054688);
  expect(result.target.reachedSeeds).toEqual([1]);
  expect(result.target.notObservedSeeds).toEqual([2]);
  expect(result.target.unreachedSeeds).toEqual([]);
  expect(result.target.planUnavailableSeeds).toEqual([1, 2]);
  expect(result.target.waveOutcomes).toEqual({ victory: 1, defeat: 0, draw: 0 });
  expect(result.target.victoryOnlyWaveLogicalMs.p50).toBe(3000);
  expect(result.scope.balanceAcceptance).toBe(false);
});

it('reports an empty population without a fabricated zero win rate or duration', () => {
  const result = summarizeCheckpointPopulation(fixture, [1, 2], 'elite', []);
  expect(result.missingSeeds).toEqual([1, 2]);
  expect(result.wholeArea.winRate).toEqual({ n: 0, successes: 0, estimate: null, lower95: null, upper95: null });
  expect(result.wholeArea.allLogicalMs).toEqual({ n: 0, p10: null, p50: null, p90: null, p95: null });
  expect(result.rewards.xpPerLogicalHour).toBeNull();
});

it('projects rich native waves without copying their full event recordings into the report', () => {
  const native = attempt(1, true);
  const rich = { ...native, waves: native.waves.map(entry => ({ ...entry, events: ['large-native-recording'] })) };
  const result = summarizeCheckpointPopulation(fixture, [1], 'boss', [rich]);
  expect(result.trials[0]?.targetWaves[0]).not.toHaveProperty('events');
  expect(result.wholeArea.winRate.upper95).toBe(1);
  expect(result.wholeArea.heroDeathRate.lower95).toBe(0);
});

it('preserves a reached draw, without inferring a timeout or treating the waves as independent trials', () => {
  const draw = attempt(1, false);
  draw.waves = [wave(0, 'trash', 'draw', 2000, 'defeat')];
  const result = summarizeCheckpointPopulation(fixture, [1], 'trash', [draw]);
  expect(result.populationComplete).toBe(true);
  expect(result.wholeArea).toMatchObject({ draws: 1, defeats: 0, heroDeaths: 0, timeouts: null });
  expect(result.target.reachedSeeds).toEqual([1]);
  expect(result.target.waveOutcomes).toEqual({ victory: 0, defeat: 0, draw: 1 });
  expect(result.target.victoryOnlyWaveLogicalMs.n).toBe(0);
});

it('uses nearest-rank percentiles and includes won-prefix rewards from a failed area', () => {
  const failed = attempt(2, false);
  failed.handle.totalWaves = 3;
  failed.waves = [wave(0, 'trash', 'victory', 1000, 'next-wave'), wave(1, 'elite', 'defeat', 1000, 'defeat')];
  failed.actualDelta.xp = 10;
  failed.actualDelta.materials = { rune: 2 };
  const inputs = [attempt(1, true), failed, attempt(3, true)];
  const before = structuredClone(inputs);
  const result = summarizeCheckpointPopulation(fixture, [3, 1, 2], 'trash', inputs);
  expect(result.wholeArea.allLogicalMs).toEqual({ n: 3, p10: 2000, p50: 4000, p90: 4000, p95: 4000 });
  expect(result.rewards).toMatchObject({ xp: 70, materials: { rune: 4 }, xpPerLogicalHour: 25200 });
  expect(result.target.waveOutcomes).toEqual({ victory: 3, defeat: 0, draw: 0 });
  expect(result.wholeArea.winRate.n).toBe(3);
  expect(result.resources.finalMana.p50).toBe(50);
  expect(result.damage).toEqual({ directBySource: { hero: 72, enemy: 24 }, periodicByTarget: { enemy: 18 },
    periodicProvenance: { unknownWaveCount: 6, eventCount: 0, missingEventCount: 0,
      hpMsBySource: {}, hpMsByDamageType: {} } });
  expect(inputs).toEqual(before);
});

it('aggregates integrated periodic origins while preserving unknown historical wave coverage', () => {
  const base = attempt(1, true);
  const current = { ...base, waves: base.waves.map(entry => ({ ...entry, metrics: { ...entry.metrics,
    periodicProvenance: { eventCount: 2, missingEventCount: 1,
      hpMsBySource: { hero: 500, merc: 1000 }, hpMsByDamageType: { poison: 500, unknown: 1000 } }
  } })) };
  const result = summarizeCheckpointPopulation(fixture, [1, 2], 'boss', [current, attempt(2, false)]);
  expect(result.damage).toEqual({ directBySource: { hero: 36, enemy: 12 }, periodicByTarget: { enemy: 9 },
    periodicProvenance: { unknownWaveCount: 1, eventCount: 4, missingEventCount: 2,
      hpMsBySource: { hero: 1000, merc: 2000 }, hpMsByDamageType: { poison: 1000, unknown: 2000 } } });
  expect(result.scope.balanceAcceptance).toBe(false);
});

it('rejects duplicate, undeclared, fractional and out-of-partition seeds', () => {
  expect(() => summarizeCheckpointPopulation(fixture, [1, 1], 'boss', [])).toThrow(/seed/i);
  expect(() => summarizeCheckpointPopulation(fixture, [1], 'boss', [attempt(1, true), attempt(1, false)])).toThrow(/seed/i);
  expect(() => summarizeCheckpointPopulation(fixture, [1], 'boss', [attempt(2, true)])).toThrow(/seed/i);
  for (const seed of [0, 1.5, 101, 10001])
    expect(() => summarizeCheckpointPopulation(fixture, [seed], 'boss', [])).toThrow(/seed/i);
});

it.each(['source', 'power', 'ordinal', 'mode', 'pity', 'clock', 'stage', 'area'])(
  'rejects a mixed %s population', field => {
    const changed = structuredClone(attempt(1, true));
    switch (field) {
      case 'source': changed.fixture = { ...fixture, checkpoint: { ...fixture.checkpoint, sha256: 'b'.repeat(64) } }; break;
      case 'power': changed.fixture = { ...fixture, build: { ...fixture.build, level: 14 } }; break;
      case 'ordinal': changed.fixture = { ...fixture, scenario: { ...fixture.scenario, challengeOrdinal: 118 } }; break;
      case 'mode': changed.fixture = { ...fixture, scenario: { ...fixture.scenario, mode: 'idle' } }; break;
      case 'pity': changed.fixture = { ...fixture, scenario: { ...fixture.scenario, idleEliteMisses: 11 } }; break;
      case 'clock': changed.fixture = { ...fixture, clockEpochMs: fixture.clockEpochMs + 1 }; break;
      case 'stage': changed.fixture = { ...fixture, sample: { stage: 'holdout', seed: 10001 } }; break;
      case 'area': changed.fixture = { ...fixture, scenario: { ...fixture.scenario, subAreaId: 'areas/act1-catacombs' } }; break;
    }
    expect(() => summarizeCheckpointPopulation(fixture, [1], 'boss', [changed])).toThrow(/context/i);
  }
);

it('rejects truncated or contradictory terminal observations instead of silently counting them', () => {
  const changes: ((entry: CheckpointPopulationAttempt) => void)[] = [
    entry => { entry.completeVictory = false; },
    entry => { entry.logicalMs++; },
    entry => { entry.unreachedWaveCount = 1; },
    entry => { entry.waves = entry.waves.slice(0, 1); },
    entry => { entry.waves = [wave(1, 'trash', 'victory', 1000, 'next-wave'), wave(1, 'boss', 'victory', 3000, 'victory')]; },
    entry => { entry.waves = [wave(0, 'trash', 'defeat', 1000, 'next-wave'), wave(1, 'boss', 'victory', 3000, 'victory')]; },
    entry => { entry.waves = [wave(0, 'trash', 'victory', NaN, 'next-wave'), wave(1, 'boss', 'victory', 3000, 'victory')]; }
  ];
  for (const change of changes) {
    const entry = attempt(1, true);
    change(entry);
    expect(() => summarizeCheckpointPopulation(fixture, [1], 'boss', [entry])).toThrow();
  }
});

function withPlan(entry: CheckpointPopulationAttempt, kinds: ('trash' | 'elite' | 'boss')[]) {
  return { ...entry, plan: { subAreaId: entry.fixture.scenario.subAreaId,
    seed: entry.fixture.sample.seed, mode: entry.fixture.scenario.mode, waves: kinds.map(kind => ({
    presentation: { kind, ...(kind === 'boss' ? { isActBoss: true } : {}) }
  })) } };
}

it('distinguishes a role absent from the native plan, blocked by a failed prefix, and historically unknown', () => {
  const absent = attempt(1, true);
  absent.waves = [wave(0, 'trash', 'victory', 1000, 'next-wave'), wave(1, 'elite', 'victory', 3000, 'victory')];
  const result = summarizeCheckpointPopulation(fixture, [1, 2, 3, 4], 'boss', [
    withPlan(absent, ['trash', 'elite']), withPlan(attempt(2, false), ['trash', 'boss']),
    attempt(3, false), withPlan(attempt(4, true), ['trash', 'boss'])
  ]);
  expect(result.reportVersion).toBe(2);
  expect(result.wholeArea.winRate).toMatchObject({ n: 4, successes: 2 });
  expect(result.target).toMatchObject({ reachedSeeds: [4], notObservedSeeds: [1, 2, 3],
    plannedSeeds: [2, 4], absentSeeds: [1], unreachedSeeds: [2], planUnavailableSeeds: [3],
    plannedWaveCount: 2, unreachedWaveCount: 1 });
  expect(result.trials.map(row => row.plannedTargetWaveIndices)).toEqual([[], [1], null, [1]]);
  expect(result.trials.map(row => row.unreachedTargetWaveIndices)).toEqual([[], [1], null, []]);
});

it('retains later unplayed occurrences of a role that was already reached', () => {
  const partial = attempt(1, false);
  partial.handle.totalWaves = 5;
  partial.waves = [wave(0, 'trash', 'victory', 1000, 'next-wave'),
    wave(1, 'elite', 'victory', 2000, 'next-wave'), wave(2, 'trash', 'defeat', 1000, 'defeat')];
  partial.logicalMs = 4000;
  partial.unreachedWaveCount = 2;
  partial.actualDelta.xp = 10;
  const result = summarizeCheckpointPopulation(fixture, [1], 'elite', [
    withPlan(partial, ['trash', 'elite', 'trash', 'elite', 'boss'])
  ]);
  expect(result.target).toMatchObject({ reachedSeeds: [1], plannedSeeds: [1], unreachedSeeds: [],
    plannedWaveCount: 2, unreachedWaveCount: 1, waveOutcomes: { victory: 1, defeat: 0, draw: 0 } });
  expect(result.trials[0]).toMatchObject({ plannedTargetWaveIndices: [1, 3], unreachedTargetWaveIndices: [3] });
  expect(result.rewards.xp).toBe(10);
  expect(result.scope.waveSamplesIndependent).toBe(false);
});

it('rejects plan length, role and presentation drift instead of inventing coverage', () => {
  const plans = [
    { waves: [] },
    { waves: [{ presentation: { kind: 'elite' as const } }, { presentation: { kind: 'boss' as const } }] },
    { waves: [{ presentation: { kind: 'trash' as const } }, {}] },
    { waves: [{ presentation: { kind: 'trash' as const, isIdleElite: true } },
      { presentation: { kind: 'boss' as const, isActBoss: true } }] }
  ];
  for (const plan of plans)
    expect(() => summarizeCheckpointPopulation(fixture, [1], 'boss', [{ ...attempt(1, true),
      plan: { ...withPlan(attempt(1, true), ['trash', 'boss']).plan, ...plan } }])).toThrow(/plan/i);
});

it.each(['area', 'mode', 'seed'])('rejects a native plan from a different %s', field => {
  const entry = withPlan(attempt(1, true), ['trash', 'boss']);
  if (field === 'area') entry.plan.subAreaId = 'areas/act1-catacombs';
  if (field === 'mode') entry.plan.mode = 'idle';
  if (field === 'seed') entry.plan.seed = 2;
  expect(() => summarizeCheckpointPopulation(fixture, [1], 'boss', [entry])).toThrow(/plan/i);
});
