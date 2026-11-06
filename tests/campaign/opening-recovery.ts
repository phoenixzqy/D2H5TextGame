import assert from 'node:assert/strict';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { returnCampaignToMap, type CampaignRecord } from './actions';
import type { CampaignProfile } from './policy';
import { CampaignStop, type CampaignSettledNonwin } from './route';
import { trainCampaignBuild, type CampaignTrainingRequest } from './training';

export interface CampaignOpeningCycle {
  readonly failure: CampaignSettledNonwin;
  readonly fromLevel: number;
  readonly targetLevel: number;
  readonly trainingRequest: CampaignTrainingRequest;
  readonly trainingStartOrdinal: number;
  trainingNextOrdinal: number;
  readonly fromXp: number;
  trainingTerminalXp: number;
  trainingResult: ReturnType<typeof trainCampaignBuild> | null;
  retryOrdinal: number | null;
  resolution: 'retry-won' | 'retry-nonwin' | 'stopped' | null;
  reason: string | null;
  stopStatus: 'nonwin' | 'budget' | 'technical' | null;
}

export interface CampaignOpeningRecovery {
  readonly mode: 'den-training-v1';
  readonly cycles: CampaignOpeningCycle[];
}

const den = 'areas/act1-den-of-evil', moor = 'areas/act1-blood-moor';

/** Preserve the original opening unless explicitly selected; failed Den runs may earn one retry level. */
export function runCampaignDen(profile: CampaignProfile, record: CampaignRecord,
  enter: (area: string, phase: 'farm' | 'route') => void,
  opening?: CampaignOpeningRecovery, boundary: () => void = () => undefined): void {
  if (opening) {
    assert.equal(opening.mode, 'den-training-v1', 'Invalid opening recovery mode');
    assert.equal(opening.cycles.length, 0, 'Opening recovery cannot reuse old cycles');
  }
  const player = () => { const hero = usePlayerStore.getState().player; assert.ok(hero); return hero; };
  const resolve = (cycle: CampaignOpeningCycle, resolution: NonNullable<CampaignOpeningCycle['resolution']>,
    reason: string | null = null, error?: unknown) => {
    assert.equal(cycle.resolution, null, 'Opening recovery resolved twice');
    cycle.resolution = resolution; cycle.reason = reason;
    cycle.stopStatus = reason === null ? null : error instanceof CampaignStop ? error.status : 'technical';
    record({ kind: 'opening-resolved', cycle });
  };
  let pending: CampaignOpeningCycle | undefined;
  for (;;) {
    const ordinal = useMapStore.getState().challengeOrdinals.normal;
    let failed: CampaignStop | undefined;
    try { enter(den, 'route'); }
    catch (error) {
      const settled = error instanceof CampaignStop && error.status === 'nonwin' &&
        error.settledNonwin?.area === den && error.settledNonwin.phase === 'route' &&
        error.settledNonwin.ordinal === ordinal;
      if (pending) {
        if (useMapStore.getState().challengeOrdinals.normal === pending.retryOrdinal) pending.retryOrdinal = null;
        resolve(pending, settled ? 'retry-nonwin' : 'stopped', String(error), error);
      }
      pending = undefined;
      if (!settled || !opening || opening.cycles.length >= 2 || player().level >= 14) throw error;
      failed = error;
    }
    if (!failed) { if (pending) resolve(pending, 'retry-won'); return; }
    assert.ok(opening && failed.settledNonwin);
    const hero = player(), fromXp = xpTotal(hero.level) + hero.experience;
    const trainingStartOrdinal = useMapStore.getState().challengeOrdinals.normal;
    const request: CampaignTrainingRequest = { act: 1, area: moor, targetLevel: hero.level + 1,
      maxAdmissions: 40, maxConsecutiveNonwins: 1, maxTotalNonwins: 1 };
    const cycle: CampaignOpeningCycle = { failure: failed.settledNonwin, fromLevel: hero.level,
      targetLevel: request.targetLevel, trainingRequest: request, trainingStartOrdinal,
      trainingNextOrdinal: trainingStartOrdinal, fromXp, trainingTerminalXp: fromXp,
      trainingResult: null, retryOrdinal: null, resolution: null, reason: null, stopStatus: null };
    opening.cycles.push(cycle);
    try {
      record({ kind: 'opening-recovery-start', cycle }); returnCampaignToMap();
      try {
        cycle.trainingResult = trainCampaignBuild(profile, request, record, (area, phase) => {
          enter(area, phase); boundary();
        });
      } finally {
        cycle.trainingNextOrdinal = useMapStore.getState().challengeOrdinals.normal;
        const terminal = player(); cycle.trainingTerminalXp = xpTotal(terminal.level) + terminal.experience;
      }
      if (cycle.trainingResult.status !== 'target-earned')
        throw new CampaignStop(cycle.trainingResult.status === 'retry-limit' ? 'nonwin' : 'budget',
          `Opening training ${cycle.trainingResult.status}`);
      boundary();
      cycle.retryOrdinal = useMapStore.getState().challengeOrdinals.normal;
      record({ kind: 'opening-attempt-retry', cycle });
    } catch (error) {
      cycle.retryOrdinal = null; resolve(cycle, 'stopped', String(error), error); throw error;
    }
    pending = cycle;
  }
}
