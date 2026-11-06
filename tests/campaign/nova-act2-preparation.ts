import assert from 'node:assert/strict';
import { levelForXp, xpTotal } from '@/engine/progression/xp';
import type { DerivedStats } from '@/engine/types/attributes';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { resolveSubArea } from '@/stores/subAreaResolver';
import type { CampaignProfile, CampaignWave } from './policy';
import { growCampaignBuild, returnCampaignToMap, type CampaignRecord } from './actions';
import { equipCampaignMercGear } from './merc-gear';
import { runActTwo } from './act2-route';
import type { createCampaignQuestActions } from './quest-actions';
import { CampaignStop } from './route';
import { equipCampaignCasterGear, prepareNovaActTwoOpening, resetCampaignPoints, novaActTwoProfile } from './caster-preparation';
import { prepareNovaTombSockets } from './socket-preparation';
import type { CampaignReward } from './economy';

const routeAreas = ['areas/act2-rocky-waste', 'areas/act2-dry-hills', 'areas/act2-far-oasis',
  'areas/act2-lost-city', 'areas/act2-arcane-sanctuary', 'areas/act2-tomb-of-tal-rasha'] as const;
const safeFarm = { act: 1, area: 'areas/act1-dark-wood' };
const hero = () => { const player = usePlayerStore.getState().player; assert.ok(player); return player; };
const totalXp = () => xpTotal(hero().level) + hero().experience;
const ordinal = () => useMapStore.getState().challengeOrdinals.normal;

export interface NovaActTwoAttempt {
  kind: 'route' | 'training';
  purpose: string;
  targetLevel: number | null;
  act: number;
  area: string;
  ordinal: number;
  nextOrdinal: number;
  fromLevel: number;
  terminalLevel: number;
  fromXp: number;
  terminalXp: number;
  outcome: 'victory' | 'nonwin' | 'interrupted';
  failureStatus: 'nonwin' | 'budget' | 'technical' | null;
}
export interface NovaActTwoRecovery {
  area: string;
  failedOrdinal: number;
  fromLevel: number;
  targetLevel: number;
  retryOrdinal: number | null;
}
export interface NovaActTwoPreparation {
  readonly mode: 'nova-act2-prepared-v1';
  readonly startOrdinal: number;
  nextOrdinal: number;
  readonly initialCleared: string[];
  attempts: NovaActTwoAttempt[];
  recoveries: NovaActTwoRecovery[];
  profile: CampaignProfile | null;
  baseline: DerivedStats | null;
  offensePrepared: boolean;
  completed: boolean;
}

/** Reserve the mutable evidence before the first fallible preparation action. */
export function createNovaActTwoPreparation(): NovaActTwoPreparation {
  return { mode: 'nova-act2-prepared-v1', startOrdinal: ordinal(), nextOrdinal: ordinal(),
    initialCleared: [...useMapStore.getState().clearedSubAreas], attempts: [], recoveries: [],
    profile: null, baseline: null, offensePrepared: false, completed: false };
}

/** Fresh native six-area policy; callbacks retain every wave, cost, capacity decision and global bound. */
export function runPreparedNovaActTwo(initialProfile: CampaignProfile, record: CampaignRecord,
  enter: (act: number, area: string, phase: 'farm' | 'route') => void,
  actions: ReturnType<typeof createCampaignQuestActions>, state: NovaActTwoPreparation,
  onInsertion: (delta: CampaignReward) => void = () => undefined,
  recoverCapacity: () => void = () => undefined): CampaignProfile {
  assert.equal(state.startOrdinal, ordinal()); assert.equal(state.attempts.length, 0);
  assert.ok(hero().level >= 14 && useMapStore.getState().isActUnlocked(2));
  assert.ok(state.initialCleared.includes(safeFarm.area), 'Native safe farm must already be cleared');
  let profile = novaActTwoProfile(initialProfile, false), cold = false, socketsPrepared = false;
  state.profile = profile;
  let lastCleared = safeFarm, trainingAdmissions = 0, trainingNonwins = 0;
  const boundary = () => {
    if (hero().level > 28) throw new CampaignStop('budget', 'Nova Act II level28 envelope reached');
    growCampaignBuild(profile, record);
    equipCampaignCasterGear(baseline, record, state.offensePrepared ? 'critical' : 'survival');
    equipCampaignMercGear(record, true);
  };
  const attempt = (act: number, area: string, kind: 'route' | 'training', purpose: string, targetLevel: number | null = null) => {
    const row: NovaActTwoAttempt = { kind, purpose, targetLevel, act, area, ordinal: ordinal(), nextOrdinal: ordinal(),
      fromLevel: hero().level, terminalLevel: hero().level, fromXp: totalXp(), terminalXp: totalXp(),
      outcome: 'interrupted', failureStatus: null };
    state.attempts.push(row);
    try {
      enter(act, area, kind === 'route' ? 'route' : 'farm'); row.outcome = 'victory';
    } catch (error) {
      row.failureStatus = error instanceof CampaignStop ? error.status : 'technical';
      if (!(error instanceof CampaignStop) || error.status !== 'nonwin' ||
        error.settledNonwin?.area !== area || error.settledNonwin.ordinal !== row.ordinal ||
        error.settledNonwin.phase !== (kind === 'route' ? 'route' : 'farm')) throw error;
      row.outcome = 'nonwin'; returnCampaignToMap();
    } finally {
      row.nextOrdinal = ordinal(); row.terminalLevel = hero().level; row.terminalXp = totalXp();
      state.nextOrdinal = ordinal(); record({ kind: 'act2-prepared-attempt', attempt: row });
    }
    assert.equal(row.nextOrdinal, row.ordinal + 1, 'Prepared attempt requires one native admission');
    boundary(); return row;
  };
  const trainTo = (targetLevel: number, purpose: string, allowBoundedEntry = false) => {
    let count = 0;
    while (hero().level < targetLevel) {
      if (trainingAdmissions >= 256) throw new CampaignStop('budget', 'Nova Act II total training bound reached');
      if (trainingNonwins >= 3) throw new CampaignStop('nonwin', 'Nova Act II training nonwin bound reached');
      if (count >= 64) {
        if (allowBoundedEntry) { record({ kind: 'act2-bounded-first-entry', purpose, targetLevel, level: hero().level }); return; }
        throw new CampaignStop('budget', 'Nova Act II purpose training bound reached');
      }
      assert.ok(useMapStore.getState().clearedSubAreas.includes(lastCleared.area));
      boundary(); count++; trainingAdmissions++;
      const trained = attempt(lastCleared.act, lastCleared.area, 'training', purpose, targetLevel);
      if (trained.outcome === 'nonwin') {
        trainingNonwins++;
        if (lastCleared.act === 2) { record({ kind: 'act2-safe-farm-fallback', failedOrdinal: trained.ordinal,
          failedArea: lastCleared.area, target: safeFarm }); lastCleared = safeFarm; }
        if (trainingNonwins >= 3) throw new CampaignStop('nonwin', 'Nova Act II training nonwin bound reached');
      }
    }
  };
  const entry = (area: string) => {
    const definition = resolveSubArea(2, area); assert.ok(definition);
    trainTo(definition.areaLevel, `first-entry:${area}`, true);
    if (area === 'areas/act2-lost-city') {
      trainTo(23, 'cold-evolution:23');
      trainTo(24, 'cold-evolution:24');
    }
    if (!cold && hero().level >= 24) {
      resetCampaignPoints('skill', record); profile = novaActTwoProfile(initialProfile, true);
      state.profile = profile; cold = true; boundary();
      assert.equal(hero().skillLevels?.['sorceress.blizzard'], 20);
    }
    for (let number = 1; number <= 3; number++) {
      boundary();
      if (area === 'areas/act2-tomb-of-tal-rasha') {
        if (!socketsPrepared) {
          socketsPrepared = true; recoverCapacity(); prepareNovaTombSockets(record, onInsertion);
        }
        if (!state.offensePrepared) {
          resetCampaignPoints('stat', record);
          profile = { ...profile, statsPerLevel: { strength: 0, dexterity: 5, vitality: 0, energy: 0 },
            priority: ['sorceress.static_field', 'sorceress.blizzard'] };
          state.profile = profile; state.offensePrepared = true;
          record({ kind: 'act2-owned-offense-preparation', ordinal: ordinal(), profile });
          boundary();
        }
        const order = [...profile.priority];
        assert.ok(order.every(id => (hero().skillLevels?.[id] ?? 0) > 0));
        usePlayerStore.getState().setComboOrder(order); record({ kind: 'act2-tomb-priority', order });
      }
      const played = attempt(2, area, 'route', `route:${area}:${String(number)}`);
      if (played.outcome === 'victory') { lastCleared = { act: 2, area }; return; }
      if (number === 3) throw new CampaignStop('nonwin', `Nova Act II ${area}: three route attempts exhausted`);
      if (state.recoveries.length >= 6 || hero().level >= 28)
        throw new CampaignStop('budget', 'Nova Act II retry envelope reached');
      const recovery: NovaActTwoRecovery = { area, failedOrdinal: played.ordinal,
        fromLevel: hero().level, targetLevel: hero().level + 1, retryOrdinal: null };
      state.recoveries.push(recovery); record({ kind: 'act2-prepared-recovery', recovery });
      trainTo(recovery.targetLevel, `retry:${String(played.ordinal)}`);
      recovery.retryOrdinal = ordinal(); record({ kind: 'act2-prepared-retry-ready', recovery });
    }
  };
  prepareNovaActTwoOpening(initialProfile, record); resetCampaignPoints('stat', record);
  const baseline = structuredClone(hero().derivedStats);
  state.baseline = baseline;
  try {
    boundary(); entry(routeAreas[0]);
    const preparedActions = { ...actions, visit: (area: string, act = 2) => {
      if (area === routeAreas[1] || area === routeAreas[3]) entry(area);
      actions.visit(area, act);
    } };
    runActTwo(profile, record, area => { entry(area); }, preparedActions, boundary);
    state.completed = true; return profile;
  } finally { state.nextOrdinal = ordinal(); }
}

/** Independently reconcile the entire within-act admission span, training sources, XP and retries. */
export function auditNovaActTwoPreparation(state: NovaActTwoPreparation, waves: readonly CampaignWave[]) {
  assert.equal(state.mode, 'nova-act2-prepared-v1');
  assert.ok(state.initialCleared.includes(safeFarm.area));
  assert.ok(state.nextOrdinal >= state.startOrdinal && state.recoveries.length <= 6);
  if (state.offensePrepared) {
    assert.ok(state.profile);
    assert.deepEqual(state.profile.statsPerLevel, { strength: 0, dexterity: 5, vitality: 0, energy: 0 });
    assert.deepEqual(state.profile.priority, ['sorceress.static_field', 'sorceress.blizzard']);
  } else assert.ok(!state.attempts.some(attempt => attempt.area === 'areas/act2-tomb-of-tal-rasha'),
    'Tomb admission without owned offensive preparation');
  const cleared = new Set(state.initialCleared), nonwinOrdinals: number[] = [];
  let lastCleared = safeFarm, next = state.startOrdinal, trainingAdmissions = 0, trainingNonwins = 0, xp = 0;
  const purposes = new Map<string, number>(), routeCounts = new Map<string, number>();
  const successfulRouteAreas: string[] = [];
  for (const [index, attempt] of state.attempts.entries()) {
    assert.equal(attempt.ordinal, next, 'Prepared admission gap/overlap');
    assert.ok(attempt.nextOrdinal === next || attempt.nextOrdinal === next + 1, 'Prepared admission span mismatch');
    next = attempt.nextOrdinal;
    assert.ok(attempt.fromLevel <= 28 && attempt.fromLevel >= 14);
    for (const value of [attempt.fromXp, attempt.terminalXp]) assert.ok(Number.isSafeInteger(value) && value >= 0);
    assert.equal(attempt.fromLevel, levelForXp(attempt.fromXp));
    assert.equal(attempt.terminalLevel, levelForXp(attempt.terminalXp));
    const rows = waves.filter(row => row.ordinal === attempt.ordinal && row.ordinal < attempt.nextOrdinal);
    assert.ok(rows.every(row => row.area === attempt.area && row.phase === (attempt.kind === 'route' ? 'route' : 'farm')));
    assert.deepEqual(rows.map(row => row.index), rows.map((_row, waveIndex) => waveIndex));
    assert.equal(attempt.terminalXp, attempt.fromXp + rows.reduce((sum, row) => sum + row.xp, 0), 'Prepared XP mismatch');
    xp += attempt.terminalXp - attempt.fromXp;
    for (const row of rows.slice(0, -1)) assert.ok(row.outcome === 'victory' && row.advance === 'next-wave' && row.heroLife > 0);
    const last = rows.at(-1);
    if (attempt.outcome === 'victory') assert.ok(last?.outcome === 'victory' && last.advance === 'victory' && last.heroLife > 0);
    else if (attempt.outcome === 'nonwin') {
      assert.ok(last?.outcome !== 'victory' && last?.advance === 'defeat');
      assert.equal(attempt.failureStatus, 'nonwin'); nonwinOrdinals.push(attempt.ordinal);
    } else {
      assert.equal(index, state.attempts.length - 1, 'Continuation after interrupted preparation');
      assert.ok(attempt.failureStatus === 'budget' || attempt.failureStatus === 'technical');
      if (last) assert.equal(last.advance, 'next-wave');
    }
    if (attempt.kind === 'training') {
      assert.ok(attempt.targetLevel !== null && attempt.fromLevel < attempt.targetLevel && attempt.targetLevel <= 28);
      const routeArea = routeAreas[successfulRouteAreas.length]; assert.ok(routeArea);
      if (attempt.purpose.startsWith('first-entry:')) {
        assert.equal(attempt.purpose, `first-entry:${routeArea}`);
        const definition = resolveSubArea(2, routeArea); assert.ok(definition);
        assert.equal(attempt.targetLevel, definition.areaLevel);
      } else if (attempt.purpose.startsWith('cold-evolution:')) {
        assert.equal(routeArea, 'areas/act2-lost-city');
        assert.equal(routeCounts.get(routeArea) ?? 0, 0, 'Cold evolution must precede first Lost City entry');
        assert.ok(attempt.purpose === 'cold-evolution:23' || attempt.purpose === 'cold-evolution:24');
        assert.equal(attempt.targetLevel, attempt.purpose === 'cold-evolution:23' ? 23 : 24);
        if (attempt.targetLevel === 24) assert.ok(attempt.fromLevel >= 23, 'Cold level23 target not earned');
        else assert.ok(!purposes.has('cold-evolution:24'), 'Cold training purposes reversed');
      } else {
        const failedOrdinal = Number(attempt.purpose.slice('retry:'.length));
        assert.equal(attempt.purpose, `retry:${String(failedOrdinal)}`);
        const recovery = state.recoveries.find(row => row.failedOrdinal === failedOrdinal);
        assert.ok(recovery && recovery.area === routeArea && failedOrdinal < attempt.ordinal);
        assert.equal(attempt.targetLevel, recovery.targetLevel);
      }
      assert.deepEqual({ act: attempt.act, area: attempt.area }, lastCleared, 'Undeclared training source');
      assert.ok(cleared.has(attempt.area)); trainingAdmissions++;
      const count = (purposes.get(attempt.purpose) ?? 0) + 1; purposes.set(attempt.purpose, count);
      assert.ok(count <= 64 && trainingAdmissions <= 256);
      if (attempt.outcome === 'nonwin') { trainingNonwins++; if (lastCleared.act === 2) lastCleared = safeFarm; }
      assert.ok(trainingNonwins <= 3);
      if (trainingNonwins === 3) assert.equal(index, state.attempts.length - 1, 'Continuation after training loss bound');
    } else {
      assert.equal(attempt.targetLevel, null);
      assert.equal(attempt.act, 2);
      assert.equal(attempt.area, routeAreas[successfulRouteAreas.length], 'Prepared route area/order mismatch');
      if (attempt.area === 'areas/act2-lost-city')
        assert.ok(attempt.fromLevel >= 24, 'Lost City requires earned cold-transition level');
      const count = (routeCounts.get(attempt.area) ?? 0) + 1; routeCounts.set(attempt.area, count);
      assert.ok(count <= 3); assert.equal(attempt.purpose, `route:${attempt.area}:${String(count)}`);
      if (attempt.outcome === 'victory') {
        successfulRouteAreas.push(attempt.area); cleared.add(attempt.area); lastCleared = { act: 2, area: attempt.area };
      }
    }
  }
  assert.equal(next, state.nextOrdinal, 'Prepared terminal admission mismatch');
  assert.equal(waves.filter(row => row.ordinal >= state.startOrdinal && row.ordinal < state.nextOrdinal).length,
    state.attempts.reduce((sum, attempt) => sum + waves.filter(row => row.ordinal === attempt.ordinal && row.ordinal < attempt.nextOrdinal).length, 0));
  const recovered = new Set<number>();
  for (const recovery of state.recoveries) {
    assert.ok(!recovered.has(recovery.failedOrdinal)); recovered.add(recovery.failedOrdinal);
    const failed = state.attempts.find(row => row.ordinal === recovery.failedOrdinal);
    assert.ok(failed?.kind === 'route' && failed.outcome === 'nonwin' && failed.area === recovery.area);
    assert.equal(recovery.fromLevel, failed.terminalLevel); assert.equal(recovery.targetLevel, recovery.fromLevel + 1);
    assert.ok(recovery.targetLevel <= 28);
    if (recovery.retryOrdinal !== null) {
      const retry = state.attempts.find(row => row.ordinal === recovery.retryOrdinal);
      // A shared budget may stop immediately before the retry's native admission.
      assert.ok(retry?.kind === 'route' && retry.area === recovery.area && retry.fromLevel >= recovery.targetLevel);
      assert.ok(recovery.retryOrdinal > recovery.failedOrdinal);
    }
  }
  for (const [index, attempt] of state.attempts.entries()) {
    if (attempt.kind !== 'route' || attempt.outcome !== 'nonwin') continue;
    if (state.attempts.slice(index + 1).some(row => row.kind === 'route'))
      assert.ok(recovered.has(attempt.ordinal), 'Route continuation without declared earned recovery');
  }
  if (state.completed) assert.deepEqual(successfulRouteAreas, routeAreas);
  return { completed: state.completed, routeAdmissions: state.attempts.filter(row => row.kind === 'route').length,
    trainingAdmissions, trainingNonwins, xp, nonwinOrdinals };
}
