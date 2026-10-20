import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import * as adapter from './earned-adapter';
import * as identity from './provenance';
import type { SourceState } from './provenance';
import type { EarnedFixture } from './earned-fixture';
import { fingerprintEarnedFixture } from './earned-fixture';
import { decodeObservation, encodeObservation, observationJson } from './earned-report';
import { runEarnedMeasurement } from './earned-measurement';
import { compareEarnedAttempts } from './earned-comparison';
import { captureEarnedRestorers, observeEarnedState, observeStore } from './earned-state';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const tiny: EarnedFixture = {
  fixtureVersion: 2, id: 'earned-adapter-tiny',
  origin: { kind: 'new-character', classId: 'sorceress', name: 'Tiny Earned',
    policy: 'production-creation-defaults' },
  clockEpochMs: 1792497600000, seeds: [1], acquisitionSeedPolicy: 'production-clock',
  actions: [
    { kind: 'hire-merc', mercId: 'mercs/act1-rogue-inner-sight' },
    { kind: 'allocate-skill', skillId: 'skills-sorceress-fire-bolt', points: 1 },
    { kind: 'set-combo', skillIds: ['skills-sorceress-fire-bolt'] },
    { kind: 'farm-first-waves', subAreaId: 'areas/act1-blood-moor', count: 1, firstChallengeOrdinal: 0 },
    { kind: 'checkpoint', id: 'earned-after-one' },
    { kind: 'allocate-stats', deltas: { strength: 0, dexterity: 0, vitality: 5, energy: 0 } },
    { kind: 'accept-quest', questId: 'quests/act1-den-of-evil' },
    { kind: 'checkpoint', id: 'ready' }
  ],
  scenario: { act: 1, subAreaId: 'areas/act1-den-of-evil', mode: 'manual', challengeOrdinal: 1,
    idleEliteMisses: 0 }, mercPolicy: 'recipe-actions', summonPolicy: 'production-default'
};
let source: SourceState;
let template: adapter.EarnedAttempt;
beforeAll(() => {
  source = identity.collectSourceState(root);
  template = adapter.runEarnedRecipeOnce(tiny, { targetSeed: 1, repetition: 1 });
});
afterEach(() => { vi.restoreAllMocks(); });

// The real attempt above supplies value shapes only. Mocked attempts below test
// orchestration and injected failures, never victory, reproducibility or balance.
function controls() {
  const collect = vi.spyOn(identity, 'collectSourceState').mockImplementation(() => structuredClone(source));
  const run = vi.spyOn(adapter, 'runEarnedRecipeOnce').mockImplementation((input, options) => ({
    ...structuredClone(template), fixture: structuredClone(input) as EarnedFixture,
    targetSeed: options.targetSeed, repetition: options.repetition,
    sourceBefore: structuredClone(source), sourceAfter: structuredClone(source)
  }));
  return { collect, run };
}
function caught(fn: () => unknown): unknown {
  try { fn(); } catch (error) { return error; }
  throw new Error('Expected measurement to throw');
}

describe('versioned earned measurement orchestration', () => {
  it('runs exactly two fresh attempts per declared seed in declaration order, one comparison each', () => {
    const { run, collect } = controls();
    const fixture = { ...structuredClone(tiny), seeds: [7, 1] };
    const shapedAttempt = run.getMockImplementation();
    if (!shapedAttempt) throw new Error('Missing orchestration control');
    run.mockImplementation((input, options) => {
      const attempt = shapedAttempt(input, options);
      // Asymmetric synthetic channels distinguish correct pair propagation
      // from reusing one pair's flags. These are never gameplay observations.
      if (options.repetition === 2 && options.targetSeed === 7) {
        const item = attempt.acquisitionJournal[0];
        if (!item) throw new Error('Missing native item shape');
        Object.assign(item, { id: 'synthetic-pair-seven' });
      }
      if (options.repetition === 2 && options.targetSeed === 1)
        Object.assign(attempt.terminal.inventory.currencies, { gold: 991 });
      return attempt;
    });
    const beforeInput = observationJson(fixture); const beforeSource = observationJson(source);
    const report = runEarnedMeasurement(fixture, source);
    expect(run.mock.calls.map(([, options]) => options)).toEqual([
      { targetSeed: 7, repetition: 1 }, { targetSeed: 7, repetition: 2 },
      { targetSeed: 1, repetition: 1 }, { targetSeed: 1, repetition: 2 }
    ]);
    expect(collect).toHaveBeenCalledTimes(6); // pre-action + four restored attempts + final
    expect(report.attempts.map(attempt => [attempt.targetSeed, attempt.repetition]))
      .toEqual([[7, 1], [7, 2], [1, 1], [1, 2]]);
    expect(report.comparisons.map(comparison => comparison.targetSeed)).toEqual([7, 1]);
    const returned = run.mock.results.map(result => {
      if (result.type !== 'return') throw new Error('Expected complete controlled adapter result');
      return result.value;
    });
    expect(observationJson(report.attempts)).toBe(observationJson(returned));
    const expectedComparisons = fixture.seeds.map((targetSeed, index) => {
      const first = returned[index * 2]; const second = returned[index * 2 + 1];
      if (!first || !second) throw new Error('Missing controlled pair');
      return { targetSeed, ...compareEarnedAttempts(first, second) };
    });
    expect(report.comparisons).toEqual(expectedComparisons);
    expect(expectedComparisons[0]?.itemIdentityAssessment).toBe('different');
    expect(expectedComparisons[1]?.rawDomainObservationsEqual).toBe(false);
    expect(report.reportVersion).toBe(2);
    expect(report.observationEncoding).toBe('d2h5-observation-v1');
    expect(report.fixture).toEqual(fixture); expect(report.fixture).not.toBe(fixture);
    expect(report.provenance).toEqual({ sourceSha: source.sourceSha, sourceTreeHash: source.sourceTreeHash,
      dataHash: source.dataHash, fixtureHash: fingerprintEarnedFixture(fixture), fixtureVersion: 2,
      nodeVersion: source.nodeVersion, vitestVersion: source.vitestVersion });
    expect(report.sourceBeforeImport).toEqual(source); expect(report.sourceAfter).toEqual(source);
    expect(report.identityAllocation).toEqual({ scope: 'process-global', reset: false, initialState: 'unobserved' });
    expect(report.scope).toEqual({ execution: 'production-manual-only', screening: false, campaignAcceptance: false });
    expect(report.timingInterpretation).toEqual({
      logicalSimSeconds: 'sum-of-attempted-terminal-sim-clocks',
      uiDelayHintSeconds: 'sum-of-attempted-recorded-event-ui-delays',
      wallSeconds: 'adapter-execution-and-restoration'
    });
    const decoded = decodeObservation(JSON.parse(JSON.stringify(encodeObservation(report))));
    expect(observationJson(decoded)).toBe(observationJson(report));
    expect(observationJson(fixture)).toBe(beforeInput); expect(observationJson(source)).toBe(beforeSource);
  });
  it.each([
    { ...tiny, extra: true },
    { ...tiny, seeds: [] },
    { ...tiny, actions: [{ kind: 'hire-merc', mercId: 'unknown' }, ...tiny.actions] },
    { ...tiny, origin: { ...tiny.origin, classId: 'unknown' } }
  ])('rejects invalid shape or production references before adapter calls %#', input => {
    const { run } = controls();
    expect(() => runEarnedMeasurement(input, source)).toThrow();
    expect(run).not.toHaveBeenCalled();
  });
  it.each(['sourceSha', 'sourceTreeHash', 'dataHash', 'nodeVersion', 'vitestVersion',
    'manifest', 'collectionPolicy'] as const)('refuses pre-import %s drift before any attempt', key => {
    const { run } = controls(); const changed = structuredClone(source);
    Object.assign(changed, { [key]: null });
    expect(() => runEarnedMeasurement(tiny, changed)).toThrow();
    expect(run).not.toHaveBeenCalled();
  });
  it.each([
    { name: 'after first restored attempt', call: 2, attempted: 1 },
    { name: 'after second restored attempt', call: 3, attempted: 2 },
    { name: 'final verification', call: 4, attempted: 2 }
  ])('aborts on source drift $name without retries or later attempts', ({ call, attempted }) => {
    const { run, collect } = controls(); let collections = 0;
    collect.mockImplementation(() => ({ ...structuredClone(source),
      sourceTreeHash: ++collections >= call ? 'changed-source' : source.sourceTreeHash }));
    expect(() => runEarnedMeasurement(tiny, source)).toThrow();
    expect(run).toHaveBeenCalledTimes(attempted);
  });
  it.each(['sourceBefore', 'sourceAfter'] as const)('refuses inconsistent adapter %s evidence', field => {
    const { run } = controls();
    run.mockImplementation(() => ({ ...structuredClone(template),
      [field]: { ...structuredClone(source), sourceTreeHash: 'inconsistent' } }));
    expect(() => runEarnedMeasurement(tiny, source)).toThrow();
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('propagates original structural and cleanup error identities without retries', () => {
    const { run } = controls();
    for (const error of [new Error('structural sentinel'),
      new AggregateError([new Error('execution'), new Error('cleanup')], 'cleanup sentinel')]) {
      run.mockClear(); run.mockImplementation(() => { throw error; });
      expect(caught(() => runEarnedMeasurement(tiny, source))).toBe(error);
      expect(run).toHaveBeenCalledTimes(1);
    }
  });
  it('retains expected refusal and partial observations in genuine restored attempts', () => {
    const restorers = captureEarnedRestorers();
    try {
      useInventoryStore.getState().addCurrency('gold', 913);
      const before = observationJson({ state: observeEarnedState(), combat: observeStore(useCombatStore) });
      const now = Date.now;
      const fixture = { ...structuredClone(tiny), actions: [
        { kind: 'allocate-skill' as const, skillId: 'skills-sorceress-fire-bolt', points: 20 }, ...tiny.actions
      ] };
      const report = runEarnedMeasurement(fixture, source);
      expect(report.attempts).toHaveLength(2);
      for (const attempt of report.attempts) {
        expect(attempt.status).toBe('action-refused'); expect(attempt.refusal?.actionIndex).toBe(0);
        expect(attempt.actions).toHaveLength(1); expect(attempt.actions[0]?.result.ok).toBe(false);
        expect(attempt.preTarget).toBeNull(); expect(attempt.target).toBeNull();
        expect(attempt.created).toBeDefined(); expect(attempt.terminal).toBeDefined();
      }
      expect(report.comparisons[0]?.rewardPathCoverage).toEqual({ first: 'unexercised', second: 'unexercised' });
      expect(observationJson({ state: observeEarnedState(), combat: observeStore(useCombatStore) })).toBe(before);
      expect(Date.now).toBe(now);
    } finally { for (const restore of restorers) restore(); }
  });
});
