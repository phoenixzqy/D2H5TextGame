/** Constructed admissions exercise custody/bounds, never earned balance evidence. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { challengeEnemyLevelRange } from '@/engine/combat/sub-area-run';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMercStore } from '@/stores/mercStore';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { captureEarnedRestorers, observeEarnedState, resetEarnedStores } from '../sim/production/earned-state';
import { campaignProfiles } from './profiles';
import type { CampaignWave } from './policy';
import { CampaignStop } from './route';
import { prepareCampaignCombo } from './actions';
import type { TrainingCurseRecovery } from './policy';
import { actThreePreparationAreas, actThreePreparationTarget, actThreeTrainingSource,
  createActThreeAreaPreparation, enterPreparedActThreeArea, auditActThreeAreaPreparation, resumeActThreeAreaPreparation, type ActThreeWallContinuation } from './act3-area-preparation';

const profile = campaignProfiles['necromancer-bone-intended-v1'];
const safe = 'areas/act1-dark-wood';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act3 QA', 'necromancer').ok).toBe(true);
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(32));
  useMapStore.getState().updateQuestProgress('quests/act2-seven-tombs', {
    status: 'completed', rewardClaimed: true, objectives: { 'obj-kill-duriel': true } });
  for (const area of [safe, 'areas/act2-tomb-of-tal-rasha', 'areas/act2-lost-city'])
    useMapStore.getState().markCleared(area);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function fixture(outcome: (area: string, phase: 'farm' | 'route') => 'victory' | 'defeat' | 'draw' | 'interrupted' = () => 'victory', farmXp = 1_000_000) {
  // Retained historical states omit the policy and must keep their original fallback.
  const { trainingFallbackPolicy, ...state } = createActThreeAreaPreparation();
  expect(trainingFallbackPolicy).toBe('ranked-cleared-v1');
  const waves: CampaignWave[] = [];
  const records: Readonly<Record<string, unknown>>[] = [];
  const enter = (act: number, area: string, phase: 'farm' | 'route', trainingRecovery?: TrainingCurseRecovery) => {
    prepareCampaignCombo(profile, () => undefined, area, { phase, previousWave: waves.at(-1), trainingRecovery });
    if (trainingRecovery) expect(usePlayerStore.getState().player?.comboOrder[0]).toBe('necromancer.amplify_damage');
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    map.setCurrentLocation(act, area);
    const result = outcome(area, phase), xp = result === 'defeat' || result === 'draw' ? 0 : phase === 'farm' ? farmXp : 1000;
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ phase, area, ordinal, index: 0, outcome: result === 'draw' ? 'draw' : result === 'defeat' ? 'defeat' : 'victory',
      advance: result === 'interrupted' ? 'next-wave' : result === 'defeat' || result === 'draw' ? 'defeat' : 'victory',
      logicalMs: 1, xp, items: 0, heroLife: result === 'defeat' ? 0 : 1, heroMana: 1 });
    if (result === 'interrupted') throw new CampaignStop('budget', 'Constructed interruption');
    if (result === 'defeat' || result === 'draw') throw new CampaignStop('nonwin', 'Constructed settled nonwin',
      { area, phase, ordinal, index: 0, outcome: result });
    map.markCleared(area);
  };
  const next = (area: string) => { enterPreparedActThreeArea(profile, row => { records.push(row); }, enter, state, area, waves); };
  return { state, waves, records, next, enter, run: () => { for (const area of actThreePreparationAreas) next(area); } };
}

it('keeps the owning Act III journal label when training in an earlier act', () => {
  const f = fixture(); f.run();
  expect(f.state.attempts.some(row => row.kind === 'training' && row.act === 2)).toBe(true);
  const attempts = f.records.filter(row => typeof row.kind === 'string' && row.kind.endsWith('-area-prepared-attempt'));
  expect(attempts).toEqual(f.state.attempts.map(attempt => ({ kind: 'act3-area-prepared-attempt', attempt })));
});

it('projects complete authored challenge maxima, including Mephisto, without admissions or mutation', () => {
  const before = observeEarnedState();
  const targets = actThreePreparationAreas.map(area => {
    const definition = resolveSubArea(3, area); assert.ok(definition);
    const target = actThreePreparationTarget(area);
    expect(target).toBe(challengeEnemyLevelRange(definition).max);
    expect(target).toBeGreaterThan(definition.areaLevel);
    return target;
  });
  expect(targets[0]).toBe(33); expect(targets.at(-1)).toBe(47);
  expect(observeEarnedState()).toEqual(before);
  expect(() => actThreePreparationTarget('areas/act2-lost-city')).toThrow();
});

it('selects only prior clears inside the full two-level margin and upgrades as levels are earned', () => {
  const cleared = [safe, 'areas/act2-lost-city', 'areas/act2-tomb-of-tal-rasha', actThreePreparationAreas[0]];
  expect(actThreeTrainingSource(32, cleared)).toEqual({ act: 2, area: 'areas/act2-lost-city' });
  const selected = actThreeTrainingSource(34, cleared); assert.ok(selected);
  const definition = resolveSubArea(selected.act, selected.area); assert.ok(definition);
  expect(challengeEnemyLevelRange(definition).max).toBe(32);
  expect(actThreeTrainingSource(1, cleared)).toBe(null);
  expect(actThreeTrainingSource(60, ['areas/act4-plains-of-despair'])).toBe(null);
});

it('earns every entry target in order and audits all admissions, XP and cleared farm custody', () => {
  const f = fixture(); f.run();
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area)).toEqual(actThreePreparationAreas);
  expect(f.state.attempts.some(row => row.kind === 'training')).toBe(true);
  expect(f.state.attempts.every(row => row.kind !== 'route' || row.fromLevel >= row.targetLevel)).toBe(true);
  expect(auditActThreeAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, routeAreas: 5, trainingNonwins: 0 });
});

it('keeps the safe fallback after a training loss until its route area clears', () => {
  let lost = false;
  const f = fixture((_area, phase) => {
    if (!lost && phase === 'farm') { lost = true; return 'defeat'; }
    return 'victory';
  }, 100_000);
  f.run();
  const loss = f.state.attempts.findIndex(row => row.kind === 'training' && row.outcome === 'nonwin');
  expect(loss).toBeGreaterThanOrEqual(0);
  const following = f.state.attempts.slice(loss + 1), route = following.findIndex(row => row.kind === 'route');
  expect(following.slice(0, route).every(row => row.area === safe)).toBe(true);
  expect(auditActThreeAreaPreparation(f.state, f.waves).trainingNonwins).toBe(1);
});

it.each([1, 2, 3])('retains route losses and stops retrying after victory on attempt %i', attempt => {
  let tries = 0;
  const f = fixture((area, phase) => phase === 'route' && area === actThreePreparationAreas[0] && ++tries < attempt ? 'defeat' : 'victory');
  f.run();
  expect(tries).toBe(attempt);
  expect(auditActThreeAreaPreparation(f.state, f.waves).nonwinOrdinals).toEqual(Array.from({ length: attempt - 1 }, (_v, i) => i + 1));
});

it('does not renew an exhausted route budget or enter a later area', () => {
  const f = fixture((_area, phase) => phase === 'route' ? 'defeat' : 'victory');
  expect(() => { f.run(); }).toThrow('Constructed settled nonwin');
  expect(auditActThreeAreaPreparation(f.state, f.waves)).toMatchObject({ admissions: 4, completed: false, routeAreas: 0 });
  expect(() => { f.next(actThreePreparationAreas[0]); }).toThrow('terminal');
  expect(f.state.attempts).toHaveLength(4);
});

it('stops at the shared training nonwin limit without a route retry', () => {
  const f = fixture((_area, phase) => phase === 'farm' ? 'defeat' : 'victory');
  expect(() => { f.run(); }).toThrow('training nonwin bound');
  expect(auditActThreeAreaPreparation(f.state, f.waves)).toMatchObject({ trainingAdmissions: 3, trainingNonwins: 3, routeAreas: 0 });
});

it('stops before underlevel entry when the per-area training budget is exhausted', () => {
  const f = fixture(() => 'victory', 0);
  expect(() => { f.run(); }).toThrow('area training bound');
  expect(auditActThreeAreaPreparation(f.state, f.waves)).toMatchObject({ trainingAdmissions: 200, routeAreas: 0, completed: false });
});

it('retains a between-wave interruption and never retries it', () => {
  const f = fixture(() => 'interrupted');
  expect(() => { f.run(); }).toThrow('Constructed interruption');
  expect(f.state.attempts).toHaveLength(1);
  expect(auditActThreeAreaPreparation(f.state, f.waves)).toMatchObject({ admissions: 1, completed: false });
});

it.each(['wrong-area', 'wrong-phase', 'wrong-ordinal', 'missing', 'technical'] as const)('does not retry a %s failure', kind => {
  const f = fixture((area, phase) => {
    if (kind === 'technical') throw new Error('Unverified failure');
    throw new CampaignStop('nonwin', 'Unverified failure', kind === 'missing' ? undefined : {
      area: kind === 'wrong-area' ? safe : area, phase: kind === 'wrong-phase' ? (phase === 'farm' ? 'route' : 'farm') : phase,
      ordinal: kind === 'wrong-ordinal' ? 99 : 0, index: 0, outcome: 'defeat' });
  });
  expect(() => { f.run(); }).toThrow('Unverified failure');
  expect(f.state.attempts).toHaveLength(1);
  expect(f.state.attempts[0]?.outcome).toBe('interrupted');
});

it('refuses out-of-order entry before growth, equipment or admission', () => {
  const f = fixture(), before = observeEarnedState();
  expect(() => { f.next(actThreePreparationAreas[1]); }).toThrow();
  expect(observeEarnedState()).toEqual(before); expect(f.state.attempts).toEqual([]);
});

it.each(['quest', 'clear', 'unclaimed'] as const)('rejects a nonfresh %s boundary before mutation', kind => {
  if (kind === 'quest') useMapStore.getState().updateQuestProgress('quests/act3-khalims-will', { status: 'inProgress' });
  if (kind === 'clear') useMapStore.getState().markCleared(actThreePreparationAreas[0]);
  if (kind === 'unclaimed') useMapStore.getState().updateQuestProgress('quests/act2-seven-tombs', { rewardClaimed: false });
  const before = observeEarnedState();
  expect(() => createActThreeAreaPreparation()).toThrow(); expect(observeEarnedState()).toEqual(before);
});

it.each(['target', 'farm', 'ordinal', 'xp', 'retry', 'wave'] as const)('rejects forged %s custody', kind => {
  const f = fixture(); f.run(); const state = structuredClone(f.state), waves = f.waves.map(row => ({ ...row }));
  const training = state.attempts.find(row => row.kind === 'training'); assert.ok(training);
  if (kind === 'target') training.targetLevel--;
  if (kind === 'farm') {
    training.area = safe; training.act = 1;
    for (const wave of waves.filter(row => row.ordinal === training.ordinal)) wave.area = safe;
  }
  if (kind === 'ordinal') training.ordinal++;
  if (kind === 'xp') training.terminalXp++;
  if (kind === 'retry') {
    const first = state.attempts[0]; assert.ok(first);
    state.attempts.push({ ...first, ordinal: state.nextOrdinal });
  }
  if (kind === 'wave') {
    const first = waves[0]; assert.ok(first);
    waves.push({ ...first, ordinal: state.nextOrdinal - 1 });
  }
  expect(() => auditActThreeAreaPreparation(state, waves)).toThrow();
});


function continuationProof(f: ReturnType<typeof fixture>): ActThreeWallContinuation {
  const row = f.state.attempts.at(-1); assert.ok(row);
  return { afterAttempt: f.state.attempts.length, nextOrdinal: f.state.nextOrdinal,
    terminalXp: row.terminalXp, abandonedWaveIndex: f.waves.filter(wave => wave.ordinal === row.ordinal).length,
    maxAdmissions: 615, maxCombatMs: 180_000_000,
    combatMs: f.waves.reduce((sum, wave) => sum + wave.logicalMs, 0), maxWallMs: 600_000, wallMs: 600_001 };
}

it('continues a proven wall stop without replaying or awarding its abandoned training suffix', () => {
  let first = true;
  const f = fixture(() => { if (first) { first = false; return 'interrupted'; } return 'victory'; });
  expect(() => { f.run(); }).toThrow('Constructed interruption');
  const parent = structuredClone(f.state), before = observeEarnedState();
  const state = resumeActThreeAreaPreparation(f.state, f.waves, continuationProof(f));
  expect(f.state).toEqual(parent); expect(observeEarnedState()).toEqual(before);
  expect(state.attempts).toEqual(parent.attempts); expect(state.attempts).not.toBe(f.state.attempts);
  for (const area of actThreePreparationAreas) enterPreparedActThreeArea(profile, () => undefined, f.enter, state, area);
  expect(auditActThreeAreaPreparation(state, f.waves)).toMatchObject({ completed: true, routeAreas: 5 });
  expect(state.attempts[0]).toEqual(parent.attempts[0]);
  expect(state.attempts[1]?.ordinal).toBe(parent.nextOrdinal);
  expect(f.waves.filter(wave => wave.ordinal === parent.attempts[0]?.ordinal)).toHaveLength(1);
});

it.each(['wall', 'combat', 'admissions', 'xp', 'ordinal', 'clear', 'index', 'technical', 'route'] as const)(
  'rejects a mismatched or ineligible %s continuation before mutation', fault => {
    const f = fixture((_area, phase) => fault === 'route' && phase === 'farm' ? 'victory' : 'interrupted');
    expect(() => { f.run(); }).toThrow('Constructed interruption');
    const proof = continuationProof(f);
    if (fault === 'wall') proof.wallMs = proof.maxWallMs - 1;
    if (fault === 'combat') proof.maxCombatMs = proof.combatMs;
    if (fault === 'admissions') proof.maxAdmissions = f.state.nextOrdinal - f.state.startOrdinal;
    if (fault === 'xp') usePlayerStore.getState().gainExperience(1);
    if (fault === 'ordinal') useMapStore.setState(map => ({ challengeOrdinals: { ...map.challengeOrdinals, normal: 99 } }));
    if (fault === 'clear') useMapStore.getState().markCleared(actThreePreparationAreas[0]);
    if (fault === 'index') proof.abandonedWaveIndex++;
    if (fault === 'technical') { f.state.failureStatus = 'technical'; const row = f.state.attempts.at(-1); assert.ok(row); row.failureStatus = 'technical'; }
    const parent = structuredClone(f.state), before = observeEarnedState();
    expect(() => resumeActThreeAreaPreparation(f.state, f.waves, proof)).toThrow();
    expect(f.state).toEqual(parent); expect(observeEarnedState()).toEqual(before);
  });

it('carries per-area training spent before an interruption instead of renewing it', () => {
  let count = 0;
  const f = fixture(() => ++count === 199 ? 'interrupted' : 'victory', 0);
  expect(() => { f.run(); }).toThrow('Constructed interruption');
  const state = resumeActThreeAreaPreparation(f.state, f.waves, continuationProof(f));
  expect(() => { enterPreparedActThreeArea(profile, () => undefined, f.enter, state, actThreePreparationAreas[0]); })
    .toThrow('area training bound');
  expect(auditActThreeAreaPreparation(state, f.waves)).toMatchObject({ trainingAdmissions: 200, routeAreas: 0 });
});

it('keeps safe fallback and consecutive nonwins across an abandoned training suffix', () => {
  let count = 0;
  const f = fixture(() => ++count === 2 ? 'interrupted' : 'defeat', 0);
  expect(() => { f.run(); }).toThrow('Constructed interruption');
  const state = resumeActThreeAreaPreparation(f.state, f.waves, continuationProof(f));
  expect(f.state).not.toHaveProperty('trainingFallbackPolicy');
  expect(state).not.toHaveProperty('trainingFallbackPolicy');
  expect(() => { enterPreparedActThreeArea(profile, () => undefined, f.enter, state, actThreePreparationAreas[0]); })
    .toThrow('training nonwin bound');
  expect(state.attempts.slice(1).every(row => row.area === safe)).toBe(true);
  expect(auditActThreeAreaPreparation(state, f.waves)).toMatchObject({ trainingAdmissions: 4, trainingNonwins: 3 });
});

it('refuses renewal when interrupted training has already spent the area cap', () => {
  let count = 0;
  const f = fixture(() => ++count === 200 ? 'interrupted' : 'victory', 0);
  expect(() => { f.run(); }).toThrow('Constructed interruption');
  expect(() => resumeActThreeAreaPreparation(f.state, f.waves, continuationProof(f))).toThrow();
});


it('retains the original physical bounds across a second wall stop and rejects forged markers', () => {
  const f = fixture(() => 'interrupted', 0);
  expect(() => { f.run(); }).toThrow('Constructed interruption');
  const first = resumeActThreeAreaPreparation(f.state, f.waves, continuationProof(f));
  expect(() => { enterPreparedActThreeArea(profile, () => undefined, f.enter, first, actThreePreparationAreas[0]); })
    .toThrow('Constructed interruption');
  const proof = continuationProof({ ...f, state: first });
  expect(() => resumeActThreeAreaPreparation(first, f.waves, { ...proof, maxAdmissions: proof.maxAdmissions + 1 })).toThrow();
  const second = resumeActThreeAreaPreparation(first, f.waves, proof);
  expect(second.continuations).toHaveLength(2);
  const marker = second.continuations?.[0]; assert.ok(marker); marker.afterAttempt++;
  expect(() => auditActThreeAreaPreparation(second, f.waves)).toThrow();
});

it('audits cumulative admission limits after continuation instead of allowing a fresh budget', () => {
  let first = true;
  const f = fixture(() => { if (first) { first = false; return 'interrupted'; } return 'victory'; });
  expect(() => { f.run(); }).toThrow('Constructed interruption');
  const state = resumeActThreeAreaPreparation(f.state, f.waves, { ...continuationProof(f), maxAdmissions: 2 });
  for (const area of actThreePreparationAreas) enterPreparedActThreeArea(profile, () => undefined, f.enter, state, area);
  expect(() => auditActThreeAreaPreparation(state, f.waves)).toThrow('Carried admission bound');
});


it('retries a healthy training timeout offensively and retains the stance until the source changes', () => {
  let first = true;
  const f = fixture((_area, phase) => {
    if (first && phase === 'farm') { first = false; return 'draw'; }
    return 'victory';
  }, 50_000);
  f.next(actThreePreparationAreas[0]); f.state.failureStatus = 'budget'; f.state.failure = 'Constructed prefix stop';
  const [draw, retry] = f.state.attempts; assert.ok(draw && retry);
  expect(retry.area).toBe(draw.area);
  expect(retry.trainingRecovery).toEqual({ policy: 'learned-offensive-curse-v1', area: draw.area, triggerOrdinal: draw.ordinal });
  const carried = f.state.attempts.slice(2).find(row => row.area === retry.area && row.kind === 'training');
  expect(carried?.trainingRecovery).toEqual(retry.trainingRecovery);
  const changed = f.state.attempts.slice(2).find(row => row.area !== retry.area);
  expect(changed?.trainingRecovery).toBeUndefined();
  expect(auditActThreeAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false, routeAreas: 1, trainingNonwins: 1 });
});

it('uses safe fallback after the single offensive retry also times out and still counts both nonwins', () => {
  let farms = 0;
  const f = fixture((_area, phase) => phase === 'farm' && ++farms <= 2 ? 'draw' : 'victory', 100_000);
  f.next(actThreePreparationAreas[0]); f.state.failureStatus = 'budget'; f.state.failure = 'Constructed prefix stop';
  const [first, retry, fallback] = f.state.attempts; assert.ok(first && retry && fallback);
  expect(retry.area).toBe(first.area); expect(retry.trainingRecovery).toBeDefined();
  expect(fallback.area).toBe(safe); expect(fallback.trainingRecovery).toBeUndefined();
  expect(auditActThreeAreaPreparation(f.state, f.waves).trainingNonwins).toBe(2);
});

it('counts offensive training recovery against the original area cap without admitting an extra retry', () => {
  let farms = 0;
  const f = fixture(() => ++farms === 1 ? 'draw' : 'victory', 0);
  expect(() => { f.next(actThreePreparationAreas[0]); }).toThrow('area training bound');
  expect(f.state.attempts[1]?.trainingRecovery).toBeDefined();
  expect(f.state.attempts.slice(1).every(row => row.trainingRecovery !== undefined)).toBe(true);
  expect(auditActThreeAreaPreparation(f.state, f.waves)).toMatchObject({
    admissions: 200, trainingAdmissions: 200, trainingNonwins: 1, routeAreas: 0 });
  expect(() => { f.next(actThreePreparationAreas[0]); }).toThrow('terminal');
  expect(f.state.attempts).toHaveLength(200);
});

it.each(['trigger', 'source', 'carry-after-nonwin', 'dead-hero', 'route'] as const)(
  'rejects forged training recovery %s evidence', fault => {
    let farms = 0;
    const f = fixture((_area, phase) => phase === 'farm' && ++farms === 1 ? 'draw' : 'victory', 50_000);
    f.next(actThreePreparationAreas[0]); f.state.failureStatus = 'budget'; f.state.failure = 'Constructed prefix stop';
    const state = structuredClone(f.state), waves = f.waves.map(row => ({ ...row }));
    const retry = state.attempts[1]; assert.ok(retry?.trainingRecovery);
    if (fault === 'trigger') retry.trainingRecovery = { ...retry.trainingRecovery, triggerOrdinal: 99 };
    if (fault === 'source') retry.trainingRecovery = { ...retry.trainingRecovery, area: safe };
    if (fault === 'carry-after-nonwin') { const prior = state.attempts[0]; assert.ok(prior); prior.trainingRecovery = retry.trainingRecovery; }
    if (fault === 'dead-hero') { const prior = waves[0]; assert.ok(prior); prior.heroLife = 0; }
    if (fault === 'route') { const route = state.attempts.find(row => row.kind === 'route'); assert.ok(route); route.trainingRecovery = retry.trainingRecovery; }
    expect(() => auditActThreeAreaPreparation(state, waves)).toThrow();
  });
