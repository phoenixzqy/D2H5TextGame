import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  collectSourceState,
  validateOutputPath,
  writeNewReport,
  assertSourceStable
} from './provenance';

// Do not statically import gameplay: collect disk identity before Vite loads data.
it('measures fresh production twice per seed and optionally emits a new external report', async () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const output = process.env.SIM_REPORT_PATH;
  if (output !== undefined) validateOutputPath(root, output);
  const input: unknown =
    process.env.SIM_FIXTURE_PATH === undefined
      ? {
          fixtureVersion: 1,
          id: 'fresh-sorceress-blood-moor-v1',
          origin: {
            kind: 'new-character',
            classId: 'sorceress',
            name: 'SimSorceress',
            policy: 'production-creation-defaults'
          },
          scenario: {
            act: 1,
            subAreaId: 'areas/act1-blood-moor',
            mode: 'manual',
            challengeOrdinal: 0,
            idleEliteMisses: 0
          },
          clockEpochMs: 1792454400000,
          seeds: [1],
          mercPolicy: 'none',
          summonPolicy: 'production-default'
        }
      : (JSON.parse(readFileSync(process.env.SIM_FIXTURE_PATH, 'utf8')) as unknown);
  const before = collectSourceState(root);
  const { runFreshMeasurement } = await import('./adapter');
  const report = runFreshMeasurement(input);
  const after = collectSourceState(root);
  assertSourceStable(before, report.sourceState);
  assertSourceStable(before, after);
  expect(report.runs).toHaveLength(report.fixture.seeds.length * 2);
  expect(report.comparisons.every((comparison) => comparison.rawWaveRecordingsEqual)).toBe(true);
  expect(report.runs.every((run) => run.waves.length > 0)).toBe(true);
  if (output !== undefined) writeNewReport(root, output, report);
}, 30_000);
