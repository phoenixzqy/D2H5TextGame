import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import * as adapter from './mode-adapter';
import * as identity from './provenance';
import { runRestoredModeMeasurement } from './mode-measurement';
import { compareRestoredModes } from './mode-comparison';
import { decodeObservation, encodeObservation, hashObservation, observationJson } from './earned-report';
import type { SourceState } from './provenance';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const cases = [{ mode: 'manual', idleEliteMisses: 0 }, { mode: 'idle', idleEliteMisses: 0 },
  { mode: 'manual', idleEliteMisses: 11 }, { mode: 'idle', idleEliteMisses: 11 }] as const;
const protocol = { baselineTag: 'restored-test-baseline-v1', cases } as const;
let source: SourceState; let template: adapter.RestoredModeAttempt;
beforeAll(() => {
  source = identity.collectSourceState(root);
  // One real native value shape, <=3 battles. All spy returns below are synthetic.
  template = adapter.runRestoredModeOnce(cases[0]);
});
const counts: { name: string | undefined; assertions: number }[] = [];
afterEach(() => {
  counts.push({ name: expect.getState().currentTestName, assertions: expect.getState().assertionCalls });
  vi.restoreAllMocks();
});
afterAll(() => {
  if (process.env.D2H5_MODE_REPORT_ASSERT_OUT) identity.writeNewReport(root, process.env.D2H5_MODE_REPORT_ASSERT_OUT, counts);
  if (process.env.D2H5_MODE_REPORT_TEMPLATE_OUT) identity.writeNewReport(root, process.env.D2H5_MODE_REPORT_TEMPLATE_OUT,
    encodeObservation({ template }));
});
function controls() {
  const collect = vi.spyOn(identity, 'collectSourceState').mockImplementation(() => structuredClone(source));
  const run = vi.spyOn(adapter, 'runRestoredModeOnce').mockImplementation(input => {
    const options = input as adapter.RestoredModeOptions;
    return { ...structuredClone(template), options: structuredClone(options),
      baselinePity: options.idleEliteMisses, terminalPity: options.idleEliteMisses,
      sourceBefore: structuredClone(source), sourceAfter: structuredClone(source) };
  });
  return { collect, run };
}
function measure() {
  let report: ReturnType<typeof runRestoredModeMeasurement> | undefined;
  expect(() => { report = runRestoredModeMeasurement(source); }).not.toThrow();
  if (!report) throw new Error('Missing restored report');
  return report;
}
function requiredAt<T>(values: readonly T[], index: number): T {
  const value = values[index]; if (value === undefined) throw new Error('Missing native value'); return value;
}
function caught(run: () => unknown): unknown {
  try { run(); } catch (error) { return error; } throw new Error('Expected failure');
}
function baselineHash(a: adapter.RestoredModeAttempt) {
  return hashObservation({ baselineTag: a.baselineTag, clockEpochMs: a.clockEpochMs, scope: a.scope,
    requestedPity: a.options.idleEliteMisses, created: a.created, actions: a.actions,
    baseline: a.baseline, baselineCombat: a.baselineCombat, baselinePity: a.baselinePity });
}
it('runs exactly four declared cases, retains original observations, propagates distinct pair comparisons', () => {
  const { run, collect } = controls(); const shape = run.getMockImplementation();
  if (!shape) throw new Error('Missing synthetic adapter');
  run.mockImplementation(input => {
    const attempt = shape(input);
    if (attempt.options.mode === 'idle' && attempt.options.idleEliteMisses === 0)
      Object.assign(requiredAt(requiredAt(attempt.waves, 0).rawRewardDelta.items, 0), { id: 'synthetic-id-only' });
    if (attempt.options.mode === 'idle' && attempt.options.idleEliteMisses === 11)
      Object.assign(attempt.terminal.inventory.currencies, { syntheticCurrency: 918 });
    return attempt;
  });
  const before = observationJson(source); const report = measure();
  expect(run.mock.calls.map(([input]) => input)).toEqual(cases);
  expect(collect).toHaveBeenCalledTimes(6); // pre-action, four restored checks, final
  const attempts = run.mock.results.map(result => {
    if (result.type !== 'return') throw new Error('Expected synthetic adapter return'); return result.value;
  });
  expect(observationJson(report.attempts)).toBe(observationJson(attempts));
  const expected = [0, 1].map((_, index) => ({ idleEliteMisses: index === 0 ? 0 : 11,
    ...compareRestoredModes(requiredAt(attempts, index * 2), requiredAt(attempts, index * 2 + 1)) }));
  expect(report.comparisons).toEqual(expected);
  expect(requiredAt(expected, 0).itemIdentityAssessment).toBe('different');
  expect(requiredAt(expected, 1).rawDomainObservationsEqual).toBe(false);
  expect(report.baselineHashes).toEqual(attempts.map(baselineHash));
  expect(report.reportKind).toBe('restored-mode-diagnostic'); expect(report.reportVersion).toBe(1);
  expect(report.observationEncoding).toBe('d2h5-observation-v1');
  expect(report.protocol).toEqual(protocol); expect(report.protocol).not.toBe(protocol);
  expect(report.provenance).toEqual({ sourceSha: source.sourceSha, sourceTreeHash: source.sourceTreeHash,
    dataHash: source.dataHash, nodeVersion: source.nodeVersion, vitestVersion: source.vitestVersion,
    protocolHash: hashObservation(protocol) });
  expect(report.sourceBeforeImport).toEqual(source); expect(report.sourceBeforeImport).not.toBe(source);
  expect(report.sourceAfter).toEqual(source);
  expect(report.scope).toEqual({ synthetic: true, directService: true, uiEligible: false,
    earnedClear: false, routingExercised: false, screening: false, campaignAcceptance: false });
  expect(report.identityAllocation).toEqual({ scope: 'process-global', reset: false, initialState: 'unobserved' });
  expect(report.timingInterpretation).toEqual({ logicalSimSeconds: 'sum-of-attempted-terminal-sim-clocks',
    uiDelayHintSeconds: 'sum-of-attempted-recorded-event-ui-delays', wallSeconds: 'adapter-execution-and-restoration',
    humanActivePlayDuration: false });
  expect(observationJson(decodeObservation(JSON.parse(JSON.stringify(encodeObservation(report))))))
    .toBe(observationJson(report));
  expect(observationJson(source)).toBe(before);
});
it('retains baseline refusal and partial observations without skipping any remaining case', () => {
  const { run } = controls(); const shape = run.getMockImplementation();
  if (!shape) throw new Error('Missing synthetic adapter');
  run.mockImplementation(input => {
    const attempt = shape(input); const action = requiredAt(attempt.actions, 0);
    return { ...attempt, status: 'baseline-refused',
      refusal: { actionIndex: 0, reason: 'synthetic-native-refusal-shape' }, handle: null, waves: [],
      actions: [{ ...action, after: action.before, result: { ok: false, reason: 'synthetic-native-refusal-shape' } }],
      baseline: action.before, terminal: action.before, terminalCombat: attempt.baselineCombat,
      terminalPity: attempt.baselinePity };
  });
  const report = measure(); expect(run).toHaveBeenCalledTimes(4);
  expect(report.attempts).toHaveLength(4);
  expect(report.attempts.map(a => a.options)).toEqual(cases);
  expect(observationJson(report.attempts)).toBe(observationJson(run.mock.results.map(result => result.value)));
  for (const a of report.attempts) {
    expect(a.status).toBe('baseline-refused'); expect(a.refusal).toEqual({ actionIndex: 0, reason: 'synthetic-native-refusal-shape' });
    expect(a.actions).toHaveLength(1); expect(requiredAt(a.actions, 0).result.ok).toBe(false);
    expect(a.created).toEqual(template.created);
    expect(a.baseline).toEqual(requiredAt(template.actions, 0).before); expect(a.terminal).toEqual(a.baseline);
    expect(a.handle).toBeNull(); expect(a.waves).toEqual([]);
  }
  expect(report.comparisons.every(c => c.battlePathCoverage.first === 'unexercised' &&
    c.battlePathCoverage.second === 'unexercised')).toBe(true);
  expect(report.comparisons.every(c => c.rewardPathCoverage.first === 'unexercised' &&
    c.rewardPathCoverage.second === 'unexercised')).toBe(true);
});
it('retains one refusal followed by three distinct completed observations', () => {
  const { run } = controls(); const shape = run.getMockImplementation(); let calls = 0;
  if (!shape) throw new Error('Missing synthetic adapter');
  run.mockImplementation(input => {
    const attempt = shape(input);
    if (++calls !== 1) return attempt;
    const action = requiredAt(attempt.actions, 0);
    return { ...attempt, status: 'baseline-refused',
      refusal: { actionIndex: 0, reason: 'synthetic-first-only' }, handle: null, waves: [],
      actions: [{ ...action, after: action.before, result: { ok: false, reason: 'synthetic-first-only' } }],
      baseline: action.before, terminal: action.before, terminalCombat: attempt.baselineCombat,
      terminalPity: attempt.baselinePity };
  });
  const report = measure(); expect(run).toHaveBeenCalledTimes(4);
  expect(report.attempts.map(a => a.options)).toEqual(cases);
  const returned = run.mock.results.map(result => result.value);
  expect(observationJson(report.attempts)).toBe(observationJson(returned));
  expect(report.attempts.map(a => a.status)).toEqual(['baseline-refused', 'completed', 'completed', 'completed']);
  expect(report.comparisons).toEqual([0, 1].map((_, index) => ({ idleEliteMisses: index === 0 ? 0 : 11,
    ...compareRestoredModes(requiredAt(returned, index * 2), requiredAt(returned, index * 2 + 1)) })));
});
it.each(['sourceSha', 'sourceTreeHash', 'dataHash', 'nodeVersion', 'vitestVersion', 'manifest', 'collectionPolicy'] as const)
('refuses pre-import %s drift before any adapter call', field => {
  const { run } = controls(); const changed = { ...structuredClone(source), [field]: null };
  expect(() => runRestoredModeMeasurement(changed as SourceState)).toThrow(); expect(run).not.toHaveBeenCalled();
});
it.each(['sourceBefore', 'sourceAfter'] as const)('refuses inconsistent adapter %s before continuing', field => {
  for (const position of [1, 2, 3, 4]) {
    for (const identityField of ['sourceSha', 'sourceTreeHash', 'dataHash', 'nodeVersion', 'vitestVersion', 'manifest', 'collectionPolicy']) {
      const { run } = controls(); const shape = run.getMockImplementation(); let calls = 0;
      if (!shape) throw new Error('Missing synthetic adapter');
      run.mockImplementation(input => {
        const attempt = shape(input);
        return ++calls === position ? { ...attempt, [field]: { ...structuredClone(source), [identityField]: null } } : attempt;
      });
      expect(() => runRestoredModeMeasurement(source)).toThrow(); expect(run).toHaveBeenCalledTimes(position);
      vi.restoreAllMocks();
    }
  }
});
it.each([2, 3, 4, 5, 6])('aborts source drift at collection %s with no later attempts', call => {
  for (const field of ['sourceSha', 'sourceTreeHash', 'dataHash', 'nodeVersion', 'vitestVersion', 'manifest', 'collectionPolicy']) {
    const { collect, run } = controls(); let count = 0;
    collect.mockImplementation(() => ++count >= call ? { ...structuredClone(source), [field]: null } as SourceState : structuredClone(source));
    expect(() => runRestoredModeMeasurement(source)).toThrow(); expect(run).toHaveBeenCalledTimes(Math.min(call - 1, 4));
    vi.restoreAllMocks();
  }
});
it('preserves structural and aggregate error identities, stopping at the failed attempt without retry', () => {
  for (const error of [new Error('native error'), new AggregateError([new Error('native'), new Error('cleanup')], 'aggregate')]) {
    const { run } = controls(); const shape = run.getMockImplementation(); let calls = 0;
    if (!shape) throw new Error('Missing synthetic adapter');
    run.mockImplementation(input => { if (++calls === 2) throw error; return shape(input); });
    expect(caught(() => runRestoredModeMeasurement(source))).toBe(error); expect(run).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  }
});
