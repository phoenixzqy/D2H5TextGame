import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assertSourceStable, collectSourceState, validateOutputPath, writeNewReport } from './provenance';

// Only Node I/O/provenance and the test runner load statically. Gameplay is loaded
// after collecting disk identity, including this driver's actual untracked bytes.
it('measures the declared fresh earned recipe twice per seed and optionally writes a new external report', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.EARNED_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const input: unknown = process.env.EARNED_FIXTURE_PATH === undefined ? {
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
  } : JSON.parse(readFileSync(process.env.EARNED_FIXTURE_PATH, 'utf8')) as unknown;
  const beforeImport = collectSourceState(root);
  const { runEarnedMeasurement, assertEarnedSourceStable } = await import('./earned-measurement');
  const report = runEarnedMeasurement(input, beforeImport);
  expect(report.reportVersion).toBe(2);
  expect(report.observationEncoding).toBe('d2h5-observation-v1');
  expect(report.attempts).toHaveLength(report.fixture.seeds.length * 2);
  expect(report.attempts.map(attempt => [attempt.targetSeed, attempt.repetition]))
    .toEqual(report.fixture.seeds.flatMap(seed => [[seed, 1], [seed, 2]]));
  expect(report.comparisons.map(comparison => comparison.targetSeed)).toEqual(report.fixture.seeds);
  expect(report.comparisons.every(comparison => comparison.sourceIdentityEqual)).toBe(true);
  const { encodeObservation } = await import('./earned-report');
  const encoded = encodeObservation(report);
  const after = collectSourceState(root);
  assertSourceStable(beforeImport, report.sourceBeforeImport);
  assertSourceStable(beforeImport, report.sourceAfter);
  assertSourceStable(beforeImport, after);
  assertEarnedSourceStable(beforeImport, after);
  if (output !== undefined) writeNewReport(root, output, encoded);
}, 30_000);
