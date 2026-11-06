/** Constructed admissions verify custody and world-action integration, never earned balance. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { resolveChallengeWavePlan } from '@/engine/combat/sub-area-run';
import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { useHydrationStore } from '@/stores/hydrationStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import type { CampaignProfile, CampaignWave, TrainingCurseRecovery } from './policy';
import { trainingCurseRecovery } from './training-draw-recovery';
import { growCampaignBuild, prepareCampaignCombo } from './actions';
import { CampaignStop } from './route';
import { createCampaignQuestActions } from './quest-actions';
import { constructActFivePrefix, publishConstructedActFiveWave } from './act5-fixture';
import { actFiveMainActionOrder, runActFive, resumeActFiveMain } from './act5-route';
import { actFivePreparationAreas, actFivePreparationTarget, actFiveTrainingSource,
  createActFiveAreaPreparation, createActFivePreparationFromUnpreparedRoute,
  enterPreparedActFiveArea, auditActFiveAreaPreparation, type ActFiveAreaAttempt } from './act5-area-preparation';

const profile = campaignProfiles['necromancer-bone-intended-v1'];
const safe = 'areas/act1-dark-wood';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793418805210);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function prefix(level = 61) {
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act5 QA', 'necromancer').ok).toBe(true);
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(level));
  useMapStore.getState().updateQuestProgress('quests/act4-terrors-end', {
    status: 'completed', rewardClaimed: true,
    objectives: { 'obj-seal-1': true, 'obj-seal-2': true, 'obj-seal-3': true, 'obj-kill-diablo': true } });
  for (const area of [safe, 'areas/act4-plains-of-despair', 'areas/act4-river-of-flame', 'areas/act4-chaos-sanctuary'])
    useMapStore.getState().markCleared(area);
}
function fixture(farmXp = 5_000_000, routeDraw = false, trainingDrawArea?: string) {
  let trainingDrawn = false;
  const state = createActFiveAreaPreparation();
  expect(state.trainingFallbackPolicy).toBe('ranked-cleared-v1');
  const waves: CampaignWave[] = [], records: Readonly<Record<string, unknown>>[] = [];
  const enter = (act: number, area: string, phase: 'farm' | 'route', _recovery?: TrainingCurseRecovery) => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    map.setCurrentLocation(act, area);
    const draw = phase === 'route' && routeDraw || phase === 'farm' && area === trainingDrawArea && !trainingDrawn;
    if (phase === 'farm' && draw) trainingDrawn = true;
    const xp = draw ? 0 : phase === 'farm' ? farmXp : 1000;
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ phase, area, ordinal, index: 0, outcome: draw ? 'draw' : 'victory',
      advance: draw ? 'defeat' : 'victory', logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
    if (draw) throw new CampaignStop('nonwin', 'Constructed settled draw', { area, phase, ordinal, index: 0, outcome: 'draw' });
    map.markCleared(area);
  };
  const record = (row: Readonly<Record<string, unknown>>) => { records.push(row); };
  const next = (area: string) => { enterPreparedActFiveArea(profile, record, enter, state, area, waves); };
  return { state, waves, records, next, enter, record };
}

it('projects ordered full targets and covers all finite original Throne quest sources without mutation', () => {
  prefix(); const before = observeEarnedState();
  expect(actFivePreparationAreas.map(actFivePreparationTarget)).toEqual([60, 63, 71, 75, 82]);
  const area = actFivePreparationAreas[4], definition = resolveSubArea(5, area); assert.ok(definition);
  const plan = resolveChallengeWavePlan({ subArea: definition, seed: 1, mode: 'manual',
    fallbackArchetypeId: 'structural-only', fallbackLevel: definition.areaLevel, challengeOrdinal: 0,
    questSourceProjection: 'act5-throne' });
  expect(plan.waves).toHaveLength(8);
  expect(plan.waves.every(wave => wave.spawns.every(spawn => spawn.level <= actFivePreparationTarget(area)))).toBe(true);
  expect(() => actFivePreparationTarget('areas/act4-chaos-sanctuary')).toThrow();
  expect(observeEarnedState()).toEqual(before);
});
it('selects earned Act IV and V sources inside the two-level margin', () => {
  prefix();
  expect(actFiveTrainingSource(61, ['areas/act4-river-of-flame', 'areas/act4-chaos-sanctuary']))
    .toEqual({ act: 4, area: 'areas/act4-river-of-flame' });
  expect(actFiveTrainingSource(63, [safe, actFivePreparationAreas[0], actFivePreparationAreas[1]]))
    .toEqual({ act: 5, area: actFivePreparationAreas[0] });
  expect(actFiveTrainingSource(65, [safe, actFivePreparationAreas[0], actFivePreparationAreas[1]]))
    .toEqual({ act: 5, area: actFivePreparationAreas[1] });
  expect(actFiveTrainingSource(61, [actFivePreparationAreas[1]])).toBe(null);
});
it.each(['quest', 'receipt', 'clear', 'unclaimed'] as const)('rejects a nonfresh %s Act V boundary before mutation', kind => {
  prefix(); const map = useMapStore.getState();
  if (kind === 'quest') map.updateQuestProgress('quests/act5-siege-on-harrogath', { status: 'inProgress' });
  if (kind === 'receipt') useMapStore.setState({ questReceipts: { 'quests/act5-siege-on-harrogath#action:shenk-victory': true } });
  if (kind === 'clear') map.markCleared(actFivePreparationAreas[0]);
  if (kind === 'unclaimed') map.updateQuestProgress('quests/act4-terrors-end', { rewardClaimed: false });
  const before = observeEarnedState();
  expect(createActFiveAreaPreparation).toThrow(); expect(observeEarnedState()).toEqual(before);
});
it('retains ordered route custody and owning-act labels while earning all five targets', () => {
  prefix(); const f = fixture();
  for (const area of actFivePreparationAreas) f.next(area);
  expect(f.state.mode).toBe('challenge-prepared-act5-v1');
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area)).toEqual(actFivePreparationAreas);
  expect(f.state.attempts.every(row => row.kind !== 'route' || row.fromLevel >= row.targetLevel)).toBe(true);
  expect(f.records.filter(row => row.kind === 'act5-area-prepared-attempt'))
    .toEqual(f.state.attempts.map(attempt => ({ kind: 'act5-area-prepared-attempt', attempt })));
  expect(auditActFiveAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, routeAreas: 5 });
  const forged = structuredClone(f.state); assert.ok(forged.attempts[0]); forged.attempts[0].targetLevel--;
  expect(() => auditActFiveAreaPreparation(forged, f.waves)).toThrow();
});
it('refuses out-of-order entry before allocation or admission', () => {
  prefix(); const f = fixture(), before = observeEarnedState();
  expect(() => { f.next(actFivePreparationAreas[1]); }).toThrow();
  expect(observeEarnedState()).toEqual(before); expect(f.state.attempts).toEqual([]);
});
it('retains three spent route attempts and refuses a terminal controller', () => {
  prefix(); const f = fixture(5_000_000, true);
  expect(() => { f.next(actFivePreparationAreas[0]); }).toThrow('Constructed settled draw');
  expect(f.state.attempts).toHaveLength(3);
  expect(auditActFiveAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false, routeAreas: 0 });
  expect(() => { f.next(actFivePreparationAreas[0]); }).toThrow('terminal');
});
it('stops at the original 200-entry allowance before underlevel Crystalline entry', () => {
  prefix();
  usePlayerStore.getState().gainExperience(xpTotal(63) - xpTotal(61));
  const f = fixture(0);
  f.next(actFivePreparationAreas[0]); f.next(actFivePreparationAreas[1]);
  expect(() => { f.next(actFivePreparationAreas[2]); }).toThrow('area training bound');
  expect(auditActFiveAreaPreparation(f.state, f.waves)).toMatchObject({ trainingAdmissions: 200, routeAreas: 2 });
});
it('integrates five prepared areas with all19native main-quest actions and Nightmare entitlement', () => {
  const p = constructActFivePrefix('necromancer-bone-intended-v1');
  usePlayerStore.getState().gainExperience(xpTotal(61));
  useMapStore.getState().markCleared(safe);
  const f = fixture();
  const enter = (act: number, area: string, phase: 'farm' | 'route') => {
    f.enter(act, area, phase);
    if (phase !== 'route') return;
    if (area === actFivePreparationAreas[4]) {
      for (let index = 0; index < 8; index++) publishConstructedActFiveWave(index);
      return;
    }
    const map = useMapStore.getState(), contract = ACT5_ENCOUNTERS.find(row => row.areaId === area);
    if (!contract) return;
    const progress = map.questProgress[contract.questId]; assert.ok(progress);
    expect(contract.prerequisites.every(id => progress.objectives[id] === true)).toBe(true);
    map.updateQuestProgress(contract.questId, { ...progress, status: 'completed',
      objectives: { ...progress.objectives, [contract.objectiveId]: true } });
    useMapStore.setState({ questReceipts: { ...useMapStore.getState().questReceipts, [contract.proof]: true } });
  };
  runActFive(profile, f.record, area => {
    enterPreparedActFiveArea(profile, f.record, enter, f.state, area, f.waves);
  }, p.actions, 'main-quests');
  expect(p.actions.entries.slice(p.act5Start).map(row => [row.action, row.id])).toEqual(actFiveMainActionOrder);
  expect(auditActFiveAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, routeAreas: 5 });
  expect(Object.values(useMapStore.getState().questDifficulties)).toContain(true);
});


const offensive = 'necromancer.amplify_damage', defensive = 'necromancer.decrepify';
const corpse = 'necromancer.corpse_explosion', frigid = 'areas/act5-frigid-highlands';
const draw: CampaignWave = { phase: 'farm', area: frigid, ordinal: 403, index: 3,
  outcome: 'draw', advance: 'defeat', logicalMs: 60000, xp: 0, items: 0, heroLife: 1, heroMana: 1 };
const learned = { [offensive]: 1, [defensive]: 1, [corpse]: 8 };

it.each([
  ['area already offensive', [offensive, corpse], [defensive, offensive, corpse], [], false],
  ['global declaration supplies recovery', [defensive, corpse], [defensive, offensive, corpse], [], true],
  ['neither declares offensive', [defensive, corpse], [defensive, corpse], [], false],
  ['area grants declaration', [defensive, offensive, corpse], [defensive, corpse], [], true],
  ['preference already offensive', [defensive, offensive, corpse], [defensive, offensive, corpse], [offensive], false],
  ['unlearned prefix', ['necromancer.teeth', offensive, corpse], [defensive, offensive, corpse], [], false],
  ['offensive can move before corpse', [corpse, offensive], [defensive, offensive, corpse], [], true],
  ['ordinary defensive selection', [defensive, corpse, offensive], [defensive, offensive, corpse], [], true]
] as const)('training recovery requires a changed learned area order: %s', (_name, priority, global, preference, changes) => {
  const candidate: CampaignProfile = { ...profile, priority: global, priorityByArea: { [frigid]: priority },
    cursePreferenceByArea: { [frigid]: preference } };
  const before = structuredClone({ candidate, learned, draw });
  const recovery = trainingCurseRecovery(candidate, learned, frigid, 404, draw, undefined);
  expect(recovery).toEqual(changes ? { policy: 'learned-offensive-curse-v1', area: frigid, triggerOrdinal: 403 } : undefined);
  expect({ candidate, learned, draw }).toEqual(before);
});

it('falls back to the next ranked clear after an already offensive Act V training draw', () => {
  prefix();
  usePlayerStore.getState().gainExperience(xpTotal(65) - xpTotal(61));
  const f = fixture(5_000_000, false, frigid);
  for (const area of actFivePreparationAreas) f.next(area);
  const training = f.state.attempts.filter(row => row.entryArea === actFivePreparationAreas[2] && row.kind === 'training');
  expect(training.slice(0, 2).map(row => row.area)).toEqual([frigid, 'areas/act4-chaos-sanctuary']);
  expect(training.every(row => row.trainingRecovery === undefined)).toBe(true);
  expect(auditActFiveAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, trainingNonwins: 1 });
});

it('ignores a supplied redundant recovery without recording it or changing owned state', () => {
  prefix(); growCampaignBuild(profile, () => undefined);
  useMapStore.setState({ challengeOrdinals: { normal: 404, nightmare: 0, hell: 0 } });
  prepareCampaignCombo(profile, () => undefined, frigid);
  const before = observeEarnedState(), records: Readonly<Record<string, unknown>>[] = [];
  prepareCampaignCombo(profile, row => { records.push(row); }, frigid, { phase: 'farm', previousWave: draw,
    trainingRecovery: { policy: 'learned-offensive-curse-v1', area: frigid, triggerOrdinal: 403 } });
  expect(records).toEqual([{ kind: 'priority', order: [offensive, corpse] }]);
  expect(observeEarnedState()).toEqual(before);
});

/** Constructed direct route history; no actual combat or earned campaign claim. */
function unpreparedPrefix() {
  prefix(49);
  const initial = createActFiveAreaPreparation();
  const waves: CampaignWave[] = [], attempts: ActFiveAreaAttempt[] = [];
  for (const [index, area] of actFivePreparationAreas.slice(0, 3).entries()) {
    const player = usePlayerStore.getState().player; assert.ok(player);
    const fromXp = xpTotal(player.level) + player.experience;
    const ordinal = initial.startOrdinal + index, victory = index < 2;
    const xp = victory ? 1000 : 0;
    usePlayerStore.getState().gainExperience(xp);
    useMapStore.setState({ challengeOrdinals: { normal: ordinal + 1, nightmare: 0, hell: 0 } });
    if (victory) useMapStore.getState().markCleared(area);
    attempts.push({ kind: 'route', entryArea: area, targetLevel: actFivePreparationTarget(area),
      act: 5, area, ordinal, nextOrdinal: ordinal + 1, fromLevel: 49, terminalLevel: 49,
      fromXp, terminalXp: fromXp + xp, outcome: victory ? 'victory' : 'nonwin',
      failureStatus: victory ? null : 'nonwin' });
    waves.push({ phase: 'route', area, ordinal, index: 0, outcome: victory ? 'victory' : 'draw',
      advance: victory ? 'victory' : 'defeat', logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
  }
  return { history: { startOrdinal: initial.startOrdinal, fromXp: initial.fromXp,
    initialCleared: initial.initialCleared, attempts }, waves };
}

it('adopts an underlevel direct prefix without mutating native custody or dropping the failed admission', () => {
  const f = unpreparedPrefix(), before = observeEarnedState();
  const state = createActFivePreparationFromUnpreparedRoute(f.history, f.waves);
  expect(observeEarnedState()).toEqual(before);
  expect(state).toMatchObject({ unpreparedRoutePrefix: 3, startOrdinal: 0, nextOrdinal: 3,
    failureStatus: null, completed: false, trainingFallbackPolicy: 'ranked-cleared-v1' });
  expect(state.attempts).toEqual(f.history.attempts);
  expect(state.attempts).not.toBe(f.history.attempts);
  expect(auditActFiveAreaPreparation(state, f.waves)).toMatchObject({ admissions: 3, routeAreas: 2,
    trainingAdmissions: 0, nonwinOrdinals: [2] });
  expect(() => enterPreparedActFiveArea(profile, () => undefined, () => undefined, state,
    actFivePreparationAreas[0], f.waves)).toThrow('out of order');
});

it('trains the adopted checkpoint but allows only two further route attempts', () => {
  const f = unpreparedPrefix();
  const state = createActFivePreparationFromUnpreparedRoute(f.history, f.waves);
  const crystalline = actFivePreparationAreas[2];
  const enter = (_act: number, area: string, phase: 'farm' | 'route') => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    const xp = phase === 'farm' ? 50_000_000 : 0;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    usePlayerStore.getState().gainExperience(xp);
    f.waves.push({ phase, area, ordinal, index: 0, outcome: phase === 'farm' ? 'victory' : 'draw',
      advance: phase === 'farm' ? 'victory' : 'defeat', logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
    if (phase === 'route') throw new CampaignStop('nonwin', 'Retained route failure',
      { area, phase, ordinal, index: 0, outcome: 'draw' });
  };
  expect(() => enterPreparedActFiveArea(profile, () => undefined, enter, state, crystalline, f.waves))
    .toThrow('Retained route failure');
  expect(state.attempts.filter(row => row.area === crystalline && row.kind === 'route')).toHaveLength(3);
  expect(state.attempts[3]?.kind).toBe('training');
  expect(auditActFiveAreaPreparation(state, f.waves)).toMatchObject({ routeAreas: 2, completed: false });
  const before = observeEarnedState();
  expect(() => enterPreparedActFiveArea(profile, () => undefined, enter, state, crystalline, f.waves)).toThrow('terminal');
  expect(observeEarnedState()).toEqual(before);
});

it.each(['missing-wave', 'ordinal', 'xp', 'clear', 'training', 'interrupted', 'exhausted'] as const)
('rejects invalid direct-prefix custody before mutation: %s', invalid => {
  const f = unpreparedPrefix(), last = f.history.attempts.at(-1); assert.ok(last);
  if (invalid === 'missing-wave') f.waves.pop();
  if (invalid === 'ordinal') last.nextOrdinal++;
  if (invalid === 'xp') last.terminalXp++;
  if (invalid === 'clear') useMapStore.getState().markCleared(actFivePreparationAreas[3]);
  if (invalid === 'training') last.kind = 'training';
  if (invalid === 'interrupted') { last.outcome = 'interrupted'; last.failureStatus = 'budget'; }
  if (invalid === 'exhausted') {
    for (let count = 0; count < 2; count++) {
      const ordinal = last.ordinal + count + 1;
      f.history.attempts.push({ ...last, ordinal, nextOrdinal: ordinal + 1 });
      const wave = f.waves.at(-1); assert.ok(wave); f.waves.push({ ...wave, ordinal });
    }
    useMapStore.setState({ challengeOrdinals: { normal: 5, nightmare: 0, hell: 0 } });
  }
  const before = observeEarnedState();
  expect(() => createActFivePreparationFromUnpreparedRoute(f.history, f.waves)).toThrow();
  expect(observeEarnedState()).toEqual(before);
});

it('continues the native13action quest prefix through preparation without repeating its two claimed areas', () => {
  const f = constructActFivePrefix('necromancer-bone-intended-v1');
  usePlayerStore.getState().gainExperience(xpTotal(49));
  useMapStore.getState().markCleared(safe);
  const initial = createActFiveAreaPreparation(), waves: CampaignWave[] = [], attempts: ActFiveAreaAttempt[] = [];
  const publish = (area: string) => {
    if (area === actFivePreparationAreas[4]) {
      for (let index = 0; index < 8; index++) publishConstructedActFiveWave(index);
      return;
    }
    const map = useMapStore.getState(), contract = ACT5_ENCOUNTERS.find(row => row.areaId === area);
    if (contract) {
      const progress = map.questProgress[contract.questId]; assert.ok(progress);
      map.updateQuestProgress(contract.questId, { ...progress, status: 'completed',
        objectives: { ...progress.objectives, [contract.objectiveId]: true } });
      useMapStore.setState({ questReceipts: { ...map.questReceipts, [contract.proof]: true } });
    }
    map.markCleared(area);
  };
  const admit = (_act: number, area: string, phase: 'farm' | 'route', draw = false) => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    map.setCurrentLocation(5, area);
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    const xp = draw ? 0 : phase === 'farm' ? 50_000_000 : 1000;
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ phase, area, ordinal, index: 0, outcome: draw ? 'draw' : 'victory',
      advance: draw ? 'defeat' : 'victory', logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
    if (draw) throw new CampaignStop('nonwin', 'Unprepared Crystalline draw',
      { area, phase, ordinal, index: 0, outcome: 'draw' });
    if (phase === 'route') publish(area);
  };
  expect(() => runActFive(profile, f.record, area => {
    const player = usePlayerStore.getState().player; assert.ok(player);
    const fromXp = xpTotal(player.level) + player.experience;
    const ordinal = useMapStore.getState().challengeOrdinals.normal, draw = area === actFivePreparationAreas[2];
    try { admit(5, area, 'route', draw); }
    finally {
      const terminal = usePlayerStore.getState().player; assert.ok(terminal);
      attempts.push({ kind: 'route', entryArea: area, targetLevel: actFivePreparationTarget(area),
        act: 5, area, ordinal, nextOrdinal: ordinal + 1, fromLevel: player.level, terminalLevel: terminal.level,
        fromXp, terminalXp: xpTotal(terminal.level) + terminal.experience,
        outcome: draw ? 'nonwin' : 'victory', failureStatus: draw ? 'nonwin' : null });
    }
  }, f.actions, 'main-quests')).toThrow('Unprepared Crystalline draw');
  const prefix = f.actions.entries.slice(f.act5Start), original = structuredClone(prefix);
  expect(prefix).toHaveLength(13);
  const state = createActFivePreparationFromUnpreparedRoute({ startOrdinal: initial.startOrdinal,
    fromXp: initial.fromXp, initialCleared: initial.initialCleared, attempts }, waves);
  const actions = createCampaignQuestActions(f.record, () => undefined), entered: string[] = [];
  resumeActFiveMain(profile, f.record, area => {
    entered.push(area);
    enterPreparedActFiveArea(profile, f.record,
      (sourceAct, sourceArea, phase) => admit(sourceAct, sourceArea, phase), state, area, waves);
  }, actions, prefix);
  expect(entered).toEqual(actFivePreparationAreas.slice(2));
  expect(prefix).toEqual(original);
  expect([...prefix, ...actions.entries].map(row => [row.action, row.id])).toEqual(actFiveMainActionOrder);
  expect(auditActFiveAreaPreparation(state, waves)).toMatchObject({ completed: true, routeAreas: 5,
    nonwinOrdinals: [initial.startOrdinal + 2] });
});
