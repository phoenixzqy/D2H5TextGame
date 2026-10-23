import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMapStore } from '@/stores/mapStore';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { captureEarnedRestorers, earnedDelta, observeEarnedState, resetEarnedStores } from './earned-state';
import { abandonEarnedNextWave, playEarnedWave, startEarnedRun, type EarnedRunHandle, type EarnedWave } from './earned-playback';
import { hashObservation } from './earned-report';
import { freshCampaignPolicy as policy, freshCampaignV2, type FreshCampaignStage } from './fresh-campaign-policy';
import { captureFreshNativeSave } from './fresh-campaign-save';
import { assertSourceStable, collectSourceState, type SourceState } from './provenance';
import { FreshGearRefusal } from './fresh-campaign-gear';
import { FreshRouteStop, runFreshCampaignRoute } from './fresh-campaign-route';

function wonAlive(wave: EarnedWave): boolean {
  const id = wave.beforeAward.player.player?.id;
  return wave.opening.outcome?.winner === 'player' &&
    wave.opening.outcome.finalPlayerTeam.some(unit => unit.id === id && unit.life > 0);
}

type FleeSummary = { delta: ReturnType<typeof earnedDelta>; beforeHash: string;
  afterHash: string; activeAfterFlee: boolean } | null;

function summarizeWave(wave: EarnedWave, index: number, handle: EarnedRunHandle, flee: FleeSummary, label = 'preparation') {
  return { index, waveIndex: wave.index, label, handle, winner: wave.opening.outcome?.winner, wonAlive: wonAlive(wave),
    terminalSimClockMs: wave.terminalSimClockMs, advanceResult: wave.advanceResult,
    actualDelta: wave.actualDelta, rawRewardDelta: wave.rawRewardDelta,
    finalPlayerTeam: wave.opening.outcome?.finalPlayerTeam,
    finalEnemyTeam: wave.opening.outcome?.finalEnemyTeam,
    beforeAwardHash: hashObservation(wave.beforeAward), afterAwardHash: hashObservation(wave.afterAward), flee };
}

type NativeCaptureHook = (capture: ReturnType<typeof captureFreshNativeSave>, context: Record<string, unknown>) => void;

function execute(stage: FreshCampaignStage, onNativeCapture?: NativeCaptureHook) {
  const creation = createCharacter(policy.name, policy.classId);
  if (!creation.ok) throw new Error(`Fresh production creation refused: ${creation.reason}`);
  const created = observeEarnedState();
  const waves: ReturnType<typeof summarizeWave>[] = [];
  const actions: { action: string; result: unknown }[] = [];
  const finish = (status: 'stage-complete' | 'action-refused' | 'preparation-nonwin' | 'campaign-nonwin',
    refusal: unknown = null, firstNonwin: EarnedWave | null = null) => {
    const terminal = observeEarnedState();
    // This executes against the actual stopped live realm, before the outer finally restores it.
    const nativeSaveCapture = stage === 'native17-v2-far-oasis' ? captureFreshNativeSave() : null;
    let nativePublicationFailure: string | null = null;
    if (nativeSaveCapture) {
      try { onNativeCapture?.(nativeSaveCapture, { status, refusal, waveCount: waves.length,
        lastWave: waves.at(-1) ?? null, terminalHash: hashObservation(terminal) }); }
      catch (error) { nativePublicationFailure = error instanceof Error ? error.message : String(error); }
    }
    return { status, refusal, firstNonwin, created, actions, waves, terminal, nativeSaveCapture,
      nativePublicationFailure };
  };
  const roster = loadMercHireRoster().find(act => act.mercs.some(merc => merc.id === policy.mercId));
  const definition = roster?.mercs.find(merc => merc.id === policy.mercId);
  if (!roster || !definition) throw new Error('Accepted Rogue definition disappeared');
  if (roster.unlockReqLevel > (created.player.player?.level ?? 0))
    return finish('action-refused', { action: 'hire-merc', reason: 'hire-act-locked' });
  const hired = useMercStore.getState().hireMerc(definition);
  actions.push({ action: 'hire-merc', result: hired });
  if (!hired.ok) return finish('action-refused', { action: 'hire-merc', result: hired });
  const allocated = usePlayerStore.getState().allocateSkillPoint(policy.fire);
  actions.push({ action: 'allocate-fire-bolt', result: allocated });
  if (allocated !== 'ok') return finish('action-refused', { action: 'allocate-fire-bolt', result: allocated });
  usePlayerStore.getState().setComboOrder([policy.fire]);
  actions.push({ action: 'set-fire-bolt-combo', result: observeEarnedState().player.player?.comboOrder });

  const count = stage === 'one-preparation-wave' ? 1 : policy.preparationCount;
  for (let index = 0; index < count; index++) {
    useMapStore.getState().setCurrentLocation(1, policy.area);
    // Use persisted production ordinals and production clock seeds: no overrides.
    const handle = startEarnedRun({ act: 1, subAreaId: policy.area, mode: 'manual' });
    if (handle.challengeOrdinal !== index) throw new Error('Fresh native challenge ordinal drift');
    const wave = playEarnedWave(handle, 0);
    const won = wonAlive(wave);
    let flee: FleeSummary = null;
    if (won) {
      if (wave.advanceResult !== 'next-wave') throw new Error('Preparation W1 did not install W2');
      const abandoned = abandonEarnedNextWave();
      const delta = earnedDelta(abandoned.beforeFlee, abandoned.afterFlee);
      if (delta.xp !== 0 || Object.values(delta.mercXp).some(value => value !== 0) ||
        Object.values(delta.currencies).some(value => value !== 0) || delta.addedItems.length ||
        delta.removedItemIds.length || delta.addedClears.length || abandoned.activeAfterFlee)
        throw new Error('Native preparation flee changed earned rewards');
      flee = { delta, beforeHash: hashObservation(abandoned.beforeFlee),
        afterHash: hashObservation(abandoned.afterFlee), activeAfterFlee: abandoned.activeAfterFlee };
    }
    waves.push(summarizeWave(wave, index, handle, flee));
    if (!won) return finish('preparation-nonwin', { action: 'preparation', index }, wave);
  }
  if (stage === 'accepted-preparation') {
    for (const expected of policy.literals) {
      const before = observeEarnedState();
      const actual = before.inventory.backpack.find(item => item.id === expected.id) ?? null;
      if (!isDeepStrictEqual(actual, expected)) return finish('action-refused', {
        action: 'accepted-earned-literal-guard', expected, actual,
        sameBaseEarnedItems: before.inventory.backpack.filter(item => item.baseId === expected.baseId),
        beforeHash: hashObservation(before), afterHash: hashObservation(observeEarnedState()),
        delta: earnedDelta(before, observeEarnedState())
      });
    }
  }
  if (stage === 'native17-act2' || stage === 'native17-v2-far-oasis') {
    try {
      runFreshCampaignRoute({
        wave: (wave, handle, label) => waves.push(summarizeWave(wave, waves.length, handle, null, label)),
        action: (action, result) => actions.push({ action, result })
      }, stage);
    } catch (error) {
      if (error instanceof FreshGearRefusal) return finish('action-refused', error.evidence);
      if (error instanceof FreshRouteStop) return finish(error.wave ? 'campaign-nonwin' : 'action-refused',
        error.evidence, error.wave);
      throw error;
    }
  }
  return finish('stage-complete');
}

/**
 * Bounded fresh production-service screening, without persistence or browser claims.
 * Caller captures source before importing this module. No save restore, state boosts,
 * ordinal/seed overrides, retries, or item-counter resets. Always restores its realm.
 */
export function runFreshCampaignScreen(stage: FreshCampaignStage, beforeImport: SourceState,
  onNativeCapture?: NativeCaptureHook) {
  if (stage === 'native17-v2-far-oasis' && !onNativeCapture)
    throw new Error('Fresh v2 requires durable native publication before realm cleanup');
  if (hasActiveSubAreaRun()) throw new Error('Fresh screen requires a quiescent production realm');
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const sourceBefore = collectSourceState(root);
  assertSourceStable(beforeImport, sourceBefore);
  const readReferences = () => [policy.source,
    'docs/plans/evidence/fixtures/fresh-current-act2-screen/fresh-gear-helper.mjs.txt',
    'docs/plans/evidence/fixtures/fresh-native17-campaign-screen/native17-frozen-plan.md',
    ...(stage === 'native17-v2-far-oasis' ? [freshCampaignV2.plan] : [])
  ].map(path => ({ path, sha256: createHash('sha256').update(readFileSync(new URL(
    `../../../${path}`, import.meta.url))).digest('hex') }));
  const referenceInputs = readReferences();
  const retainedPolicySha256 = createHash('sha256').update(readFileSync(new URL(
    `../../../${policy.source}`, import.meta.url))).digest('hex');
  const restore = captureEarnedRestorers();
  const originalNow = Date.now;
  const originalPity = getIdleEliteMisses();
  const started = performance.now();
  let result: ReturnType<typeof execute> | undefined;
  let failure: unknown;
  const cleanupErrors: unknown[] = [];
  try {
    Date.now = () => policy.clockEpochMs;
    resetEarnedStores();
    setIdleEliteMisses(0);
    useHydrationStore.getState().setStatus('ready');
    result = execute(stage, (capture, campaignStop) => onNativeCapture?.(capture, { stage,
      sourceBeforeImport: beforeImport, sourceBefore, referenceInputs, experiment: freshCampaignV2,
      campaignStop, sourceAfter: null,
      limitation: 'Captured before cleanup; post-run source and realm validation belongs to the primary report.' }));
  } catch (error) { failure = error; }
  finally {
    try { abortSubAreaRun(); } catch (error) { cleanupErrors.push(error); }
    for (const restoreStore of restore) {
      try { restoreStore(); } catch (error) { cleanupErrors.push(error); }
    }
    setIdleEliteMisses(originalPity);
    Date.now = originalNow;
  }
  if (cleanupErrors.length) throw new AggregateError([...(failure === undefined ? [] : [failure]),
    ...cleanupErrors], 'Fresh screen realm cleanup failed');
  if (failure instanceof Error) throw failure;
  if (failure !== undefined) throw new Error('Fresh screen failed', { cause: failure });
  if (!result) throw new Error('Fresh screen did not produce an observation');
  const sourceAfter = collectSourceState(root);
  assertSourceStable(sourceBefore, sourceAfter);
  if (!isDeepStrictEqual(referenceInputs, readReferences())) throw new Error('Fresh frozen reference input drift');
  if (retainedPolicySha256 !== createHash('sha256').update(readFileSync(new URL(
    `../../../${policy.source}`, import.meta.url))).digest('hex')) throw new Error('Retained policy drift');
  return { reportVersion: 1, observationEncoding: 'd2h5-observation-v1',
    kind: 'fresh-production-service-screen', stage, policy, retainedPolicySha256,
    experiment: stage === 'native17-v2-far-oasis' ? freshCampaignV2 : null,
    sourceBeforeImport: beforeImport, sourceBefore, sourceAfter, referenceInputs,
    native17Adaptation: stage === 'native17-act2' || stage === 'native17-v2-far-oasis' ?
      'Preserve all historical literal fields/IDs; validate own actual socketCapacity with native authoritative validators; preserve exact native payload through real transfers. Persisted ordinals never reset.' : null,
    limitations: ['No browser, persistence, Save/Continue, or player pacing acceptance.',
      stage === 'native17-v2-far-oasis' ? 'Separately declared NEW fresh prefix and three exact earned transfers; stops at first refusal/nonwin or after its single Far Oasis challenge. No claim/Book/Arcane, retry or continuation from prior evidence.'
        : stage === 'native17-act2' ? 'Conditional route stops at first refusal/nonwin or after Act III availability; no Act III launch.'
        : 'Only the declared preparation checkpoint is implemented; Den and later acts remain unattempted.'],
    wallSeconds: (performance.now() - started) / 1000, ...result };
}
