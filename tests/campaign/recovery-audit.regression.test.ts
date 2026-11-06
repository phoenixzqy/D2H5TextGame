/** Constructed report corruption checks; these do not establish native earned progress. */
import { expect, it } from 'vitest';
import type { CampaignProfile, CampaignWave } from './policy';
import type { CampaignRecovery } from './route';
import { assertCampaignRecovery } from './recovery-audit';
import { auditCampaignAcquisition } from './acquisition-audit';
import { campaignProfiles } from './profiles';
import { xpTotal } from '@/engine/progression/xp';

const catacombs = 'areas/act1-catacombs', wood = 'areas/act1-dark-wood';

function laterFailure(area = 'areas/act3-great-marsh', phase: CampaignWave['phase'] = 'route'): CampaignWave {
  return { area, phase, ordinal: 1, index: 0, outcome: 'draw', advance: 'defeat',
    logicalMs: 1, xp: 0, items: 0, heroLife: 1, heroMana: 0 };
}

it.each([
  [3, 'areas/act3-great-marsh'], [4, 'areas/act4-plains-of-despair'], [5, 'areas/act5-bloody-foothills']
] as const)('reconciles independently audited Act %s route and earlier farm losses', (act, area) => {
  const waves = [laterFailure(area), { ...laterFailure(wood, 'farm'), ordinal: 2 }];
  const recovery: CampaignRecovery = { mode: 'none', cycles: [] };
  expect(() => { assertCampaignRecovery(recovery, waves, 'act5-complete'); }).toThrow('Retained nonwins');
  expect(() => { assertCampaignRecovery(recovery, waves, 'act5-complete', new Set(), undefined, undefined,
    [{ act, nonwinOrdinals: [1, 2] }]); }).not.toThrow();
  expect(() => { assertCampaignRecovery(recovery, waves, 'nonwin', new Set(), undefined, undefined,
    [{ act, nonwinOrdinals: [1, 2] }]); }).not.toThrow();
});

it.each([
  ['areas/act2-rocky-waste', 'route'], ['areas/act4-plains-of-despair', 'farm'],
  ['areas/act3-not-authored', 'route'], ['a3-great-marsh', 'route']
] as const)('rejects undeclared later-act recovery source %s/%s', (area, phase) => {
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, [laterFailure(area, phase)], 'nonwin',
    new Set(), undefined, undefined, [{ act: 3, nonwinOrdinals: [1] }]); }).toThrow('Undeclared later-act nonwin source');
});

it('rejects duplicate later-act owners and loss custody', () => {
  const recovery: CampaignRecovery = { mode: 'none', cycles: [] }, waves = [laterFailure(wood, 'farm')];
  const audit = { act: 3 as const, nonwinOrdinals: [1] };
  expect(() => { assertCampaignRecovery(recovery, waves, 'nonwin', new Set(), undefined, undefined,
    [audit, { ...audit, nonwinOrdinals: [] }]); }).toThrow('Repeated later-act recovery audit');
  expect(() => { assertCampaignRecovery(recovery, waves, 'nonwin', new Set(), undefined, undefined,
    [{ ...audit, nonwinOrdinals: [1, 1] }]); }).toThrow('Overlapping later-act exclusion');
  expect(() => { assertCampaignRecovery(recovery, waves, 'nonwin', new Set([1]), undefined, undefined,
    [audit]); }).toThrow('Overlapping later-act exclusion');
  expect(() => { assertCampaignRecovery(recovery, waves, 'nonwin', new Set(), undefined, { nonwinOrdinals: [1] },
    [audit]); }).toThrow('Overlapping later-act exclusion');
  expect(() => { assertCampaignRecovery(recovery, waves, 'nonwin', new Set(), undefined, undefined,
    [audit, { act: 4, nonwinOrdinals: [1] }]); }).toThrow('Overlapping later-act exclusion');
  const ordinary = recovered().cycle;
  expect(() => { assertCampaignRecovery({ mode: 'act1-training-v1', cycles: [{ ...ordinary,
    failure: { ...ordinary.failure, area: wood, phase: 'farm' } }] }, waves, 'nonwin',
  new Set(), undefined, undefined, [audit]); }).toThrow('Later-act exclusion overlaps ordinary recovery');
});

/** Constructed cumulative XP and waves verify audit integrity, never build viability. */
function acquisition() {
  const den = 'areas/act1-den-of-evil';
  const profile: Omit<CampaignProfile, 'acquisitionTrainingPolicy'> & { acquisitionTrainingPolicy?: 'den-bounded-v1' } =
    { ...campaignProfiles['sorceress-cold'], acquisitionTrainingPolicy: 'den-bounded-v1' };
  const request = { act: 1, area: den, targetLevel: 12, maxAdmissions: 99,
    maxConsecutiveNonwins: 3, maxTotalNonwins: 10 };
  const checkpoint = { request, startOrdinal: 2, nextOrdinal: 4, fromXp: xpTotal(6), terminalXp: xpTotal(12),
    result: { request, status: 'target-earned', fromLevel: 6, terminalLevel: 12,
      admissions: 2, wins: 1, nonwins: 1, consecutiveNonwins: 0, lastAttempt: 'victory' as const },
    failure: null, failureStatus: null };
  const recovery: CampaignRecovery = { mode: 'act1-training-v1', cycles: [], acquisition: checkpoint };
  const wave = (ordinal: number, phase: CampaignWave['phase']): CampaignWave => ({ ordinal, phase, area: den,
    index: 0, outcome: 'victory', advance: 'victory', logicalMs: 1000, xp: 0, items: 0, heroLife: 1, heroMana: 1 });
  const waves: CampaignWave[] = [wave(1, 'route'), { ...wave(2, 'farm'), xp: 1, advance: 'next-wave' },
    { ...wave(2, 'farm'), index: 1, outcome: 'defeat', advance: 'defeat', heroLife: 0 },
    { ...wave(3, 'farm'), xp: xpTotal(12) - xpTotal(6) - 1 },
    { ...wave(4, 'route'), area: 'areas/act1-blood-moor' }];
  return { profile, recovery, checkpoint, waves,
    waveAt: (index: number) => {
      const row = waves[index]; if (!row) throw new Error('Missing fixture wave'); return row;
    },
    audit: (claimed = true) => auditCampaignAcquisition(profile, recovery, waves, claimed) };
}

it('reconciles post-Den recovery with actual partial income and verified farm losses', () => {
  const f = acquisition(), audit = f.audit();
  expect(audit).toEqual({ admissions: 2, xp: xpTotal(12) - xpTotal(6), nonwinOrdinals: [2] });
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete'); }).toThrow('Retained nonwins');
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete', new Set(audit.nonwinOrdinals)); }).not.toThrow();
  f.recovery.cycles.push({ ...recovered().cycle, failure: { area: f.checkpoint.request.area,
    ordinal: 2, phase: 'farm', index: 1, outcome: 'defeat' } });
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete', new Set(audit.nonwinOrdinals)); })
    .toThrow('Preparation exclusion overlaps an ordinary recovery');
});

it('rejects missing acquisition evidence while keeping legacy first-loss screens intact', () => {
  const f = acquisition(); delete f.recovery.acquisition;
  expect(f.audit).toThrow('Missing Den acquisition checkpoint');
  delete f.profile.acquisitionTrainingPolicy;
  expect(f.audit()).toEqual({ admissions: 0, xp: 0, nonwinOrdinals: [] });
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete'); }).toThrow('Retained nonwins');
});

it.each(['profile', 'recovery'] as const)('rejects a checkpoint without the %s opt-in', gate => {
  const f = acquisition();
  if (gate === 'profile') {
    delete f.profile.acquisitionTrainingPolicy;
    expect(f.audit).toThrow('Den acquisition requires both opt-ins');
  } else expect(() => auditCampaignAcquisition(f.profile, { ...f.recovery, mode: 'none' }, f.waves, true))
    .toThrow('Den acquisition requires both opt-ins');
});

it('requires a prior Den clear and its claimed quest', () => {
  const f = acquisition(); expect(() => f.audit(false)).toThrow('requires the claimed quest');
  f.waves.shift(); expect(f.audit).toThrow('requires the original Den clear');
});

it.each(['bound', 'interval', 'counter', 'xp', 'failed-reward', 'target-continuation'] as const)(
  'rejects forged Den acquisition %s evidence', corruption => {
    const f = acquisition();
    if (corruption === 'bound') f.checkpoint.request.maxTotalNonwins++;
    if (corruption === 'interval') f.checkpoint.startOrdinal++;
    if (corruption === 'counter') f.checkpoint.result.nonwins++;
    if (corruption === 'xp') f.checkpoint.terminalXp++;
    if (corruption === 'failed-reward') f.waves[2] = { ...f.waveAt(2), items: 1 };
    if (corruption === 'target-continuation') {
      f.waves[1] = { ...f.waveAt(1), xp: xpTotal(12) - xpTotal(6) };
    }
    expect(f.audit).toThrow();
  });

it.each(['budget', 'technical'] as const)('retains a %s interruption without inventing target success', status => {
  const f = acquisition();
  const checkpoint = { ...f.checkpoint, nextOrdinal: 3, terminalXp: xpTotal(6) + 1,
    result: null, failure: 'Interrupted', failureStatus: status };
  f.recovery.acquisition = checkpoint; f.waves.splice(3);
  expect(f.audit()).toEqual({ admissions: 1, xp: 1, nonwinOrdinals: [2] });
  f.waves.push({ ...f.waveAt(0), ordinal: 3 });
  expect(f.audit).toThrow('Continuation after Den acquisition stop');
});

it('reconciles an exact retry-limit terminal loss without counting it twice', () => {
  const f = acquisition(), failure = f.waveAt(2);
  f.waves.splice(1, f.waves.length - 1, ...[2, 3, 4].map(ordinal => ({ ...failure, ordinal, index: 0 })));
  f.recovery.acquisition = { ...f.checkpoint, nextOrdinal: 5, terminalXp: xpTotal(6),
    failure: 'Error: Den acquisition retry-limit', failureStatus: 'nonwin',
    result: { ...f.checkpoint.result, status: 'retry-limit', terminalLevel: 6, admissions: 3,
      wins: 0, nonwins: 3, consecutiveNonwins: 3, lastAttempt: 'nonwin' } };
  const audit = f.audit();
  expect(audit.nonwinOrdinals).toEqual([2, 3, 4]);
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'nonwin', new Set(audit.nonwinOrdinals)); }).not.toThrow();
});

function recovered() {
  const wave = (ordinal: number, area: string, phase: 'route' | 'farm', outcome: CampaignWave['outcome']): CampaignWave =>
    ({ ordinal, area, phase, index: 0, outcome, advance: outcome === 'victory' ? 'victory' : 'defeat',
      logicalMs: 1000, xp: outcome === 'victory' ? 100 : 0, items: 0, heroLife: 1, heroMana: 1 });
  const waves = [wave(0, wood, 'route', 'victory'), wave(1, catacombs, 'route', 'draw'),
    wave(2, wood, 'farm', 'victory'), wave(3, catacombs, 'route', 'victory')];
  const recovery: CampaignRecovery = { mode: 'act1-training-v1', cycles: [{
    failure: { area: catacombs, phase: 'route', ordinal: 1, index: 0, outcome: 'draw' },
    fromLevel: 12, targetLevel: 13, trainingArea: wood, trainingOrdinals: [2], retryOrdinal: 3,
    resolution: 'retry-won', endLevel: 13, reason: null
  }] };
  const cycle = recovery.cycles[0]; if (!cycle) throw new Error('Missing fixture recovery');
  return { waves, recovery, cycle };
}

it('allows completion only while retaining the historical loss and actual whole-area retry', () => {
  const f = recovered();
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete'); }).not.toThrow();
  expect(() => { assertCampaignRecovery(f.recovery, f.waves.filter(row => row.outcome === 'victory'), 'act1-complete'); })
    .toThrow('Retained nonwins');
});

it('retains the default exact one-terminal-nonwin accounting', () => {
  const f = recovered();
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves.slice(0, 2), 'nonwin'); }).not.toThrow();
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'act1-complete'); }).toThrow();
});

it('allows a budget stop after training without fabricating a retry', () => {
  const f = recovered(); f.cycle.retryOrdinal = null; f.cycle.resolution = 'stopped';
  expect(() => { assertCampaignRecovery(f.recovery, f.waves.slice(0, 3), 'budget'); }).not.toThrow();
});

it('allows a retained terminal training nonwin without treating it as another recoverable loss', () => {
  const f = recovered(); f.cycle.retryOrdinal = null; f.cycle.resolution = 'stopped'; f.cycle.endLevel = 12;
  const training = f.waves[2]; if (!training) throw new Error('Missing fixture training');
  f.waves[2] = { ...training, outcome: 'defeat', advance: 'defeat', xp: 0, heroLife: 0 };
  expect(() => { assertCampaignRecovery(f.recovery, f.waves.slice(0, 3), 'nonwin'); }).not.toThrow();
});

it.each(['unobserved-retry', 'skipped-wave', 'repeat-training', 'wrong-failure', 'unresolved', 'default-mode', 'nonzero-failed-xp'])(
  'rejects corrupted report: %s', corruption => {
    const f = recovered();
    if (corruption === 'unobserved-retry') f.cycle.retryOrdinal = 9;
    if (corruption === 'skipped-wave') { const retry = f.waves[3]; if (retry) f.waves[3] = { ...retry, index: 4 }; }
    if (corruption === 'repeat-training') f.cycle.trainingOrdinals.push(2);
    if (corruption === 'wrong-failure') f.recovery.cycles[0] = { ...f.cycle,
      failure: { ...f.cycle.failure, index: 4 } };
    if (corruption === 'unresolved') f.cycle.resolution = null;
    if (corruption === 'default-mode') f.recovery = { ...f.recovery, mode: 'none' };
    if (corruption === 'nonzero-failed-xp') { const failed = f.waves[1]; if (failed) f.waves[1] = { ...failed, xp: 5 }; }
    expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete'); }).toThrow();
  });

function intendedRecovered() {
  const f = recovered(), area = 'areas/act1-cold-plains';
  const cycle: CampaignRecovery['cycles'][number] = {
    ...f.cycle, trainingPolicy: 'cleared-level-margin-v1', trainingArea: area
  };
  f.recovery.cycles[0] = cycle;
  f.waves = f.waves.map(row => row.area === wood ? { ...row, area } : row);
  return { ...f, cycle };
}

it('audits forty lower-level training admissions with native level and prior-clear evidence', () => {
  const f = intendedRecovered(), farm = f.waves[2], retry = f.waves[3];
  if (!farm || !retry) throw new Error('Missing fixture waves');
  f.cycle.trainingOrdinals.splice(0, 1, ...Array.from({ length: 40 }, (_, i) => i + 2));
  f.cycle.retryOrdinal = 42;
  f.waves = [...f.waves.slice(0, 2), ...f.cycle.trainingOrdinals.map(ordinal => ({ ...farm, ordinal })),
    { ...retry, ordinal: 42 }];
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete'); }).not.toThrow();
  f.cycle.trainingOrdinals.push(43);
  expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete'); }).toThrow();
});

it.each(['level-margin', 'prior-clear', 'wrong-act', 'missing-source'] as const)(
  'rejects intended recovery with invalid %s evidence', corruption => {
    const f = intendedRecovered();
    if (corruption === 'level-margin') {
      f.recovery.cycles[0] = { ...f.cycle, trainingArea: wood };
      f.waves = f.waves.map(row => row.area === 'areas/act1-cold-plains' ? { ...row, area: wood } : row);
    }
    if (corruption === 'prior-clear') f.waves = f.waves.slice(1);
    if (corruption === 'wrong-act') f.recovery.cycles[0] = { ...f.cycle, trainingArea: 'areas/act2-rocky-waste' };
    if (corruption === 'missing-source') f.recovery.cycles[0] = { ...f.cycle, trainingArea: null };
    expect(() => { assertCampaignRecovery(f.recovery, f.waves, 'act1-complete'); }).toThrow();
  });

it('audits a no-source stop only when no earlier cleared challenge meets the level margin', () => {
  const f = intendedRecovered();
  f.recovery.cycles[0] = { ...f.cycle, fromLevel: 6, targetLevel: 7, endLevel: 6,
    trainingArea: null, trainingOrdinals: [], retryOrdinal: null, resolution: 'stopped',
    reason: 'No cleared lower-level recovery area' };
  expect(() => { assertCampaignRecovery(f.recovery, f.waves.slice(0, 2), 'budget'); }).not.toThrow();
  f.recovery.cycles[0] = { ...f.recovery.cycles[0], fromLevel: 12, targetLevel: 13, endLevel: 12 };
  expect(() => { assertCampaignRecovery(f.recovery, f.waves.slice(0, 2), 'budget'); })
    .toThrow('Eligible cleared recovery area was omitted');
});


it.each([
  ['areas/act1-blood-moor', 'route'],
  ['areas/act1-not-authored', 'farm'],
  ['areas/act2-not-authored', 'farm'],
  ['areas/act3-great-marsh', 'farm']
] as const)('rejects undeclared Act II recovery exclusion %s/%s', (area, phase) => {
  const wave: CampaignWave = { area, phase, ordinal: 1, index: 0, outcome: 'defeat', advance: 'defeat',
    logicalMs: 1, xp: 0, items: 0, heroLife: 0, heroMana: 0 };
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, [wave], 'nonwin',
    new Set(), undefined, { nonwinOrdinals: [1] }); }).toThrow('Undeclared Act II nonwin source');
});
