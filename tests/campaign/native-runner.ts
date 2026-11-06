import assert from 'node:assert/strict';
import { createCharacter } from '@/features/character/createCharacter';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { useMercStore } from '@/stores/mercStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { snapshotStores, exportCurrentSave } from '@/stores/persistence';
import { decodeSave } from '@/engine/save/validate';
import { captureEarnedRestorers, resetEarnedStores, earnedDelta } from '../sim/production/earned-state';
import { abandonEarnedNextWave } from '../sim/production/earned-playback';
import { observeP15Wave } from '../sim/contracts/p15-wave-observation';
import { campaignRequest, campaignRecoveryMode, campaignTotals, type CampaignProfile, type CampaignWave, type CampaignUnobservedWave, type TrainingCurseRecovery } from './policy';
import { growCampaignBuild, prepareCampaignCombo, equipCampaignGear, recordCampaignBossCheckpoint, type CampaignRecord } from './actions';
import { useMapStore } from '@/stores/mapStore';
import { runActOne, CampaignStop, type CampaignRecovery } from './route';
import { campaignEconomy, auditCampaignEconomy, type CampaignEconomy, type CampaignReward } from './economy';
import { assertCampaignSettlement } from './settlement';
import { startCampaignAdmission } from './admission';
import { assertFreshActOnePrefix, assertActTwoComplete, runActTwo } from './act2-route';
import { createCampaignQuestActions } from './quest-actions';
import { auditCampaignQuests } from './quest-audit';
import { assertFreshActTwoPrefix, assertActThreeComplete, runActThree } from './act3-route';
import { assertFreshActThreePrefix, assertActFourComplete, runActFour } from './act4-route';
import { assertFreshActFourPrefix, assertActFiveComplete, runActFive, resolveActFiveRoute } from './act5-route';
import { playCampaignQuestWave, type CampaignQuestSettlement } from './quest-settlement';
import { recoverCampaignCapacity } from './capacity';
import { recoverIntendedOwnedCapacity } from './owned-capacity';
import { campaignExecution, assertCampaignExecutionProfile, novaActFiveProfile } from './execution';
import { prepareCampaignStage, type CampaignPreparation } from './preparation';
import { auditCampaignPreparations } from './preparation-audit';
import { createActThreeAreaPreparation, enterPreparedActThreeArea, auditActThreeAreaPreparation,
  type ActThreeAreaPreparation } from './act3-area-preparation';
import { createActFourAreaPreparation, enterPreparedActFourArea, auditActFourAreaPreparation,
  type ActFourAreaPreparation } from './act4-area-preparation';
import { createActFiveAreaPreparation, enterPreparedActFiveArea, auditActFiveAreaPreparation,
  type ActFiveAreaPreparation } from './act5-area-preparation';
import { auditCampaignOpening } from './opening-audit';
import { auditCampaignAcquisition } from './acquisition-audit';
import { campaignInventoryPolicy } from './inventory-policy';
import { createNovaActTwoPreparation, runPreparedNovaActTwo, auditNovaActTwoPreparation,
  type NovaActTwoPreparation } from './nova-act2-preparation';
import { createActTwoAreaPreparation, runAreaPreparedActTwo, auditActTwoAreaPreparation,
  type ActTwoAreaPreparation } from './act2-area-preparation';
import { prepareNovaActTwoOpening, equipCampaignCasterGear, prepareNovaActFiveResources, prepareNovaBaalDexterity, recoverCampaignCasterCapacity } from './caster-preparation';
import { equipCampaignMercGear } from './merc-gear';
import { prepareIntendedCompanion } from './intended-companion';
import { prepareNovaDurance, auditNovaActThreePreparation, type NovaActThreePreparation } from './nova-act3-preparation';
import { prepareNovaChaos } from './nova-act4-preparation';
import { campaignCreationTimestamp, installCampaignOnlineClock } from './online-clock';
import { prepareJavelinArcaneSockets, prepareJavelinPhysicalShieldSockets,
  prepareIntendedActTwoSockets, prepareIntendedMercWeaponSockets, prepareIntendedHeroWeaponSockets } from './socket-preparation';
import { prepareJavelinCompanion } from './javelin-progression';
import { prepareJavelinTraining, auditJavelinTraining, prepareJavelinAcquisition,
  auditJavelinAcquisition, type JavelinTrainingCheckpoint } from './javelin-training';
import { createCampaignFirstEntries, type CampaignEntryAdmission } from './first-entry';

/** Dedicated fresh-process measurement; it never loads a historical save or supplies a seed. */
export function runCampaign(phaseName: string, profileId: string, record: CampaignRecord,
  recoveryName?: string, act5RouteName?: string, executionName?: string, inventoryName?: string,
  timestamp?: number) {
  const creationTimestamp = campaignCreationTimestamp(timestamp);
  const { phase, profile: requestedProfile } = campaignRequest(phaseName, profileId);
  const execution = campaignExecution(executionName);
  assertCampaignExecutionProfile(execution, phase, profileId);
  const inventoryPolicy = campaignInventoryPolicy(inventoryName);
  let profile: CampaignProfile = execution.mode !== 'screen'
    ? { ...requestedProfile, mercEquipmentPolicy: 'monotone-fielded-v1' } : requestedProfile;
  if (execution.mode === 'javelin-earned-v1') profile = { ...profile, progressionPolicy: 'javelin-earned-v1' };
  const act5Route = resolveActFiveRoute(act5RouteName);
  assert.ok(phase === 'act5' || act5Route === 'minimum', 'Full Act V route requires the Act V campaign phase');
  assert.ok(execution.mode !== 'nova-act2-prepared-v1' || phase !== 'act5' || act5Route === 'main-quests',
    'Nova Act V preparation requires the main-quest route');
  assert.ok(execution.mode !== 'javelin-earned-v1' || phase !== 'act5' || act5Route === 'main-quests',
    'Javelin Act V preparation requires the main-quest route');
  const routeFirstCampaign = execution.mode === 'route-first-campaign-v1';
  assert.ok(!routeFirstCampaign || phase !== 'act5' || act5Route === 'main-quests',
    'Route-first campaign requires the main-quest Act V route');
  const recovery: CampaignRecovery = { mode: campaignRecoveryMode(recoveryName), cycles: [],
    ...(execution.mode !== 'screen' ? { opening: { mode: 'den-training-v1' as const, cycles: [] } } : {}) };
  assert.ok(!hasActiveSubAreaRun() && !useCombatStore.getState().inCombat);
  const restores = captureEarnedRestorers(), now = Date.now, pity = getIdleEliteMisses();
  let clock: ReturnType<typeof installCampaignOnlineClock> | undefined;
  const started = performance.now();
  const waves: CampaignWave[] = [];
  const unobservedWaves: CampaignUnobservedWave[] = [];
  const questSettlements: CampaignQuestSettlement[] = [];
  const preparations: CampaignPreparation[] = [];
  const javelinTraining: JavelinTrainingCheckpoint[] = [];
  let javelinTrainingAudit: ReturnType<typeof auditJavelinTraining> | null = null;
  const javelinAcquisition: JavelinTrainingCheckpoint[] = [];
  let javelinAcquisitionAudit: ReturnType<typeof auditJavelinAcquisition> | null = null;
  const nativeWaveExceptions: { area: string; ordinal: number; index: number;
    delta: ReturnType<typeof earnedDelta>; error: string }[] = [];
  let act3Start: number | undefined;
  let act4Start: number | undefined;
  let act5Start: number | undefined;
  let gameplayStatus = 'incomplete', technicalStatus = 'completed', failure: string | null = null;
  let successor: ReturnType<typeof snapshotStores> = null;
  let exported: string | null = null;
  let initialEconomy: CampaignEconomy | null = null;
  let economyAudit: ReturnType<typeof auditCampaignEconomy> | null = null;
  let createdSave: NonNullable<ReturnType<typeof snapshotStores>> | null = null;
  let questAudit: ReturnType<typeof auditCampaignQuests> | null = null;
  let preparationAudit: ReturnType<typeof auditCampaignPreparations> | null = null;
  let openingAudit: ReturnType<typeof auditCampaignOpening> | null = null;
  let acquisitionAudit: ReturnType<typeof auditCampaignAcquisition> | null = null;
  let novaActTwo: NovaActTwoPreparation | null = null;
  let novaActTwoAudit: ReturnType<typeof auditNovaActTwoPreparation> | null = null;
  let actTwoAreaPreparation: ActTwoAreaPreparation | null = null;
  let actTwoAreaPreparationAudit: ReturnType<typeof auditActTwoAreaPreparation> | null = null;
  let actThreeAreaPreparation: ActThreeAreaPreparation | null = null;
  let actThreeAreaPreparationAudit: ReturnType<typeof auditActThreeAreaPreparation> | null = null;
  let actFourAreaPreparation: ActFourAreaPreparation | null = null;
  let actFourAreaPreparationAudit: ReturnType<typeof auditActFourAreaPreparation> | null = null;
  let actFiveAreaPreparation: ActFiveAreaPreparation | null = null;
  let actFiveAreaPreparationAudit: ReturnType<typeof auditActFiveAreaPreparation> | null = null;
  const novaActThreeState: { current: NovaActThreePreparation | null } = { current: null };
  let novaActThreeAudit: ReturnType<typeof auditNovaActThreePreparation> | null = null;
  const rewards: CampaignReward[] = [];
  const firstEntries = createCampaignFirstEntries(record);
  const admissionHistory: CampaignEntryAdmission[] = [];
  const questRewards: CampaignReward[] = [];
  const successfulClaims: string[] = [];
  const retainRecord: CampaignRecord = entry => {
    if (entry.kind === 'quest-claim' && entry.result === 'ok' && typeof entry.id === 'string')
      successfulClaims.push(entry.id);
    record(entry);
  };
  const questActions = createCampaignQuestActions(record, delta => { rewards.push(delta); questRewards.push(delta); });
  const cleanupErrors: unknown[] = [];
  let admissions = 0, stagedWaves = 0, fledWaves = 0;
  const stage = () => {
    const combat = useCombatStore.getState(); stagedWaves++;
    record({ kind: 'staged-wave', wave: combat.currentWave, presentation: combat.currentWavePresentation,
      playerTeam: combat.playerTeam, enemyTeam: combat.enemyTeam, events: combat.recordedEvents });
  };
  const recoverCapacity = () => {
    if (inventoryPolicy === 'retain-earned-overflow-v1') return;
    const capacity = profile.capacityPolicy === 'owned-shortlist-v2'
      ? recoverIntendedOwnedCapacity(profile, record, delta => { rewards.push(delta); })
      : execution.mode === 'nova-act2-prepared-v1' && act5Start !== undefined && novaActTwo?.baseline
      ? recoverCampaignCasterCapacity(novaActTwo.baseline, record, delta => { rewards.push(delta); })
      : recoverCampaignCapacity(record, delta => { rewards.push(delta); });
    // Native combat permits overflow; equipment actions report their own capacity refusal.
    if (capacity !== 'ready') record({ kind: 'campaign-capacity-boundary', capacity });
  };
  const equipPreparedNovaGear = (bossWeapons = false) => {
    if (execution.mode === 'nova-act2-prepared-v1' &&
      useMercStore.getState().getFieldedMerc()?.id === 'mercs/act2-prayer') {
      if (novaActTwo?.baseline) equipCampaignCasterGear(novaActTwo.baseline, record,
        novaActTwo.offensePrepared ? 'critical' : 'survival',
        act5Start === undefined ? 'elemental-v1' : 'mixed-v4');
      if (bossWeapons && novaActTwo?.baseline)
        equipCampaignCasterGear(novaActTwo.baseline, record, 'critical-all');
      equipCampaignMercGear(record, true);
    }
  };
  const enter = (act: number, area: string, wavePhase: 'farm' | 'route', fleeAfterFirst = false,
    trainingRecovery?: TrainingCurseRecovery) => {
    if (execution.mode === 'javelin-earned-v1') {
      if (wavePhase === 'route') prepareJavelinTraining(profile, act, area, record, enter,
        checkpoint => { javelinTraining.push(checkpoint); }, () => campaignTotals(waves, [], unobservedWaves).combatMs, true);
      useMapStore.getState().setCurrentLocation(act, area.replace(/^areas\/act([1-5])-/, 'a$1-'));
      if (wavePhase === 'route' && act === 2 && area === 'areas/act2-arcane-sanctuary')
        prepareJavelinCompanion(record);
      growCampaignBuild(profile, record); equipCampaignGear(record, profile);
      if (wavePhase === 'route' && act === 2 && area === 'areas/act2-arcane-sanctuary') {
        recoverCapacity();
        prepareJavelinArcaneSockets(record, delta => { rewards.push(delta); });
      }
      if (wavePhase === 'route' && act === 3 && area === 'areas/act3-kurast-bazaar') {
        recoverCapacity();
        prepareJavelinPhysicalShieldSockets(record, delta => { rewards.push(delta); });
      }
    }
    if (admissions >= execution.maxAdmissions || campaignTotals(waves).combatMs >= execution.maxCombatMs ||
      performance.now() - started >= execution.maxWallMs)
      throw new CampaignStop('budget', 'Campaign admission/time budget reached');
    recoverCapacity(); equipPreparedNovaGear(act === 5 &&
      ['areas/act5-ancients-way', 'areas/act5-throne-of-destruction'].includes(area));
    if (execution.mode === 'nova-act2-prepared-v1' && act === 5)
      growCampaignBuild(novaActFiveProfile(profile, area === 'areas/act5-ancients-way' ? 'training' : 'route'), record);
    prepareIntendedHeroWeaponSockets(profile, record, delta => { rewards.push(delta); });
    prepareIntendedMercWeaponSockets(profile, record, delta => { rewards.push(delta); });
    prepareIntendedActTwoSockets(profile, record, delta => { rewards.push(delta); });
    if (profile.priorityByArea !== undefined || profile.cursePreferenceByArea !== undefined ||
      profile.drawRecoveryPolicy !== undefined || trainingRecovery !== undefined)
      prepareCampaignCombo(profile, record, area, { phase: wavePhase, previousWave: waves.at(-1), trainingRecovery });
    const checkpoint = recordCampaignBossCheckpoint('before-admission', area, record);
    if (checkpoint) {
      assert.ok(createdSave);
      firstEntries.capture(checkpoint, { created: createdSave, profileId, profile,
        configuration: { execution, inventoryPolicy, recoveryMode: recovery.mode, act5Route, creationTimestamp },
        admissions: admissionHistory, waves, unobservedWaves, rewards }, wavePhase);
    }
    const startedAt = Date.now();
    const { handle, location } = startCampaignAdmission(act, area);
    assert.equal(handle.challengeOrdinal, admissions++);
    const admission: CampaignEntryAdmission = { ordinal: handle.challengeOrdinal, area, phase: wavePhase,
      totalWaves: handle.totalWaves };
    admissionHistory.push(admission);
    record({ kind: 'admission', handle, act, area, location, phase: wavePhase, startedAt }); stage();
    for (let index = 0; index < handle.totalWaves; index++) {
      const native = playCampaignQuestWave(handle, { act, area, ordinal: handle.challengeOrdinal,
        index, actionIndex: questActions.entries.length }, questSettlements, returned => {
        rewards.push(returned.actualDelta);
        unobservedWaves.push({ phase: wavePhase, area, ordinal: handle.challengeOrdinal, index,
          logicalMs: returned.terminalSimClockMs, xp: returned.actualDelta.xp,
          items: returned.actualDelta.addedItems.length });
      }, (delta, error) => {
        rewards.push(delta);
        unobservedWaves.push({ phase: wavePhase, area, ordinal: handle.challengeOrdinal, index,
          logicalMs: null, xp: delta.xp, items: delta.addedItems.length });
        nativeWaveExceptions.push({ area, ordinal: handle.challengeOrdinal, index, delta, error: String(error) });
      });
      assert.ok(clock); clock.advance(native.terminalSimClockMs);
      const observed = observeP15Wave(native), metrics = observed.metrics;
      assert.ok(metrics.outcome === 'victory' || metrics.outcome === 'defeat' || metrics.outcome === 'draw');
      waves.push({ phase: wavePhase, area, ordinal: handle.challengeOrdinal, index,
        outcome: metrics.outcome, advance: native.advanceResult, logicalMs: metrics.logicalMs,
        xp: native.actualDelta.xp, items: native.actualDelta.addedItems.length,
        heroLife: metrics.heroLife, heroMana: metrics.heroMana });
      unobservedWaves.pop();
      assertCampaignSettlement({ ...native, won: metrics.outcome === 'victory' });
      assert.deepEqual(native.actualDelta.addedItems, native.rawRewardDelta.items);
      assert.deepEqual(native.actualDelta.materials, native.rawRewardDelta.materials);
      assert.deepEqual(native.actualDelta.removedItemIds, []);
      assert.equal(native.actualDelta.currencies['rune-shard'] ?? 0, native.rawRewardDelta.runeShards);
      assert.equal(native.actualDelta.currencies.wishstone ?? 0, native.rawRewardDelta.wishstones);
      record({ kind: 'settled-wave', handle, wave: observed });
      if (metrics.outcome !== 'victory') record({ kind: 'nonwin-award-state',
        before: native.beforeAward, after: native.afterAward });
      if (metrics.outcome !== 'victory') throw new CampaignStop('nonwin', `${area} W${String(index + 1)}: ${metrics.outcome}`,
        { area, phase: wavePhase, ordinal: handle.challengeOrdinal, index, outcome: metrics.outcome });
      if (native.advanceResult === 'next-wave') stage();
      if (fleeAfterFirst && native.advanceResult === 'next-wave') {
        const fled = abandonEarnedNextWave(), delta = earnedDelta(fled.beforeFlee, fled.afterFlee);
        admission.abandonedAfterIndex = index;
        fledWaves++; record({ kind: 'flee-unplayed-wave', area, handle, delta });
        assert.deepEqual(delta, earnedDelta(fled.beforeFlee, fled.beforeFlee)); return;
      }
      if (native.advanceResult === 'victory') {
        useMetaStore.getState().setIdleTarget(undefined); setIdleEliteMisses(0);
        useCombatStore.getState().endCombat(); return;
      }
      if (performance.now() - started >= execution.maxWallMs || campaignTotals(waves).combatMs >= execution.maxCombatMs)
        throw new CampaignStop('budget', 'Campaign time budget reached between waves');
    }
    throw new Error('Campaign exhausted without native terminal');
  };
  const enterPreparedArea = (act: number, area: string, wavePhase: 'farm' | 'route',
    trainingRecovery?: TrainingCurseRecovery) => { enter(act, area, wavePhase, false, trainingRecovery); };
  const prepare = (nextAct: number) => {
    if (execution.mode !== 'screen' && execution.mode !== 'javelin-earned-v1') {
      if (execution.mode !== 'route-first-act2-v1' && !routeFirstCampaign)
        prepareCampaignStage(profile, nextAct, record, enter, checkpoint => { preparations.push(checkpoint); }, execution.mode);
      if (nextAct === 2 && profile.companionPolicy) {
        prepareIntendedCompanion(profile, record);
        equipCampaignGear(record, profile);
      }
    }
  };
  try {
    clock = installCampaignOnlineClock(creationTimestamp);
    resetEarnedStores(); setIdleEliteMisses(0);
    useHydrationStore.getState().setStatus('ready');
    assert.equal(createCharacter('Campaign screen', profile.classId).ok, true);
    const created = snapshotStores(); assert.ok(created); createdSave = created;
    initialEconomy = campaignEconomy(created);
    record({ kind: 'created', creationTimestamp, execution, inventoryPolicy, snapshot: created });
    const roster = loadMercHireRoster().find(row => row.act === 1);
    const merc = roster?.mercs.find(row => row.id === 'mercs/act1-rogue-inner-sight');
    assert.ok(merc);
    const hire = useMercStore.getState().hireMerc(merc);
    record({ kind: 'hire', result: hire });
    assert.equal(hire.ok, true);
    assert.equal(useMercStore.getState().fieldedMercId, hire.mercId);
    growCampaignBuild(profile, record);
    if (phase === 'intro') enter(1, 'areas/act1-blood-moor', 'route');
    else {
      runActOne(profile, retainRecord, (area, wavePhase, flee) => { enter(1, area, wavePhase, flee); },
        delta => { rewards.push(delta); questRewards.push(delta); }, recovery,
        execution.mode === 'javelin-earned-v1' ? () => { prepareJavelinAcquisition(profile, record, enter,
          checkpoint => { javelinAcquisition.push(checkpoint); },
          () => campaignTotals(waves, [], unobservedWaves).combatMs); } : undefined);
      if (phase === 'act2' || phase === 'act3' || phase === 'act4' || phase === 'act5') {
        assertFreshActOnePrefix(created, successfulClaims);
        record({ kind: 'fresh-act1-prefix', successfulClaims });
        if (execution.mode === 'nova-act2-prepared-v1') profile = prepareNovaActTwoOpening(profile, record);
        prepare(2);
        if (execution.mode === 'nova-act2-prepared-v1') {
          novaActTwo = createNovaActTwoPreparation();
          profile = runPreparedNovaActTwo(profile, record, enter, questActions, novaActTwo,
            delta => { rewards.push(delta); }, recoverCapacity);
        } else if (execution.mode === 'area-prepared-act2-v1' || execution.mode === 'area-prepared-retry-act2-v1' ||
          execution.mode === 'challenge-prepared-act2-v1' || execution.mode === 'route-first-act2-v1' ||
          execution.mode === 'route-first-campaign-v1') {
          actTwoAreaPreparation = createActTwoAreaPreparation(execution.mode === 'route-first-campaign-v1'
            ? 'route-first-act2-v1' : execution.mode);
          runAreaPreparedActTwo(profile, record, enter, questActions, actTwoAreaPreparation);
        } else runActTwo(profile, record, (area, wavePhase) => { enter(2, area, wavePhase); }, questActions);
        const act2Entries = questActions.entries.slice();
        assertActTwoComplete(act2Entries);
        if (phase === 'act3' || phase === 'act4' || phase === 'act5') {
          assertFreshActTwoPrefix(created, successfulClaims, act2Entries);
          act3Start = act2Entries.length;
          record({ kind: 'fresh-act2-prefix', act2Entries });
          prepare(3);
          if (routeFirstCampaign) actThreeAreaPreparation = createActThreeAreaPreparation({ entryPolicy: 'route-first-v1' });
          profile = runActThree(profile, record, (area, wavePhase) => {
            if (actThreeAreaPreparation) enterPreparedActThreeArea(profile, record, enterPreparedArea, actThreeAreaPreparation, area, waves);
            else enter(3, area, wavePhase);
          }, questActions,
            execution.mode === 'nova-act2-prepared-v1' ? current => {
              profile = prepareNovaDurance(current, record, enter,
                checkpoint => { novaActThreeState.current = checkpoint; }, equipPreparedNovaGear);
              return profile;
            } : undefined);
          const act3Entries = questActions.entries.slice(act3Start);
          assertActThreeComplete(act3Entries);
          if (phase === 'act4' || phase === 'act5') {
            assertFreshActThreePrefix(created, successfulClaims, act2Entries, act3Entries);
            act4Start = questActions.entries.length;
            record({ kind: 'fresh-act3-prefix', act3Entries });
            prepare(4);
            if (routeFirstCampaign) actFourAreaPreparation = createActFourAreaPreparation({ entryPolicy: 'route-first-v1' });
            profile = runActFour(profile, record, (area, wavePhase) => {
              if (actFourAreaPreparation) enterPreparedActFourArea(profile, record, enterPreparedArea, actFourAreaPreparation, area, waves);
              else enter(4, area, wavePhase);
            }, questActions,
              execution.mode === 'nova-act2-prepared-v1' ? current => {
                profile = prepareNovaChaos(current, record); return profile;
              } : undefined);
            const act4Entries = questActions.entries.slice(act4Start);
            assertActFourComplete(act4Entries);
            if (phase === 'act5') {
              assertFreshActFourPrefix(created, successfulClaims, act2Entries, act3Entries, act4Entries);
              act5Start = questActions.entries.length;
              record({ kind: 'fresh-act4-prefix', act4Entries });
              if (execution.mode !== 'nova-act2-prepared-v1') prepare(5);
              if (routeFirstCampaign) actFiveAreaPreparation = createActFiveAreaPreparation({ entryPolicy: 'route-first-v1' });
              profile = runActFive(profile, record, (area, wavePhase) => {
                if (actFiveAreaPreparation) enterPreparedActFiveArea(profile, record, enterPreparedArea, actFiveAreaPreparation, area, waves);
                else enter(5, area, wavePhase);
              }, questActions, act5Route,
                execution.mode === 'nova-act2-prepared-v1' ? () => {
                  profile = novaActFiveProfile(profile); prepare(5);
                  profile = prepareNovaActFiveResources(profile, record, current => { profile = current; });
                  profile = novaActFiveProfile(profile, 'route'); return profile;
                } : undefined, execution.mode === 'nova-act2-prepared-v1' ? current => {
                  profile = prepareNovaBaalDexterity(current, record, delta => { rewards.push(delta); },
                    retained => { profile = retained; });
                  return profile;
                } : undefined);
              assertActFiveComplete(questActions.entries.slice(act5Start), act5Route);
            }
          }
        }
      }
    }
    gameplayStatus = `${phase}-complete`;
  } catch (error) {
    if (error instanceof CampaignStop) { gameplayStatus = error.status; failure = error.message; }
    else { technicalStatus = 'failed'; failure = error instanceof Error ? error.stack ?? error.message : String(error); }
  } finally {
    try {
      successor = snapshotStores(); exported = exportCurrentSave();
      if (novaActThreeState.current && !novaActThreeState.current.completed) profile = novaActThreeState.current.profile;
      else if (novaActTwo?.profile && !novaActTwo.completed) profile = novaActTwo.profile;
      assert.ok(successor && exported);
      // Retain native state before validation can reject it and cleanup restores the outer realm.
      try { record({ kind: 'stopped-native-checkpoint', snapshot: successor, exported }); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint: ${String(error)}`; }
      assert.deepEqual(decodeSave(JSON.parse(exported) as unknown), successor);
      assert.ok(initialEconomy);
      assert.ok(createdSave);
      try { economyAudit = auditCampaignEconomy(initialEconomy, campaignEconomy(successor), rewards); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint economy: ${String(error)}`; }
      try { preparationAudit = auditCampaignPreparations(execution, preparations, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint preparation: ${String(error)}`; }
      try { openingAudit = auditCampaignOpening(recovery.opening, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint opening: ${String(error)}`; }
      try { acquisitionAudit = auditCampaignAcquisition(profile, recovery, waves,
        successfulClaims.includes('quests/act1-den-of-evil')); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint Den acquisition: ${String(error)}`; }
      try { javelinTrainingAudit = auditJavelinTraining(javelinTraining, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint Javelin: ${String(error)}`; }
      try { javelinAcquisitionAudit = auditJavelinAcquisition(javelinAcquisition, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint Javelin acquisition: ${String(error)}`; }
      try { if (novaActTwo) novaActTwoAudit = auditNovaActTwoPreparation(novaActTwo, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint Nova Act II: ${String(error)}`; }
      try { if (actTwoAreaPreparation) actTwoAreaPreparationAudit = auditActTwoAreaPreparation(actTwoAreaPreparation, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint area preparation Act II: ${String(error)}`; }
      try { if (actThreeAreaPreparation) actThreeAreaPreparationAudit = auditActThreeAreaPreparation(actThreeAreaPreparation, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint area preparation Act III: ${String(error)}`; }
      try { if (actFourAreaPreparation) actFourAreaPreparationAudit = auditActFourAreaPreparation(actFourAreaPreparation, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint area preparation Act IV: ${String(error)}`; }
      try { if (actFiveAreaPreparation) actFiveAreaPreparationAudit = auditActFiveAreaPreparation(actFiveAreaPreparation, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint area preparation Act V: ${String(error)}`; }
      try { if (novaActThreeState.current) novaActThreeAudit = auditNovaActThreePreparation(novaActThreeState.current, waves); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint Nova Act III: ${String(error)}`; }
      try { questAudit = auditCampaignQuests(createdSave, successor, questActions.entries, successfulClaims,
        { ...(act3Start === undefined ? {} : { act3Start }), ...(act4Start === undefined ? {} : { act4Start }),
          ...(act5Start === undefined ? {} : { act5Start, act5Route }),
          settlements: questSettlements }); }
      catch (error) { technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint quests: ${String(error)}`; }
    } catch (error) {
      technicalStatus = 'failed'; failure = `${failure ?? ''}\nCheckpoint: ${String(error)}`;
    } finally {
      try { abortSubAreaRun(); } catch (error) { cleanupErrors.push(error); }
      for (const restore of restores) { try { restore(); } catch (error) { cleanupErrors.push(error); } }
      try { setIdleEliteMisses(pity); } catch (error) { cleanupErrors.push(error); }
      try { clock?.dispose(); } catch (error) { cleanupErrors.push(error); }
      Date.now = now;
    }
  }
  if (cleanupErrors.length) throw new AggregateError(cleanupErrors, 'Campaign realm cleanup failed');
  const totals = campaignTotals(waves, questRewards.map(reward => ({ xp: reward.xp, items: reward.addedItems.length })),
    unobservedWaves);
  if (economyAudit) {
    assert.equal(totals.earnings.allEarned.xp, economyAudit.xp);
    assert.equal(totals.earnings.allEarned.items, economyAudit.addedItems);
  }
  return { version: 3, phase, profileId, profile, creationTimestamp, recovery, act5Route, execution, inventoryPolicy, preparations,
    javelinTraining, javelinTrainingAudit, javelinAcquisition, javelinAcquisitionAudit,
    technicalStatus, gameplayStatus, failure,
    totals, questRewards, questActions: questActions.entries, questSettlements, waves, unobservedWaves, nativeWaveExceptions,
    successor, exported, admissions, stagedWaves, fledWaves, admissionHistory, firstBossEntries: firstEntries.entries,
    terminalLevel: successor?.player.level ?? null, economyAudit, questAudit, preparationAudit, openingAudit, acquisitionAudit,
    novaActTwo, novaActTwoAudit, novaActThree: novaActThreeState.current, novaActThreeAudit,
    actTwoAreaPreparation, actTwoAreaPreparationAudit,
    actThreeAreaPreparation, actThreeAreaPreparationAudit, actFourAreaPreparation, actFourAreaPreparationAudit,
    actFiveAreaPreparation, actFiveAreaPreparationAudit,
    wallMs: performance.now() - started,
    limitation: 'Fresh native production-service screen; no browser durability, earned viability or player-hours acceptance.' };
}
