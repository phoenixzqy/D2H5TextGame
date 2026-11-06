import assert from 'node:assert/strict';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { listSubAreasForAct } from '@/stores/subAreaResolver';
import { challengeEnemyLevelRange } from '@/engine/combat/sub-area-run';
import { xpTotal } from '@/engine/progression/xp';
import { growCampaignBuild, equipCampaignGear, startCampaignQuest, claimCampaignQuest, returnCampaignToMap, type CampaignRecord } from './actions';
import type { CampaignProfile, CampaignRecoveryMode } from './policy';
import type { CampaignReward } from './economy';
import { runCampaignDen, type CampaignOpeningRecovery } from './opening-recovery';
import { trainCampaignBuild } from './training';
import type { CampaignPreparation } from './preparation';

export type CampaignAcquisition = Omit<CampaignPreparation, 'nextAct'>;

export interface CampaignSettledNonwin {
  readonly area: string;
  readonly phase: 'farm' | 'route';
  readonly ordinal: number;
  readonly index: number;
  readonly outcome: 'defeat' | 'draw';
}
export interface CampaignRecoveryCycle {
  readonly failure: CampaignSettledNonwin;
  readonly fromLevel: number;
  readonly targetLevel: number;
  readonly trainingArea: string | null;
  readonly trainingPolicy?: 'cleared-level-margin-v1';
  readonly trainingOrdinals: number[];
  retryOrdinal: number | null;
  resolution: 'retry-won' | 'retry-nonwin' | 'stopped' | null;
  endLevel: number | null;
  reason: string | null;
}
export interface CampaignRecovery {
  readonly mode: CampaignRecoveryMode;
  readonly cycles: CampaignRecoveryCycle[];
  readonly opening?: CampaignOpeningRecovery;
  acquisition?: CampaignAcquisition;
}

/** A measured nonwin/budget stop is a valid result, never viability success. */
export class CampaignStop extends Error {
  constructor(readonly status: 'nonwin' | 'budget', message: string,
    readonly settledNonwin?: CampaignSettledNonwin) { super(message); }
}

/** New declared route; historical fixed-item recipes and saves are never read. */
export function runActOne(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'farm' | 'route', fleeAfterFirst?: boolean) => void,
  reward: (delta: CampaignReward) => void,
  recovery: CampaignRecovery = { mode: 'none', cycles: [] }, afterDen?: () => void) {
  const level = () => usePlayerStore.getState().player?.level ?? 0;
  const boundary = (equip = true) => {
    if (level() > 14) throw new CampaignStop('budget', 'Act I L14 envelope exceeded');
    growCampaignBuild(profile, record);
    if (equip) equipCampaignGear(record, profile);
  };
  for (let count = 0; count < 40 && level() < 6; count++) {
    enter('areas/act1-blood-moor', 'farm', true);
    boundary(false);
  }
  if (level() < 6) throw new CampaignStop('budget', 'Blood Moor acquisition limit before L6');
  boundary();
  const den = 'quests/act1-den-of-evil';
  startCampaignQuest(den, record);
  runCampaignDen(profile, record, enter, recovery.opening, () => { boundary(); });
  useMapStore.getState().recordNpcTalk('npc/akara');
  record({ kind: 'npc-talk', id: 'npc/akara', progress: useMapStore.getState().questProgress[den] });
  claimCampaignQuest(den, record, reward);
  boundary();
  if (afterDen) { afterDen(); boundary(); }
  if (level() < 12 && profile.acquisitionTrainingPolicy === 'den-bounded-v1' &&
    recovery.mode === 'act1-training-v1') {
    assert.equal(recovery.acquisition, undefined, 'Den acquisition already retained');
    const hero = usePlayerStore.getState().player; assert.ok(hero);
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    const checkpoint: CampaignAcquisition = { request: { act: 1, area: 'areas/act1-den-of-evil',
      targetLevel: 12, maxAdmissions: 99, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 },
    startOrdinal: ordinal, nextOrdinal: ordinal, fromXp: xpTotal(hero.level) + hero.experience,
    terminalXp: xpTotal(hero.level) + hero.experience, result: null, failure: null, failureStatus: null };
    recovery.acquisition = checkpoint;
    try {
      checkpoint.result = trainCampaignBuild(profile, checkpoint.request, record, enter, boundary);
      if (checkpoint.result.status !== 'target-earned')
        throw new CampaignStop(checkpoint.result.status === 'retry-limit' ? 'nonwin' : 'budget',
          `Den acquisition ${checkpoint.result.status}`);
    } catch (error) {
      checkpoint.failure = String(error);
      checkpoint.failureStatus = error instanceof CampaignStop ? error.status : 'technical';
      throw error;
    } finally {
      checkpoint.nextOrdinal = useMapStore.getState().challengeOrdinals.normal;
      const terminal = usePlayerStore.getState().player; assert.ok(terminal);
      checkpoint.terminalXp = xpTotal(terminal.level) + terminal.experience;
    }
  } else {
    for (let count = 1; count < 100 && level() < 12; count++) {
      enter('areas/act1-den-of-evil', 'farm');
      boundary();
    }
  }
  if (level() < 12) throw new CampaignStop('budget', 'Den acquisition limit before L12');
  runActOneMainQuest(profile, record, enter, reward, recovery);
}

/** Resume only remaining Act I main-route areas; a pinned settled failure earns training before its retry. */
export function runActOneMainQuest(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'farm' | 'route') => void,
  reward: (delta: CampaignReward) => void,
  recovery: CampaignRecovery = { mode: 'none', cycles: [] },
  continuation?: { readonly failure: CampaignSettledNonwin }) {
  const level = () => usePlayerStore.getState().player?.level ?? 0;
  const boundary = () => {
    if (level() > 14) throw new CampaignStop('budget', 'Act I L14 envelope exceeded');
    growCampaignBuild(profile, record); equipCampaignGear(record, profile);
  };
  const areas = ['blood-moor', 'cold-plains', 'burial-grounds', 'dark-wood', 'catacombs'];
  if (continuation) {
    const map = useMapStore.getState(), failure = continuation.failure;
    assert.equal(recovery.mode, 'act1-training-v1', 'Continuation requires bounded route recovery');
    assert.ok(level() >= 12 && level() < 14, 'Continuation requires the earned Act I recovery level');
    assert.equal(map.questProgress['quests/act1-den-of-evil']?.rewardClaimed, true);
    assert.equal(map.questProgress['quests/act1-sisters-to-the-slaughter']?.status, 'inProgress');
    assert.notEqual(map.questProgress['quests/act1-sisters-to-the-slaughter'].rewardClaimed, true);
    assert.equal(failure.phase, 'route');
    assert.ok(['defeat', 'draw'].includes(failure.outcome));
    assert.ok(Number.isSafeInteger(failure.index) && failure.index >= 0);
    assert.ok(Number.isSafeInteger(failure.ordinal) && failure.ordinal >= 0);
    assert.equal(map.challengeOrdinals.normal, failure.ordinal + 1, 'Continuation failure ordinal mismatch');
    assert.equal(map.currentAct, 1);
    assert.equal(map.currentSubAreaId, failure.area.replace('areas/act1-', 'a1-'));
    assert.equal(areas.find(slug => !map.clearedSubAreas.includes(`areas/act1-${slug}`)),
      failure.area.replace('areas/act1-', ''), 'Continuation failure must be the first remaining route area');
  }
  let resumedFailure = continuation?.failure;
  const sisters = 'quests/act1-sisters-to-the-slaughter';
  if (!continuation) startCampaignQuest(sisters, record);
  let lastClearedArea = 'areas/act1-den-of-evil';
  for (const area of areas) {
    const target = `areas/act1-${area}`;
    if (continuation && useMapStore.getState().clearedSubAreas.includes(target)) { lastClearedArea = target; continue; }
    let pending: CampaignRecoveryCycle | undefined;
    const resolve = (cycle: CampaignRecoveryCycle, resolution: NonNullable<CampaignRecoveryCycle['resolution']>,
      reason: string | null = null) => {
      assert.equal(cycle.resolution, null, 'Recovery resolved twice');
      cycle.resolution = resolution; cycle.endLevel = level(); cycle.reason = reason;
      record({ kind: 'recovery-resolved', cycle });
    };
    for (;;) {
      let failed: CampaignStop | undefined;
      if (resumedFailure) {
        assert.equal(resumedFailure.area, target);
        failed = new CampaignStop('nonwin', 'Retained settled route failure', resumedFailure);
        resumedFailure = undefined;
      } else {
        try { enter(target, 'route'); }
        catch (error) {
          const settled = error instanceof CampaignStop && error.status === 'nonwin' &&
            error.settledNonwin?.area === target && error.settledNonwin.phase === 'route';
          if (pending) {
            if (useMapStore.getState().challengeOrdinals.normal === pending.retryOrdinal) pending.retryOrdinal = null;
            resolve(pending, settled ? 'retry-nonwin' : 'stopped', String(error));
          }
          pending = undefined;
          if (!settled || recovery.mode !== 'act1-training-v1' || recovery.cycles.length >= 2 || level() >= 14)
            throw error;
          failed = error;
        }
      }
      if (!failed) {
        if (pending) resolve(pending, 'retry-won');
        boundary(); lastClearedArea = target; break;
      }
      assert.ok(failed.settledNonwin);
      if (recovery.mode !== 'act1-training-v1' || recovery.cycles.length >= 2 || level() >= 14) throw failed;
      const lowerLevelTraining = profile.recoveryTrainingPolicy === 'cleared-level-margin-v1';
      const cleared = useMapStore.getState().clearedSubAreas;
      const trainingArea = lowerLevelTraining ? listSubAreasForAct(1)
        .filter(area => cleared.includes(area.id))
        .map(area => ({ id: area.id, maximum: challengeEnemyLevelRange(area).max }))
        .filter(area => area.maximum <= level() - 2)
        .sort((a, b) => b.maximum - a.maximum || a.id.localeCompare(b.id))[0]?.id ?? null : lastClearedArea;
      const cycle: CampaignRecoveryCycle = { failure: failed.settledNonwin, fromLevel: level(),
        targetLevel: level() + 1, trainingArea, trainingOrdinals: [],
        ...(lowerLevelTraining ? { trainingPolicy: profile.recoveryTrainingPolicy } : {}),
        retryOrdinal: null, resolution: null, endLevel: null, reason: null };
      recovery.cycles.push(cycle);
      try {
        record({ kind: 'recovery-start', cycle });
        if (cycle.trainingArea === null) throw new CampaignStop('budget', 'No cleared lower-level recovery area');
        returnCampaignToMap();
        while (level() < cycle.targetLevel) {
          const trainingTotal = recovery.cycles.reduce((sum, row) => sum + row.trainingOrdinals.length, 0);
          if (cycle.trainingOrdinals.length >= (lowerLevelTraining ? 40 : 12) || trainingTotal >= (lowerLevelTraining ? 80 : 20))
            throw new CampaignStop('budget', 'Recovery training admission limit');
          const ordinal = useMapStore.getState().challengeOrdinals.normal;
          try { enter(cycle.trainingArea, 'farm'); }
          finally {
            if (useMapStore.getState().challengeOrdinals.normal > ordinal) cycle.trainingOrdinals.push(ordinal);
          }
          boundary();
          record({ kind: 'recovery-training', failureOrdinal: cycle.failure.ordinal,
            area: cycle.trainingArea, ordinal, level: level() });
        }
        cycle.retryOrdinal = useMapStore.getState().challengeOrdinals.normal;
        record({ kind: 'recovery-attempt-retry', cycle });
      } catch (error) {
        cycle.retryOrdinal = null;
        resolve(cycle, 'stopped', String(error)); throw error;
      }
      pending = cycle;
    }
  }
  claimCampaignQuest(sisters, record, reward);
  assert.equal(useMapStore.getState().isActUnlocked(2), true);
}
