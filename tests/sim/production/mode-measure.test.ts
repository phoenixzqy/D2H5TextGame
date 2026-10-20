import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { collectSourceState, validateOutputPath, writeNewReport } from './provenance';

// Only Node/Vitest/provenance load statically. Gameplay imports follow disk capture.
// The test runner and provenance module have already loaded; no earlier claim.
it('reports the four closed restored-mode cases with before-import source identity', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.MODE_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const beforeImport = collectSourceState(root);
  const { runRestoredModeMeasurement } = await import('./mode-measurement');
  const { assertEarnedSourceStable } = await import('./earned-measurement');
  let measured: ReturnType<typeof runRestoredModeMeasurement> | undefined;
  expect(() => { measured = runRestoredModeMeasurement(beforeImport); }).not.toThrow();
  if (!measured) throw new Error('Missing restored report');
  const report = measured;
  const { encodeObservation, hashObservation } = await import('./earned-report');
  expect(report.reportKind).toBe('restored-mode-diagnostic'); expect(report.reportVersion).toBe(1);
  expect(report.observationEncoding).toBe('d2h5-observation-v1');
  expect(report.protocol.baselineTag).toBe('restored-test-baseline-v1');
  expect(report.attempts.map(a => a.options)).toEqual([
    { mode: 'manual', idleEliteMisses: 0 }, { mode: 'idle', idleEliteMisses: 0 },
    { mode: 'manual', idleEliteMisses: 11 }, { mode: 'idle', idleEliteMisses: 11 }
  ]);
  expect(report.attempts).toHaveLength(4); expect(report.baselineHashes).toHaveLength(4);
  expect(report.protocol.cases).toEqual(report.attempts.map(a => a.options));
  expect(report.baselineHashes).toEqual(report.attempts.map(a => hashObservation({
    baselineTag: a.baselineTag, clockEpochMs: a.clockEpochMs, scope: a.scope,
    requestedPity: a.options.idleEliteMisses, created: a.created, actions: a.actions,
    baseline: a.baseline, baselineCombat: a.baselineCombat, baselinePity: a.baselinePity })));
  expect(report.scope).toEqual({ synthetic: true, directService: true, uiEligible: false,
    earnedClear: false, routingExercised: false, screening: false, campaignAcceptance: false });
  const { compareRestoredModes } = await import('./mode-comparison');
  const firstManual = report.attempts[0]; const firstIdle = report.attempts[1];
  const secondManual = report.attempts[2]; const secondIdle = report.attempts[3];
  if (!firstManual || !firstIdle || !secondManual || !secondIdle) throw new Error('Missing closed attempt');
  expect(report.comparisons).toEqual([
    { idleEliteMisses: 0, ...compareRestoredModes(firstManual, firstIdle) },
    { idleEliteMisses: 11, ...compareRestoredModes(secondManual, secondIdle) }
  ]);
  expect(report.comparisons.map(c => c.idleEliteMisses)).toEqual([0, 11]);
  expect(report.comparisons.every(c => c.sourceIdentityEqual)).toBe(true);
  expect(report.provenance.protocolHash).toBe(hashObservation(report.protocol));
  for (const attempt of report.attempts) {
    expect(['completed', 'baseline-refused']).toContain(attempt.status);
    expect(attempt.scope).toEqual({ synthetic: true, uiEligible: false, syntheticClear: false, routingExercised: false });
    assertEarnedSourceStable(beforeImport, attempt.sourceBefore);
    assertEarnedSourceStable(beforeImport, attempt.sourceAfter);
  }
  const encoded = encodeObservation(report);
  assertEarnedSourceStable(beforeImport, report.sourceBeforeImport);
  assertEarnedSourceStable(beforeImport, report.sourceAfter);
  assertEarnedSourceStable(beforeImport, collectSourceState(root));
  if (output !== undefined) writeNewReport(root, output, encoded);
}, 30_000);
