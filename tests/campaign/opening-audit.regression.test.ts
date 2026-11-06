/** Constructed report corruption and reconciliation; not native earned campaign evidence. */
import { expect, it } from 'vitest';
import { xpTotal } from '@/engine/progression/xp';
import type { CampaignWave } from './policy';
import type { CampaignOpeningCycle, CampaignOpeningRecovery } from './opening-recovery';
import { auditCampaignOpening } from './opening-audit';
import { assertCampaignRecovery } from './recovery-audit';

function recovered() {
  const wave = (ordinal: number, phase: 'farm' | 'route', outcome: CampaignWave['outcome']): CampaignWave => ({
    area: phase === 'route' ? 'areas/act1-den-of-evil' : 'areas/act1-blood-moor', ordinal, phase,
    index: 0, outcome, advance: outcome === 'victory' ? 'victory' : 'defeat', logicalMs: 1000,
    xp: phase === 'farm' ? xpTotal(7) - xpTotal(6) : 0, items: 0, heroLife: 100, heroMana: 50 });
  const request = { act: 1, area: 'areas/act1-blood-moor', targetLevel: 7,
    maxAdmissions: 40, maxConsecutiveNonwins: 1, maxTotalNonwins: 1 };
  const cycle: CampaignOpeningCycle = { failure: { area: 'areas/act1-den-of-evil', phase: 'route',
    ordinal: 0, index: 0, outcome: 'draw' }, fromLevel: 6, targetLevel: 7, trainingRequest: request,
    trainingStartOrdinal: 1, trainingNextOrdinal: 2, fromXp: xpTotal(6), trainingTerminalXp: xpTotal(7),
    trainingResult: { status: 'target-earned', request, fromLevel: 6, terminalLevel: 7,
      admissions: 1, wins: 1, nonwins: 0, consecutiveNonwins: 0, lastAttempt: 'victory' },
    retryOrdinal: 2, resolution: 'retry-won', reason: null, stopStatus: null };
  const opening: CampaignOpeningRecovery = { mode: 'den-training-v1', cycles: [cycle] };
  return { opening, cycle, waves: [wave(0, 'route', 'draw'), wave(1, 'farm', 'victory'), wave(2, 'route', 'victory')] };
}

it('rederives the original loss, bounded training XP and complete Den retry', () => {
  const f = recovered();
  expect(auditCampaignOpening(f.opening, f.waves)).toEqual({ cycles: 1, trainingAdmissions: 1,
    trainingXp: xpTotal(7) - xpTotal(6), failureOrdinals: [0], trainingNonwinOrdinals: [] });
});

it('retains audited opening losses while reconciling later route recovery', () => {
  const f = recovered(), audit = auditCampaignOpening(f.opening, f.waves);
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'act1-complete', new Set(), audit); })
    .not.toThrow();
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'act1-complete'); })
    .toThrow('Retained nonwins');
});

it.each(['xp', 'failure', 'ordinal', 'target', 'retry', 'outcome', 'duplicate', 'unresolved'] as const)(
  'rejects opening report corruption: %s', corruption => {
    const f = recovered();
    if (corruption === 'xp') f.cycle.trainingTerminalXp++;
    if (corruption === 'failure') f.opening.cycles[0] = { ...f.cycle, failure: { ...f.cycle.failure, ordinal: 99 } };
    if (corruption === 'ordinal') f.cycle.trainingNextOrdinal++;
    if (corruption === 'target') f.opening.cycles[0] = { ...f.cycle, targetLevel: 8 };
    if (corruption === 'retry') f.cycle.retryOrdinal = 3;
    if (corruption === 'outcome') { const retry = f.waves[2]; if (retry) f.waves[2] = { ...retry, outcome: 'defeat', advance: 'defeat' }; }
    if (corruption === 'duplicate') f.opening.cycles.push({ ...f.cycle });
    if (corruption === 'unresolved') f.cycle.resolution = null;
    expect(() => { auditCampaignOpening(f.opening, f.waves); }).toThrow();
  });

it('refuses an opening exclusion for an unrelated route loss', () => {
  const f = recovered(), failed = f.waves[0]; if (!failed) throw new Error('Missing constructed failure');
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, [{ ...failed,
    area: 'areas/act1-dark-wood' }], 'nonwin', new Set(), { cycles: 1, trainingAdmissions: 0,
    trainingXp: 0, failureOrdinals: [0], trainingNonwinOrdinals: [] }); })
    .toThrow('Opening exclusion requires a Den route nonwin');
});

it('reconciles a terminal opening training loss without adding an ordinary terminal loss', () => {
  const f = recovered(), training = f.waves[1]; if (!training) throw new Error('Missing training fixture');
  f.waves.splice(1, 2, { ...training, outcome: 'defeat', advance: 'defeat', xp: 0, heroLife: 0 });
  f.cycle.trainingTerminalXp = f.cycle.fromXp;
  f.cycle.trainingResult = { status: 'retry-limit', request: f.cycle.trainingRequest,
    fromLevel: 6, terminalLevel: 6, admissions: 1, wins: 0, nonwins: 1,
    consecutiveNonwins: 1, lastAttempt: 'nonwin' };
  f.cycle.retryOrdinal = null; f.cycle.resolution = 'stopped';
  f.cycle.reason = 'Opening training retry-limit'; f.cycle.stopStatus = 'nonwin';
  const audit = auditCampaignOpening(f.opening, f.waves);
  expect(audit.trainingNonwinOrdinals).toEqual([1]);
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'nonwin', new Set(), audit); })
    .not.toThrow();
});

it('keeps a final failed Den retry as the ordinary terminal nonwin', () => {
  const f = recovered(), retry = f.waves[2]; if (!retry) throw new Error('Missing retry fixture');
  f.waves[2] = { ...retry, outcome: 'draw', advance: 'defeat' };
  f.cycle.resolution = 'retry-nonwin'; f.cycle.reason = 'Den retry draw'; f.cycle.stopStatus = 'nonwin';
  const audit = auditCampaignOpening(f.opening, f.waves);
  expect(audit.failureOrdinals).toEqual([0]);
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'nonwin', new Set(), audit); })
    .not.toThrow();
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'act1-complete', new Set(), audit); })
    .toThrow('Retained nonwins');
});

it.each(['preparation', 'ordinary'] as const)('refuses overlapping opening and %s exclusions', kind => {
  const f = recovered(), audit = auditCampaignOpening(f.opening, f.waves);
  const cycles = kind === 'ordinary' ? [{ failure: f.cycle.failure,
    fromLevel: 6, targetLevel: 7, trainingArea: 'areas/act1-blood-moor', trainingOrdinals: [1],
    retryOrdinal: 2, resolution: 'retry-won' as const, endLevel: 7, reason: null }] : [];
  expect(() => { assertCampaignRecovery({ mode: 'act1-training-v1', cycles }, f.waves,
    'act1-complete', new Set(kind === 'preparation' ? [0] : []), audit); })
    .toThrow(kind === 'preparation' ? 'Opening exclusion overlaps preparation'
      : 'Opening exclusion overlaps an ordinary recovery');
});

it('refuses a forged opening training exclusion for a route nonwin', () => {
  const f = recovered();
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'nonwin', new Set(),
    { cycles: 0, trainingAdmissions: 1, trainingXp: 0, failureOrdinals: [], trainingNonwinOrdinals: [0] }); })
    .toThrow('Opening training exclusion requires a Blood Moor farm nonwin');
});
