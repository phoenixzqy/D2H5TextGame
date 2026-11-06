/** Offline, inert-data accounting. Never imports gameplay or starts campaigns. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';

const classificationVersion = 'campaign-recorded-decisions-v1';
const actions = new Set(['created', 'hire', 'allocate-skill', 'allocate-stats', 'select-aura',
  'admission', 'equip', 'merc-equip', 'caster-equip', 'campaign-survival-equip',
  'quest-start', 'quest-claim', 'npc-talk', 'flee-unplayed-wave', 'campaign-inventory-sink',
  'campaign-capacity-transfer', 'campaign-gear-stage', 'campaign-gear-retrieve',
  'campaign-socket-insertion']);
const reviews = new Set(['gear-decision', 'merc-gear-decision', 'caster-gear-decision',
  'campaign-survival-gear-decision']);
// Only reviewed, explicit wrapper/observation kinds are excluded. New kinds stay unknown.
const telemetry = new Set(['staged-wave', 'settled-wave', 'owned-capacity-selection',
  'campaign-training-start', 'campaign-training-attempt', 'campaign-training-terminal',
  'campaign-boss-checkpoint', 'campaign-first-boss-entry', 'nonwin-award-state',
  'recovery-start', 'recovery-training', 'recovery-attempt-retry', 'recovery-resolved',
  'stopped-native-checkpoint']);
const questActions = new Set(['start', 'claim', 'visit', 'recover', 'interact', 'assemble',
  'insert', 'read', 'execute', 'act5']);
const increment = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const sorted = map => Object.fromEntries([...map].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
const nonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const count = value => Number.isSafeInteger(value) && value >= 0;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function readJson(path) {
  assert.ok(isAbsolute(path), 'Input paths must be absolute');
  const bytes = readFileSync(path);
  return { value: JSON.parse(bytes.toString('utf8')),
    input: { path: realpathSync(path), bytes: bytes.length, sha256: hash(bytes) } };
}

function readPolicy(path) {
  if (!path) return null;
  const policy = readJson(path), value = policy.value;
  assert.ok(value?.format === 'campaign-menu-costs-v1' &&
    typeof value.id === 'string' && value.id.trim() && value.basis === 'assumed' &&
    value.costsMs && typeof value.costsMs === 'object' && !Array.isArray(value.costsMs) &&
    Object.values(value.costsMs).every(nonnegative), 'Invalid assumed menu policy');
  return policy;
}

/** Hash compressed bytes as read; consume concatenated gzip members one JSONL record at a time. */
async function readJournal(path, consume) {
  assert.ok(isAbsolute(path), 'Journal path must be absolute');
  const digest = createHash('sha256'), decoder = new StringDecoder('utf8');
  let bytes = 0, pending = '', records = 0;
  const maxRecordCharacters = 64 * 1024 * 1024;
  await pipeline(createReadStream(path), new Transform({ transform(chunk, _encoding, done) {
    bytes += chunk.length; digest.update(chunk); done(null, chunk);
  } }), createGunzip(), async source => {
    for await (const chunk of source) {
      pending += decoder.write(chunk);
      let end;
      while ((end = pending.indexOf('\n')) !== -1) {
        assert.ok(end <= maxRecordCharacters, 'Journal record exceeds 64 Mi characters');
        const line = pending.slice(0, end); pending = pending.slice(end + 1);
        assert.ok(line.trim(), 'Empty journal record');
        const record = JSON.parse(line);
        assert.ok(record && typeof record.kind === 'string' && record.kind.length, 'Missing journal kind');
        consume(record); records++;
      }
      assert.ok(pending.length <= maxRecordCharacters, 'Journal record exceeds 64 Mi characters');
    }
    pending += decoder.end();
    assert.equal(pending, '', 'Truncated JSONL: missing terminal newline');
  });
  assert.ok(records > 0, 'Empty journal');
  return { path: realpathSync(path), bytes, sha256: digest.digest('hex'), records };
}

function sameNumber(actual, expected, label) {
  assert.ok(nonnegative(actual) && nonnegative(expected) &&
    Math.abs(actual - expected) <= Math.max(0.000001, expected * 1e-12),
  `Campaign reconciliation mismatch: ${label}`);
}

/** Read native/retained campaign reports; timing assumptions never establish human pace. */
export async function analyzeCampaignPacing({ reportPath, journalPath, policyPath }) {
  const { value: report, input: reportInput } = readJson(reportPath), policy = readPolicy(policyPath);
  const native = report?.version === 3;
  const continuation = report?.version === 1 && report.capture?.kind === 'live-production-snapshot-and-export';
  const unobserved = native ? report.unobservedWaves : report.unobserved;
  assert.ok((native || continuation) && Array.isArray(report.waves) && Array.isArray(unobserved) &&
    (native ? Array.isArray(report.admissionHistory) && report.totals : nonnegative(report.combatMs)),
  'Expected native version-3 or retained continuation version-1 campaign report');
  assert.ok(nonnegative(report.wallMs), 'Invalid campaign execution time');
  const actionCounts = new Map(), rawKinds = new Map(), unknownKinds = new Map(), telemetryKinds = new Map();
  let admissionIndex = 0, waveIndex = 0, currentAdmission, previousPriority;
  let repeatedPriorities = 0, emptyGearReviews = 0, candidateChecks = 0;
  const combat = { knownCombatMs: 0, farmMs: 0, routeMs: 0, nonwinMs: 0, nonwins: 0,
    wonWaves: 0, playedWaves: 0, unmeasuredWaves: 0 };
  function addTime(row, unobserved = false) {
    assert.ok(row.phase === 'farm' || row.phase === 'route', 'Invalid wave phase');
    assert.ok(unobserved && row.logicalMs === null || nonnegative(row.logicalMs), 'Invalid combat time');
    combat.playedWaves++;
    if (row.logicalMs === null) combat.unmeasuredWaves++;
    else {
      combat.knownCombatMs += row.logicalMs;
      combat[row.phase === 'farm' ? 'farmMs' : 'routeMs'] += row.logicalMs;
    }
    if (!unobserved) {
      const won = row.outcome === 'victory' && row.heroLife > 0 && row.advance !== 'defeat';
      if (won) combat.wonWaves++;
      else { combat.nonwins++; combat.nonwinMs += row.logicalMs; }
    }
  }
  const journalInput = await readJournal(journalPath, record => {
    const { kind } = record; increment(rawKinds, kind);
    if (kind === 'admission') {
      const expected = native ? report.admissionHistory[admissionIndex] : {
        ordinal: record.handle?.challengeOrdinal, area: record.area,
        phase: record.phase, totalWaves: record.handle?.totalWaves };
      admissionIndex++;
      assert.ok(expected && count(expected.ordinal) && count(expected.totalWaves) && expected.totalWaves > 0,
        'Campaign admission reconciliation mismatch');
      assert.deepEqual([record.handle?.challengeOrdinal, record.area, record.phase, record.handle?.totalWaves],
        [expected.ordinal, expected.area, expected.phase, expected.totalWaves], 'Admission reconciliation mismatch');
      currentAdmission = expected;
    }
    if (kind === 'settled-wave') {
      const expected = report.waves[waveIndex++], observed = record.wave, metrics = observed?.metrics;
      assert.ok(expected && currentAdmission && metrics, 'Wave reconciliation mismatch: missing history');
      assert.ok(count(expected.index) && expected.index < currentAdmission.totalWaves,
        'Wave reconciliation mismatch: invalid wave index');
      assert.deepEqual([record.handle?.challengeOrdinal, observed.index, metrics.outcome,
        observed.advanceResult, metrics.heroLife, record.handle?.runId],
      [expected.ordinal, expected.index, expected.outcome, expected.advance, expected.heroLife, expected.area],
      'Wave reconciliation mismatch');
      assert.deepEqual([expected.ordinal, expected.area, expected.phase],
        [currentAdmission.ordinal, currentAdmission.area, currentAdmission.phase], 'Wave admission reconciliation mismatch');
      sameNumber(metrics.logicalMs, expected.logicalMs, 'wave duration');
      addTime(expected);
    }
    if (actions.has(kind)) increment(actionCounts, kind);
    else if (reviews.has(kind)) {
      assert.ok(Array.isArray(record.candidates), 'Missing gear review candidates');
      candidateChecks += record.candidates.length;
      if (record.candidates.length) increment(actionCounts, kind);
      else emptyGearReviews++;
    } else if (kind === 'priority') {
      assert.ok(Array.isArray(record.order) && record.order.every(id => typeof id === 'string'),
        'Missing priority order');
      const order = JSON.stringify(record.order);
      if (previousPriority === order) repeatedPriorities++;
      else increment(actionCounts, kind);
      previousPriority = order;
    } else if (kind === 'quest-action' && questActions.has(record.action)) {
      increment(actionCounts, `quest-action:${record.action}`);
    } else if (telemetry.has(kind)) increment(telemetryKinds, kind);
    else increment(unknownKinds, kind);
  });
  if (native) assert.equal(admissionIndex, report.admissionHistory.length, 'Admission reconciliation mismatch: missing records');
  assert.equal(admissionIndex, report.admissions, 'Admission count reconciliation mismatch');
  assert.equal(waveIndex, report.waves.length, 'Wave reconciliation mismatch: missing records');
  for (const row of unobserved) addTime(row, true);
  if (native) {
    for (const [field, value] of Object.entries(combat))
      sameNumber(value, report.totals[field === 'knownCombatMs' ? 'combatMs' : field], field);
    sameNumber(unobserved.length, report.totals.unobservedWaves, 'unobserved waves');
  } else sameNumber(combat.knownCombatMs, report.combatMs, 'combatMs');
  const missingCostCategories = [], costs = policy?.value.costsMs;
  let coveredMenuMs = 0;
  for (const [category, quantity] of actionCounts) {
    if (!costs || !Object.hasOwn(costs, category)) missingCostCategories.push(category);
    else coveredMenuMs += quantity * costs[category];
  }
  assert.ok(nonnegative(coveredMenuMs), 'Menu policy arithmetic overflow');
  const complete = !!policy && native && !missingCostCategories.length && !unknownKinds.size && !unobserved.length;
  const adjusted = combat.knownCombatMs + coveredMenuMs;
  assert.ok(nonnegative(adjusted), 'Adjusted policy arithmetic overflow');
  return {
    format: 'campaign-pacing-accounting-v1', classificationVersion,
    reportFormat: native ? 'native-campaign-v3' : 'retained-continuation-v1',
    inputs: { report: reportInput, journal: journalInput, policy: policy?.input ?? null },
    policy: policy?.value ?? null, combat,
    rawKinds: sorted(rawKinds), actions: sorted(actionCounts), telemetryKinds: sorted(telemetryKinds),
    coverage: { unknownKinds: sorted(unknownKinds), repeatedPriorities, emptyGearReviews,
      candidateChecks, unobservedWaves: unobserved.length, admissionHistoryVerified: native },
    timing: { combatOnlyMs: combat.unmeasuredWaves ? null : combat.knownCombatMs,
      executionWallMs: report.wallMs, policyBasis: policy ? 'assumed' : 'none',
      missingCostCategories: missingCostCategories.sort(), coveredMenuMs,
      recordedMenuMs: complete ? coveredMenuMs : null,
      recordedDecisionAdjustedMs: complete ? adjusted : null,
      economicMs: null, humanActiveMs: null, afkOfflineMs: null },
    limitations: [
      'Counts describe scripted journal actions, not observed human decisions or first-session pace.',
      'Costs add serial non-combat time per classified unit; review and execution costs must be disjoint.',
      'Priority counts include the first order and subsequent distinct orders; unchanged repeats cost zero.',
      'Reviews count nonempty candidate sets, including ineligible/no-change reviews; empty reviews cost zero.',
      'Action attempts count regardless of success; reviewed telemetry wrappers add no separate cost.',
      'Unknown kinds, missing costs or unobserved waves withhold recorded decision-adjusted totals.',
      'Retained v1 continuations lack independent admission history/summary fields; adjusted totals remain unknown.',
      'Unrecorded navigation, Return/recovery, reading, idle/offline waits and human calibration remain unknown.',
      'This report covers only the supplied stage, earns no balance acceptance and does not verify 30–50 active hours.'
    ]
  };
}

/** Exclusive external artifact; refuse every repository ancestor, including symlinked parents. */
export function writePacingReport(path, result) {
  assert.ok(isAbsolute(path), 'Output path must be absolute');
  let directory = realpathSync(dirname(path));
  for (;;) {
    assert.ok(!existsSync(join(directory, '.git')), 'Output must be outside a repository');
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = new Map(), args = process.argv.slice(2);
  const names = ['--report', '--journal', '--output', '--policy'];
  assert.ok(args.length === 6 || args.length === 8,
    'Usage: node scripts/account-campaign-pacing.mjs --report /report.json --journal /journal.jsonl.gz --output /new.json [--policy /assumed-costs.json]');
  for (let index = 0; index < args.length; index += 2) {
    assert.ok(names.includes(args[index]) && !options.has(args[index]) && args[index + 1] &&
      isAbsolute(args[index + 1]), 'Each unique option requires an absolute path');
    options.set(args[index], args[index + 1]);
  }
  assert.ok(['--report', '--journal', '--output'].every(name => options.has(name)), 'Missing required path');
  const result = await analyzeCampaignPacing({ reportPath: options.get('--report'),
    journalPath: options.get('--journal'), policyPath: options.get('--policy') });
  writePacingReport(options.get('--output'), result);
  process.stdout.write(`${JSON.stringify(result.timing)}\n`);
}
