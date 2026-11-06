import { expect, it } from 'vitest';
import { parseCheckpointFixture } from './checkpoint-fixture';

const references = {
  classes: [{ id: 'classes/sorceress' }, { id: 'classes/barbarian' }],
  areas: [{ id: 'areas/act1-blood-moor', actId: 'acts/act1' },
    { id: 'areas/act5-worldstone-keep', actId: 'acts/act5' }]
};
const example = {
  fixtureVersion: 3,
  id: 'sorceress-act1-control',
  checkpoint: { kind: 'constructed-control', sha256: 'a'.repeat(64), evidence: 'constructed-unit-control' },
  build: { id: 'sorceress-initial', classId: 'sorceress', level: 1 },
  scenario: { act: 1, subAreaId: 'areas/act1-blood-moor', mode: 'manual',
    difficulty: 'normal', challengeOrdinal: 0, idleEliteMisses: 0 },
  sample: { stage: 'benchmark', seed: 1 },
  clockEpochMs: 1792497600000
};

it('accepts a detached checkpoint descriptor without accepting injected stats or actions', () => {
  const parsed = parseCheckpointFixture(example, references);
  expect(parsed).toStrictEqual(example);
  expect(parsed).not.toBe(example);
  expect(() => parseCheckpointFixture({ ...example, attack: 10000 }, references)).toThrow();
  expect(() => parseCheckpointFixture({ ...example, actions: [] }, references)).toThrow();
});

it.each([
  { build: { ...example.build, classId: 'unknown' } },
  { build: { ...example.build, level: 0 } },
  { checkpoint: { ...example.checkpoint, sha256: 'bad' } },
  { checkpoint: { ...example.checkpoint, kind: 'certified' } },
  { scenario: { ...example.scenario, subAreaId: 'blood-moor' } },
  { scenario: { ...example.scenario, act: 5 } },
  { scenario: { ...example.scenario, challengeOrdinal: 360360 } },
  { scenario: { ...example.scenario, idleEliteMisses: -1 } },
  { scenario: { ...example.scenario, mode: 'auto-win' } },
  { sample: { stage: 'benchmark', seed: 2 } },
  { sample: { stage: 'screening', seed: 101 } },
  { sample: { stage: 'tuning', seed: 1001 } },
  { sample: { stage: 'holdout', seed: 1000 } },
  { sample: { stage: 'holdout', seed: 11001 } },
  { clockEpochMs: Infinity }
])('rejects invalid checkpoint context or sample partitions %#', patch => {
  expect(() => parseCheckpointFixture({ ...example, ...patch }, references)).toThrow();
});

it.each([
  ['screening', 1], ['screening', 100], ['tuning', 1], ['tuning', 1000],
  ['holdout', 10001], ['holdout', 11000]
])('accepts the declared %s seed boundary %i', (stage, seed) => {
  expect(parseCheckpointFixture({ ...example, sample: { stage, seed } }, references).sample)
    .toEqual({ stage, seed });
});

it('supports another class, higher act, idle mode and owned higher difficulty descriptors', () => {
  const descriptor = { ...example, build: { id: 'barbarian-control', classId: 'barbarian', level: 82 },
    scenario: { ...example.scenario, act: 5, subAreaId: 'areas/act5-worldstone-keep',
      mode: 'idle', difficulty: 'hell', challengeOrdinal: 360359, idleEliteMisses: 11 } };
  expect(parseCheckpointFixture(descriptor, references)).toEqual(descriptor);
});
