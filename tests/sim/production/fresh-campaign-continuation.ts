import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import { decodeSave } from '@/engine/save/validate';
import { hashSeed } from '@/engine/rng';
import { snapshotStores } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { useCombatStore } from '@/stores/combatStore';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, restoreEarnedSave } from './earned-state';
import { hashObservation } from './earned-report';
import { historicalV17Save, historicalV17EarnedState } from './historical-v17';
import { FreshGearRefusal, auditFrozenNativeItem, transferFreshItem } from './fresh-campaign-gear';
import { captureFreshNativeSave } from './fresh-campaign-save';
import { startEarnedRun, playEarnedWave, type EarnedWave } from './earned-playback';
import { assertSourceStable, collectSourceState, type SourceState } from './provenance';
import { nativeContinuationPolicy as policy } from './fresh-campaign-continuation-policy';

const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const describeFailure = (error: unknown) => error instanceof Error
  ? { name: error.name, message: error.message, stack: error.stack ?? null,
    cause: error.cause instanceof Error ? { name: error.cause.name, message: error.cause.message } : String(error.cause ?? '') }
  : { name: 'NonError', message: String(error), stack: null, cause: '' };

/** Hash exact authentic bytes before parse/decode; no observation or arbitrary save input. */
export function loadAuthenticV2Terminal() {
  const compressed = readFileSync(new URL(`../../../${policy.source}`, import.meta.url));
  assert.equal(digest(compressed), policy.sourceGzipSha256, 'Native source compressed bytes drifted');
  const bytes = gunzipSync(compressed);
  assert.equal(digest(bytes), policy.sourceRawSha256, 'Native source export bytes drifted');
  const original: unknown = JSON.parse(bytes.toString('utf8'));
  assert.ok(typeof original === 'object' && original !== null && 'version' in original && original.version === 17,
    'Authenticated ancestry must remain native v17');
  const save = decodeSave(original);
  assert.equal(hashObservation(historicalV17Save(save)), policy.sourceSaveHash, 'Native source decoder changed the saved values');
  return { save, ancestry: { source: policy.source, gzipSha256: digest(compressed), rawSha256: digest(bytes),
    saveHash: hashObservation(historicalV17Save(save)), liveSaveHash: hashObservation(save),
    liveSaveVersion: save.version, migratedMaterials: structuredClone(save.inventory.materials), parentReportRawSha256: policy.parentReportRawSha256 } };
}

/** Exact service hydration of the authenticated native save, without IO or offline accrual. */
export function hydrateAuthenticV2Terminal() {
  const authenticated = loadAuthenticV2Terminal();
  assert.equal(Date.now(), policy.clockEpochMs);
  restoreEarnedSave(authenticated.save, policy.clockEpochMs);
  assert.deepEqual(snapshotStores(), authenticated.save, 'Hydration changed an authenticated saved domain');
  assert.equal(hashObservation(historicalV17EarnedState(observeEarnedState())), policy.sourceEarnedHash, 'Hydrated earned domains differ from native ancestry');
  return authenticated;
}

/** Only the predeclared production amulet transfer and one earned skill allocation. */
export function prepareNativeContinuation(action: (name: string, result: unknown) => void) {
  const before = observeEarnedState();
  const player = before.player.player;
  assert.ok(player);
  assert.equal(player.level, 13);
  assert.equal(player.skillPoints, 1);
  assert.equal(player.statPoints, 5);
  assert.equal(player.skillLevels?.['sorceress.ice_blast'], 8);
  assert.equal(before.merc.fieldedMercId, policy.mercId);
  if (before.merc.mercEquipment[policy.mercId]?.amulet != null)
    throw new FreshGearRefusal({ reason: 'continuation-rogue-amulet-not-empty' });
  const owned = [...before.inventory.backpack, ...before.inventory.stash,
    ...Object.values(before.inventory.equipped).filter(item => item != null),
    ...Object.values(before.merc.mercEquipment).flatMap(gear => Object.values(gear).filter(item => item != null))];
  assert.equal(owned.filter(item => item.id === policy.amulet.id).length, 1, 'Continuation amulet ownership is not unique');
  action('audit-exact-earned-amulet', auditFrozenNativeItem(policy.amulet));
  action('equip-earned-rogue-amulet', transferFreshItem('merc', 'amulet', policy.amulet.id));
  const allocated = usePlayerStore.getState().allocateSkillPoint(policy.skill);
  action('allocate-earned-ice-blast-point', allocated);
  if (allocated !== 'ok') throw new FreshGearRefusal({ reason: 'continuation-earned-skill-refused', allocated });
  const after = observeEarnedState();
  assert.equal(after.player.player?.skillPoints, 0);
  assert.equal(after.player.player.statPoints, 5);
  assert.deepEqual(after.player.player.skillLevels, { ...player.skillLevels, 'sorceress.ice_blast': 9 });
  assert.deepEqual(after.player.player.coreStats, player.coreStats);
  assert.deepEqual(after.player.player.comboOrder, player.comboOrder);
  assert.deepEqual(after.merc.ownedMercs.map(merc => merc.comboOrder), before.merc.ownedMercs.map(merc => merc.comboOrder));
  assert.deepEqual(after.inventory.equipped, before.inventory.equipped);
  assert.deepEqual({ ...after.merc.mercEquipment[policy.mercId], amulet: null },
    { ...before.merc.mercEquipment[policy.mercId], amulet: null });
  assert.deepEqual(after.map, before.map);
  action('prepared-native-continuation', { state: after, delta: earnedDelta(before, after) });
}

type NativeCaptureHook = (capture: ReturnType<typeof captureFreshNativeSave>, context: Record<string, unknown>) => void;

/** Dedicated process only: one native saved-domain continuation, never a fresh prefix or replay. */
export function runNativeContinuationScreen(beforeImport: SourceState, onNativeCapture: NativeCaptureHook) {
  if (hasActiveSubAreaRun() || useCombatStore.getState().inCombat)
    throw new Error('Native continuation requires a quiescent caller');
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const sourceBefore = collectSourceState(root);
  assertSourceStable(beforeImport, sourceBefore);
  const readReferences = () => [policy.source, policy.plan].map(path => ({ path,
    sha256: digest(readFileSync(new URL(`../../../${path}`, import.meta.url))) }));
  const referenceInputs = readReferences();
  const restorers = captureEarnedRestorers();
  const originalNow = Date.now;
  const originalPity = getIdleEliteMisses();
  const started = performance.now();
  const actions: { action: string; result: unknown }[] = [];
  const waves: EarnedWave[] = [];
  let ancestry: ReturnType<typeof loadAuthenticV2Terminal>['ancestry'] | null = null;
  let handle: ReturnType<typeof startEarnedRun> | null = null;
  let restored: ReturnType<typeof observeEarnedState> | null = null;
  const action = (name: string, result: unknown) => actions.push({ action: name, result });
  const finish = (status: 'stage-complete' | 'action-refused' | 'campaign-nonwin' | 'execution-failed', refusal: unknown = null) => {
    const terminal = observeEarnedState();
    let nativeSaveCapture: ReturnType<typeof captureFreshNativeSave> | null = null;
    let nativeCaptureFailure: ReturnType<typeof describeFailure> | null = null;
    try { nativeSaveCapture = captureFreshNativeSave(); }
    catch (error) { nativeCaptureFailure = describeFailure(error); }
    let nativePublicationFailure: string | null = null;
    try { if (nativeSaveCapture !== null) onNativeCapture(nativeSaveCapture, { experiment: policy, ancestry, sourceBeforeImport: beforeImport,
      sourceBefore, referenceInputs, sourceAfter: null, campaignStop: { status, refusal, handle,
        waveCount: waves.length, terminalHash: hashObservation(terminal) },
      limitation: 'Captured before cleanup; post-run source/caller checks belong to the primary report.' }); }
    catch (error) { nativePublicationFailure = error instanceof Error ? error.message : String(error); }
    return { status, refusal, handle, ancestry, restored, actions, waves, terminal, nativeSaveCapture,
      nativeCaptureFailure, nativePublicationFailure };
  };
  let result: ReturnType<typeof finish> | undefined;
  let executionFailure: ReturnType<typeof describeFailure> | null = null;
  const cleanupErrors: unknown[] = [];
  try {
    Date.now = () => policy.clockEpochMs;
    ancestry = hydrateAuthenticV2Terminal().ancestry;
    restored = observeEarnedState();
    try {
      prepareNativeContinuation(action);
      const map = useMapStore.getState();
      assert.equal(map.selectedDifficulty, 'normal');
      assert.equal(map.challengeOrdinals.normal, policy.expectedOrdinal);
      assert.equal(map.clearedSubAreas.includes(policy.area), false);
      assert.equal(map.isActUnlocked(2), true);
      map.setCurrentLocation(2, policy.area);
      try { handle = startEarnedRun({ act: 2, subAreaId: policy.area, mode: 'manual' }); }
      catch (error) { throw new FreshGearRefusal({ reason: 'production-native-launch-refused',
        error: error instanceof Error ? error.message : String(error) }); }
      assert.equal(handle.challengeOrdinal, policy.expectedOrdinal);
      assert.equal(handle.runSeed, hashSeed(`${policy.area}|${String(policy.clockEpochMs)}`));
      assert.equal(handle.totalWaves, policy.maxWaves);
      const freeze = () => { const state = observeEarnedState(); return {
        heroGear: state.inventory.equipped, mercGear: state.merc.mercEquipment,
        coreStats: state.player.player?.coreStats, skills: state.player.player?.skillLevels,
        combo: state.player.player?.comboOrder, mercCombos: state.merc.ownedMercs.map(merc => merc.comboOrder) }; };
      const frozen = freeze();
      for (let index = 0; index < handle.totalWaves; index++) {
        const wave = playEarnedWave(handle, index);
        waves.push(wave);
        assert.deepEqual(freeze(), frozen, 'Continuation policy changed during the challenge');
        const heroId = restored.player.player?.id;
        if (wave.opening.outcome?.winner !== 'player' || !wave.opening.outcome.finalPlayerTeam.some(
          unit => unit.id === heroId && unit.life > 0)) {
          result = finish('campaign-nonwin', { action: 'rocky-waste', waveIndex: index,
            winner: wave.opening.outcome?.winner, actualDelta: wave.actualDelta });
          break;
        }
        if (wave.advanceResult === 'victory') {
          useMetaStore.getState().setIdleTarget(undefined);
          setIdleEliteMisses(0);
          useCombatStore.getState().endCombat();
          action('ordinary-return-to-map', 'ok');
          result = finish('stage-complete');
          break;
        }
        assert.equal(wave.advanceResult, 'next-wave');
      }
      if (!result) throw new Error('Native continuation exhausted its four waves without terminal result');
    } catch (error) {
      if (!(error instanceof FreshGearRefusal)) throw error;
      result = finish('action-refused', error.evidence);
    }
  } catch (error) {
    executionFailure = describeFailure(error);
    result = finish('execution-failed', { reason: 'unexpected-execution-failure', error: executionFailure });
  }
  finally {
    try { abortSubAreaRun(); } catch (error) { cleanupErrors.push(error); }
    for (const restore of restorers) try { restore(); } catch (error) { cleanupErrors.push(error); }
    try { setIdleEliteMisses(originalPity); } catch (error) { cleanupErrors.push(error); }
    Date.now = originalNow;
  }
  let sourceAfter: SourceState | null = null;
  let provenanceFailure: string | null = null;
  try {
    sourceAfter = collectSourceState(root);
    assertSourceStable(sourceBefore, sourceAfter);
    assert.ok(isDeepStrictEqual(referenceInputs, readReferences()), 'Native continuation reference drift');
  } catch (error) { provenanceFailure = error instanceof Error ? error.message : String(error); }
  return { kind: 'earned-native-save-continuation-service-screen', reportVersion: 1,
    observationEncoding: 'd2h5-observation-v1', experiment: policy, sourceBeforeImport: beforeImport,
    sourceBefore, sourceAfter, referenceInputs, provenanceFailure,
    executionFailure,
    cleanupFailures: cleanupErrors.map(error => error instanceof Error ? error.message : String(error)),
    wallSeconds: (performance.now() - started) / 1000,
    limitations: ['Continues authenticated saved domains by exact service hydration; no fresh prefix or observation reconstruction.',
      'Native saves omit transient combat HP/mana. No transplant/heal is applied; ordinary next challenge constructs its native opening.',
      'No IndexedDB, browser Save/Continue, offline accrual, Radament feasibility, full campaign or C2 acceptance.',
      'Dedicated task process seeds native item IDs from authentic ownership; its module realm ends with that process.'], ...result };
}
