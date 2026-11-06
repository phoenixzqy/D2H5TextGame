import assert from 'node:assert/strict';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { xpTotal } from '@/engine/progression/xp';
import { equipCampaignGear, type CampaignRecord } from './actions';
import type { CampaignProfile } from './policy';
import { CampaignStop } from './route';
import { trainCampaignBuild, type CampaignTrainingRequest } from './training';
import { campaignPreparationRequest, type CampaignExecution } from './execution';

export interface CampaignPreparation {
  readonly nextAct: number;
  readonly request: CampaignTrainingRequest;
  readonly startOrdinal: number;
  nextOrdinal: number;
  readonly fromXp: number;
  terminalXp: number;
  result: ReturnType<typeof trainCampaignBuild> | null;
  failure: string | null;
  failureStatus: 'nonwin' | 'budget' | 'technical' | null;
}

/** Retain even interrupted training checkpoints; the caller owns all native wave/economy accounting. */
export function prepareCampaignStage(profile: CampaignProfile, nextAct: number, record: CampaignRecord,
  enter: (act: number, area: string, phase: 'farm') => void,
  retain: (checkpoint: CampaignPreparation) => void,
  mode: CampaignExecution['mode'] = 'level-training-v1'): void {
  const request = campaignPreparationRequest(nextAct, mode), map = useMapStore.getState();
  assert.equal(map.isActUnlocked(nextAct), true, 'Preparation requires the next act unlocked');
  assert.ok(map.clearedSubAreas.includes(request.area), 'Preparation requires a previously cleared area');
  const player = usePlayerStore.getState().player; assert.ok(player);
  const checkpoint: CampaignPreparation = { nextAct, request, startOrdinal: map.challengeOrdinals.normal,
    nextOrdinal: map.challengeOrdinals.normal, fromXp: xpTotal(player.level) + player.experience,
    terminalXp: xpTotal(player.level) + player.experience, result: null, failure: null, failureStatus: null };
  retain(checkpoint);
  try {
    checkpoint.result = trainCampaignBuild(profile, request, record, (area, phase) => {
      enter(request.act, area, phase);
    }, () => { equipCampaignGear(record, profile); });
    if (checkpoint.result.status !== 'target-earned')
      throw new CampaignStop(checkpoint.result.status === 'retry-limit' ? 'nonwin' : 'budget',
        `Campaign training ${checkpoint.result.status} before Act ${String(nextAct)}`);
    equipCampaignGear(record, profile);
  } catch (error) {
    checkpoint.failure = String(error);
    checkpoint.failureStatus = error instanceof CampaignStop ? error.status : 'technical';
    throw error;
  } finally {
    checkpoint.nextOrdinal = useMapStore.getState().challengeOrdinals.normal;
    const terminal = usePlayerStore.getState().player; assert.ok(terminal);
    checkpoint.terminalXp = xpTotal(terminal.level) + terminal.experience;
  }
}
