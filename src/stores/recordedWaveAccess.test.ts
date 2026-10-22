/** Real receipt/guard protocol fixtures; no production receipt is created here. */
import { afterEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { synthDefaultPlan } from '@/engine/combat';
import { createSimpleEnemy, playerToCombatUnit } from './combatHelpers';
import type { ActiveRun } from './combatRunLifecycle';
import { stageRecordedBattle } from './recordedBattlePublication';
import { abandonRecordedWaves, prepareRecordedWave, commitPreparedRecordedWave,
  recognizeRecordedWavePublication, inspectRecordedWaves, RecordedWaveReceiptError,
  prepareRecordedWaveInstallation, markRecordedWaveMetadataInstalled,
  beginRecordedWaveSettlement, finishRecordedWaveSettlement, failRecordedWaveSettlement, clearRecordedWavesAfterRestore,
  type RecordedWaveBinding, type RecordedWaveLive } from './recordedWaveReceipt';
import { assertRecordedWaveSnapshotAllowed, reserveRecordedWaveRestore,
  assertRecordedWavePlaybackAllowed, assertRecordedWaveNewTransitionAllowed,
  assertRecordedWavePublicationRecoveryAllowed, assertRecordedWaveReplayAllowed, RecordedWaveAccessError } from './recordedWaveAccess';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore,
  assertWaveSnapshotAllowed, WaveGuardError,
  type WaveTransitionLease, type WaveRestoreLease } from './waveTransitionGuard';

const waves = new Set<WaveTransitionLease>();
const restores = new Set<WaveRestoreLease>();
function acquireWave() { const lease = beginWaveTransition(true); waves.add(lease); return lease; }
function releaseWave(lease: WaveTransitionLease) { endWaveTransition(lease); waves.delete(lease); }
function trackRestore(lease: WaveRestoreLease) { restores.add(lease); return lease; }
function releaseRestore(lease: WaveRestoreLease) { releaseWaveRestore(lease); restores.delete(lease); }
afterEach(() => {
  for (const lease of waves) releaseWave(lease);
  for (const lease of restores) releaseRestore(lease);
  abandonRecordedWaves();
});

function fixture() {
  const hero = playerToCombatUnit({ ...createMockPlayer('Access', 'necromancer'), id: 'access-hero' });
  const enemy = createSimpleEnemy(1);
  const plan = synthDefaultPlan({ id: 'access-area', lootTable: 'loot/trash-act1', areaLevel: 1 },
    'monsters/act1.fallen', 1, 7);
  const run: ActiveRun = { plan, act: 1, seed: 7, mode: 'manual', playerUnit: hero,
    waveIdx: 0, carryPlayerTeam: [hero], waveElapsedMs: 0 };
  const events = [{ kind: 'end' as const, winner: 'player' as const, simClockMs: 1200, uiDelayMs: 0 }];
  const outcome = { winner: 'player' as const, finalPlayerTeam: [hero], finalEnemyTeam: [enemy] };
  const recording = { events, outcome };
  const defaults = { currentWave: 1, totalWaves: plan.waves.length, subAreaRunId: plan.subAreaId,
    runRewards: { items: [], runeShards: 0, runes: 0, gems: 0, wishstones: 0 } };
  const publication = stageRecordedBattle({ initialPlayerTeam: [hero], initialEnemyTeam: [enemy],
    events, outcome, unitNameMap: new Map() }, defaults);
  const ownership = { backpack: [], stash: [], equipped: {}, mercEquipment: {} };
  const binding: RecordedWaveBinding = { candidateRun: run, expectedActiveRun: null,
    heroId: hero.id, targetWaveIdx: 0, waveElapsedMs: 1200, selection: null, ownership,
    debitIntent: null, engineInput: { seed: 7, playerTeam: [hero], enemyTeam: [enemy] },
    attestation: null, recording, publication };
  const live: RecordedWaveLive = { activeRun: null, heroId: hero.id, selection: null, ownership };
  return { binding, live };
}
type State = 'empty' | 'published' | 'prepared' | 'committedPendingPublication' | 'conflict';
const states: State[] = ['empty', 'published', 'prepared', 'committedPendingPublication', 'conflict'];
function installState(state: State) {
  if (state === 'empty') return null;
  const { binding, live } = fixture();
  const lease = acquireWave();
  const receipt = prepareRecordedWave(binding, lease);
  if (state !== 'prepared') {
    commitPreparedRecordedWave(receipt, lease, state === 'conflict'
      ? { ...live, ownership: { ...live.ownership, backpack: [] } } : live,
    { error: new Error('Retained debit observer') });
  }
  if (state === 'published') {
    Object.assign(binding.candidateRun, { waveElapsedMs: binding.waveElapsedMs, recording: binding.recording });
    expect(recognizeRecordedWavePublication(receipt, lease, {
      activeRun: binding.candidateRun, heroId: binding.heroId, combat: binding.publication
    }, { error: new Error('Retained publisher observer') })).toBe(true);
  }
  releaseWave(lease);
  return receipt;
}

describe('recorded-wave phase access', () => {
  it.each(states)('snapshot access in %s preserves the sole holder', state => {
    installState(state); const before = inspectRecordedWaves();
    if (state === 'prepared' || state === 'conflict') {
      expect(assertRecordedWaveSnapshotAllowed).toThrow(new RecordedWaveAccessError(
        state === 'prepared' ? 'preparedPending' : 'conflict'));
    } else expect(assertRecordedWaveSnapshotAllowed).not.toThrow();
    expect(inspectRecordedWaves()).toBe(before);
  });

  it.each(states)('restore reservation in %s preserves phase and releases only refused ownership', state => {
    installState(state); const before = inspectRecordedWaves();
    if (state === 'prepared' || state === 'conflict') {
      expect(() => trackRestore(reserveRecordedWaveRestore())).toThrow(new RecordedWaveAccessError(
        state === 'prepared' ? 'preparedPending' : 'conflict'));
      const wave = acquireWave(); releaseWave(wave);
    } else {
      const restore = trackRestore(reserveRecordedWaveRestore());
      expect(assertWaveSnapshotAllowed).toThrow(new WaveGuardError('restorePending'));
      releaseRestore(restore);
    }
    expect(inspectRecordedWaves()).toBe(before);
  });

  describe.each([
    ['playback', assertRecordedWavePlaybackAllowed],
    ['new transition', assertRecordedWaveNewTransitionAllowed],
    ['ordinary replay', assertRecordedWaveReplayAllowed]
  ] as const)('%s', (_name, check) => {
    it.each(states)('allows only empty/published holders in %s', state => {
      installState(state); const before = inspectRecordedWaves();
      const code = state === 'prepared' ? 'preparedPending'
        : state === 'committedPendingPublication' ? 'publicationPending' : state === 'conflict' ? 'conflict' : null;
      if (code) expect(check).toThrow(new RecordedWaveAccessError(code));
      else expect(check).not.toThrow();
      expect(inspectRecordedWaves()).toBe(before);
    });
  });

  it.each(states)('recovery in %s requires the exact committed pending receipt', state => {
    const receipt = installState(state) ?? installState('published');
    if (!receipt) throw new Error('Missing token fixture');
    if (state === 'empty') abandonRecordedWaves();
    const before = inspectRecordedWaves(); const lease = acquireWave();
    const check = () => { assertRecordedWavePublicationRecoveryAllowed(receipt, lease); };
    if (state === 'committedPendingPublication') expect(check).not.toThrow();
    else expect(check).toThrow(new RecordedWaveReceiptError(
      state === 'empty' || state === 'published' ? 'staleReceipt' : 'wrongPhase'));
    expect(inspectRecordedWaves()).toBe(before);
  });

  it.each(states)('primitive wave ownership has precedence over %s phases', state => {
    installState(state); const before = inspectRecordedWaves(); const lease = acquireWave();
    for (const operation of [assertRecordedWaveSnapshotAllowed, reserveRecordedWaveRestore,
      assertRecordedWavePlaybackAllowed, assertRecordedWaveNewTransitionAllowed]) {
      expect(operation).toThrow(new WaveGuardError('waveBusy'));
    }
    releaseWave(lease); expect(inspectRecordedWaves()).toBe(before);
  });

  it.each(states)('queued restore ownership has precedence over %s phases', state => {
    installState(state); const before = inspectRecordedWaves();
    const restore = trackRestore(reserveWaveRestore());
    for (const check of [assertRecordedWaveSnapshotAllowed, assertRecordedWavePlaybackAllowed,
      assertRecordedWaveNewTransitionAllowed]) expect(check).toThrow(new WaveGuardError('restorePending'));
    expect(inspectRecordedWaves()).toBe(before);
    releaseRestore(restore);
  });

  it.each(states)('a second restore in %s preserves the first queued reservation', state => {
    installState(state); const before = inspectRecordedWaves();
    const first = trackRestore(reserveWaveRestore());
    if (state === 'prepared' || state === 'conflict') {
      expect(() => trackRestore(reserveRecordedWaveRestore())).toThrow(RecordedWaveAccessError);
      expect(assertWaveSnapshotAllowed).toThrow(new WaveGuardError('restorePending'));
      releaseRestore(first);
      expect(assertWaveSnapshotAllowed).not.toThrow();
    } else {
      const second = trackRestore(reserveRecordedWaveRestore());
      releaseRestore(first);
      expect(assertWaveSnapshotAllowed).toThrow(new WaveGuardError('restorePending'));
      releaseRestore(second);
      expect(assertWaveSnapshotAllowed).not.toThrow();
    }
    expect(inspectRecordedWaves()).toBe(before);
  });

  it('recovery rejects a stale token and prioritizes a released lease over receipt identity', () => {
    const oldToken = installState('published');
    const oldLease = acquireWave(); releaseWave(oldLease);
    const token = installState('committedPendingPublication');
    if (!token || !oldToken) throw new Error('Missing recovery token fixture');
    const before = inspectRecordedWaves(); const lease = acquireWave();
    expect(() => { assertRecordedWavePublicationRecoveryAllowed(oldToken, oldLease); })
      .toThrow(new WaveGuardError('invalidLease'));
    expect(() => { assertRecordedWavePublicationRecoveryAllowed(token, oldLease); })
      .toThrow(new WaveGuardError('invalidLease'));
    expect(() => { assertRecordedWavePublicationRecoveryAllowed(oldToken, lease); })
      .toThrow(new RecordedWaveReceiptError('staleReceipt'));
    expect(() => { assertRecordedWavePublicationRecoveryAllowed(token, lease); }).not.toThrow();
    expect(inspectRecordedWaves()).toBe(before);
  });

  it.each(['prepared', 'committedPendingPublication', 'conflict'] as const)(
    'preserves the published slot and retained errors alongside %s', state => {
      installState('published'); installState(state);
      const before = inspectRecordedWaves();
      expect(before.currentPublished?.publicationFailure?.error).toBeInstanceOf(Error);
      expect(before.pending?.phase).toBe(state);
      expect(assertRecordedWavePlaybackAllowed).toThrow(RecordedWaveAccessError);
      expect(assertRecordedWaveNewTransitionAllowed).toThrow(RecordedWaveAccessError);
      if (state !== 'committedPendingPublication') {
        expect(assertRecordedWaveSnapshotAllowed).toThrow(RecordedWaveAccessError);
        expect(() => trackRestore(reserveRecordedWaveRestore())).toThrow(RecordedWaveAccessError);
      }
      expect(inspectRecordedWaves()).toBe(before);
      expect(inspectRecordedWaves().currentPublished).toBe(before.currentPublished);
      expect(inspectRecordedWaves().pending).toBe(before.pending);
    });

  it.each(['prepared', 'committedPendingPublication', 'conflict'] as const)(
    'explicit abandonment of %s restores ordinary access without implicit normalization', state => {
      installState(state);
      expect(assertRecordedWaveNewTransitionAllowed).toThrow(RecordedWaveAccessError);
      expect(inspectRecordedWaves().pending?.phase).toBe(state);
      abandonRecordedWaves();
      expect(assertRecordedWaveSnapshotAllowed).not.toThrow();
      expect(assertRecordedWavePlaybackAllowed).not.toThrow();
      expect(assertRecordedWaveNewTransitionAllowed).not.toThrow();
      releaseRestore(trackRestore(reserveRecordedWaveRestore()));
      const lease = acquireWave(); releaseWave(lease);
      expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    });
});


const settlementStates = ['unsettled', 'settling', 'awaitingNextWave', 'settled', 'settlementFailed'] as const;
type SettlementState = typeof settlementStates[number];
function installSettlementState(state: SettlementState) {
  const { binding, live } = fixture(); const lease = acquireWave();
  try {
    const token = prepareRecordedWaveInstallation(binding, { kind: 'newRun', nextDefaultChallengeOrdinal: null }, lease);
    commitPreparedRecordedWave(token, lease, live); markRecordedWaveMetadataInstalled(token, lease);
    Object.assign(binding.candidateRun, { recording: binding.recording, waveElapsedMs: binding.waveElapsedMs });
    expect(recognizeRecordedWavePublication(token, lease, { activeRun: binding.candidateRun,
      heroId: binding.heroId, combat: binding.publication })).toBe(true);
    const failure = { message: 'original payout exception' };
    if (state !== 'unsettled') {
      beginRecordedWaveSettlement(token, lease, { activeRun: binding.candidateRun, heroId: binding.heroId,
        combat: { ...binding.publication, playbackComplete: true } });
      if (state === 'awaitingNextWave') finishRecordedWaveSettlement(token, lease,
        { kind: 'nextWave', carryPlayerTeam: [...binding.candidateRun.carryPlayerTeam] });
      else if (state === 'settled') finishRecordedWaveSettlement(token, lease, { kind: 'terminal', result: 'defeat' });
      else if (state === 'settlementFailed') failRecordedWaveSettlement(token, lease, { error: failure });
    }
    return { token, binding, failure };
  } finally { releaseWave(lease); }
}
const settlementActions = [
  { name: 'snapshot', check: assertRecordedWaveSnapshotAllowed },
  { name: 'restore', check: () => { releaseRestore(trackRestore(reserveRecordedWaveRestore())); } },
  { name: 'playback', check: assertRecordedWavePlaybackAllowed },
  { name: 'transition', check: assertRecordedWaveNewTransitionAllowed },
  { name: 'replay', check: () => { assertRecordedWaveReplayAllowed(); } }
] as const;
function settlementRefusal(state: SettlementState, action: typeof settlementActions[number]['name']) {
  if (state === 'settling') return 'settling';
  if (state === 'settlementFailed' && action !== 'snapshot' && action !== 'restore') return 'settlementFailed';
  if (action === 'replay' && (state === 'awaitingNextWave' || state === 'settled')) return 'replaySettled';
  return null;
}

describe('inactive settlement access rules', () => {
  it.each(settlementStates.flatMap(state => settlementActions.map(action => ({ state, ...action }))))(
    '$name observes $state without changing progress or gameplay', ({ state, name, check }) => {
    const { binding, failure } = installSettlementState(state); const before = inspectRecordedWaves();
    const run = structuredClone(binding.candidateRun); const code = settlementRefusal(state, name);
    if (code) expect(check).toThrow(new RecordedWaveAccessError(code));
    else expect(check).not.toThrow();
    expect(inspectRecordedWaves()).toBe(before); expect(binding.candidateRun).toEqual(run);
    if (state === 'settlementFailed') expect(before.currentPublished?.installation?.settlement.progress)
      .toEqual({ phase: 'settlementFailed', failure: { error: failure } });
    // A failed reservation must have released its own lease.
    const wave = acquireWave(); releaseWave(wave);
  });

  it.each(settlementStates.flatMap(state => (['wave', 'restore'] as const).map(owner => ({ state, owner }))))(
    '$owner ownership has precedence over $state settlement access', ({ state, owner }) => {
    installSettlementState(state); const before = inspectRecordedWaves();
    const wave = owner === 'wave' ? acquireWave() : undefined;
    const restore = owner === 'restore' ? trackRestore(reserveWaveRestore()) : undefined;
    try {
      for (const { name, check } of settlementActions) {
        if (owner === 'restore' && name === 'restore') continue; // Restore reservations may coexist.
        expect(check).toThrow(new WaveGuardError(owner === 'wave' ? 'waveBusy' : 'restorePending'));
      }
      expect(inspectRecordedWaves()).toBe(before);
    } finally { if (wave) releaseWave(wave); if (restore) releaseRestore(restore); }
  });

  it.each((['settling', 'settlementFailed'] as const).flatMap(settlement =>
    (['prepared', 'committedPendingPublication', 'conflict'] as const).map(pending => ({ settlement, pending }))))(
    'pending $pending restrictions precede $settlement settlement', ({ settlement, pending }) => {
    installSettlementState(settlement); installState(pending); const before = inspectRecordedWaves();
    for (const { name, check } of settlementActions) {
      const snapshot = name === 'snapshot' || name === 'restore';
      const code = pending === 'prepared' ? 'preparedPending' : pending === 'conflict' ? 'conflict'
        : !snapshot ? 'publicationPending' : settlementRefusal(settlement, name);
      if (code) expect(check).toThrow(new RecordedWaveAccessError(code));
      else expect(check).not.toThrow();
      expect(inspectRecordedWaves()).toBe(before);
    }
    const wave = acquireWave(); releaseWave(wave);
  });

  it('permits stable failure snapshot/restore and explicit abandonment without changing retained gains', () => {
    const { binding, failure } = installSettlementState('settlementFailed'); const gains = { xp: 75, items: ['paid-loot'] };
    const before = inspectRecordedWaves();
    expect(assertRecordedWaveSnapshotAllowed).not.toThrow();
    releaseRestore(trackRestore(reserveRecordedWaveRestore()));
    expect(inspectRecordedWaves()).toBe(before);
    expect(() => { assertRecordedWaveReplayAllowed(); }).toThrow(new RecordedWaveAccessError('settlementFailed'));
    expect(before.currentPublished?.installation?.settlement.progress).toEqual({ phase: 'settlementFailed', failure: { error: failure } });
    const recording = binding.candidateRun.recording;
    abandonRecordedWaves();
    for (const { check } of settlementActions) expect(check).not.toThrow();
    expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    expect(binding.candidateRun.recording).toBe(recording); expect(gains).toEqual({ xp: 75, items: ['paid-loot'] });
  });

  it('successful restore cleanup discards stable failed receipts and keeps actual gameplay values', () => {
    const { binding } = installSettlementState('settlementFailed'); const run = structuredClone(binding.candidateRun);
    const restore = trackRestore(reserveRecordedWaveRestore());
    try { clearRecordedWavesAfterRestore(restore); } finally { releaseRestore(restore); }
    expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
    expect(binding.candidateRun).toEqual(run);
    for (const { check } of settlementActions) expect(check).not.toThrow();
  });
});
