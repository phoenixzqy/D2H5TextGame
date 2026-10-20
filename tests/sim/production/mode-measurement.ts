import { fileURLToPath } from 'node:url';
import { runRestoredModeOnce, type RestoredModeAttempt, type RestoredModeOptions } from './mode-adapter';
import { assertEarnedSourceStable } from './earned-measurement';
import { collectSourceState } from './provenance';
import { compareRestoredModes, type RestoredModeComparison } from './mode-comparison';
import { hashObservation } from './earned-report';
import type { SourceState } from './provenance';
export interface RestoredModeReport {
  readonly reportKind: 'restored-mode-diagnostic';
  readonly reportVersion: 1;
  readonly observationEncoding: 'd2h5-observation-v1';
  readonly protocol: { readonly baselineTag: 'restored-test-baseline-v1'; readonly cases: readonly RestoredModeOptions[] };
  readonly provenance: { readonly sourceSha: string; readonly sourceTreeHash: string; readonly dataHash: string;
    readonly nodeVersion: string; readonly vitestVersion: string; readonly protocolHash: string };
  readonly sourceBeforeImport: SourceState;
  readonly sourceAfter: SourceState;
  readonly attempts: readonly RestoredModeAttempt[];
  readonly baselineHashes: readonly string[];
  readonly comparisons: readonly (RestoredModeComparison & { readonly idleEliteMisses: 0 | 11 })[];
  readonly scope: { readonly synthetic: true; readonly directService: true; readonly uiEligible: false;
    readonly earnedClear: false; readonly routingExercised: false; readonly screening: false; readonly campaignAcceptance: false };
  readonly identityAllocation: { readonly scope: 'process-global'; readonly reset: false; readonly initialState: 'unobserved' };
  readonly timingInterpretation: { readonly logicalSimSeconds: 'sum-of-attempted-terminal-sim-clocks';
    readonly uiDelayHintSeconds: 'sum-of-attempted-recorded-event-ui-delays';
    readonly wallSeconds: 'adapter-execution-and-restoration'; readonly humanActivePlayDuration: false };
}
/** Run exactly four closed synthetic direct-service cases, verifying before-import source identity. */
export function runRestoredModeMeasurement(beforeImportSource: SourceState): RestoredModeReport {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  assertEarnedSourceStable(beforeImportSource, collectSourceState(root));
  const cases: readonly RestoredModeOptions[] = [
    { mode: 'manual', idleEliteMisses: 0 }, { mode: 'idle', idleEliteMisses: 0 },
    { mode: 'manual', idleEliteMisses: 11 }, { mode: 'idle', idleEliteMisses: 11 }
  ];
  const attempts: RestoredModeAttempt[] = [];
  for (const options of cases) {
    const attempt = runRestoredModeOnce(options);
    assertEarnedSourceStable(beforeImportSource, attempt.sourceBefore);
    assertEarnedSourceStable(beforeImportSource, attempt.sourceAfter);
    assertEarnedSourceStable(beforeImportSource, collectSourceState(root));
    attempts.push(attempt);
  }
  const sourceAfter = collectSourceState(root);
  assertEarnedSourceStable(beforeImportSource, sourceAfter);
  const protocol = { baselineTag: 'restored-test-baseline-v1', cases } as const;
  const comparisons = ([0, 11] as const).map((idleEliteMisses, index) => {
    const manual = attempts[index * 2]; const idle = attempts[index * 2 + 1];
    if (!manual || !idle) throw new Error('Missing closed restored-mode attempt');
    return { idleEliteMisses, ...compareRestoredModes(manual, idle) };
  });
  return {
    reportKind: 'restored-mode-diagnostic', reportVersion: 1,
    observationEncoding: 'd2h5-observation-v1', protocol,
    provenance: { sourceSha: beforeImportSource.sourceSha, sourceTreeHash: beforeImportSource.sourceTreeHash,
      dataHash: beforeImportSource.dataHash, nodeVersion: beforeImportSource.nodeVersion,
      vitestVersion: beforeImportSource.vitestVersion, protocolHash: hashObservation(protocol) },
    sourceBeforeImport: structuredClone(beforeImportSource), sourceAfter, attempts, comparisons,
    baselineHashes: attempts.map(attempt => hashObservation({
      baselineTag: attempt.baselineTag, clockEpochMs: attempt.clockEpochMs, scope: attempt.scope,
      requestedPity: attempt.options.idleEliteMisses, created: attempt.created, actions: attempt.actions,
      baseline: attempt.baseline, baselineCombat: attempt.baselineCombat, baselinePity: attempt.baselinePity
    })),
    scope: { synthetic: true, directService: true, uiEligible: false, earnedClear: false,
      routingExercised: false, screening: false, campaignAcceptance: false },
    identityAllocation: { scope: 'process-global', reset: false, initialState: 'unobserved' },
    timingInterpretation: {
      logicalSimSeconds: 'sum-of-attempted-terminal-sim-clocks',
      uiDelayHintSeconds: 'sum-of-attempted-recorded-event-ui-delays',
      wallSeconds: 'adapter-execution-and-restoration', humanActivePlayDuration: false
    }
  };
}
