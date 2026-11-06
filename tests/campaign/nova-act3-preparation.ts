import assert from 'node:assert/strict';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { growCampaignBuild, type CampaignRecord } from './actions';
import { resetCampaignPoints } from './caster-preparation';
import { CampaignStop } from './route';
import type { CampaignProfile, CampaignWave } from './policy';
import type { CampaignPreparation } from './preparation';
import { trainCampaignBuild } from './training';
import { auditCampaignTraining } from './training-audit';

const request = { act: 3, area: 'areas/act3-great-marsh', targetLevel: 30,
  maxAdmissions: 128, maxConsecutiveNonwins: 3, maxTotalNonwins: 3 } as const;
const priority = ['sorceress.static_field', 'sorceress.blizzard', 'sorceress.ice_blast'] as const;

export interface NovaActThreePreparation extends CampaignPreparation {
  profile: CampaignProfile;
  completed: boolean;
}

/** Retain the earned training/reset policy before any fallible preparation action. */
export function prepareNovaDurance(initial: CampaignProfile, record: CampaignRecord,
  enter: (act: number, area: string, phase: 'farm') => void,
  retain: (state: NovaActThreePreparation) => void, afterAttempt?: () => void): CampaignProfile {
  const map = useMapStore.getState(), hero = usePlayerStore.getState().player; assert.ok(hero);
  assert.equal(initial.classId, 'sorceress'); assert.ok(hero.level >= 26 && map.isActUnlocked(3));
  assert.ok(map.clearedSubAreas.includes(request.area), 'Nova preparation requires a cleared Great Marsh');
  const totalXp = () => { const player = usePlayerStore.getState().player; assert.ok(player); return xpTotal(player.level) + player.experience; };
  const profile: CampaignProfile = { ...initial,
    targets: [{ id: 'sorceress.cold_mastery', rank: 6, level: 30 },
      ...initial.targets.filter(target => target.id !== 'sorceress.cold_mastery')] };
  const state: NovaActThreePreparation = { nextAct: 3, request, profile, completed: false,
    startOrdinal: map.challengeOrdinals.normal, nextOrdinal: map.challengeOrdinals.normal,
    fromXp: totalXp(), terminalXp: totalXp(), result: null, failure: null, failureStatus: null };
  retain(state);
  try {
    state.result = trainCampaignBuild(profile, request, record, (area, phase) => { enter(3, area, phase); }, afterAttempt);
    if (state.result.status !== 'target-earned') throw new CampaignStop(state.result.status === 'retry-limit' ? 'nonwin' : 'budget',
      `Nova Act III training ${state.result.status}`);
    const before = usePlayerStore.getState().player; assert.ok(before);
    const points = before.skillPoints + Object.values(before.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0);
    resetCampaignPoints('skill', record);
    state.profile = { ...profile, priority };
    growCampaignBuild(state.profile, record);
    const after = usePlayerStore.getState().player; assert.ok(after);
    assert.equal(after.skillPoints + Object.values(after.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0), points);
    const levels = after.skillLevels; assert.ok(levels);
    assert.equal(levels['sorceress.cold_mastery'], 6); assert.equal(levels['sorceress.blizzard'], 20);
    assert.deepEqual(after.coreStats, before.coreStats); assert.deepEqual(after.comboOrder, priority);
    state.completed = true; record({ kind: 'nova-act3-earned-preparation', profile: state.profile, points });
    return state.profile;
  } catch (error) {
    state.failure = String(error); state.failureStatus = error instanceof CampaignStop ? error.status : 'technical'; throw error;
  } finally { state.nextOrdinal = useMapStore.getState().challengeOrdinals.normal; state.terminalXp = totalXp(); }
}

/** Require the declared interval before independently reconciling native income and losses. */
export function auditNovaActThreePreparation(state: CampaignPreparation, waves: readonly CampaignWave[]) {
  assert.equal(state.nextAct, 3); assert.deepEqual(state.request, request);
  return auditCampaignTraining(state, waves);
}
