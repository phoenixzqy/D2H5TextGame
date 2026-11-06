import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { analyzeCampaignPacing, writePacingReport } from './account-campaign-pacing.mjs';

const handle = { challengeOrdinal: 7, runId: 'areas/act1-cold-plains', totalWaves: 2 };
const wave = (index, logicalMs, outcome) => ({ ordinal: 7, index, area: handle.runId,
  phase: 'route', logicalMs, outcome, heroLife: outcome === 'victory' ? 100 : 0,
  advance: index === 0 ? 'next-wave' : 'defeat' });
const report = () => ({ version: 3, wallMs: 12, admissions: 1,
  admissionHistory: [{ ordinal: 7, area: handle.runId, phase: 'route', totalWaves: 2 }],
  waves: [wave(0, 1000, 'victory'), wave(1, 300, 'defeat')], unobservedWaves: [],
  totals: { combatMs: 1300, farmMs: 0, routeMs: 1300, nonwinMs: 300, nonwins: 1,
    playedWaves: 2, wonWaves: 1, unobservedWaves: 0, unmeasuredWaves: 0 } });
const records = () => [{ kind: 'created' }, { kind: 'admission', handle,
  area: handle.runId, phase: 'route' }, ...report().waves.map(row => ({
  kind: 'settled-wave', handle, wave: { index: row.index, advanceResult: row.advance,
    metrics: { logicalMs: row.logicalMs, outcome: row.outcome, heroLife: row.heroLife } } }))];
const policy = costsMs => ({ format: 'campaign-menu-costs-v1', id: 'test-assumption-v1',
  basis: 'assumed', costsMs: { created: 100, admission: 20, ...costsMs } });

async function fixture(action, additions = [], suppliedPolicy, mutateReport = () => {}) {
  const directory = mkdtempSync(join(tmpdir(), 'd2-pacing-test-'));
  const paths = { reportPath: join(directory, 'report.json'),
    journalPath: join(directory, 'journal.jsonl.gz'), policyPath: undefined };
  const input = report(); mutateReport(input);
  writeFileSync(paths.reportPath, JSON.stringify(input));
  writeFileSync(paths.journalPath, Buffer.concat([...records(), ...additions]
    .map(row => gzipSync(`${JSON.stringify(row)}\n`))));
  if (suppliedPolicy) {
    paths.policyPath = join(directory, 'policy.json');
    writeFileSync(paths.policyPath, JSON.stringify(suppliedPolicy));
  }
  try { await action(paths, directory); }
  finally {
    rmSync(directory, { recursive: true });
    assert.equal(existsSync(directory), false);
  }
}

test('preserves failed fight time and keeps combat, execution and human time separate without a policy', async () => {
  await fixture(async paths => {
    const result = await analyzeCampaignPacing(paths);
    assert.equal(result.combat.knownCombatMs, 1300);
    assert.equal(result.combat.nonwinMs, 300);
    assert.equal(result.timing.combatOnlyMs, 1300);
    assert.equal(result.timing.executionWallMs, 12);
    assert.equal(result.timing.recordedMenuMs, null);
    assert.equal(result.timing.recordedDecisionAdjustedMs, null);
    assert.equal(result.timing.economicMs, null);
    assert.equal(result.timing.humanActiveMs, null);
    assert.equal(result.timing.afkOfflineMs, null);
    assert.equal(result.timing.policyBasis, 'none');
  });
});

test('counts priority transitions, nonempty reviews and refused attempts without charging telemetry twice', async () => {
  const additions = [
    { kind: 'priority', order: ['bash'] }, { kind: 'priority', order: ['bash'] },
    { kind: 'priority', order: ['swing', 'bash'] },
    { kind: 'gear-decision', candidates: [] },
    { kind: 'gear-decision', candidates: [{ eligible: false }, { eligible: true }] },
    { kind: 'equip', result: { ok: false } },
    { kind: 'quest-action', action: 'claim', result: 'refused' },
    { kind: 'owned-capacity-selection' }, { kind: 'campaign-training-attempt' },
    { kind: 'recovery-start' }, { kind: 'nonwin-award-state' }
  ];
  await fixture(async paths => {
    const result = await analyzeCampaignPacing(paths);
    assert.deepEqual(result.actions, { admission: 1, created: 1, equip: 1,
      'gear-decision': 1, priority: 2, 'quest-action:claim': 1 });
    assert.equal(result.coverage.repeatedPriorities, 1);
    assert.equal(result.coverage.emptyGearReviews, 1);
    assert.equal(result.coverage.candidateChecks, 2);
    assert.equal(result.timing.recordedMenuMs, 260);
    assert.equal(result.timing.recordedDecisionAdjustedMs, 1560);
    assert.equal(result.timing.policyBasis, 'assumed');
    assert.equal(result.timing.economicMs, null);
    assert.deepEqual(result.coverage.unknownKinds, {});
  }, additions, policy({ priority: 10, 'gear-decision': 50, equip: 30, 'quest-action:claim': 40 }));
});

test('withholds adjusted totals for unknown events or missing costs, including prototype-shaped names', async () => {
  await fixture(async paths => {
    const result = await analyzeCampaignPacing(paths);
    assert.deepEqual(result.coverage.unknownKinds,
      Object.fromEntries([['__proto__', 1], ['constructor', 1], ['new-menu', 1]]));
    assert.deepEqual(result.timing.missingCostCategories, ['equip']);
    assert.equal(result.timing.coveredMenuMs, 120);
    assert.equal(result.timing.recordedDecisionAdjustedMs, null);
  }, [{ kind: 'new-menu' }, { kind: 'constructor' }, { kind: '__proto__' }, { kind: 'equip' }], policy({}));
});

test('known and unknown unobserved waves remain explicit gaps and cannot earn an adjusted total', async () => {
  for (const logicalMs of [null, 200]) await fixture(async paths => {
    const result = await analyzeCampaignPacing(paths);
    assert.equal(result.combat.knownCombatMs, 1300 + (logicalMs ?? 0));
    assert.equal(result.timing.combatOnlyMs, logicalMs === null ? null : 1500);
    assert.equal(result.coverage.unobservedWaves, 1);
    assert.equal(result.timing.recordedDecisionAdjustedMs, null);
  }, [], policy({}), input => {
    input.unobservedWaves.push({ ordinal: 8, index: 0, area: handle.runId, phase: 'farm', logicalMs });
    input.totals.combatMs += logicalMs ?? 0; input.totals.farmMs += logicalMs ?? 0;
    input.totals.playedWaves++; input.totals.unobservedWaves++;
    input.totals.unmeasuredWaves = logicalMs === null ? 1 : 0;
  });
});

test('reads retained continuation reports without inventing their missing admission-history verification', async () => {
  await fixture(async paths => {
    const result = await analyzeCampaignPacing(paths);
    assert.equal(result.reportFormat, 'retained-continuation-v1');
    assert.equal(result.combat.knownCombatMs, 1300);
    assert.equal(result.combat.nonwinMs, 300);
    assert.equal(result.coverage.admissionHistoryVerified, false);
    assert.equal(result.timing.recordedDecisionAdjustedMs, null);
  }, [], policy({}), input => {
    input.version = 1; input.capture = { kind: 'live-production-snapshot-and-export' };
    input.combatMs = input.totals.combatMs; input.unobserved = input.unobservedWaves;
    delete input.totals; delete input.admissionHistory; delete input.unobservedWaves;
  });
});

test('rejects missing, reordered or altered waves and inconsistent summary accounting', async () => {
  const mutations = [input => { input.waves.pop(); },
    input => { input.waves.reverse(); },
    input => { input.waves[1].logicalMs = 301; },
    input => { input.waves[1].heroLife = 1; },
    input => { input.waves[1].advance = 'victory'; },
    input => { input.totals.nonwinMs = 0; },
    input => { input.admissions = 2; },
    input => { input.admissionHistory[0].phase = 'farm'; }];
  for (const mutation of mutations) await fixture(async paths => {
    await assert.rejects(analyzeCampaignPacing(paths), /reconcil|mismatch/i);
  }, [], undefined, mutation);
});

test('rejects malformed or truncated gzip/JSONL and invalid or falsely calibrated policies', async () => {
  await fixture(async paths => {
    const bytes = readFileSync(paths.journalPath);
    writeFileSync(paths.journalPath, bytes.subarray(0, bytes.length - 4));
    await assert.rejects(analyzeCampaignPacing(paths));
    for (const text of ['{"kind":', '{"kind":"equip"}', '\n', '{}\n']) {
      writeFileSync(paths.journalPath, gzipSync(text));
      await assert.rejects(analyzeCampaignPacing(paths));
    }
  });
  for (const invalid of [policy({ equip: -1 }), policy({ equip: '1' }),
    { ...policy({}), basis: 'calibrated' }, { ...policy({}), id: '' }]) {
    await fixture(paths => assert.rejects(analyzeCampaignPacing(paths), /policy/i), [], invalid);
  }
});

test('hashes the bytes consumed, preserves inputs, creates exclusive external output and refuses repository output', async () => {
  await fixture(async (paths, directory) => {
    const before = [paths.reportPath, paths.journalPath, paths.policyPath].map(path => readFileSync(path));
    const result = await analyzeCampaignPacing(paths);
    ['report', 'journal', 'policy'].forEach((key, index) => {
      assert.equal(result.inputs[key].sha256, createHash('sha256').update(before[index]).digest('hex'));
      assert.equal(result.inputs[key].bytes, before[index].length);
    });
    [paths.reportPath, paths.journalPath, paths.policyPath].forEach((path, i) =>
      assert.deepEqual(readFileSync(path), before[i]));
    const output = join(directory, 'accounting.json');
    writePacingReport(output, result);
    assert.deepEqual(JSON.parse(readFileSync(output)), result);
    assert.throws(() => writePacingReport(output, {}), /EEXIST/);
    assert.throws(() => writePacingReport(new URL('./must-not-exist.json', import.meta.url).pathname, {}), /repository/i);
    assert.equal(existsSync(new URL('./must-not-exist.json', import.meta.url)), false);
  }, [], policy({}));
});
