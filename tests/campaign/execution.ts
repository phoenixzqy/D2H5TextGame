import assert from 'node:assert/strict';
import type { CampaignTrainingRequest } from './training';
import type { CampaignProfile } from './policy';

export interface CampaignExecution {
  readonly mode: 'screen' | 'level-training-v1' | 'nova-act2-prepared-v1' | 'javelin-earned-v1' |
    'area-prepared-act2-v1' | 'area-prepared-retry-act2-v1' | 'challenge-prepared-act2-v1' | 'route-first-act2-v1' |
    'route-first-campaign-v1';
  readonly maxAdmissions: number;
  readonly maxCombatMs: number;
  readonly maxWallMs: number;
}

/** Explicit diagnostic envelopes; larger bounds never silently replace the original screen. */
export function campaignExecution(value = 'screen'): CampaignExecution {
  assert.ok(value === 'screen' || value === 'level-training-v1' || value === 'nova-act2-prepared-v1' ||
    value === 'javelin-earned-v1' || value === 'area-prepared-act2-v1' || value === 'area-prepared-retry-act2-v1' ||
    value === 'challenge-prepared-act2-v1' || value === 'route-first-act2-v1' || value === 'route-first-campaign-v1',
    'Invalid campaign execution');
  return value === 'screen'
    ? { mode: value, maxAdmissions: 160, maxCombatMs: 36_000_000, maxWallMs: 600_000 }
    : { mode: value, maxAdmissions: 1800, maxCombatMs: 216_000_000, maxWallMs: 1_500_000 };
}

/** The diagnostic changes one declared build; reject incompatible requests before creation. */
export function assertCampaignExecutionProfile(execution: CampaignExecution, phase: string, profileId: string): void {
  if (execution.mode === 'route-first-campaign-v1') {
    assert.ok(['act2', 'act3', 'act4', 'act5'].includes(phase), 'Route-first campaign requires Act II–V phase');
    return;
  }
  if (execution.mode === 'route-first-act2-v1') {
    assert.equal(phase, 'act2', 'Route-first execution requires Act II phase');
    return;
  }
  if (execution.mode === 'challenge-prepared-act2-v1') {
    assert.equal(phase, 'act2', 'Challenge level preparation requires Act II phase');
    return;
  }
  if (execution.mode === 'area-prepared-retry-act2-v1') {
    assert.ok(phase === 'act2' && ['amazon-bow-survival-owned-v1', 'amazon-bow-survival-managed-v1'].includes(profileId),
      'Prepared retries require the owned Bow diagnostic profile and Act II phase');
    return;
  }
  if (execution.mode === 'area-prepared-act2-v1') {
    assert.ok(['act2', 'act3', 'act4', 'act5'].includes(phase), 'Area preparation requires Act II–V phase');
    return;
  }
  if (execution.mode === 'javelin-earned-v1') {
    assert.equal(profileId, 'amazon-javelin-poison2-impale1', 'Javelin execution requires the Javelin diagnostic profile');
    return;
  }
  if (execution.mode !== 'nova-act2-prepared-v1') return;
  assert.ok(['act2', 'act3', 'act4', 'act5'].includes(phase) && profileId === 'sorceress-cold-nova-focus',
    'Nova Act II preparation requires the Nova diagnostic profile and Act II–V phase');
}

/** Preserve earned allocations while keeping area damage/control available against Act V packs. */
export function novaActFiveProfile(initial: CampaignProfile, stage: 'training' | 'route' = 'training'): CampaignProfile {
  assert.equal(initial.classId, 'sorceress');
  return { ...initial, priority: stage === 'training'
    ? ['sorceress.static_field', 'sorceress.blizzard', 'sorceress.frost_nova']
    : ['sorceress.blizzard', 'sorceress.static_field', 'sorceress.frost_nova'] };
}

/** Frozen evaluation targets from the recommended act-entry levels, not gameplay overrides. */
export function campaignPreparationRequest(nextAct: number,
  mode: CampaignExecution['mode'] = 'level-training-v1'): CampaignTrainingRequest {
  const stage = [
    { act: 1, area: 'areas/act1-den-of-evil', targetLevel: 14, maxAdmissions: 200 },
    { act: 2, area: 'areas/act2-far-oasis', targetLevel: 26, maxAdmissions: 400 },
    { act: 3, area: 'areas/act3-great-marsh', targetLevel: 40, maxAdmissions: 500 },
    { act: 4, area: 'areas/act4-plains-of-despair', targetLevel: 55, maxAdmissions: 600 }
  ][nextAct - 2];
  assert.ok(Number.isSafeInteger(nextAct) && stage, 'Invalid campaign preparation stage');
  if (nextAct === 5 && mode === 'nova-act2-prepared-v1')
    return { act: 5, area: 'areas/act5-bloody-foothills', targetLevel: 55, maxAdmissions: 600,
      maxConsecutiveNonwins: 3, maxTotalNonwins: 10 };
  return { ...stage, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 };
}
