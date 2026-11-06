/** Constructed admission outcomes exercise preparation custody, not balance. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { challengeEnemyLevelRange, resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMercStore } from '@/stores/mercStore';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import { claimCampaignQuest, growCampaignBuild } from './actions';
import type { CampaignProfile, CampaignWave } from './policy';
import { createCampaignQuestActions, type CampaignQuestEntry } from './quest-actions';
import { actTwoActionOrder, runActTwo } from './act2-route';
import { CampaignStop } from './route';
import { assertCampaignRecovery } from './recovery-audit';
import { campaignExecution, assertCampaignExecutionProfile } from './execution';
import { createActTwoAreaPreparation, runAreaPreparedActTwo, auditActTwoAreaPreparation, actTwoPreparationTarget, actTwoTrainingSource, type ActTwoRouteCarry, type ActTwoTrainingCarry } from './act2-area-preparation';

let restores: (() => void)[];
const profile = campaignProfiles['amazon-bow-volley-v1'];
const areas = ['rocky-waste', 'dry-hills', 'far-oasis', 'lost-city', 'arcane-sanctuary', 'tomb-of-tal-rasha']
  .map(id => `areas/act2-${id}`);
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  expect(createCharacter('Act II QA', 'amazon').ok).toBe(true);
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs
    .find(row => row.id === 'mercs/act1-rogue-inner-sight');
  assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(14));
  growCampaignBuild(profile, () => undefined);
  for (const area of ['areas/act1-catacombs', 'areas/act1-dark-wood']) useMapStore.getState().markCleared(area);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function fixture(outcome: (area: string, phase: 'farm' | 'route') => 'victory' | 'defeat' | 'interrupted' = () => 'victory',
  farmXp = 150_000, mode: Parameters<typeof createActTwoAreaPreparation>[0] = 'area-prepared-act2-v1', build: CampaignProfile = profile) {
  if (mode === 'route-first-act2-v1') useMapStore.getState().markCleared('areas/act1-blood-moor');
  const state = createActTwoAreaPreparation(mode), waves: CampaignWave[] = [];
  const actions = createCampaignQuestActions(() => undefined, () => undefined);
  const enter = (act: number, area: string, phase: 'farm' | 'route') => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    map.setCurrentLocation(act, area);
    const result = outcome(area, phase), xp = result === 'defeat' ? 0 : phase === 'farm' ? farmXp : 1000;
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ area, phase, ordinal, index: 0, outcome: result === 'defeat' ? 'defeat' : 'victory',
      advance: result === 'interrupted' ? 'next-wave' : result === 'defeat' ? 'defeat' : 'victory',
      logicalMs: 1, xp, items: 0, heroLife: result === 'defeat' ? 0 : 1, heroMana: 1 });
    if (result === 'interrupted') throw new CampaignStop('budget', 'Constructed between-wave stop');
    if (result === 'defeat') throw new CampaignStop('nonwin', 'Constructed settled nonwin',
      { area, phase, ordinal, index: 0, outcome: 'defeat' });
    map.markCleared(area);
    const archetype = ({ 'areas/act2-far-oasis': 'monsters/act2.radament',
      'areas/act2-arcane-sanctuary': 'monsters/act2.the-summoner' } as Record<string, string>)[area];
    if (archetype) useMapStore.getState().recordMonsterKills({ actId: 'acts/act2', areaId: area, archetypeIds: [archetype] });
    if (area === areas.at(-1)) useMapStore.getState().recordBossKill({ actId: 'acts/act2',
      areaId: area, bossArchetypeId: 'monsters/act2.duriel' });
  };
  return { state, waves, actions, run: (prefix: readonly CampaignQuestEntry[] = [], priorRoute?: ActTwoRouteCarry, priorTraining?: ActTwoTrainingCarry) => { runAreaPreparedActTwo(build, () => undefined, enter, actions, state, prefix, priorRoute, priorTraining); } };
}

it('route-first registers an explicit Act II-only execution without changing historical envelopes', () => {
  const execution = campaignExecution('route-first-act2-v1');
  expect(() => { assertCampaignExecutionProfile(execution, 'act2', 'amazon-bow-volley-v1'); }).not.toThrow();
  for (const phase of ['intro', 'act1', 'act3', 'act4', 'act5'])
    expect(() => { assertCampaignExecutionProfile(execution, phase, 'amazon-bow-volley-v1'); }).toThrow();
  expect(campaignExecution().maxAdmissions).toBe(160);
});

it('route-first attempts all native areas without earning advisory entry levels first', () => {
  const player = usePlayerStore.getState().player; assert.ok(player);
  // Constructed below-L14 Act I completion; the native callback owns access.
  usePlayerStore.setState({ player: { ...player, level: 12, experience: 0 } });
  const f = fixture(() => 'victory', 0, 'route-first-act2-v1'); f.run();
  expect(f.state.attempts.map(row => row.kind)).toEqual(Array(6).fill('route'));
  expect(f.state.attempts.map(row => row.area)).toEqual(areas);
  expect(f.state.attempts[0]).toMatchObject({ fromLevel: 12, targetLevel: 18 });
  expect(f.actions.entries.map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, trainingAdmissions: 0 });
});

it('route-first earns one level after a settled loss and stops farming before the retry', () => {
  let first = true;
  const f = fixture((_area, phase) => {
    if (phase === 'route' && first) { first = false; return 'defeat'; }
    return 'victory';
  }, xpTotal(15) - xpTotal(14), 'route-first-act2-v1'); f.run();
  expect(f.state.attempts.slice(0, 3).map(row => [row.kind, row.fromLevel, row.targetLevel, row.outcome]))
    .toEqual([['route', 14, 18, 'nonwin'], ['training', 14, 15, 'victory'], ['route', 15, 18, 'victory']]);
  expect(f.state.attempts.filter(row => row.kind === 'training')).toHaveLength(1);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true,
    admissions: 8, trainingAdmissions: 1, nonwinOrdinals: [0] });
});

it('route-first retains three losses and two earned recovery levels without advancing the quest', () => {
  const f = fixture((_area, phase) => phase === 'route' ? 'defeat' : 'victory',
    xpTotal(16) - xpTotal(15), 'route-first-act2-v1');
  expect(() => { f.run(); }).toThrow('Constructed settled nonwin');
  expect(f.state.attempts.map(row => row.kind)).toEqual(['route', 'training', 'route', 'training', 'route']);
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.fromLevel)).toEqual([14, 15, 16]);
  expect(f.actions.entries).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    admissions: 5, trainingAdmissions: 2, nonwinOrdinals: [0, 2, 4] });
});

it.each(['victory', 'interrupted'] as const)('audits the selected recovery farm after %s training', result => {
  const f = fixture((_area, phase) => phase === 'route' ? 'defeat' : result,
    xpTotal(16) - xpTotal(15), 'route-first-act2-v1');
  expect(() => { f.run(); }).toThrow();
  const lastTraining = f.state.attempts.filter(row => row.kind === 'training').at(-1);
  assert.ok(lastTraining);
  expect(lastTraining.area).not.toBe('areas/act1-dark-wood');
  expect(auditActTwoAreaPreparation(f.state, f.waves).continuation.farm)
    .toEqual({ act: lastTraining.act, area: lastTraining.area });
});

it('route-first derives recovery from terminal level after rewarded prefix waves of a lost admission', () => {
  let first = true;
  const earnedXp = xpTotal(15) - xpTotal(14);
  const f = fixture((_area, phase) => {
    if (phase === 'route' && first) {
      first = false; usePlayerStore.getState().gainExperience(earnedXp);
      const area = areas[0]; assert.ok(area);
      f.waves.push({ area, phase, ordinal: 0, index: 0, outcome: 'victory', advance: 'next-wave',
        logicalMs: 1, xp: earnedXp, items: 0, heroLife: 1, heroMana: 1 });
      return 'defeat';
    }
    return 'victory';
  }, xpTotal(16) - xpTotal(15), 'route-first-act2-v1'); f.run();
  const loss = f.waves[1]; assert.ok(loss); f.waves[1] = { ...loss, index: 1 };
  expect(f.state.attempts.slice(0, 3)).toMatchObject([
    { kind: 'route', fromLevel: 14, terminalLevel: 15, outcome: 'nonwin' },
    { kind: 'training', fromLevel: 15, targetLevel: 16 },
    { kind: 'route', fromLevel: 16 }
  ]);
  expect(auditActTwoAreaPreparation(f.state, f.waves).completed).toBe(true);
});

it('route-first retains interrupted recovery and its pending retry through a training checkpoint', () => {
  const previous = fixture((_area, phase) => phase === 'route' ? 'defeat' : 'interrupted',
    0, 'route-first-act2-v1');
  expect(() => { previous.run(); }).toThrow('between-wave stop');
  const carry = structuredClone({ preparation: previous.state, waves: previous.waves });
  expect(auditActTwoAreaPreparation(previous.state, previous.waves).continuation.routeFirstRecovery)
    .toEqual({ routeAttempts: 1, targetLevel: 15 });
  const current = fixture(() => 'victory', xpTotal(15) - xpTotal(14), 'route-first-act2-v1');
  current.run([], undefined, carry);
  expect(carry).toEqual({ preparation: previous.state, waves: previous.waves });
  expect(current.state.attempts[0]).toMatchObject({ kind: 'training', ordinal: 2, targetLevel: 15 });
  expect(current.state.attempts[1]).toMatchObject({ kind: 'route', ordinal: 3, fromLevel: 15 });
  expect(auditActTwoAreaPreparation(current.state, current.waves)).toMatchObject({ completed: true,
    trainingAdmissions: 1, continuation: { trainingAdmissions: 2 } });
});

it('route-first preserves an exhausted area recovery budget across a checkpoint', () => {
  const previous = fixture((_area, phase) => phase === 'route' ? 'defeat' : 'victory', 0, 'route-first-act2-v1');
  expect(() => { previous.run(); }).toThrow('area training bound');
  const current = fixture(() => 'victory', 0, 'route-first-act2-v1');
  expect(() => { current.run([], undefined, { preparation: previous.state, waves: previous.waves }); })
    .toThrow('area training bound');
  expect(current.state.attempts).toEqual([]);
  expect(auditActTwoAreaPreparation(current.state, current.waves)).toMatchObject({ completed: false,
    trainingAdmissions: 0, continuation: { trainingAdmissions: 200,
      routeFirstRecovery: { routeAttempts: 1, targetLevel: 15 } } });
});

it('route-first stops at the recovery level ceiling without farming or granting a retry', () => {
  usePlayerStore.getState().gainExperience(xpTotal(32) - xpTotal(14));
  const f = fixture(() => 'defeat', 0, 'route-first-act2-v1');
  expect(() => { f.run(); }).toThrow('recovery level ceiling');
  expect(f.state.attempts).toHaveLength(1);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    trainingAdmissions: 0, nonwinOrdinals: [0] });
});

it('route-first stops when no previously cleared training area meets the safety margin', () => {
  const player = usePlayerStore.getState().player; assert.ok(player);
  usePlayerStore.setState({ player: { ...player, level: 1, experience: 0 } });
  const f = fixture(() => 'defeat', 0, 'route-first-act2-v1');
  expect(() => { f.run(); }).toThrow('No cleared lower-level');
  expect(f.state.attempts).toHaveLength(1);
  expect(auditActTwoAreaPreparation(f.state, f.waves).trainingAdmissions).toBe(0);
});

it('route-first retains shared training nonwins after a settled route loss', () => {
  usePlayerStore.getState().gainExperience(xpTotal(22) - xpTotal(14));
  const f = fixture(() => 'defeat', 0, 'route-first-act2-v1');
  expect(() => { f.run(); }).toThrow('training nonwin bound');
  expect(f.state.attempts.map(row => row.kind)).toEqual(['route', 'training', 'training', 'training']);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    trainingAdmissions: 3, trainingNonwins: 3, nonwinOrdinals: [0, 1, 2, 3] });
});

it('route-first reconciles a verified lower-level Act I training loss with the outer recovery audit', () => {
  const f = fixture(() => 'defeat', 0, 'route-first-act2-v1');
  expect(() => { f.run(); }).toThrow();
  expect(f.state.attempts[1]).toMatchObject({ kind: 'training', area: 'areas/act1-blood-moor', outcome: 'nonwin' });
  const audit = auditActTwoAreaPreparation(f.state, f.waves);
  expect(audit.nonwinOrdinals).toEqual([0, 1]);
  expect(() => { assertCampaignRecovery({ mode: 'none', cycles: [] }, f.waves, 'budget',
    new Set(), undefined, audit); }).not.toThrow();
});

it('route-first audit rejects legacy route retries relabeled without earning recovery', () => {
  const f = fixture(() => 'defeat', 0, 'area-prepared-retry-act2-v1');
  expect(() => { f.run(); }).toThrow('Constructed settled nonwin');
  const relabeled = { ...f.state, mode: 'route-first-act2-v1' as const, trainingPolicy: 'cleared-level-margin-v1' as const,
    attempts: f.state.attempts.map(row => ({ ...row, targetLevel: 18 })) };
  expect(() => auditActTwoAreaPreparation(relabeled, f.waves)).toThrow('earned recovery level');
});

it.each(['premature-training', 'target', 'policy'] as const)('route-first audit rejects %s', mutation => {
  let first = true;
  const f = fixture((_area, phase) => {
    if (phase === 'route' && first) { first = false; return 'defeat'; }
    return 'victory';
  }, xpTotal(15) - xpTotal(14), 'route-first-act2-v1'); f.run();
  if (mutation === 'premature-training') {
    const row = f.state.attempts[0]; assert.ok(row); row.kind = 'training'; row.targetLevel = 15;
    const wave = f.waves[0]; assert.ok(wave); f.waves[0] = { ...wave, phase: 'farm' };
  } else if (mutation === 'target') {
    const row = f.state.attempts[1]; assert.ok(row); row.targetLevel++;
  } else delete f.state.trainingPolicy;
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});

it.each(['interrupted', 'technical', 'unsettled', 'wrong-area', 'wrong-phase', 'wrong-ordinal'] as const)(
  'route-first does not train or retry a %s route failure', kind => {
    const f = fixture(() => {
      if (kind === 'interrupted') return 'interrupted';
      if (kind === 'technical') throw new Error('Constructed technical error');
      throw new CampaignStop('nonwin', 'Constructed unverified nonwin', kind === 'unsettled' ? undefined : {
        area: kind === 'wrong-area' ? areas[1] ?? '' : areas[0] ?? '',
        phase: kind === 'wrong-phase' ? 'farm' : 'route', ordinal: kind === 'wrong-ordinal' ? 99 : 0,
        index: 0, outcome: 'defeat'
      });
    }, 0, 'route-first-act2-v1');
    expect(() => { f.run(); }).toThrow();
    expect(f.state.attempts).toHaveLength(1);
    expect(f.state.attempts[0]?.kind).toBe('route');
  });

it('keeps the original screen and rejects incompatible prepared phases before creation', () => {
  expect(campaignExecution().maxAdmissions).toBe(160);
  const execution = campaignExecution('area-prepared-act2-v1');
  expect(execution.maxAdmissions).toBe(1800);
  expect(() => { assertCampaignExecutionProfile(execution, 'act1', 'amazon-bow-volley-v1'); }).toThrow();
  expect(() => { assertCampaignExecutionProfile(execution, 'act2', 'amazon-bow-volley-v1'); }).not.toThrow();
});

it('earns every authored area-entry target and completes the native quest action order', () => {
  const f = fixture(); f.run();
  const route = f.state.attempts.filter(row => row.kind === 'route');
  expect(route.map(row => row.area)).toEqual(areas);
  expect(route.map(row => row.targetLevel)).toEqual([14, 16, 18, 21, 23, 25]);
  expect(route.every(row => row.fromLevel >= row.targetLevel)).toBe(true);
  expect(f.actions.entries.map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(useMapStore.getState().isActUnlocked(3)).toBe(true);
  expect(auditActTwoAreaPreparation(f.state, f.waves).completed).toBe(true);
});

it('falls back after an Act II farm loss without losing its admission or resetting counters', () => {
  let failed = false;
  const f = fixture((area, phase) => {
    if (!failed && phase === 'farm' && area.startsWith('areas/act2-')) { failed = true; return 'defeat'; }
    return 'victory';
  });
  f.run();
  const loss = f.waves.find(row => row.outcome === 'defeat'); assert.ok(loss);
  expect(f.waves.find(row => row.ordinal === loss.ordinal + 1)?.area).toBe('areas/act1-dark-wood');
  expect(auditActTwoAreaPreparation(f.state, f.waves).trainingNonwins).toBe(1);
});

it('stops at the shared consecutive nonwin limit even after the farm source changes', () => {
  const f = fixture((_area, phase) => phase === 'farm' ? 'defeat' : 'victory');
  expect(() => { f.run(); }).toThrow('training nonwin bound');
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area)).toEqual(areas.slice(0, 1));
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ trainingAdmissions: 3, trainingNonwins: 3, completed: false });
});

it('stops rather than admitting an underlevel hero when per-area training is exhausted', () => {
  const f = fixture(() => 'victory', 0);
  expect(() => { f.run(); }).toThrow('area training bound');
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area)).toEqual(areas.slice(0, 1));
  expect(auditActTwoAreaPreparation(f.state, f.waves).trainingAdmissions).toBe(200);
});

it('retains a settled route defeat and does not continue or secretly retry', () => {
  const f = fixture((area, phase) => phase === 'route' && area === areas[1] ? 'defeat' : 'victory');
  expect(() => { f.run(); }).toThrow('Constructed settled nonwin');
  expect(f.state.attempts.at(-1)).toMatchObject({ area: areas[1], outcome: 'nonwin', failureStatus: 'nonwin' });
  expect(auditActTwoAreaPreparation(f.state, f.waves).nonwinOrdinals).toEqual([f.waves.at(-1)?.ordinal]);
});

it('registers the explicit retry mode only for the owned Bow Act II diagnostic', () => {
  const execution = campaignExecution('area-prepared-retry-act2-v1');
  expect(execution.maxAdmissions).toBe(1800);
  expect(() => { assertCampaignExecutionProfile(execution, 'act2', 'amazon-bow-survival-owned-v1'); }).not.toThrow();
  for (const [phase, id] of [['act1', 'amazon-bow-survival-owned-v1'], ['act3', 'amazon-bow-survival-owned-v1'],
    ['act2', 'amazon-bow-volley-v1']] as const)
    expect(() => { assertCampaignExecutionProfile(execution, phase, id); }).toThrow();
});

it.each([1, 2, 3])('stops retrying at route victory on attempt %i and retains all preceding losses', attempts => {
  let firstAreaAttempts = 0;
  const f = fixture((area, phase) => {
    if (phase === 'route' && area === areas[0] && ++firstAreaAttempts < attempts) return 'defeat';
    return 'victory';
  }, 150_000, 'area-prepared-retry-act2-v1');
  f.run();
  expect(firstAreaAttempts).toBe(attempts);
  expect(f.state.attempts.slice(0, attempts).map(row => [row.area, row.kind, row.outcome]))
    .toEqual(Array.from({ length: attempts }, (_, i) => [areas[0], 'route', i + 1 === attempts ? 'victory' : 'nonwin']));
  expect(f.actions.entries.map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, routeAreas: 6,
    nonwinOrdinals: Array.from({ length: attempts - 1 }, (_, i) => i) });
});

it('ends after the third settled route loss, without advancing quests or resetting admission custody', () => {
  const f = fixture(() => 'defeat', 150_000, 'area-prepared-retry-act2-v1');
  expect(() => { f.run(); }).toThrow('Constructed settled nonwin');
  expect(f.state.attempts.map(row => [row.ordinal, row.nextOrdinal, row.outcome]))
    .toEqual([[0, 1, 'nonwin'], [1, 2, 'nonwin'], [2, 3, 'nonwin']]);
  expect(f.actions.entries).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    admissions: 3, trainingAdmissions: 0, routeAreas: 0, nonwinOrdinals: [0, 1, 2] });
  // A fourth attempted admission cannot be legitimized by changing the saved mode.
  const third = f.state.attempts[2]; assert.ok(third);
  f.state.attempts.push({ ...third, ordinal: 3, nextOrdinal: 4 });
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});

it('does not retry a between-wave interruption in the retry mode', () => {
  const f = fixture(() => 'interrupted', 150_000, 'area-prepared-retry-act2-v1');
  expect(() => { f.run(); }).toThrow('Constructed between-wave stop');
  expect(f.state.attempts).toHaveLength(1);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    admissions: 1, nonwinOrdinals: [] });
});

it.each(['technical', 'unsettled', 'wrong-area', 'wrong-phase', 'wrong-ordinal'] as const)(
  'does not retry a %s error even when it follows a consumed admission', kind => {
    let calls = 0;
    const f = fixture(() => {
      calls++;
      if (kind === 'technical') throw new Error('Constructed technical error');
      throw new CampaignStop('nonwin', 'Constructed unverified nonwin', kind === 'unsettled' ? undefined : {
        area: kind === 'wrong-area' ? areas[1] ?? '' : areas[0] ?? '',
        phase: kind === 'wrong-phase' ? 'farm' : 'route', ordinal: kind === 'wrong-ordinal' ? 99 : 0,
        index: 0, outcome: 'defeat'
      });
    }, 150_000, 'area-prepared-retry-act2-v1');
    expect(() => { f.run(); }).toThrow(kind === 'technical' ? 'Constructed technical error' : 'Constructed unverified nonwin');
    expect(calls).toBe(1);
    expect(f.state.attempts).toHaveLength(1);
    expect(f.state.completed).toBe(false);
  });

it('rejects training inserted between a route loss and its retry', () => {
  let first = true;
  const f = fixture(() => { if (first) { first = false; return 'defeat'; } return 'victory'; },
    150_000, 'area-prepared-retry-act2-v1');
  f.run();
  const retry = f.state.attempts[1]; assert.ok(retry); retry.kind = 'training';
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});

it('retains partial-wave income and an interrupted training attempt without claiming a clear', () => {
  const f = fixture((_area, phase) => phase === 'farm' ? 'interrupted' : 'victory');
  expect(() => { f.run(); }).toThrow('Constructed between-wave stop');
  expect(f.state.attempts.at(-1)).toMatchObject({ outcome: 'interrupted', failureStatus: 'budget' });
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ trainingAdmissions: 1, completed: false });
});

it.each(['source', 'target', 'ordinal', 'xp', 'entry-level', 'completion'] as const)('rejects forged %s custody', mutation => {
  const f = fixture(); f.run();
  const training = f.state.attempts.find(row => row.kind === 'training'); assert.ok(training);
  if (mutation === 'source') training.area = 'areas/act2-tomb-of-tal-rasha';
  if (mutation === 'target') training.targetLevel++;
  if (mutation === 'ordinal') training.nextOrdinal++;
  if (mutation === 'xp') training.terminalXp++;
  if (mutation === 'entry-level') { const row = f.state.attempts[0]; assert.ok(row); row.fromLevel = 13; }
  if (mutation === 'completion') f.state.completed = false;
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});


it('projects complete native challenge levels without consuming a store or a seed stream', () => {
  const map = useMapStore.getState(), player = usePlayerStore.getState();
  const targets = areas.map(area => actTwoPreparationTarget(area, 'challenge-prepared-act2-v1'));
  // Native scaling preserves half the authored encounter-level spread.
  expect(targets).toEqual([18, 20, 22, 26, 28, 32]);
  expect(areas.map(area => actTwoPreparationTarget(area, 'area-prepared-retry-act2-v1')))
    .toEqual([14, 16, 18, 21, 23, 25]);
  for (const [index, area] of areas.entries()) {
    const subArea = resolveSubArea(2, area); assert.ok(subArea);
    for (const seed of [0, 8, 0xffff_ffff]) for (let challengeOrdinal = 0; challengeOrdinal < 13; challengeOrdinal++) {
      const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: 'unused-authored-fallback',
        fallbackLevel: subArea.areaLevel, seed, challengeOrdinal, mode: 'manual' });
      expect(Math.max(...plan.waves.flatMap(wave => wave.spawns.map(spawn => spawn.level)))).toBe(targets[index]);
    }
  }
  expect(useMapStore.getState()).toBe(map); expect(usePlayerStore.getState()).toBe(player);
  expect(() => actTwoPreparationTarget('areas/act1-dark-wood', 'challenge-prepared-act2-v1')).toThrow();
});

it('earns the whole-challenge level before every route entry and rejects legacy-level relabeling', () => {
  const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1'); f.run();
  const route = f.state.attempts.filter(row => row.kind === 'route');
  expect(f.state.attempts[0]).toMatchObject({ kind: 'training', area: 'areas/act1-dark-wood', targetLevel: 18 });
  expect(route.map(row => row.targetLevel)).toEqual([18, 20, 22, 26, 28, 32]);
  expect(route.every(row => row.fromLevel >= row.targetLevel)).toBe(true);
  expect(f.actions.entries.map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(auditActTwoAreaPreparation(f.state, f.waves).completed).toBe(true);
  const first = route[0]; assert.ok(first); first.targetLevel = 14;
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});

it('retains all three challenge-level route losses without training between retries', () => {
  const f = fixture((_area, phase) => phase === 'route' ? 'defeat' : 'victory',
    150_000, 'challenge-prepared-act2-v1');
  expect(() => { f.run(); }).toThrow('Constructed settled nonwin');
  const route = f.state.attempts.filter(row => row.kind === 'route');
  expect(route).toHaveLength(3);
  expect(f.state.attempts.slice(-3)).toEqual(route);
  expect(route.every(row => row.fromLevel >= 18 && row.targetLevel === 18)).toBe(true);
  expect(f.actions.entries).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    routeAreas: 0, nonwinOrdinals: route.map(row => row.ordinal) });
});

it('stops challenge-level preparation at the existing training budget without admitting an underlevel hero', () => {
  const f = fixture(() => 'victory', 0, 'challenge-prepared-act2-v1');
  expect(() => { f.run(); }).toThrow('area training bound');
  expect(f.state.attempts.filter(row => row.kind === 'route')).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    trainingAdmissions: 200, routeAreas: 0 });
});

it('selects challenge-level preparation explicitly for any registered Act II build only', () => {
  const execution = campaignExecution('challenge-prepared-act2-v1');
  expect(execution.maxAdmissions).toBe(1800);
  for (const id of Object.keys(campaignProfiles))
    expect(() => { assertCampaignExecutionProfile(execution, 'act2', id); }).not.toThrow();
  for (const phase of ['intro', 'act1', 'act3', 'act4', 'act5'])
    expect(() => { assertCampaignExecutionProfile(execution, phase, 'amazon-bow-survival-managed-v1'); }).toThrow();
});


it('honors the intended lower-level margin at every Act II training boundary', () => {
  usePlayerStore.getState().gainExperience(xpTotal(22) - xpTotal(14));
  for (const area of areas.slice(0, 4)) useMapStore.getState().markCleared(area);
  const build: CampaignProfile = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' };
  const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1', build);
  f.run();
  const training = f.state.attempts.filter(row => row.kind === 'training');
  expect(training.length).toBeGreaterThan(1);
  expect(training[0]?.area).toBe('areas/act2-dry-hills');
  expect(training.some(row => row.area === 'areas/act2-far-oasis')).toBe(true);
  for (const row of training) {
    const area = resolveSubArea(row.act, row.area); assert.ok(area);
    expect(challengeEnemyLevelRange(area).max).toBeLessThanOrEqual(row.fromLevel - 2);
  }
  expect(auditActTwoAreaPreparation(f.state, f.waves).completed).toBe(true);
});

it('stops intended Act II preparation before admission when no cleared lower-level source exists', () => {
  const build: CampaignProfile = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' };
  const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1', build);
  expect(() => { f.run(); }).toThrow('No cleared lower-level Act II training area');
  expect(f.state.attempts).toEqual([]);
  expect(f.waves).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves).completed).toBe(false);
});

it('retains the intended Dark Wood fallback until a route victory, then resumes ranked selection', () => {
  usePlayerStore.getState().gainExperience(xpTotal(22) - xpTotal(14));
  for (const area of areas.slice(0, 4)) useMapStore.getState().markCleared(area);
  const build: CampaignProfile = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' };
  let failed = false;
  const f = fixture((_area, phase) => {
    if (!failed && phase === 'farm') { failed = true; return 'defeat'; }
    return 'victory';
  }, 150_000, 'challenge-prepared-act2-v1', build);
  f.run();
  const training = f.state.attempts.filter(row => row.kind === 'training');
  const loss = training[0]; assert.ok(loss);
  expect(loss).toMatchObject({ area: 'areas/act2-dry-hills', outcome: 'nonwin' });
  const fallback = training.filter(row => row.ordinal > loss.ordinal && row.entryArea === loss.entryArea);
  expect(fallback.length).toBeGreaterThan(1);
  expect(fallback.every(row => row.act === 1 && row.area === 'areas/act1-dark-wood')).toBe(true);
  expect(training.find(row => row.entryArea !== loss.entryArea)?.area).toBe('areas/act2-far-oasis');
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, trainingNonwins: 1 });
});

it('rejects a consistently relabeled ranked source while the intended fallback is active', () => {
  usePlayerStore.getState().gainExperience(xpTotal(22) - xpTotal(14));
  for (const area of areas.slice(0, 4)) useMapStore.getState().markCleared(area);
  const build: CampaignProfile = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' };
  let failed = false;
  const f = fixture((_area, phase) => {
    if (!failed && phase === 'farm') { failed = true; return 'defeat'; }
    return 'victory';
  }, 150_000, 'challenge-prepared-act2-v1', build);
  f.run();
  const loss = f.state.attempts.find(row => row.kind === 'training' && row.outcome === 'nonwin'); assert.ok(loss);
  const next = f.state.attempts.find(row => row.ordinal === loss.ordinal + 1); assert.ok(next);
  next.act = 2; next.area = 'areas/act2-dry-hills';
  for (const [index, wave] of f.waves.entries())
    if (wave.ordinal === next.ordinal) f.waves[index] = { ...wave, area: next.area };
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow('Undeclared prepared training source');
});

it('keeps intended fallback losses within the original shared nonwin bound', () => {
  usePlayerStore.getState().gainExperience(xpTotal(22) - xpTotal(14));
  for (const area of areas.slice(0, 4)) useMapStore.getState().markCleared(area);
  const build: CampaignProfile = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' };
  const f = fixture((_area, phase) => phase === 'farm' ? 'defeat' : 'victory',
    150_000, 'challenge-prepared-act2-v1', build);
  expect(() => { f.run(); }).toThrow('training nonwin bound');
  expect(f.state.attempts.filter(row => row.kind === 'training').map(row => row.area))
    .toEqual(['areas/act2-dry-hills', 'areas/act1-dark-wood', 'areas/act1-dark-wood']);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    trainingAdmissions: 3, trainingNonwins: 3 });
});

it('selects only prior-cleared Act I/II challenges within the inclusive two-level margin', () => {
  const map = useMapStore.getState(), player = usePlayerStore.getState();
  expect(actTwoTrainingSource(22, [])).toBeNull();
  expect(actTwoTrainingSource(22, ['areas/act2-lost-city'])).toBeNull();
  expect(actTwoTrainingSource(22, areas)).toEqual({ act: 2, area: areas[1] });
  expect(actTwoTrainingSource(24, areas)).toEqual({ act: 2, area: areas[2] });
  expect(actTwoTrainingSource(28, areas)).toEqual({ act: 2, area: areas[3] });
  expect(actTwoTrainingSource(30, areas)).toEqual({ act: 2, area: areas[4] });
  expect(actTwoTrainingSource(34, areas)).toEqual({ act: 2, area: areas[5] });
  expect(actTwoTrainingSource(22, ['areas/act1-dark-wood'])).toEqual({ act: 1, area: 'areas/act1-dark-wood' });
  expect(useMapStore.getState()).toBe(map); expect(usePlayerStore.getState()).toBe(player);
});

it.each(['unsafe', 'uncleared', 'lower-ranked', 'wrong-act'] as const)(
  'rejects a consistently relabeled %s intended training source using recorded prior state', mutation => {
    usePlayerStore.getState().gainExperience(xpTotal(22) - xpTotal(14));
    for (const area of areas.slice(0, 4)) useMapStore.getState().markCleared(area);
    const build: CampaignProfile = { ...profile, recoveryTrainingPolicy: 'cleared-level-margin-v1' };
    const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1', build); f.run();
    const training = f.state.attempts.find(row => row.kind === 'training'); assert.ok(training);
    if (mutation === 'wrong-act') training.act = 1;
    else {
      const unsafeArea = areas[3]; assert.ok(unsafeArea);
      training.area = mutation === 'unsafe' ? unsafeArea : mutation === 'uncleared'
        ? 'areas/act1-cold-plains' : 'areas/act1-dark-wood';
      training.act = mutation === 'unsafe' ? 2 : 1;
      for (const [index, wave] of f.waves.entries())
        if (wave.ordinal === training.ordinal) f.waves[index] = { ...wave, area: training.area };
    }
    // The completed live map already contains later clears; the audit must use initial custody.
    expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow(/Training requires a cleared source|Undeclared prepared training source/);
  });

/** Native quest actions over constructed kills/clears: no campaign balance claim. */
function preparedPrefix(length: 7 | 10 | 16 | 20) {
  const start = length === 20 ? 5 : length === 16 ? 4 : length === 10 ? 3 : 2;
  const sisters = 'quests/act1-sisters-to-the-slaughter';
  useMapStore.getState().updateQuestProgress(sisters, { status: 'completed', objectives: { 'obj-kill-andariel': true } });
  claimCampaignQuest(sisters, () => undefined, () => undefined);
  const actions = createCampaignQuestActions(() => undefined, () => undefined);
  const stop = new Error('Constructed checkpoint');
  expect(() => { runActTwo(profile, () => undefined, area => {
    if (area === areas[start]) throw stop;
    useMapStore.getState().setCurrentLocation(2, area);
    useMapStore.getState().markCleared(area);
    useMapStore.getState().recordMonsterKills({ actId: 'acts/act2', areaId: area,
      archetypeIds: [area === areas[4] ? 'monsters/act2.the-summoner' : 'monsters/act2.radament'] });
  }, { ...actions, visit: (area, act) => {
    if (length === 10 && area === areas[3]) throw stop;
    actions.visit(area, act);
  } }); }).toThrow(stop);
  for (const area of areas.slice(0, start)) useMapStore.getState().markCleared(area);
  const player = usePlayerStore.getState().player; assert.ok(player);
  usePlayerStore.getState().gainExperience(Math.max(0, xpTotal(length === 20 ? 32 : 28) - xpTotal(player.level) - player.experience));
  expect(actions.entries).toHaveLength(length);
  return actions.entries;
}

it.each([7, 16, 20] as const)('prepared suffix resumes prefix %i and retains a settled loss before victory', length => {
  const prefix = preparedPrefix(length), start = length === 20 ? 5 : length === 16 ? 4 : 2;
  let first = true;
  const f = fixture((area, phase) => {
    if (first && phase === 'route' && area === areas[start]) { first = false; return 'defeat'; }
    return 'victory';
  }, 150_000, 'challenge-prepared-act2-v1');
  f.run(prefix);
  expect(f.state.resumePrefixLength).toBe(length);
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area))
    .toEqual([areas[start], ...areas.slice(start)]);
  expect([...prefix, ...f.actions.entries].map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(f.actions.entries.filter(row => row.action === 'claim').map(row => row.id))
    .toEqual(length === 20 ? ['quests/act2-seven-tombs'] : length === 16 ? ['quests/act2-arcane-sanctuary', 'quests/act2-seven-tombs'] :
      ['quests/act2-radaments-lair', 'quests/act2-tainted-sun', 'quests/act2-horadric-staff', 'quests/act2-arcane-sanctuary', 'quests/act2-seven-tombs']);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true,
    routeAreas: 6 - start, nonwinOrdinals: [f.state.startOrdinal] });
  f.state.resumePrefixLength = length === 7 ? 16 : 7;
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});

it('prepared Tomb suffix stops after three losses without replaying Arcane or its rewards', () => {
  const prefix = preparedPrefix(20);
  const f = fixture(() => 'defeat', 150_000, 'challenge-prepared-act2-v1');
  expect(() => { f.run(prefix); }).toThrow('Constructed settled nonwin');
  expect(f.state.attempts.map(row => row.area)).toEqual(Array(3).fill(areas[5]));
  expect(f.actions.entries).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    admissions: 3, trainingAdmissions: 0, routeAreas: 0 });
});

it.each(['progress', 'receipts', 'items', 'clear'] as const)(
  'prepared Tomb suffix refuses forged %s before mutation', mutation => {
    const prefix = structuredClone(preparedPrefix(20)), last = prefix.at(-1); assert.ok(last);
    const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1');
    if (mutation === 'progress') last.after.progress = {};
    if (mutation === 'receipts') last.after.receipts = { forged: true };
    if (mutation === 'items') last.after.items = {};
    if (mutation === 'clear') useMapStore.setState({ clearedSubAreas:
      useMapStore.getState().clearedSubAreas.filter(id => id !== areas[4]) });
    const before = observeEarnedState();
    expect(() => { f.run(prefix); }).toThrow();
    expect(observeEarnedState()).toEqual(before);
    expect(f.state.attempts).toEqual([]); expect(f.waves).toEqual([]);
  });

it('prepared suffix stops after three Arcane losses with no new quest action', () => {
  const prefix = preparedPrefix(16);
  const f = fixture(() => 'defeat', 150_000, 'challenge-prepared-act2-v1');
  expect(() => { f.run(prefix); }).toThrow('Constructed settled nonwin');
  expect(f.state.attempts.map(row => row.area)).toEqual(Array(3).fill(areas[4]));
  expect(f.actions.entries).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    admissions: 3, trainingAdmissions: 0, routeAreas: 0 });
});

it.each(['length', 'order', 'result', 'progress', 'receipts', 'items', 'clear', 'action-custody'] as const)(
  'prepared suffix refuses forged %s before growth, equipment or admission', mutation => {
    const prefix = structuredClone(preparedPrefix(16));
    const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1');
    const last = prefix.at(-1), first = prefix[0]; assert.ok(last && first);
    if (mutation === 'length') prefix.pop();
    if (mutation === 'order') prefix.reverse();
    if (mutation === 'result') prefix[0] = { ...first, result: 'refused' };
    if (mutation === 'progress') last.after.progress = {};
    if (mutation === 'receipts') last.after.receipts = { forged: true };
    if (mutation === 'items') last.after.items = {};
    if (mutation === 'clear') useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs', 'areas/act1-dark-wood'] });
    if (mutation === 'action-custody') f.actions.entries.push(first);
    const before = observeEarnedState();
    expect(() => { f.run(prefix); }).toThrow();
    expect(observeEarnedState()).toEqual(before);
    expect(f.state.attempts).toEqual([]); expect(f.waves).toEqual([]);
  });


function carriedArcaneAttempts(count: number, tomb = false): ActTwoRouteCarry {
  const player = usePlayerStore.getState().player; assert.ok(player);
  const total = xpTotal(player.level) + player.experience;
  useMapStore.setState({ challengeOrdinals: { normal: count, nightmare: 0, hell: 0 } });
  const area = areas[tomb ? 5 : 4]; assert.ok(area);
  return { attempts: Array.from({ length: count }, (_, ordinal) => ({ kind: 'route', act: 2, area,
    entryArea: area, targetLevel: tomb ? 32 : 28, ordinal, nextOrdinal: ordinal + 1,
    fromLevel: player.level, terminalLevel: player.level, fromXp: total, terminalXp: total,
    outcome: 'nonwin', failureStatus: 'nonwin' })),
    waves: Array.from({ length: count }, (_, ordinal) => ({ area, ordinal, phase: 'route', index: 0,
      outcome: 'draw', advance: 'defeat', logicalMs: 60000, xp: 0, items: 0,
      heroLife: 1, heroMana: 1 })) };
}

it.each([1, 2])('prepared Tomb suffix retains %i previous attempts within the three-attempt limit', count => {
  const prefix = preparedPrefix(20), prior = carriedArcaneAttempts(count, true);
  const f = fixture(() => 'defeat', 150_000, 'challenge-prepared-act2-v1');
  expect(() => { f.run(prefix, prior); }).toThrow('Constructed settled nonwin');
  expect(f.state.attempts).toHaveLength(3 - count);
  expect(f.state.attempts.every(row => row.area === areas[5])).toBe(true);
  expect(f.actions.entries).toEqual([]);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    admissions: 3 - count, carriedRouteAttempts: count, trainingAdmissions: 0, routeAreas: 0 });
});

it.each([1, 2])('carried retries retain %i previous attempts and consume only the remaining three-attempt budget', count => {
  const prefix = preparedPrefix(16), prior = carriedArcaneAttempts(count);
  const f = fixture(() => 'defeat', 150_000, 'challenge-prepared-act2-v1');
  expect(() => { f.run(prefix, prior); }).toThrow('Constructed settled nonwin');
  expect(f.state.attempts).toHaveLength(3 - count);
  expect(f.actions.entries).toEqual([]);
  expect(f.state.priorRoute).toEqual(prior);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false,
    admissions: 3 - count, carriedRouteAttempts: count, trainingAdmissions: 0, routeAreas: 0,
    nonwinOrdinals: Array.from({ length: 3 - count }, (_, index) => count + index) });
});

it('carried retries reset only after area victory and keep earlier costs outside new admission totals', () => {
  const prefix = preparedPrefix(16), prior = carriedArcaneAttempts(2);
  let tombAttempts = 0;
  const f = fixture((area, phase) => phase === 'route' && area === areas[5] && ++tombAttempts < 3
    ? 'defeat' : 'victory', 150_000, 'challenge-prepared-act2-v1');
  f.run(prefix, prior);
  expect(tombAttempts).toBe(3);
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area))
    .toEqual([areas[4], areas[5], areas[5], areas[5]]);
  expect([...prefix, ...f.actions.entries].map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true,
    admissions: f.state.attempts.length, carriedRouteAttempts: 2, routeAreas: 2 });
  const first = f.state.attempts[0]; assert.ok(first);
  // Relabelling the retained two attempts as zero must not make an added retry lawful.
  f.state.attempts.splice(1, 0, { ...first, outcome: 'nonwin', failureStatus: 'nonwin' });
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});

it.each(['empty', 'exhausted', 'foreign-area', 'stale-ordinal', 'xp', 'entry-level', 'victory',
  'training', 'missing-wave', 'extra-wave', 'wave-xp', 'wave-terminal', 'wave-phase', 'gap'] as const)(
  'carried retries reject %s custody before mutation or admission', mutation => {
  const prefix = preparedPrefix(16), prior = carriedArcaneAttempts(mutation === 'exhausted' ? 3 : 2);
  const row = prior.attempts[0], last = prior.attempts.at(-1), wave = prior.waves[0]; assert.ok(row && last && wave);
  if (mutation === 'empty') prior.attempts.length = 0;
  if (mutation === 'foreign-area') row.area = areas[3] ?? '';
  if (mutation === 'stale-ordinal') last.nextOrdinal++;
  if (mutation === 'xp') last.terminalXp++;
  if (mutation === 'entry-level') row.fromLevel--;
  if (mutation === 'victory') row.outcome = 'victory';
  if (mutation === 'training') row.kind = 'training';
  if (mutation === 'missing-wave') prior.waves.pop();
  if (mutation === 'extra-wave') prior.waves.push({ ...wave, ordinal: 100 });
  if (mutation === 'wave-xp') prior.waves[0] = { ...wave, xp: 1 };
  if (mutation === 'wave-terminal') prior.waves[0] = { ...wave, advance: 'next-wave' };
  if (mutation === 'wave-phase') prior.waves[0] = { ...wave, phase: 'farm' };
  if (mutation === 'gap') last.ordinal++;
  const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1');
  const before = observeEarnedState();
  expect(() => { f.run(prefix, prior); }).toThrow();
  expect(observeEarnedState()).toEqual(before);
  expect(f.state.attempts).toEqual([]); expect(f.waves).toEqual([]);
});

it('carried retries reject a corrupted retained wave during independent audit', () => {
  const prefix = preparedPrefix(16), prior = carriedArcaneAttempts(1);
  const f = fixture(() => 'defeat', 150_000, 'challenge-prepared-act2-v1');
  expect(() => { f.run(prefix, prior); }).toThrow('Constructed settled nonwin');
  expect(auditActTwoAreaPreparation(f.state, f.waves).carriedRouteAttempts).toBe(1);
  const retained = f.state.priorRoute; assert.ok(retained);
  const wave = retained.waves[0]; assert.ok(wave);
  retained.waves[0] = { ...wave, outcome: 'victory', advance: 'victory' };
  expect(() => auditActTwoAreaPreparation(f.state, f.waves)).toThrow();
});


it('prepared ten-action suffix skips three earned areas and already paid Radament rewards', () => {
  const prefix = preparedPrefix(10);
  const f = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1');
  f.run(prefix);
  expect(f.state.resumePrefixLength).toBe(10);
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area)).toEqual(areas.slice(3));
  expect(f.actions.entries[0]).toMatchObject({ action: 'visit', id: areas[3] });
  expect(f.actions.entries.filter(row => row.action === 'claim').map(row => row.id)).toEqual([
    'quests/act2-tainted-sun', 'quests/act2-horadric-staff', 'quests/act2-arcane-sanctuary', 'quests/act2-seven-tombs'
  ]);
  expect([...prefix, ...f.actions.entries].map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  expect(auditActTwoAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, routeAreas: 3 });
});


function bookTrainingCheckpoint() {
  const prefix = preparedPrefix(10);
  const player = usePlayerStore.getState().player; assert.ok(player);
  // Constructed L23 preparation fixture, never an earned gameplay claim.
  usePlayerStore.setState({ player: { ...player, level: 23, experience: 0 } });
  return prefix;
}

it('carried Book training preserves its exhausted per-area budget across the ten-action checkpoint', () => {
  const prefix = bookTrainingCheckpoint();
  const previous = fixture(() => 'victory', 0, 'challenge-prepared-act2-v1');
  expect(() => { previous.run(prefix); }).toThrow('area training bound');
  expect(auditActTwoAreaPreparation(previous.state, previous.waves).trainingAdmissions).toBe(200);
  const saved = structuredClone(previous.state);
  const current = fixture(() => 'victory', 0, 'challenge-prepared-act2-v1');
  expect(() => { current.run(prefix, undefined, { preparation: previous.state, waves: previous.waves }); })
    .toThrow('area training bound');
  expect(current.state.attempts).toEqual([]); expect(current.waves).toEqual([]);
  expect(current.actions.entries).toEqual([]); expect(previous.state).toEqual(saved);
  expect(auditActTwoAreaPreparation(current.state, current.waves)).toMatchObject({
    trainingAdmissions: 0, completed: false, continuation: { trainingAdmissions: 200 }
  });
});

it('carried Book training retains an interrupted admission without replaying its paid waves', () => {
  const prefix = bookTrainingCheckpoint();
  const previous = fixture(() => 'interrupted', 0, 'challenge-prepared-act2-v1');
  expect(() => { previous.run(prefix); }).toThrow('between-wave stop');
  const saved = structuredClone(previous.state);
  const current = fixture(() => 'victory', 500_000, 'challenge-prepared-act2-v1');
  current.run(prefix, undefined, { preparation: previous.state, waves: previous.waves });
  expect(current.state.startOrdinal).toBe(previous.state.nextOrdinal);
  expect(current.state.attempts[0]).toMatchObject({ kind: 'training', ordinal: previous.state.nextOrdinal });
  expect(previous.state).toEqual(saved);
  expect([...prefix, ...current.actions.entries].map(row => [row.action, row.id])).toEqual(actTwoActionOrder);
  const audit = auditActTwoAreaPreparation(current.state, current.waves);
  expect(audit.completed).toBe(true);
  expect(audit.continuation.trainingAdmissions).toBe(audit.trainingAdmissions + 1);
});

it.each(['ordinal', 'xp', 'clear', 'mode', 'policy', 'route', 'missing-wave', 'extra-wave', 'wave-xp', 'technical'] as const)(
  'carried Book training rejects %s discontinuity before native mutation', mutation => {
    const prefix = bookTrainingCheckpoint();
    const previous = fixture(() => 'interrupted', 0, 'challenge-prepared-act2-v1');
    expect(() => { previous.run(prefix); }).toThrow('between-wave stop');
    const carry = structuredClone({ preparation: previous.state, waves: previous.waves });
    const row = carry.preparation.attempts[0], wave = carry.waves[0]; assert.ok(row && wave);
    if (mutation === 'ordinal') carry.preparation.nextOrdinal++;
    if (mutation === 'xp') row.terminalXp++;
    if (mutation === 'clear') carry.preparation.initialCleared.pop();
    if (mutation === 'mode') carry.preparation = { ...carry.preparation, mode: 'area-prepared-act2-v1' };
    if (mutation === 'policy') carry.preparation.trainingPolicy = 'cleared-level-margin-v1';
    if (mutation === 'route') row.entryArea = areas[4] ?? '';
    if (mutation === 'missing-wave') carry.waves.pop();
    if (mutation === 'extra-wave') carry.waves.push({ ...wave, ordinal: 100 });
    if (mutation === 'wave-xp') carry.waves[0] = { ...wave, xp: 1 };
    if (mutation === 'technical') carry.preparation.failureStatus = 'technical';
    const current = fixture(() => 'victory', 150_000, 'challenge-prepared-act2-v1');
    const before = observeEarnedState();
    expect(() => { current.run(prefix, undefined, carry); }).toThrow();
    expect(observeEarnedState()).toEqual(before);
    expect(current.state.attempts).toEqual([]); expect(current.waves).toEqual([]);
    expect(current.actions.entries).toEqual([]);
  });
