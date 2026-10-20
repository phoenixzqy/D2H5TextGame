import { fileURLToPath } from 'node:url';
import { itemBases, skills, subAreas } from '@/data/index';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { loadQuests } from '@/data/loaders/quests';
import { parseEarnedFixture, fingerprintEarnedFixture } from './earned-fixture';
import { runEarnedRecipeOnce, type EarnedAttempt } from './earned-adapter';
import { compareEarnedAttempts, sourceIdentity } from './earned-comparison';
import { observationJson } from './earned-report';
import { collectSourceState, type SourceState } from './provenance';

const classes = Object.values(import.meta.glob<{ id: string }>(
  '../../../src/data/classes/*.json', { eager: true, import: 'default' }));

/** Refuse changes to any v2 source/tool field, including manifests and policy. */
export function assertEarnedSourceStable(before: SourceState, after: SourceState): void {
  if (observationJson(sourceIdentity(before)) !== observationJson(sourceIdentity(after)))
    throw new Error('Earned source/tool identity drift during measurement');
}

/**
 * Run exactly two fresh, restored production attempts per declared seed.
 * The caller must collect actual disk identity before importing this gameplay
 * module. Expected refusals/nonwins remain observations; errors abort the report.
 * No persistence or process-global identity allocator is initialized/reset here.
 */
export function runEarnedMeasurement(input: unknown, beforeImportSource: SourceState) {
  const fixture = parseEarnedFixture(input, { classes, areas: subAreas, skills,
    mercs: loadMercHireRoster().flatMap(act => act.mercs),
    bases: itemBases.flatMap(({ id, slot }) => slot === null ? [] : [{ id, slot }]), quests: loadQuests() });
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  assertEarnedSourceStable(beforeImportSource, collectSourceState(root));
  const attempts: EarnedAttempt[] = [];
  const comparisons: ({ targetSeed: number } & ReturnType<typeof compareEarnedAttempts>)[] = [];
  function measure(targetSeed: number, repetition: 1 | 2): EarnedAttempt {
    const attempt = runEarnedRecipeOnce(fixture, { targetSeed, repetition });
    assertEarnedSourceStable(beforeImportSource, attempt.sourceBefore);
    assertEarnedSourceStable(beforeImportSource, attempt.sourceAfter);
    assertEarnedSourceStable(beforeImportSource, collectSourceState(root));
    attempts.push(attempt);
    return attempt;
  }
  for (const targetSeed of fixture.seeds) {
    const first = measure(targetSeed, 1);
    const second = measure(targetSeed, 2);
    comparisons.push({ targetSeed, ...compareEarnedAttempts(first, second) });
  }
  const sourceAfter = collectSourceState(root);
  assertEarnedSourceStable(beforeImportSource, sourceAfter);
  return {
    reportVersion: 2 as const,
    observationEncoding: 'd2h5-observation-v1' as const,
    provenance: { sourceSha: beforeImportSource.sourceSha, sourceTreeHash: beforeImportSource.sourceTreeHash,
      dataHash: beforeImportSource.dataHash, fixtureHash: fingerprintEarnedFixture(fixture),
      fixtureVersion: fixture.fixtureVersion, nodeVersion: beforeImportSource.nodeVersion,
      vitestVersion: beforeImportSource.vitestVersion },
    fixture, sourceBeforeImport: structuredClone(beforeImportSource), sourceAfter, attempts, comparisons,
    identityAllocation: { scope: 'process-global', reset: false, initialState: 'unobserved' } as const,
    scope: { execution: 'production-manual-only', screening: false, campaignAcceptance: false } as const,
    timingInterpretation: {
      logicalSimSeconds: 'sum-of-attempted-terminal-sim-clocks',
      uiDelayHintSeconds: 'sum-of-attempted-recorded-event-ui-delays',
      wallSeconds: 'adapter-execution-and-restoration'
    } as const
  };
}
