import { beforeAll, describe, expect, it } from 'vitest';
import { runEarnedRecipeOnce, type EarnedAttempt } from './earned-adapter';
import { compareEarnedAttempts } from './earned-comparison';

// One genuine in-memory attempt supplies native value shapes. All mutations below
// are synthetic comparator sensitivity probes, never gameplay/balance evidence.
let baseline: EarnedAttempt;
beforeAll(() => {
  baseline = runEarnedRecipeOnce({
    fixtureVersion: 2, id: 'earned-comparison-shapes',
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
    scenario: { act: 1, subAreaId: 'areas/act1-den-of-evil', mode: 'manual',
      challengeOrdinal: 1, idleEliteMisses: 0 },
    mercPolicy: 'recipe-actions', summonPolicy: 'production-default'
  }, { targetSeed: 1, repetition: 1 });
});

it.each(['affix', 'source', 'unit'] as const)('keeps an otherwise identical nested %s id significant', kind => {
  const [left, right] = pair();
  for (const attempt of [left, right])
    set(attempt, ['acquisitionJournal', 0, 'syntheticNested'], { [kind]: { id: 'original', value: 1 } });
  set(right, ['acquisitionJournal', 0, 'syntheticNested', kind, 'id'], 'changed-only-nested-id');
  const compared = compareEarnedAttempts(left, right);
  expect(compared.rawRewardsEqual).toBe(false);
  expect(compared.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(false);
  expect(compared.fullRawReplayEqual).toBe(false);
  expect(compared.itemIdentityAssessment).toBe('equal');
});

it.each([
  { field: 'affixes', original: [{ id: 'original-affix', value: 1 }], nested: [0, 'id'] },
  { field: 'source', original: { id: 'original-source', value: 1 }, nested: ['id'] }
])('keeps otherwise identical reward $field IDs significant', ({ field, original, nested }) => {
  const [left, right] = pair();
  for (const attempt of [left, right]) set(attempt, ['acquisitionJournal', 0, field], structuredClone(original));
  set(right, ['acquisitionJournal', 0, field, ...nested], 'changed-only-nested-id');
  const compared = compareEarnedAttempts(left, right);
  expect(compared.rawRewardsEqual).toBe(false);
  expect(compared.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(false);
  expect(compared.fullRawReplayEqual).toBe(false);
});

it('retains actual wave presentation and native name-map keys, values and order', () => {
  const [left, right] = pair();
  set(right, [...targetWave, 'opening', 'currentWavePresentation'], { syntheticPresentation: true });
  expect(compareEarnedAttempts(left, right).rawWaveRecordingsEqual).toBe(false);
  expect(compareEarnedAttempts(left, right).fullRawReplayEqual).toBe(false);
  for (const changed of [new Map([['a', 'changed'], ['b', 'B']]),
    new Map([['c', 'A'], ['b', 'B']]), new Map([['b', 'B'], ['a', 'A']])]) {
    const [a, b] = pair();
    set(a, [...targetWave, 'opening', 'unitNameMap'], new Map([['a', 'A'], ['b', 'B']]));
    set(b, [...targetWave, 'opening', 'unitNameMap'], changed);
    expect(compareEarnedAttempts(a, b).rawWaveRecordingsEqual).toBe(false);
    expect(compareEarnedAttempts(a, b).fullRawReplayEqual).toBe(false);
  }
});

it.each([
  { name: 'merc XP only', path: ['actualDelta', 'mercXp'], value: { merc: 1 } },
  { name: 'currency only', path: ['actualDelta', 'currencies'], value: { runeShards: 1 } },
  { name: 'negative currency only', path: ['actualDelta', 'currencies'], value: { runeShards: -1 } },
  { name: 'material only', path: ['actualDelta', 'materials'], value: { 'materials/scrap': 1 } },
  { name: 'spent material only', path: ['actualDelta', 'materials'], value: { 'runes/el': -1 } },
  { name: 'raw concrete material only', path: ['rawRewardDelta', 'materials'], value: { 'materials/scrap': 1 } },
  { name: 'item only', path: ['actualDelta', 'addedItems'], value: [{ id: 'synthetic-item' }] },
  { name: 'clear only', path: ['actualDelta', 'addedClears'], value: ['synthetic-clear'] },
  { name: 'removed item only', path: ['actualDelta', 'removedItemIds'], value: ['original-id'] },
  { name: 'raw wave currency only', path: ['rawRewardDelta', 'gems'], value: 1 }
])('independently recognizes a preparation $name reward path', ({ path, value }) => {
  const [left, right] = pair();
  for (const attempt of [left, right]) {
    set(attempt, ['target'], null); set(attempt, ['acquisitionJournal'], []);
    for (const action of attempt.actions) for (const farm of action.farms) for (const wave of farm.waves)
      Object.assign(wave, { rawRewardDelta: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} },
        actualDelta: { xp: 0, mercXp: {}, currencies: {}, materials: {}, addedItems: [], removedItemIds: [], addedClears: [] } });
  }
  expect(compareEarnedAttempts(left, right).rewardPathCoverage)
    .toEqual({ first: 'unexercised', second: 'unexercised' });
  set(right, [...prepWave, ...path], value);
  expect(compareEarnedAttempts(left, right).rewardPathCoverage)
    .toEqual({ first: 'unexercised', second: 'exercised' });
});

type Path = readonly (string | number)[];
const prep = ['actions', 3, 'farms', 0] as const;
const prepWave = [...prep, 'waves', 0] as const;
const targetWave = ['target', 'waves', 0] as const;
function recordAt(root: unknown, path: Path): object {
  let value = root;
  for (const key of path) {
    if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key))
      throw new Error(`Missing synthetic probe path: ${path.join('.')}`);
    value = Reflect.get(value, key) as unknown;
  }
  if (typeof value !== 'object' || value === null) throw new Error('Probe parent must be an object');
  return value;
}
function set(root: unknown, path: Path, value: unknown) {
  const key = path.at(-1);
  if (key === undefined) throw new Error('Probe requires a field');
  Reflect.set(recordAt(root, path.slice(0, -1)), key, value);
}
function pair() { return [structuredClone(baseline), structuredClone(baseline)] as const; }

describe('earned replay comparisons — synthetic sensitivity, no victory oracle', () => {
  it('compares identical lossless values and reports independently exercised rewards', () => {
    const [left, right] = pair();
    expect(compareEarnedAttempts(left, right)).toEqual({
      sourceIdentityEqual: true, rawWaveRecordingsEqual: true, rawAbandonedRecordingsEqual: true,
      rawRewardsEqual: true, semanticRewardsIgnoringOnlyTopLevelItemIdEqual: true,
      rawDomainObservationsEqual: true, fullRawReplayEqual: true,
      itemIdentityAssessment: 'equal', rewardPathCoverage: { first: 'exercised', second: 'exercised' }
    });
  });
  it('ignores exactly top-level repetition, wall timing and separately assessed source metadata', () => {
    const [left, right] = pair();
    set(right, ['repetition'], 2);
    set(right, ['timings', 'wallSeconds'], 999);
    set(right, ['sourceBefore', 'dirty'], { isDirty: true, porcelainEntries: ['?? note.md'] });
    expect(compareEarnedAttempts(left, right).fullRawReplayEqual).toBe(true);
    expect(compareEarnedAttempts(left, right).sourceIdentityEqual).toBe(true);
    set(right, ['sourceAfter', 'sourceTreeHash'], 'different-source');
    const compared = compareEarnedAttempts(left, right);
    expect(compared.fullRawReplayEqual).toBe(true);
    expect(compared.sourceIdentityEqual).toBe(false);
  });
  it.each(['sourceSha', 'sourceTreeHash', 'dataHash', 'nodeVersion', 'vitestVersion',
    'manifest', 'collectionPolicy'] as const)('compares source/tool %s in both before/after states', key => {
    for (const state of ['sourceBefore', 'sourceAfter'] as const) {
      const [left, right] = pair();
      set(right, [state, key], null);
      expect(compareEarnedAttempts(left, right).sourceIdentityEqual).toBe(false);
    }
    const [left, right] = pair();
    set(left, ['sourceAfter', key], null);
    set(right, ['sourceAfter', key], null);
    expect(compareEarnedAttempts(left, right).sourceIdentityEqual).toBe(false);
  });
  it.each([
    { name: 'status', path: ['status'], value: 'action-refused' },
    { name: 'refusal', path: ['refusal'], value: { actionIndex: 1, reason: 'synthetic' } },
    { name: 'action result', path: ['actions', 0, 'result', 'ok'], value: false },
    { name: 'action index', path: ['actions', 0, 'index'], value: 90 },
    { name: 'action identity', path: ['actions', 4, 'action', 'id'], value: 'changed' },
    { name: 'checkpoint identity', path: ['checkpoints', 0, 'id'], value: 'changed' },
    { name: 'created state', path: ['created', 'inventory', 'currencies', 'gold'], value: 900 },
    { name: 'action boundary', path: ['actions', 0, 'after', 'inventory', 'currencies', 'gold'], value: 900 },
    { name: 'checkpoint state', path: ['checkpoints', 0, 'state', 'inventory', 'currencies', 'gold'], value: 900 },
    { name: 'pretarget state', path: ['preTarget', 'inventory', 'currencies', 'gold'], value: 900 },
    { name: 'terminal state', path: ['terminal', 'inventory', 'currencies', 'gold'], value: 900 },
    { name: 'wave award state', path: [...prepWave, 'afterAward', 'inventory', 'currencies', 'gold'], value: 900 },
    { name: 'nested repetition', path: ['actions', 0, 'result', 'repetition'], value: 2 },
    { name: 'nested wallSeconds', path: ['actions', 0, 'result', 'wallSeconds'], value: 999 }
  ])('retains $name in domain and full comparison', ({ path, value }) => {
    const [left, right] = pair(); set(right, path, value);
    const compared = compareEarnedAttempts(left, right);
    expect(compared.rawDomainObservationsEqual).toBe(false);
    expect(compared.fullRawReplayEqual).toBe(false);
  });
  it('retains action and checkpoint order', () => {
    for (const key of ['actions', 'checkpoints'] as const) {
      const [left, right] = pair(); set(right, [key], [...right[key]].reverse());
      expect(compareEarnedAttempts(left, right).rawDomainObservationsEqual).toBe(false);
      expect(compareEarnedAttempts(left, right).fullRawReplayEqual).toBe(false);
    }
  });
  it('preserves Map keys, values, order and undefined-versus-absent in domain observations', () => {
    for (const changed of [new Map([['a', 2], ['b', 2]]), new Map([['c', 1], ['b', 2]]),
      new Map([['b', 2], ['a', 1]]), { a: 1, b: 2 }]) {
      const [left, right] = pair();
      set(left, ['terminal', 'inventory', 'syntheticMap'], new Map([['a', 1], ['b', 2]]));
      set(right, ['terminal', 'inventory', 'syntheticMap'], changed);
      expect(compareEarnedAttempts(left, right).rawDomainObservationsEqual).toBe(false);
      expect(compareEarnedAttempts(left, right).fullRawReplayEqual).toBe(false);
    }
    const [left, right] = pair(); set(left, ['terminal', 'inventory', 'optional'], undefined);
    expect(compareEarnedAttempts(left, right).rawDomainObservationsEqual).toBe(false);
    expect(compareEarnedAttempts(left, right).fullRawReplayEqual).toBe(false);
  });
  it.each([
    { name: 'farm handle', path: [...prep, 'handle', 'runId'], value: 'different' },
    { name: 'target handle', path: ['target', 'handle', 'runSeed'], value: 999 },
    { name: 'opening team', path: [...prepWave, 'opening', 'playerTeam', 0, 'life'], value: 999 },
    { name: 'events', path: [...targetWave, 'opening', 'recordedEvents'], value: [] },
    { name: 'outcome', path: [...targetWave, 'opening', 'outcome', 'winner'], value: 'enemy' },
    { name: 'presentation', path: [...targetWave, 'opening', 'log'], value: ['synthetic'] },
    { name: 'played final team', path: [...prepWave, 'played', 'playerTeam', 0, 'life'], value: 999 },
    { name: 'advance result', path: [...prepWave, 'advanceResult'], value: 'defeat' },
    { name: 'terminal simulation time', path: [...prepWave, 'terminalSimClockMs'], value: 999 }
  ])('detects attempted recording $name', ({ path, value }) => {
    const [left, right] = pair(); set(right, path, value);
    const compared = compareEarnedAttempts(left, right);
    expect(compared.rawWaveRecordingsEqual).toBe(false);
    expect(compared.fullRawReplayEqual).toBe(false);
  });
  it('compares installed abandoned recordings separately from attempted waves', () => {
    const [left, right] = pair();
    set(right, [...prep, 'abandoned', 'opening', 'recordedEvents'], []);
    const compared = compareEarnedAttempts(left, right);
    expect(compared.rawAbandonedRecordingsEqual).toBe(false);
    expect(compared.rawWaveRecordingsEqual).toBe(true);
    expect(compared.fullRawReplayEqual).toBe(false);
  });
  it.each([
    [...prepWave, 'rawRewardDelta', 'items', 0],
    [...prepWave, 'actualDelta', 'addedItems', 0],
    ['acquisitionJournal', 0],
    [...targetWave, 'rawRewardDelta', 'items', 0],
    [...targetWave, 'actualDelta', 'addedItems', 0],
    ['target', 'rawRunRewards', 'items', 0]
  ])('ignores only a known reward Item top-level id in semantic projection %#', (...path) => {
    const [left, right] = pair(); set(right, [...path, 'id'], 'synthetic-new-item-id');
    const compared = compareEarnedAttempts(left, right);
    expect(compared.rawRewardsEqual).toBe(false);
    expect(compared.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(true);
    expect(compared.fullRawReplayEqual).toBe(false);
  });
  it.each([
    { path: [...prepWave, 'actualDelta', 'xp'], value: 0 },
    { path: [...prepWave, 'actualDelta', 'mercXp'], value: { original: 999 } },
    { path: [...prepWave, 'actualDelta', 'currencies'], value: { runeShards: 999 } },
    { path: [...prepWave, 'actualDelta', 'removedItemIds'], value: ['opaque-original-id'] },
    { path: [...prepWave, 'actualDelta', 'addedClears'], value: ['different'] },
    { path: ['target', 'rawRunRewards', 'runeShards'], value: 999 },
    { path: ['acquisitionJournal', 0, 'baseId'], value: 'content-changed' },
    { path: ['acquisitionJournal', 0, 'affixes'], value: [{ id: 'nested-id', value: 1 }] },
    { path: ['acquisitionJournal', 0, 'source'], value: { id: 'opaque-source-id' } }
  ])('retains reward content, currencies and opaque IDs %#', ({ path, value }) => {
    const [left, right] = pair(); set(right, path, value);
    const compared = compareEarnedAttempts(left, right);
    expect(compared.rawRewardsEqual).toBe(false);
    expect(compared.semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(false);
    expect(compared.fullRawReplayEqual).toBe(false);
  });
  it('compares item identity as ordered original strings independently of item content', () => {
    const [left, right] = pair();
    set(right, ['acquisitionJournal', 0, 'baseId'], 'changed-content');
    expect(compareEarnedAttempts(left, right).itemIdentityAssessment).toBe('equal');
    set(right, ['acquisitionJournal'], [...right.acquisitionJournal].reverse());
    expect(compareEarnedAttempts(left, right).itemIdentityAssessment).toBe('different');
    expect(compareEarnedAttempts(left, right).semanticRewardsIgnoringOnlyTopLevelItemIdEqual).toBe(false);
    const [otherLeft, otherRight] = pair();
    set(otherRight, ['target', 'waves', 0, 'actualDelta', 'addedItems', 0, 'id'], 'changed-id');
    expect(compareEarnedAttempts(otherLeft, otherRight).itemIdentityAssessment).toBe('different');
  });
  it('reports one-sided rewards and no-item paths honestly, without winner-flag inference', () => {
    const [empty, rewarded] = pair();
    set(empty, ['actions'], []); set(empty, ['target'], null); set(empty, ['acquisitionJournal'], []);
    set(empty, ['status'], 'action-refused'); set(empty, ['refusal'], { actionIndex: 0, reason: 'synthetic' });
    expect(compareEarnedAttempts(empty, rewarded).rewardPathCoverage)
      .toEqual({ first: 'unexercised', second: 'exercised' });
    expect(compareEarnedAttempts(rewarded, empty).rewardPathCoverage)
      .toEqual({ first: 'exercised', second: 'unexercised' });
    expect(compareEarnedAttempts(empty, empty).itemIdentityAssessment).toBe('unexercised');
    expect(compareEarnedAttempts(empty, rewarded).itemIdentityAssessment).toBe('different');
  });
  it('does not infer rewards from victory when actual and raw reward paths are zero', () => {
    const [left, right] = pair();
    for (const attempt of [left, right]) {
      set(attempt, ['actions'], []); set(attempt, ['acquisitionJournal'], []);
      set(attempt, ['target', 'terminalAdvance'], 'victory');
      const target = attempt.target;
      if (!target) throw new Error('Missing native target');
      const zeroReward = { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0, materials: {} };
      set(attempt, ['target', 'rawRunRewards'], zeroReward);
      for (const wave of target.waves) {
        Object.assign(wave, { rawRewardDelta: zeroReward, actualDelta: { xp: 0, mercXp: {},
          currencies: {}, materials: {}, addedItems: [], removedItemIds: [], addedClears: [] } });
      }
    }
    expect(compareEarnedAttempts(left, right).rewardPathCoverage)
      .toEqual({ first: 'unexercised', second: 'unexercised' });
    expect(compareEarnedAttempts(left, right).itemIdentityAssessment).toBe('unexercised');
    set(right, ['target', 'waves', 0, 'actualDelta', 'xp'], 1);
    expect(compareEarnedAttempts(left, right).rewardPathCoverage)
      .toEqual({ first: 'unexercised', second: 'exercised' });
    set(left, ['target', 'rawRunRewards', 'runes'], 1);
    expect(compareEarnedAttempts(left, right).rewardPathCoverage)
      .toEqual({ first: 'exercised', second: 'exercised' });
  });
  it('retains logical/UI timing and random presentation IDs while omitting only wall timing', () => {
    for (const key of ['logicalSimSeconds', 'uiDelayHintSeconds'] as const) {
      const [left, right] = pair(); set(right, ['timings', key], 999);
      expect(compareEarnedAttempts(left, right).fullRawReplayEqual).toBe(false);
    }
    const [left, right] = pair();
    set(right, [...targetWave, 'opening', 'log'], [{ id: 'random-log-id' }]);
    expect(compareEarnedAttempts(left, right).rawWaveRecordingsEqual).toBe(false);
    expect(compareEarnedAttempts(left, right).fullRawReplayEqual).toBe(false);
  });
});

it('keeps both installed unplayed W2 copies out of attempted-wave recordings', () => {
  const [left, right] = pair();
  set(right, [...prepWave, 'afterAdvance', 'recordedEvents'], []);
  set(right, [...prep, 'abandoned', 'opening', 'recordedEvents'], []);
  const compared = compareEarnedAttempts(left, right);
  expect(compared.rawWaveRecordingsEqual).toBe(true);
  expect(compared.rawAbandonedRecordingsEqual).toBe(false);
  expect(compared.fullRawReplayEqual).toBe(false);
});
it.each([
  { name: 'opening reward ID', path: ['target', 'waves', 1, 'opening', 'runRewards', 'items', 0, 'id'], value: 'different' },
  { name: 'played reward content', path: [...prepWave, 'played', 'runRewards', 'runeShards'], value: 999 },
  { name: 'installed next-wave reward', path: [...prepWave, 'afterAdvance', 'runRewards', 'items', 0, 'id'], value: 'different' },
  { name: 'abandoned opening reward', path: [...prep, 'abandoned', 'opening', 'runRewards', 'items', 0, 'id'], value: 'different' },
  { name: 'terminal domain', path: ['terminal', 'inventory', 'currencies', 'gold'], value: 999 },
  { name: 'before-flee inventory', path: [...prep, 'abandoned', 'beforeFlee', 'inventory', 'backpack', 0, 'id'], value: 'different' },
  { name: 'after-flee inventory', path: [...prep, 'abandoned', 'afterFlee', 'inventory', 'backpack', 0, 'id'], value: 'different' },
  { name: 'played random log', path: [...targetWave, 'played', 'log'], value: [{ id: 'synthetic-log-id' }] }
])('keeps $name visible in full replay without contaminating recording equality', ({ path, value }) => {
  const [left, right] = pair(); set(right, path, value);
  const compared = compareEarnedAttempts(left, right);
  expect(compared.rawWaveRecordingsEqual).toBe(true);
  expect(compared.rawAbandonedRecordingsEqual).toBe(true);
  expect(compared.fullRawReplayEqual).toBe(false);
});
