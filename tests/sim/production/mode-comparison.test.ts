import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { writeNewReport } from './provenance';
import { runRestoredModeOnce, type RestoredModeAttempt } from './mode-adapter';
import { compareRestoredModes } from './mode-comparison';
import { encodeObservation, observationJson } from './earned-report';

// Four closed native shapes only. Every later corruption is synthetic sensitivity,
// never another gameplay run or evidence of viability/earned UI eligibility.
let manual0: RestoredModeAttempt; let idle0: RestoredModeAttempt;
let manual11: RestoredModeAttempt; let idle11: RestoredModeAttempt;
beforeAll(() => {
  manual0 = runRestoredModeOnce({ mode: 'manual', idleEliteMisses: 0 });
  idle0 = runRestoredModeOnce({ mode: 'idle', idleEliteMisses: 0 });
  manual11 = runRestoredModeOnce({ mode: 'manual', idleEliteMisses: 11 });
  idle11 = runRestoredModeOnce({ mode: 'idle', idleEliteMisses: 11 });
});
const assertionCounts: { name: string | undefined; assertions: number }[] = [];
afterEach(() => {
  const state = expect.getState();
  assertionCounts.push({ name: state.currentTestName, assertions: state.assertionCalls });
});
afterAll(() => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const counts = process.env.D2H5_MODE_COMPARE_ASSERT_OUT;
  const observations = process.env.D2H5_MODE_COMPARE_OBSERVATIONS_OUT;
  if (counts) writeNewReport(root, counts, assertionCounts);
  if (observations) writeNewReport(root, observations, encodeObservation({ attempts: [manual0, idle0, manual11, idle11] }));
});
function compare(a: RestoredModeAttempt, b: RestoredModeAttempt) {
  let result: ReturnType<typeof compareRestoredModes> | undefined;
  expect(() => { result = compareRestoredModes(a, b); }).not.toThrow();
  if (!result) throw new Error('Missing comparator result');
  return result;
}
type Path = readonly (string | number)[];
function at(root: unknown, path: Path): unknown {
  let value = root;
  for (const key of path) {
    if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key))
      throw new Error(`Missing probe path: ${path.join('.')}`);
    value = Reflect.get(value, key) as unknown;
  }
  return value;
}
function set(root: unknown, path: Path, value: unknown) {
  const parent = at(root, path.slice(0, -1)); const key = path.at(-1);
  if (typeof parent !== 'object' || parent === null || key === undefined) throw new Error('Invalid probe');
  Reflect.set(parent, key, value);
}
function requiredAt<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error(`Missing native value at ${index}`);
  return value;
}
function pair() { return [structuredClone(manual0), structuredClone(manual0)] as const; }
const wave = ['waves', 0] as const;
const rewardPositions: readonly Path[] = [[...wave, 'rawRewardDelta', 'items'],
  [...wave, 'actualDelta', 'addedItems'], ['terminalCombat', 'runRewards', 'items']];

it('compares exact clones with independently exercised battle/reward coverage', () => {
  const [a, b] = pair(); const before = observationJson([a, b]);
  const result = compare(a, b);
  expect(result).toMatchObject({ sourceIdentityEqual: true, restoredBaselineEqual: true,
    runIdentityEqual: true, rawCombatObservationsEqual: true, rawPityObservationsEqual: true,
    rawRewardsEqual: true, semanticRewardsIgnoringOnlyTopLevelItemIdEqual: true,
    rawDomainObservationsEqual: true, logicalUiTimingsEqual: true, fullRawObservationEqual: true,
    itemIdentityAssessment: 'equal', battlePathCoverage: { first: 'exercised', second: 'exercised' },
    rewardPathCoverage: { first: 'exercised', second: 'exercised' } });
  expect(result.waveComparisons).toEqual([0, 1].map(index => ({ position: index,
    firstIndex: index, secondIndex: index, combatInputsEqual: true, rawBattleOutputsEqual: true,
    presentationEqual: true, determinism: 'matched' })));
  expect(observationJson([a, b])).toBe(before);
});
it('ordinary-pity native modes have equal actual inputs and recordings despite metadata and IDs', () => {
  const result = compare(manual0, idle0);
  expect(result.restoredBaselineEqual).toBe(true); expect(result.runIdentityEqual).toBe(true);
  expect(result.waveComparisons.map(row => row.determinism)).toEqual(['matched', 'matched']);
  expect(result.rawRewardsEqual).toBe(false);
  expect(result.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(true);
  expect(result.itemIdentityAssessment).toBe('different');
  expect(result.rawPityObservationsEqual).toBe(false);
  expect(result.fullRawObservationEqual).toBe(false);
  expect(manual0.waves.map(w => w.advanceResult)).toEqual(['next-wave', 'defeat']);
  expect(idle0.waves.map(w => w.advanceResult)).toEqual(['next-wave', 'defeat']);
});
it('hard-pity native planner divergence never demands seeded output equality', () => {
  const result = compare(manual11, idle11);
  expect(result.restoredBaselineEqual).toBe(true); expect(result.runIdentityEqual).toBe(true);
  expect(result.waveComparisons.map(row => row.combatInputsEqual)).toEqual([false, false]);
  expect(result.waveComparisons.map(row => row.determinism)).toEqual(['different-inputs', 'different-inputs']);
  expect(result.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(false);
  expect(result.rawPityObservationsEqual).toBe(false);
  expect(result.battlePathCoverage).toEqual({ first: 'exercised', second: 'exercised' });
});

it.each(['sourceSha', 'sourceTreeHash', 'dataHash', 'nodeVersion', 'vitestVersion',
  'manifest', 'collectionPolicy'] as const)('checks all four source states for %s independently', field => {
  for (const [side, state] of [[0, 'sourceBefore'], [0, 'sourceAfter'],
    [1, 'sourceBefore'], [1, 'sourceAfter']] as const) {
    const [a, b] = pair(); const target = [a, b][side];
    set(target, [state, field], field === 'manifest' ? [] : field === 'collectionPolicy' ? { changed: true } : 'changed');
    expect(compare(a, b).sourceIdentityEqual).toBe(false);
  }
});
it.each([
  ['baselineTag'], ['clockEpochMs'], ['scope', 'uiEligible'], ['options', 'idleEliteMisses'],
  ['created', 'map', 'currentAct'], ['actions', 0, 'result', 'ok'], ['baseline', 'map', 'currentAct'],
  ['baselineCombat', 'currentTurn'], ['baselinePity']
] as Path[])('compares full restored baseline at %j', (...path) => {
  const [a, b] = pair(); set(b, path, 'synthetic-baseline-difference');
  expect(compare(a, b).restoredBaselineEqual).toBe(false);
});
it('excludes only requested mode from the baseline comparison', () => {
  const [a, b] = pair(); set(b, ['options', 'mode'], 'idle');
  expect(compare(a, b).restoredBaselineEqual).toBe(true);
  expect(compare(a, b).fullRawObservationEqual).toBe(false);
});
it.each(['runSeed', 'challengeOrdinal', 'totalWaves', 'runId'])('retains handle %s', field => {
  const [a, b] = pair(); set(b, ['handle', field], 'synthetic-handle-difference');
  expect(compare(a, b).runIdentityEqual).toBe(false);
});
it.each(['playerTeam', 'enemyTeam'])('compares every actual opening %s actor field', team => {
  for (const field of ['id', 'skillOrder', 'cooldowns', 'statuses', 'stats', 'life', 'mana', 'gridPosition',
    ...(team === 'playerTeam' ? ['skillLevels', 'equippedWeapon'] : [])]) {
    const [a, b] = pair(); const path = [...wave, 'opening', team, 0, field];
    expect(() => at(b, path)).not.toThrow(); set(b, path, { syntheticInput: field });
    const result = compare(a, b);
    expect(requiredAt(result.waveComparisons, 0).combatInputsEqual).toBe(false);
    expect(requiredAt(result.waveComparisons, 0).determinism).toBe('different-inputs');
  }
});
it('uses the native wave seed, not seed/ordinal equality alone', () => {
  const [a, b] = pair(); set(b, ['handle', 'runSeed'], (a.handle!.runSeed + 1) >>> 0);
  const result = compare(a, b);
  expect(result.waveComparisons.map(row => row.combatInputsEqual)).toEqual([false, false]);
  expect(result.waveComparisons.map(row => row.determinism)).toEqual(['different-inputs', 'different-inputs']);
});
it.each([
  { path: ['opening', 'outcome'], value: { winner: 'synthetic' } },
  { path: ['opening', 'log'], value: ['synthetic-log'] },
  { path: ['played', 'log'], value: ['synthetic-played-log'] },
  { path: ['played', 'playerTeam'], value: [] }, { path: ['played', 'enemyTeam'], value: [] },
  { path: ['played', 'eventCursor'], value: -1 }, { path: ['played', 'playbackComplete'], value: false },
  { path: ['advanceResult'], value: 'synthetic' }, { path: ['terminalSimClockMs'], value: -1 }
])('reports equal-input mismatch for $path without hiding it', ({ path, value }) => {
  const [a, b] = pair(); set(b, [...wave, ...path], value);
  const result = compare(a, b);
  expect(requiredAt(result.waveComparisons, 0).combatInputsEqual).toBe(true);
  expect(requiredAt(result.waveComparisons, 0).rawBattleOutputsEqual).toBe(false);
  expect(requiredAt(result.waveComparisons, 0).determinism).toBe('mismatch');
});
it('detects a genuine-shaped event damage-only corruption', () => {
  const [a, b] = pair(); const index = requiredAt(b.waves, 0).opening.recordedEvents.findIndex(e => e.kind === 'damage');
  expect(index).toBeGreaterThanOrEqual(0);
  set(b, [...wave, 'opening', 'recordedEvents', index, 'amount'], -987);
  const result = compare(a, b);
  expect(requiredAt(result.waveComparisons, 0).combatInputsEqual).toBe(true);
  expect(requiredAt(result.waveComparisons, 0).rawBattleOutputsEqual).toBe(false);
  expect(requiredAt(result.waveComparisons, 0).determinism).toBe('mismatch');
});
it.each(['opening', 'afterAdvance'])('keeps %s presentation separate from seeded battle outputs', phase => {
  for (const field of ['currentWave', 'totalWaves', 'currentWavePresentation', 'unitNameMap']) {
    const [a, b] = pair(); set(b, [...wave, phase, field], field === 'unitNameMap' ? new Map([['x', 'X']]) : 'synthetic');
    const result = compare(a, b);
    expect(requiredAt(result.waveComparisons, 0).presentationEqual).toBe(false);
    expect(requiredAt(result.waveComparisons, 0).determinism).toBe('matched');
    expect(result.rawCombatObservationsEqual).toBe(false);
  }
});
it.each([['baselinePity'], ['terminalPity'], [...wave, 'pityBefore'], [...wave, 'pityAfter']] as Path[])
('retains pity at %j independently of battle equality', (...path) => {
  const [a, b] = pair(); set(b, path, 999);
  const result = compare(a, b);
  expect(result.rawPityObservationsEqual).toBe(false);
  expect(requiredAt(result.waveComparisons, 0).determinism).toBe('matched');
});
it.each(['missing-wave', 'extra-wave', 'different-index', 'missing-handle'] as const)
('reports %s as unpaired rather than matching', kind => {
  const [a, b] = pair();
  if (kind === 'missing-wave') set(b, ['waves'], [b.waves[0]]);
  if (kind === 'extra-wave') set(b, ['waves'], [...b.waves, { ...b.waves[1], index: 2 }]);
  if (kind === 'different-index') set(b, [...wave, 'index'], 7);
  if (kind === 'missing-handle') set(b, ['handle'], null);
  const rows = compare(a, b).waveComparisons;
  const row = rows[kind === 'missing-wave' ? 1 : kind === 'extra-wave' ? 2 : 0];
  const expected = kind === 'missing-wave' ? { position: 1, firstIndex: 1, secondIndex: null }
    : kind === 'extra-wave' ? { position: 2, firstIndex: null, secondIndex: 2 }
    : { position: 0, firstIndex: 0, secondIndex: kind === 'different-index' ? 7 : 0 };
  expect(row).toEqual({ ...expected, determinism: 'unpaired', combatInputsEqual: null,
    rawBattleOutputsEqual: null, presentationEqual: null });
  if (kind === 'missing-handle') expect(rows).toEqual([0, 1].map(index => ({
    position: index, firstIndex: index, secondIndex: index, determinism: 'unpaired',
    combatInputsEqual: null, rawBattleOutputsEqual: null, presentationEqual: null })));
});

it.each(rewardPositions)('ignores exactly known top-level Item.id at %j', (...path) => {
  const [a, b] = pair(); expect((at(b, path) as unknown[]).length).toBeGreaterThan(0);
  set(b, [...path, 0, 'id'], 'changed-original-item-id');
  const before = observationJson([a, b]); const result = compare(a, b);
  expect(observationJson([a, b])).toBe(before);
  expect(result.rawRewardsEqual).toBe(false);
  expect(result.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(true);
  expect(result.itemIdentityAssessment).toBe('different'); expect(result.fullRawObservationEqual).toBe(false);
});
it.each(rewardPositions)('keeps nested item IDs significant at %j', (...path) => {
  const [a, b] = pair();
  for (const attempt of [a, b]) set(attempt, [...path, 0, 'syntheticNested'], { affix: { id: 'original' } });
  set(b, [...path, 0, 'syntheticNested', 'affix', 'id'], 'changed-nested-only');
  const before = observationJson([a, b]); const result = compare(a, b);
  expect(observationJson([a, b])).toBe(before);
  expect(result.rawRewardsEqual).toBe(false);
  expect(result.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(false);
  expect(result.itemIdentityAssessment).toBe('equal');
});
const rewardProbes = [
  { path: [...wave, 'rawRewardDelta', 'materials'], value: { 'materials/scrap': 1 } },
  { path: [...wave, 'actualDelta', 'materials'], value: { 'runes/el': -1 } },
  { path: [...wave, 'rawRewardDelta', 'gems'], value: 1 },
  { path: [...wave, 'actualDelta', 'xp'], value: -1 },
  { path: [...wave, 'actualDelta', 'mercXp'], value: { merc: -1 } },
  { path: [...wave, 'actualDelta', 'currencies'], value: { 'currency-id': -1 } },
  { path: [...wave, 'actualDelta', 'addedItems'], value: [{ id: 'synthetic-item', baseId: 'changed' }] },
  { path: [...wave, 'actualDelta', 'removedItemIds'], value: ['retained-original-id'] },
  { path: [...wave, 'actualDelta', 'addedClears'], value: ['synthetic-clear'] },
  { path: ['terminalCombat', 'runRewards', 'wishstones'], value: 1 }
];
it.each(rewardProbes)('isolates reward comparison and coverage at $path', ({ path, value }) => {
  const [a, b] = pair();
  for (const attempt of [a, b]) {
    for (const w of attempt.waves) {
      set(w, ['rawRewardDelta'], { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} });
      set(w, ['actualDelta'], { xp: 0, mercXp: {}, currencies: {}, materials: {}, addedItems: [], removedItemIds: [], addedClears: [] });
    }
    set(attempt, ['terminalCombat', 'runRewards'], { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} });
  }
  expect(compare(a, b).rewardPathCoverage).toEqual({ first: 'unexercised', second: 'unexercised' });
  set(b, path, value); const result = compare(a, b);
  expect(result.rawRewardsEqual).toBe(false);
  expect(result.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(false);
  expect(result.rewardPathCoverage).toEqual({ first: 'unexercised', second: 'exercised' });
});
it.each([
  ['status'], ['refusal'], ['created', 'map', 'currentAct'], ['actions', 0, 'result', 'ok'],
  ['baseline', 'map', 'currentAct'], [...wave, 'beforeAward', 'map', 'currentAct'],
  [...wave, 'afterAward', 'map', 'currentAct'], ['terminal', 'map', 'currentAct']
] as Path[])('independently retains domain observation %j', (...path) => {
  const [a, b] = pair(); set(b, path, 'synthetic-domain');
  expect(compare(a, b).rawDomainObservationsEqual).toBe(false);
});
it('retains complete afterAdvance combat fields outside the named narrow projections', () => {
  const [a, b] = pair(); set(b, [...wave, 'afterAdvance', 'autoMode'], !requiredAt(b.waves, 0).afterAdvance.autoMode);
  const result = compare(a, b);
  expect(result.rawCombatObservationsEqual).toBe(false); expect(result.fullRawObservationEqual).toBe(false);
  expect(requiredAt(result.waveComparisons, 0).determinism).toBe('matched');
});
it.each(['logicalSimSeconds', 'uiDelayHintSeconds', 'wallSeconds'])('retains %s honestly', field => {
  const [a, b] = pair(); set(b, ['timings', field], -1);
  const result = compare(a, b);
  expect(result.logicalUiTimingsEqual).toBe(field === 'wallSeconds');
  expect(result.fullRawObservationEqual).toBe(false);
});
it('retains source dirty metadata in full raw observation, separately from identity', () => {
  const [a, b] = pair(); set(b, ['sourceBefore', 'dirty'], { isDirty: true, porcelainEntries: ['?? synthetic'] });
  const result = compare(a, b);
  expect(result.sourceIdentityEqual).toBe(true); expect(result.fullRawObservationEqual).toBe(false);
});
it('does not call a synthetic refusal an exercised battle or reward path', () => {
  const [a, b] = pair();
  for (const attempt of [a, b]) {
    set(attempt, ['status'], 'baseline-refused'); set(attempt, ['refusal'], { actionIndex: 0, reason: 'synthetic' });
    set(attempt, ['handle'], null); set(attempt, ['waves'], []);
    set(attempt, ['terminalCombat', 'runRewards'], { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} });
  }
  const result = compare(a, b);
  expect(result.waveComparisons).toEqual([]);
  expect(result.battlePathCoverage).toEqual({ first: 'unexercised', second: 'unexercised' });
  expect(result.rewardPathCoverage).toEqual({ first: 'unexercised', second: 'unexercised' });
  expect(result.itemIdentityAssessment).toBe('unexercised');
  expect(result.fullRawObservationEqual).toBe(true);
});
it.each(rewardPositions)('preserves item identity order and duplicate count at %j', (...path) => {
  for (const kind of ['reverse', 'duplicate'] as const) {
    const [a, b] = pair(); const items = at(b, path) as unknown[];
    expect(items.length).toBeGreaterThan(1);
    set(b, path, kind === 'reverse' ? [...items].reverse() : [...items, structuredClone(items[0])]);
    const before = observationJson([a, b]); const result = compare(a, b);
    expect(observationJson([a, b])).toBe(before);
    expect(result.itemIdentityAssessment).toBe('different');
    expect(result.rawRewardsEqual).toBe(false);
  }
});
it('does not infer rewards or played battle coverage from victory flags alone', () => {
  const [a, b] = pair();
  for (const attempt of [a, b]) {
    set(attempt, ['waves'], []); set(attempt, ['handle'], null);
    set(attempt, ['terminalCombat', 'runVictory'], true);
    set(attempt, ['terminalCombat', 'runRewards'], { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} });
  }
  const empty = compare(a, b);
  expect(empty.rewardPathCoverage).toEqual({ first: 'unexercised', second: 'unexercised' });
  expect(empty.battlePathCoverage).toEqual({ first: 'unexercised', second: 'unexercised' });
  set(a, ['terminalCombat', 'runRewards', 'runeShards'], -1);
  expect(compare(a, b).rewardPathCoverage).toEqual({ first: 'exercised', second: 'unexercised' });
  set(a, ['waves'], [manual0.waves[0]]);
  expect(compare(a, b).battlePathCoverage).toEqual({ first: 'exercised', second: 'unexercised' });
  expect(compare(b, a).battlePathCoverage).toEqual({ first: 'unexercised', second: 'exercised' });
});
