import assert from 'node:assert/strict';
import { LEVEL_CAP } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { growCampaignBuild, returnCampaignToMap, type CampaignRecord } from './actions';
import type { CampaignProfile } from './policy';
import { CampaignStop, type CampaignSettledNonwin } from './route';

export interface CampaignTrainingRequest {
  readonly act: number;
  readonly area: string;
  readonly targetLevel: number;
  readonly maxAdmissions: number;
  readonly maxConsecutiveNonwins: number;
  readonly maxTotalNonwins: number;
}

/** Cumulative counters authenticated by the caller against settled historical waves. */
export interface CampaignTrainingProgress {
  readonly fromLevel: number;
  readonly admissions: number;
  readonly wins: number;
  readonly nonwins: number;
  readonly consecutiveNonwins: number;
  readonly lastAttempt: 'victory' | 'nonwin' | null;
}

/** Native callers retain wave income, journal/time budgets and capacity decisions. */
export function trainCampaignBuild(profile: CampaignProfile, request: CampaignTrainingRequest,
  record: CampaignRecord, enter: (area: string, phase: 'farm') => void, afterAttempt?: () => void,
  previous?: CampaignTrainingProgress) {
  for (const value of [request.act, request.targetLevel, request.maxAdmissions,
    request.maxConsecutiveNonwins, request.maxTotalNonwins])
    assert.ok(Number.isSafeInteger(value) && value > 0, 'Invalid campaign training bound');
  assert.ok(request.act <= 5 && request.targetLevel <= LEVEL_CAP, 'Invalid campaign training target');
  assert.ok(request.area.startsWith(`areas/act${String(request.act)}-`), 'Training area/act mismatch');
  const level = () => {
    const hero = usePlayerStore.getState().player; assert.ok(hero); return hero.level;
  };
  const settled = () => {
    assert.ok(!hasActiveSubAreaRun() && !useCombatStore.getState().inCombat,
      'Campaign training requires a settled admission');
  };
  settled();
  const progress = previous ?? { fromLevel: level(), admissions: 0, wins: 0,
    nonwins: 0, consecutiveNonwins: 0, lastAttempt: null };
  for (const value of [progress.admissions, progress.wins, progress.nonwins, progress.consecutiveNonwins])
    assert.ok(Number.isSafeInteger(value) && value >= 0, 'Invalid previous training counter');
  assert.ok(Number.isSafeInteger(progress.fromLevel) && progress.fromLevel >= 1 && progress.fromLevel <= level(),
    'Invalid previous training level');
  assert.ok(progress.admissions === progress.wins + progress.nonwins && progress.admissions <= request.maxAdmissions &&
    progress.nonwins <= request.maxTotalNonwins && progress.consecutiveNonwins <= progress.nonwins &&
    progress.consecutiveNonwins <= request.maxConsecutiveNonwins, 'Invalid previous training bounds');
  assert.ok(progress.admissions === 0 ? progress.lastAttempt === null && progress.consecutiveNonwins === 0 :
    progress.lastAttempt === 'victory' ? progress.consecutiveNonwins === 0 :
      progress.lastAttempt === 'nonwin' && progress.consecutiveNonwins > 0, 'Invalid previous training outcome');
  const fromLevel = progress.fromLevel;
  let { admissions, wins, nonwins, consecutiveNonwins, lastAttempt } = progress;
  record({ kind: 'campaign-training-start', request, fromLevel, ...(previous ? { previous } : {}) });
  growCampaignBuild(profile, record);
  while (level() < request.targetLevel && admissions < request.maxAdmissions &&
    consecutiveNonwins < request.maxConsecutiveNonwins && nonwins < request.maxTotalNonwins) {
    settled();
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    const beforeLevel = level();
    let failure: CampaignSettledNonwin | undefined;
    try { enter(request.area, 'farm'); }
    catch (error) {
      if (!(error instanceof CampaignStop) || error.status !== 'nonwin' ||
        error.settledNonwin?.area !== request.area || error.settledNonwin.phase !== 'farm' ||
        error.settledNonwin.ordinal !== ordinal) throw error;
      assert.ok(!hasActiveSubAreaRun(), 'Nonwin must have settled its native run');
      failure = error.settledNonwin;
      returnCampaignToMap();
    }
    settled();
    assert.equal(useMapStore.getState().challengeOrdinals.normal, ordinal + 1,
      'Training must retain exactly one native admission');
    admissions++;
    if (failure) { nonwins++; consecutiveNonwins++; lastAttempt = 'nonwin'; }
    else { wins++; consecutiveNonwins = 0; lastAttempt = 'victory'; }
    // The caller has retained actual wave deltas before this fallible diagnostic.
    record({ kind: 'campaign-training-attempt', area: request.area, ordinal,
      beforeLevel, afterLevel: level(), outcome: lastAttempt, failure });
    growCampaignBuild(profile, record);
    afterAttempt?.(); settled();
  }
  const status = level() >= request.targetLevel ? 'target-earned'
    : nonwins >= request.maxTotalNonwins || consecutiveNonwins >= request.maxConsecutiveNonwins
      ? 'retry-limit' : 'admission-limit';
  const result = { status, request, fromLevel, terminalLevel: level(), admissions,
    wins, nonwins, consecutiveNonwins, lastAttempt };
  record({ kind: 'campaign-training-terminal', ...result });
  return result;
}
