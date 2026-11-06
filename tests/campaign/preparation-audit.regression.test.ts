/** Constructed report conservation tests; no native combat or earned viability is claimed. */
import { expect, it } from 'vitest';
import { xpTotal } from '@/engine/progression/xp';
import type { CampaignWave } from './policy';
import type { CampaignPreparation } from './preparation';
import { campaignExecution, campaignPreparationRequest } from './execution';
import { auditCampaignPreparations } from './preparation-audit';
import { assertCampaignRecovery } from './recovery-audit';

function prepared() {
  const request = { act: 1, area: 'areas/act1-den-of-evil', targetLevel: 14,
    maxAdmissions: 200, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 };
  const wave = (ordinal: number, outcome: CampaignWave['outcome']): CampaignWave => ({ ordinal,
    area: request.area, phase: 'farm', index: 0, outcome,
    advance: outcome === 'victory' ? 'victory' : 'defeat', logicalMs: 1000,
    xp: outcome === 'victory' ? xpTotal(14) - xpTotal(13) : 0, items: 0,
    heroLife: outcome === 'victory' ? 100 : 0, heroMana: 30 });
  const waves = [wave(5, 'defeat'), wave(6, 'victory')];
  const checkpoint: CampaignPreparation = { nextAct: 2, request, startOrdinal: 5, nextOrdinal: 7,
    fromXp: xpTotal(13), terminalXp: xpTotal(14), failure: null, failureStatus: null,
    result: { status: 'target-earned', request, fromLevel: 13, terminalLevel: 14,
      admissions: 2, wins: 1, nonwins: 1, consecutiveNonwins: 0, lastAttempt: 'victory' } };
  return { checkpoint, waves };
}

it('audits Nova Foothills preparation and rejects the old Plains request', () => {
  const execution = campaignExecution('nova-act2-prepared-v1');
  const checkpoints: CampaignPreparation[] = [2, 3, 4, 5].map(nextAct => {
    const request = campaignPreparationRequest(nextAct, execution.mode);
    return { nextAct, request, startOrdinal: nextAct, nextOrdinal: nextAct,
      fromXp: xpTotal(request.targetLevel), terminalXp: xpTotal(request.targetLevel),
      failure: null, failureStatus: null,
      result: { status: 'target-earned', request, fromLevel: request.targetLevel,
        terminalLevel: request.targetLevel, admissions: 0, wins: 0, nonwins: 0,
        consecutiveNonwins: 0, lastAttempt: null } };
  });
  const last = checkpoints[3]; if (!last) throw new Error('Missing preparation');
  expect(last.request).toEqual({ act: 5, area: 'areas/act5-bloody-foothills', targetLevel: 55,
    maxAdmissions: 600, maxConsecutiveNonwins: 3, maxTotalNonwins: 10 });
  expect(auditCampaignPreparations(execution, checkpoints, [])).toMatchObject({ stages: 4, admissions: 0 });
  checkpoints[3] = { ...last, request: campaignPreparationRequest(5) };
  expect(() => { auditCampaignPreparations(execution, checkpoints, []); }).toThrow('Undeclared preparation request');
});

it('conserves cumulative XP and classifies every retained training admission', () => {
  const f = prepared(), audit = auditCampaignPreparations(campaignExecution('level-training-v1'), [f.checkpoint], f.waves);
  expect(audit).toEqual({ stages: 1, admissions: 2, xp: xpTotal(14) - xpTotal(13), nonwinOrdinals: [5] });
});

it('prohibits generic preparation under route-first execution', () => {
  const execution = campaignExecution('route-first-campaign-v1'), f = prepared();
  expect(auditCampaignPreparations(execution, [], [])).toEqual({ stages: 0, admissions: 0, xp: 0, nonwinOrdinals: [] });
  expect(() => auditCampaignPreparations(execution, [f.checkpoint], f.waves))
    .toThrow('Route-first campaign cannot contain generic preparation');
});

it('reconciles audited training losses with ordinary recovery without erasing their history', () => {
  const f = prepared();
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'act5-complete', new Set([5])); })
    .not.toThrow();
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'act5-complete'); }).toThrow('Retained nonwins');
});

it('retains an outer-budget interruption with a partial admission and exact XP', () => {
  const f = prepared(); f.checkpoint.result = null; f.checkpoint.failure = 'Campaign time budget';
  f.checkpoint.failureStatus = 'budget';
  const terminal = f.waves[1]; if (!terminal) throw new Error('Missing fixture wave');
  f.waves[1] = { ...terminal, advance: 'next-wave' };
  expect(auditCampaignPreparations(campaignExecution('level-training-v1'), [f.checkpoint], f.waves))
    .toMatchObject({ stages: 1, admissions: 2, nonwinOrdinals: [5] });
});

it.each(['xp', 'ordinal', 'area', 'phase', 'wave-gap', 'result', 'stage', 'unfinished-success'] as const)(
  'rejects preparation report corruption: %s', corruption => {
    const f = prepared(), first = f.waves[0], last = f.waves[1];
    if (!first || !last || !f.checkpoint.result) throw new Error('Missing fixture');
    if (corruption === 'xp') f.checkpoint.terminalXp++;
    if (corruption === 'ordinal') f.checkpoint.nextOrdinal++;
    if (corruption === 'area') f.waves[0] = { ...first, area: 'areas/act2-far-oasis' };
    if (corruption === 'phase') f.waves[0] = { ...first, phase: 'route' };
    if (corruption === 'wave-gap') f.waves[1] = { ...last, index: 1 };
    if (corruption === 'result') f.checkpoint.result = { ...f.checkpoint.result, nonwins: 0 };
    if (corruption === 'stage') f.checkpoint = { ...f.checkpoint, nextAct: 3 };
    if (corruption === 'unfinished-success') f.waves[1] = { ...last, advance: 'next-wave' };
    expect(() => { auditCampaignPreparations(campaignExecution('level-training-v1'), [f.checkpoint], f.waves); }).toThrow();
  });

it('rejects training checkpoints under the original screen and prevents excluding route losses', () => {
  const f = prepared();
  expect(() => { auditCampaignPreparations(campaignExecution(), [f.checkpoint], f.waves); }).toThrow();
  const first = f.waves[0]; if (!first) throw new Error('Missing fixture');
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, [{ ...first, phase: 'route' }], 'nonwin', new Set([5])); })
    .toThrow('Preparation exclusion requires a farm nonwin');
});
