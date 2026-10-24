import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as helpers from '@/stores/combatHelpers';
import * as playback from './earned-playback';
import { hashSeed } from '@/engine/rng';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { snapshotStores } from '@/stores/persistence';
import { captureEarnedRestorers, observeEarnedState } from './earned-state';
import { loadAuthenticEconomyAncestry, hydrateEconomyAncestry, prepareEconomyAncestry, allocateEconomyBoundary,
  economyPlaybackSchedule, playEconomyWave, runEconomyScreen } from './fresh-campaign-economy';
import { economyPolicy as policy } from './fresh-campaign-economy-policy';
import { captureFreshEconomyNativeSave, captureFreshNativeSave, publishFreshCampaignReport } from './fresh-campaign-save';
import { hashObservation } from './earned-report';
import { historicalV17Save, historicalV17EarnedState } from './historical-v17';
import { collectSourceState } from './provenance';

let restorers: (() => void)[];
beforeEach(() => { restorers = captureEarnedRestorers(); vi.spyOn(Date, 'now').mockReturnValue(policy.clockEpochMs); });
afterEach(() => { for (const restore of restorers) restore(); vi.restoreAllMocks(); });
const action = (_name: string, operation: () => unknown, expected: unknown = 'ok') => {
  const result = operation();
  if (expected !== null) expect(result).toBe(expected);
  return result;
};

it('authenticates Rocky native ancestry and exactly hydrates every saved domain without offline gain', () => {
  expect(hydrateEconomyAncestry().rawSha256).toBe(policy.sourceRawSha256);
  const live = snapshotStores();
  if (!live) throw new Error('Missing migrated ancestry');
  expect(live.version).toBe(21);
  expect(live.inventory.materials).toEqual({});
  expect(hashObservation(historicalV17Save(live, loadAuthenticEconomyAncestry().witness))).toBe(policy.sourceSaveHash);
  expect(hashObservation(historicalV17EarnedState(observeEarnedState(), loadAuthenticEconomyAncestry().witness))).toBe(policy.sourceEarnedHash);
  expect(useHydrationStore.getState().status).toBe('ready');
  expect(useCombatStore.getState().inCombat).toBe(false);
});

it('equips only the exact two earned items and spends only actual five Vitality points', () => {
  hydrateEconomyAncestry();
  const before = observeEarnedState();
  prepareEconomyAncestry(action);
  const after = observeEarnedState();
  expect(after.inventory.equipped.gloves).toEqual({ ...policy.gloves, equipped: true });
  expect(after.inventory.equipped.boots).toEqual({ ...policy.boots, equipped: true });
  expect(after.player.player?.coreStats).toEqual({ strength: 10, dexterity: 25, vitality: 42, energy: 63 });
  expect(after.player.player?.skillPoints).toBe(0);
  expect(after.player.player?.statPoints).toBe(0);
  expect(after.player.player?.skillLevels).toEqual(before.player.player?.skillLevels);
  expect(after.merc).toEqual(before.merc);
  expect(after.map).toEqual(before.map);
  expect(useCombatStore.getState().inCombat).toBe(false);
});

it('refuses a changed native payload before equipping or spending', () => {
  hydrateEconomyAncestry();
  useInventoryStore.setState(state => ({ backpack: state.backpack.map(item => item.id === policy.gloves.id
    ? { ...item, socketCapacity: 0 } : item) }));
  const before = observeEarnedState();
  expect(() => { prepareEconomyAncestry(action); }).toThrow('Fresh earned gear policy refused');
  expect(observeEarnedState()).toEqual(before);
});

it('spends synthetic earned-level fixture points through production prerequisites, retaining all unrelated skills', () => {
  hydrateEconomyAncestry();
  // Explicit no-combat fixture: validates legal allocation, never a campaign input.
  usePlayerStore.setState(state => ({ player: state.player ? { ...state.player,
    level: 24, statPoints: 60, skillPoints: 12 } : null }));
  const before = structuredClone(usePlayerStore.getState().player);
  allocateEconomyBoundary(action);
  const after = usePlayerStore.getState().player;
  expect(after?.coreStats).toEqual({ ...before?.coreStats, vitality: 97 });
  expect(after?.skillLevels).toEqual({ ...before?.skillLevels, 'sorceress.ice_blast': 20, 'sorceress.glacial_spike': 1 });
  expect(after?.skillPoints).toBe(0);
  expect(after?.statPoints).toBe(0);
  expect(after?.comboOrder).toEqual([policy.frost, policy.glacial, policy.ice]);
  expect(useCombatStore.getState().inCombat).toBe(false);
});

it('counts production atomic timestamp groups, warmup, boss intro, clamps and settlement pause exactly', () => {
  // Only shape fields consumed by scheduling are relevant; no battle is simulated.
  const events = [
    { kind: 'message', messageKey: 'combat:bossIntro', simClockMs: 0 },
    { kind: 'end', simClockMs: 0 }, { kind: 'end', simClockMs: 0 },
    { kind: 'end', simClockMs: 10 }, { kind: 'end', simClockMs: 10000 }
  ] as unknown as Parameters<typeof economyPlaybackSchedule>[0];
  expect(economyPlaybackSchedule(events)).toEqual({
    batches: [{ cursor: 0, end: 1, delayMs: 1200 }, { cursor: 1, end: 3, delayMs: 200 },
      { cursor: 3, end: 4, delayMs: 50 }, { cursor: 4, end: 5, delayMs: 3000 }],
    playbackMs: 4450, settlementPauseMs: 1500, totalMs: 5950 });
});

it('permits exactly the inactive idle lastOnline projection while retaining raw metadata and strict historical capture', () => {
  hydrateEconomyAncestry();
  vi.mocked(Date.now).mockReturnValue(policy.clockEpochMs + 12345);
  const before = observeEarnedState();
  expect(captureFreshNativeSave().status).toBe('failed');
  const capture = captureFreshEconomyNativeSave(policy.clockEpochMs);
  expect(capture.status, capture.failure ?? undefined).toBe('captured');
  expect(capture.snapshot?.meta.idleState.lastOnline).toBe(policy.clockEpochMs);
  expect(capture.decoded?.meta.idleState).toEqual({ lastOnline: policy.clockEpochMs + 12345,
    offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 });
  expect(capture.idleMetadata.equalOutsideIdleMetadata).toBe(true);
  expect(observeEarnedState()).toEqual(before);
  useMetaStore.setState(state => ({ idleState: { ...state.idleState, offlineTime: 1 } }));
  expect(captureFreshEconomyNativeSave(policy.clockEpochMs).status).toBe('failed');
});

it('uses native flee without playing or settling when an installed recording cannot fit the budget', () => {
  hydrateEconomyAncestry();
  const hasRun = vi.spyOn(helpers, 'hasActiveSubAreaRun').mockReturnValue(true);
  const settle = vi.spyOn(helpers, 'advanceWaveOrFinish');
  const abort = vi.spyOn(helpers, 'abortSubAreaRun');
  const advance = vi.fn();
  const outcome = { winner: 'player', finalPlayerTeam: [], finalEnemyTeam: [] };
  const events = [{ kind: 'end', simClockMs: 0 }];
  // Explicit unplayed opening fixture; no combat generation or reward settlement.
  useCombatStore.setState({ inCombat: true, currentWave: 1, totalWaves: 1, eventCursor: 0,
    playbackComplete: false, isPaused: false, subAreaRunId: 'fixture-budget', advanceEvent: advance,
    recordedEvents: events as unknown as Parameters<typeof economyPlaybackSchedule>[0],
    outcome: outcome as unknown as NonNullable<ReturnType<typeof useCombatStore.getState>['outcome']> });
  const before = observeEarnedState();
  const clock = { now: policy.clockEpochMs as number };
  const wave = playEconomyWave({ runId: 'fixture-budget', totalWaves: 1, runSeed: 7, challengeOrdinal: 109 },
    0, clock, policy.clockEpochMs + 1699);
  expect(wave.played).toBe(false);
  expect(wave.advanceResult).toBe('budget-flee');
  expect(wave.opening.recordedEvents).toEqual(events);
  expect(wave.actualDelta.xp).toBe(0);
  expect(wave.actualDelta.addedItems).toEqual([]);
  expect(wave.beforeHash).toBe(wave.afterHash);
  expect(observeEarnedState()).toEqual(before);
  expect(clock.now).toBe(policy.clockEpochMs);
  expect(advance).not.toHaveBeenCalled();
  expect(settle).not.toHaveBeenCalled();
  expect(abort).toHaveBeenCalledTimes(1);
  hasRun.mockRestore();
});

it('advances the monotone clock before actual playback and once before the sole settlement at the exact budget boundary', () => {
  hydrateEconomyAncestry();
  const clock = { now: policy.clockEpochMs as number };
  vi.mocked(Date.now).mockImplementation(() => clock.now);
  const active = vi.spyOn(helpers, 'hasActiveSubAreaRun').mockReturnValue(true);
  const observed: number[] = [];
  const advance = vi.fn(() => {
    observed.push(Date.now());
    useCombatStore.setState({ eventCursor: 1, playbackComplete: true });
  });
  const settle = vi.spyOn(helpers, 'advanceWaveOrFinish').mockImplementation(() => {
    observed.push(Date.now()); active.mockReturnValue(false); return 'defeat';
  });
  // Explicit no-combat timing fixture. Settlement is mocked and grants no resources.
  useCombatStore.setState({ inCombat: true, currentWave: 1, totalWaves: 1, eventCursor: 0,
    playbackComplete: false, isPaused: false, subAreaRunId: 'fixture-timing', advanceEvent: advance,
    recordedEvents: [{ kind: 'end', simClockMs: 0 }] as unknown as Parameters<typeof economyPlaybackSchedule>[0],
    outcome: { winner: 'enemy', finalPlayerTeam: [], finalEnemyTeam: [] } as unknown as NonNullable<ReturnType<typeof useCombatStore.getState>['outcome']> });
  const wave = playEconomyWave({ runId: 'fixture-timing', totalWaves: 1, runSeed: 7, challengeOrdinal: 109 },
    0, clock, policy.clockEpochMs + 1700);
  expect(wave.played).toBe(true);
  expect(observed).toEqual([policy.clockEpochMs + 200, policy.clockEpochMs + 1700]);
  expect(wave.clockEnd - wave.clockStart).toBe(wave.schedule.totalMs);
  expect(advance).toHaveBeenCalledTimes(1);
  expect(settle).toHaveBeenCalledTimes(1);
  expect(wave.actualDelta.xp).toBe(0);
  expect(captureFreshEconomyNativeSave(policy.clockEpochMs).status).toBe('captured');
});

it('captures an unexpected post-action error and exact live native state before caller restoration and primary publication', () => {
  usePlayerStore.setState({ allocateStatPoints: () => 'ok' }); // Synthetic faulty result; no combat.
  const caller = observeEarnedState();
  const now = Date.now;
  let live = false;
  const report = runEconomyScreen(collectSourceState(process.cwd()), capture => {
    live = true;
    expect(capture.snapshot?.inventory.equipped.gloves?.id).toBe(policy.gloves.id);
  });
  expect(live).toBe(true);
  expect(report.status).toBe('execution-failed');
  expect(report.executionFailure?.name).toBe('AssertionError');
  expect(report.runs).toEqual([]);
  expect(report.terminal.player.player?.statPoints).toBe(5);
  expect(report.terminal.inventory.equipped.gloves?.id).toBe(policy.gloves.id);
  expect(report.nativeSaveCapture.status).toBe('captured');
  expect(observeEarnedState()).toEqual(caller);
  expect(Date.now).toBe(now);
  const scratch = mkdtempSync(join(tmpdir(), 'd2h5-economy-contract-'));
  const output = join(scratch, 'report.json');
  try {
    publishFreshCampaignReport(process.cwd(), output, report);
    expect(JSON.parse(readFileSync(output, 'utf8')) as unknown).toMatchObject({ status: 'execution-failed' });
    expect(() => publishFreshCampaignReport(process.cwd(), output, report)).toThrow('Fresh report publication failed');
  } finally { if (existsSync(output)) unlinkSync(output); rmdirSync(scratch); expect(existsSync(scratch)).toBe(false); }
});

it('retains the old attempted recording and actual deltas when settlement publishes a new wave and throws', () => {
  const active = vi.spyOn(helpers, 'hasActiveSubAreaRun').mockReturnValue(false);
  const oldEvents = [{ kind: 'end', simClockMs: 0 }];
  const nextEvents = [{ kind: 'end', simClockMs: 300 }];
  vi.spyOn(playback, 'startEarnedRun').mockImplementation(() => {
    active.mockReturnValue(true);
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    useMapStore.setState(state => ({ challengeOrdinals: { ...state.challengeOrdinals, normal: ordinal + 1 } }));
    useCombatStore.setState({ inCombat: true, currentWave: 1, totalWaves: 6, eventCursor: 0,
      playbackComplete: false, isPaused: false, subAreaRunId: policy.farmArea,
      advanceEvent: () => { useCombatStore.setState({ eventCursor: 1, playbackComplete: true }); },
      recordedEvents: oldEvents as unknown as Parameters<typeof economyPlaybackSchedule>[0],
      outcome: { winner: 'player', finalPlayerTeam: [], finalEnemyTeam: [] } as unknown as NonNullable<ReturnType<typeof useCombatStore.getState>['outcome']> });
    return { runId: policy.farmArea, totalWaves: 6, challengeOrdinal: ordinal,
      runSeed: hashSeed(`${policy.farmArea}|${String(Date.now())}`) };
  });
  vi.spyOn(helpers, 'advanceWaveOrFinish').mockImplementation(() => {
    // Explicit no-combat fault fixture, never a frozen campaign input.
    usePlayerStore.getState().gainExperience(10);
    useCombatStore.setState({ currentWave: 2, eventCursor: 0, playbackComplete: false,
      recordedEvents: nextEvents as unknown as Parameters<typeof economyPlaybackSchedule>[0] });
    throw new Error('Synthetic post-settlement publication failure');
  });
  const caller = observeEarnedState();
  const report = runEconomyScreen(collectSourceState(process.cwd()), capture => {
    expect(capture.snapshot?.player.experience).toBe(9168);
  });
  expect(report.status).toBe('execution-failed');
  const attempt = report.runs[0]?.waves[0];
  expect(attempt?.opening.recordedEvents).toEqual(oldEvents);
  expect(attempt?.schedule.totalMs).toBe(1700);
  expect(attempt?.clockEnd).toBe(policy.clockEpochMs + 1700);
  expect(attempt?.playbackCursor).toBe(1);
  expect(attempt?.settlementStatus).toBe('started');
  expect(attempt?.failure?.message).toBe('Synthetic post-settlement publication failure');
  expect(attempt?.actualDelta.xp).toBe(10);
  expect(attempt?.beforeHash).not.toBe(attempt?.afterHash);
  expect(report.terminalCombat.currentWave).toBe(2);
  expect(report.terminalCombat.recordedEvents).toEqual(nextEvents);
  expect(report.nativeSaveCapture.status).toBe('captured');
  expect(observeEarnedState()).toEqual(caller);
});

it('preserves an actual native equip refusal and native publication failure without launching', () => {
  useInventoryStore.setState({ equipItem: () => ({ ok: false, reason: 'no_slot' }) });
  const caller = observeEarnedState();
  const report = runEconomyScreen(collectSourceState(process.cwd()), () => { throw new Error('Synthetic publication failure'); });
  expect(report.status).toBe('action-refused');
  expect(report.reason).toMatchObject({ reason: 'production-equip-refused' });
  expect(report.nativePublicationFailure).toBe('Synthetic publication failure');
  expect(report.runs).toEqual([]);
  expect(report.nativeSaveCapture.status).toBe('captured');
  expect(observeEarnedState()).toEqual(caller);
});
