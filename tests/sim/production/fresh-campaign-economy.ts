import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { decodeSave } from '@/engine/save/validate';
import { hashSeed } from '@/engine/rng';
import { snapshotStores } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { recordedPlaybackBatch, useCombatStore } from '@/stores/combatStore';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { canClaim, claimQuestReward, readQuestItem } from '@/features/quests/claimReward';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, observeStore, restoreEarnedSave } from './earned-state';
import { hashObservation } from './earned-report';
import { FreshGearRefusal, auditFrozenNativeItem, transferFreshItem } from './fresh-campaign-gear';
import { captureFreshEconomyNativeSave } from './fresh-campaign-save';
import { startEarnedRun, type EarnedRunHandle } from './earned-playback';
import { assertSourceStable, collectSourceState, type SourceState } from './provenance';
import { economyPolicy as policy } from './fresh-campaign-economy-policy';

const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const describeFailure = (error: unknown) => error instanceof Error
  ? { name: error.name, message: error.message, stack: error.stack ?? null }
  : { name: 'NonError', message: String(error), stack: null };
type Action = (name: string, operation: () => unknown, expected?: unknown) => unknown;

export interface EconomyWaveAttempt {
  index: number;
  clockStart: number;
  clockEnd: number;
  handle: EarnedRunHandle;
  schedule: ReturnType<typeof economyPlaybackSchedule>;
  opening: { playerTeam: EconomyCombatState['playerTeam'];
    enemyTeam: EconomyCombatState['enemyTeam'];
    presentation: EconomyCombatState['currentWavePresentation'];
    recordedEvents: EconomyCombatState['recordedEvents']; outcome: NonNullable<EconomyCombatState['outcome']> };
  terminalSimClockMs: number;
  beforeHash: string;
  afterHash: string;
  played: boolean;
  budgetAdmitted: boolean;
  playbackCursor: number;
  settlementStatus: 'not-started' | 'started' | 'returned';
  advanceResult: ReturnType<typeof advanceWaveOrFinish> | 'budget-flee' | null;
  actualDelta: ReturnType<typeof earnedDelta>;
  failure: ReturnType<typeof describeFailure> | null;
}
type EconomyCombatState = ReturnType<typeof useCombatStore.getState>;

/** Authenticate exact native bytes, then hydrate once without boot/offline reconciliation. */
export function hydrateEconomyAncestry() {
  const compressed = readFileSync(new URL(`../../../${policy.source}`, import.meta.url));
  assert.equal(digest(compressed), policy.sourceGzipSha256);
  const bytes = gunzipSync(compressed);
  assert.equal(digest(bytes), policy.sourceRawSha256);
  const save = decodeSave(JSON.parse(bytes.toString('utf8')) as unknown);
  assert.equal(hashObservation(save), policy.sourceSaveHash);
  assert.equal(Date.now(), policy.clockEpochMs);
  restoreEarnedSave(save, policy.clockEpochMs);
  assert.deepEqual(snapshotStores(), save, 'Economic ancestry hydration changed a saved domain');
  assert.equal(hashObservation(observeEarnedState()), policy.sourceEarnedHash);
  return { source: policy.source, rawSha256: digest(bytes), gzipSha256: digest(compressed),
    saveHash: hashObservation(save), parentReportRawSha256: policy.parentReportRawSha256 };
}

/** Only real earned points, between complete challenges; no speculative masteries or respec. */
export function allocateEconomyBoundary(action: Action) {
  const player = () => { const value = usePlayerStore.getState().player; assert.ok(value); return value; };
  const before = structuredClone(player());
  if (player().statPoints > 0) action('allocate-all-earned-stats-vitality', () => {
    const current = player();
    return usePlayerStore.getState().allocateStatPoints({ strength: 0, dexterity: 0,
      vitality: current.statPoints, energy: 0 }, current);
  });
  if (player().level >= 18 && !player().skillLevels?.['sorceress.glacial_spike'] && player().skillPoints > 0) {
    const points = player().skillPoints;
    action('allocate-earned-glacial-spike-one', () => usePlayerStore.getState().allocateSkillPoint(policy.glacial));
    assert.equal(player().skillPoints, points - 1);
    assert.equal(player().skillLevels?.['sorceress.glacial_spike'], 1);
  }
  while (player().skillPoints > 0 && (player().skillLevels?.['sorceress.ice_blast'] ?? 0) < 20) {
    const points = player().skillPoints;
    const ice = player().skillLevels?.['sorceress.ice_blast'] ?? 0;
    action('allocate-earned-ice-blast', () => usePlayerStore.getState().allocateSkillPoint(policy.ice));
    assert.equal(player().skillPoints, points - 1);
    assert.equal(player().skillLevels?.['sorceress.ice_blast'], ice + 1);
  }
  const combo = player().level >= 18 ? [policy.frost, policy.glacial, policy.ice] : [policy.frost, policy.ice];
  if (hashObservation(player().comboOrder) !== hashObservation(combo)) action('set-earned-cold-combo', () => {
    usePlayerStore.getState().setComboOrder(combo); return 'ok';
  });
  assert.equal(player().statPoints, 0);
  assert.deepEqual(player().coreStats, { ...before.coreStats, vitality: before.coreStats.vitality + before.statPoints });
  assert.deepEqual(player().comboOrder, combo);
}

export function prepareEconomyAncestry(action: Action) {
  const player = usePlayerStore.getState().player;
  assert.ok(player);
  assert.equal(player.level, 13);
  assert.equal(player.experience, 9158);
  assert.equal(player.skillPoints, 0);
  assert.equal(player.statPoints, 5);
  assert.equal(useMapStore.getState().challengeOrdinals.normal, policy.expectedOrdinal);
  for (const [slot, item] of [['gloves', policy.gloves], ['boots', policy.boots]] as const) {
    action(`audit-earned-hero-${slot}`, () => auditFrozenNativeItem(item), null);
    action(`equip-earned-hero-${slot}`, () => transferFreshItem('hero', slot, item.id), null);
  }
  allocateEconomyBoundary(action);
}

/** Exact default UI presentation cost, without reading a winner or reward. */
export function economyPlaybackSchedule(events: ReturnType<typeof useCombatStore.getState>['recordedEvents']) {
  const batches: { cursor: number; end: number; delayMs: number }[] = [];
  let cursor = 0;
  let playbackMs = 0;
  while (cursor < events.length) {
    const batch = recordedPlaybackBatch(events, cursor, 1);
    assert.ok(batch && Number.isInteger(batch.end) && batch.end > cursor && batch.end <= events.length);
    batches.push({ cursor, ...batch });
    playbackMs += batch.delayMs;
    cursor = batch.end;
  }
  assert.ok(events.length > 0);
  return { batches, playbackMs, settlementPauseMs: policy.settlementPauseMs,
    totalMs: playbackMs + policy.settlementPauseMs };
}

export function ordinaryEconomyReturn(flee = false) {
  if (flee) abortSubAreaRun();
  useMetaStore.getState().setIdleTarget(undefined);
  setIdleEliteMisses(0);
  useCombatStore.getState().endCombat();
}

/** One installed recording, with exact time admission and sole native settlement. */
export function playEconomyWave(handle: EarnedRunHandle, index: number,
  clock: { now: number }, deadline: number, retainAttempt: (attempt: EconomyWaveAttempt) => void = () => undefined) {
  const opening = observeStore(useCombatStore);
  assert.ok(hasActiveSubAreaRun() && opening.inCombat && !opening.isPaused && !opening.playbackComplete);
  assert.equal(opening.currentWave, index + 1);
  assert.equal(opening.totalWaves, handle.totalWaves);
  assert.equal(opening.subAreaRunId, handle.runId);
  assert.equal(opening.eventCursor, 0);
  assert.ok(opening.outcome);
  const terminalEvent = opening.recordedEvents.at(-1);
  assert.ok(terminalEvent?.kind === 'end');
  const schedule = economyPlaybackSchedule(opening.recordedEvents);
  const clockStart = clock.now;
  const before = observeEarnedState();
  const beforeHash = hashObservation(before);
  const common = { index, clockStart, handle, schedule,
    opening: { playerTeam: opening.playerTeam, enemyTeam: opening.enemyTeam,
      presentation: opening.currentWavePresentation, recordedEvents: opening.recordedEvents, outcome: opening.outcome },
    terminalSimClockMs: terminalEvent.simClockMs, beforeHash };
  const attempt: EconomyWaveAttempt = { ...common, played: false, budgetAdmitted: clock.now + schedule.totalMs <= deadline,
    clockEnd: clock.now, afterHash: beforeHash, advanceResult: null, actualDelta: earnedDelta(before, before),
    playbackCursor: 0, settlementStatus: 'not-started', failure: null };
  // Retain the old recording before any playback, Flee or settlement can mutate/publicize state.
  retainAttempt(attempt);
  try {
    if (!attempt.budgetAdmitted) {
      ordinaryEconomyReturn(true);
      const after = observeEarnedState();
      attempt.afterHash = hashObservation(after);
      attempt.actualDelta = earnedDelta(before, after);
      attempt.advanceResult = 'budget-flee';
      assert.equal(attempt.afterHash, beforeHash, 'Unplayed budget flee awarded or changed earned domains');
      return attempt;
    }
    const recording = useCombatStore.getState().recordedEvents;
    const outcome = useCombatStore.getState().outcome;
    attempt.played = true;
    for (const batch of schedule.batches) {
      assert.equal(useCombatStore.getState().eventCursor, batch.cursor);
      clock.now += batch.delayMs;
      attempt.clockEnd = clock.now;
      useCombatStore.getState().advanceEvent();
      const current = useCombatStore.getState();
      attempt.playbackCursor = current.eventCursor;
      assert.equal(current.eventCursor, batch.end);
      assert.equal(current.recordedEvents, recording);
      assert.equal(current.outcome, outcome);
    }
    assert.ok(useCombatStore.getState().playbackComplete);
    assert.equal(hashObservation(observeEarnedState()), beforeHash, 'Playback changed earned domains before settlement');
    clock.now += policy.settlementPauseMs;
    attempt.clockEnd = clock.now;
    attempt.settlementStatus = 'started';
    const advanceResult = advanceWaveOrFinish();
    attempt.settlementStatus = 'returned';
    attempt.advanceResult = advanceResult;
    const after = observeEarnedState();
    attempt.afterHash = hashObservation(after);
    attempt.actualDelta = earnedDelta(before, after);
    assert.ok(advanceResult === 'next-wave' || advanceResult === 'victory' || advanceResult === 'defeat');
    if (advanceResult === 'next-wave') {
      assert.ok(hasActiveSubAreaRun());
      assert.equal(useCombatStore.getState().currentWave, index + 2);
      assert.equal(useCombatStore.getState().eventCursor, 0);
    } else assert.equal(hasActiveSubAreaRun(), false);
    return attempt;
  } catch (error) {
    attempt.failure = describeFailure(error);
    attempt.clockEnd = clock.now;
    // The current combat may already be the next wave. Never replace the old opening/cursor.
    const after = observeEarnedState();
    attempt.afterHash = hashObservation(after);
    attempt.actualDelta = earnedDelta(before, after);
    throw error;
  }
}

/** Dedicated realm: one ancestry, ordinary rewards, no reset/retry after any nonwin. */
export function runEconomyScreen(beforeImport: SourceState,
  publishNative: (capture: ReturnType<typeof captureFreshEconomyNativeSave>, context: Record<string, unknown>) => void,
  progress: (event: Record<string, unknown>) => void = () => undefined) {
  assert.ok(!hasActiveSubAreaRun() && !useCombatStore.getState().inCombat);
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const sourceBefore = collectSourceState(root);
  assertSourceStable(beforeImport, sourceBefore);
  const references = () => [policy.source, policy.plan].map(path => ({ path,
    sha256: digest(readFileSync(new URL(`../../../${path}`, import.meta.url))) }));
  const referenceInputs = references();
  const restorers = captureEarnedRestorers();
  const originalNow = Date.now;
  const originalPity = getIdleEliteMisses();
  const clock = { now: policy.clockEpochMs as number };
  const started = performance.now();
  let ancestry: ReturnType<typeof hydrateEconomyAncestry> | null = null;
  let prerequisiteHash: string | null = null;
  const actions: Record<string, unknown>[] = [];
  const runs: { phase: 'farm' | 'target'; handle: EarnedRunHandle; waves: ReturnType<typeof playEconomyWave>[] }[] = [];
  let farmWaves = 0;
  let executionFailure: ReturnType<typeof describeFailure> | null = null;
  const cleanupFailures: string[] = [];
  const action: Action = (name, operation, expected = 'ok') => {
    const before = observeEarnedState();
    let result: unknown;
    let failure: ReturnType<typeof describeFailure> | null = null;
    let thrown: unknown;
    try { result = operation(); } catch (error) { failure = describeFailure(error); thrown = error; }
    const after = observeEarnedState();
    actions.push({ action: name, clock: clock.now, result, failure, beforeHash: hashObservation(before),
      afterHash: hashObservation(after), delta: earnedDelta(before, after), player: after.player.player });
    if (failure) throw thrown;
    if (expected !== null && result !== expected) throw new FreshGearRefusal({ action: name, result, expected });
    return result;
  };
  const finish = (status: 'target-complete' | 'farming-cap' | 'budget-stop' | 'campaign-nonwin' | 'action-refused' | 'execution-failed', reason: unknown = null) => {
    const terminal = observeEarnedState();
    const terminalCombat = observeStore(useCombatStore);
    const nativeSaveCapture = captureFreshEconomyNativeSave(policy.clockEpochMs);
    let nativePublicationFailure: string | null = null;
    try { publishNative(nativeSaveCapture, { experiment: policy, ancestry, sourceBeforeImport: beforeImport,
      sourceBefore, referenceInputs, stop: { status, reason, runCount: runs.length, farmWaves,
        clock: clock.now, terminalHash: hashObservation(terminal) }, capturedBeforeCleanup: true }); }
    catch (error) { nativePublicationFailure = error instanceof Error ? error.message : String(error); }
    return { status, reason, ancestry, actions, runs, farmWaves, terminal, terminalCombat,
      clockEnd: clock.now, activePlaybackMs: clock.now - policy.clockEpochMs,
      nativeSaveCapture, nativePublicationFailure };
  };
  let result: ReturnType<typeof finish> | undefined;
  const frozenBuild = () => { const state = observeEarnedState(); return hashObservation({
    heroGear: state.inventory.equipped, mercGear: state.merc.mercEquipment,
    core: state.player.player?.coreStats, skills: state.player.player?.skillLevels,
    combo: state.player.player?.comboOrder, mercCombos: state.merc.ownedMercs.map(merc => merc.comboOrder) }); };
  const prerequisites = () => { const state = observeEarnedState(); return hashObservation({
    quests: Object.fromEntries(['quests/act2-horadric-staff', 'quests/act2-tainted-sun', policy.radament,
      'quests/act2-seven-tombs'].map(id => [id, state.map.questProgress[id]])),
    items: state.inventory.questItems, receipts: state.map.questReceipts }); };
  const run = (phase: 'farm' | 'target') => {
    const area = phase === 'farm' ? policy.farmArea : policy.targetArea;
    const act = phase === 'farm' ? 1 : 2;
    assert.equal(useMapStore.getState().selectedDifficulty, 'normal');
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    const launchClock = clock.now;
    useMapStore.getState().setCurrentLocation(act, area);
    const handle = startEarnedRun({ act, subAreaId: area, mode: 'manual' });
    const record: (typeof runs)[number] = { phase, handle, waves: [] };
    runs.push(record);
    assert.equal(handle.totalWaves, phase === 'farm' ? 6 : 5);
    assert.equal(handle.challengeOrdinal, ordinal);
    assert.equal(handle.runSeed, hashSeed(`${area}|${String(launchClock)}`));
    assert.equal(useMapStore.getState().challengeOrdinals.normal, (ordinal + 1) % 360360);
    const frozen = frozenBuild();
    for (let index = 0; index < handle.totalWaves; index++) {
      const wave = playEconomyWave(handle, index, clock, policy.clockEpochMs +
        (phase === 'farm' ? policy.farmBudgetMs : policy.totalBudgetMs), attempt => { record.waves.push(attempt); });
      if (phase === 'farm' && wave.played) farmWaves++;
      assert.equal(frozenBuild(), frozen, 'Build changed inside an economic challenge');
      if (!wave.played) return finish('budget-stop', { phase, run: runs.length, wave: index });
      const heroId = usePlayerStore.getState().player?.id;
      if (wave.opening.outcome.winner !== 'player' || !wave.opening.outcome.finalPlayerTeam.some(unit => unit.id === heroId && unit.life > 0))
        return finish('campaign-nonwin', { phase, run: runs.length, wave: index, winner: wave.opening.outcome.winner });
      if (wave.advanceResult === 'victory') {
        ordinaryEconomyReturn();
        return null;
      }
      assert.equal(wave.advanceResult, 'next-wave');
    }
    throw new Error('Economic challenge exhausted waves without its native terminal result');
  };
  try {
    Date.now = () => clock.now;
    ancestry = hydrateEconomyAncestry();
    prerequisiteHash = prerequisites();
    prepareEconomyAncestry(action);
    while ((usePlayerStore.getState().player?.level ?? 0) < policy.targetLevel) {
      const farmRuns = runs.filter(entry => entry.phase === 'farm').length;
      if (farmRuns >= policy.maxFarmLaunches || farmWaves >= policy.maxFarmWaves) {
        result = finish('farming-cap', { farmRuns, farmWaves }); break;
      }
      result = run('farm') ?? undefined;
      if (result) break;
      allocateEconomyBoundary(action);
      if ((farmRuns + 1) % 10 === 0) progress({ phase: 'farm', completedRuns: farmRuns + 1,
        level: usePlayerStore.getState().player?.level, activePlaybackMs: clock.now - policy.clockEpochMs,
        wallSeconds: (performance.now() - started) / 1000 });
    }
    if (!result) {
      const state = observeEarnedState();
      const map = state.map;
      assert.ok((state.player.player?.level ?? 0) >= policy.targetLevel);
      assert.ok(clock.now <= policy.clockEpochMs + policy.farmBudgetMs);
      assert.equal(prerequisites(), prerequisiteHash, 'Farming changed authentic ActII prerequisites');
      assert.equal(map.questProgress[policy.radament]?.status, 'inProgress');
      for (const quest of ['quests/act2-horadric-staff', 'quests/act2-tainted-sun']) {
        assert.equal(map.questProgress[quest]?.status, 'completed');
        assert.equal(map.questProgress[quest].rewardClaimed, true);
      }
      assert.equal(map.questProgress['quests/act2-seven-tombs']?.objectives['obj-open-tomb'], true);
      result = run('target') ?? undefined;
      if (!result) {
        assert.equal(canClaim(policy.radament), true);
        const beforeClaim = observeEarnedState();
        action('claim-earned-radament', () => claimQuestReward(policy.radament));
        const claimed = observeEarnedState();
        const claimDelta = earnedDelta(beforeClaim, claimed);
        assert.equal(claimDelta.xp, 5000);
        assert.equal(claimDelta.mercXp[policy.mercId], 3750);
        assert.equal(canClaim(policy.radament), false);
        const bookSource = `${policy.radament}#reward:questItem`;
        assert.equal(claimed.inventory.questItems[bookSource]?.state, 'owned');
        action('read-earned-book-of-skill', () => readQuestItem(`${policy.radament}#reward:questItem`));
        const afterBook = observeEarnedState();
        assert.equal(afterBook.inventory.questItems[bookSource]?.state, 'consumed');
        assert.equal(afterBook.player.player?.skillPoints, (claimed.player.player?.skillPoints ?? 0) + 1);
        result = finish('target-complete');
      }
    }
  } catch (error) {
    if (error instanceof FreshGearRefusal) result = finish('action-refused', error.evidence);
    else { executionFailure = describeFailure(error); result = finish('execution-failed', executionFailure); }
  } finally {
    try { abortSubAreaRun(); } catch (error) { cleanupFailures.push(String(error)); }
    for (const restore of restorers) try { restore(); } catch (error) { cleanupFailures.push(String(error)); }
    try { setIdleEliteMisses(originalPity); } catch (error) { cleanupFailures.push(String(error)); }
    Date.now = originalNow;
  }
  let sourceAfter: SourceState | null = null;
  let provenanceFailure: string | null = null;
  try {
    sourceAfter = collectSourceState(root);
    assertSourceStable(sourceBefore, sourceAfter);
    assert.deepEqual(references(), referenceInputs);
  } catch (error) { provenanceFailure = error instanceof Error ? error.message : String(error); }
  assert.ok(result);
  return { kind: 'earned-native-economic-continuation-screen', reportVersion: 1,
    observationEncoding: 'd2h5-observation-v1', experiment: policy, sourceBeforeImport: beforeImport,
    sourceBefore, sourceAfter, referenceInputs, provenanceFailure, executionFailure, cleanupFailures,
    wallSeconds: (performance.now() - started) / 1000,
    limitations: ['Service hydration of exact native saved domains; no browser/IndexedDB/Save-Continue acceptance.',
      'Historical online clock counts production default 1x playback and 1500ms settlement pauses only; menu/travel/decision latency and actual browser pacing are unmeasured.',
      'No boot/offline accrual, supplied seed, reset, respec, injected resources or retries after a first nonwin.',
      'Native saves omit transient combat HP/MP; ordinary challenges construct fresh derived resources.',
      'Dedicated realm seeds native item IDs once from owned ancestry; module sequence ends with its process.'], ...result };
}
