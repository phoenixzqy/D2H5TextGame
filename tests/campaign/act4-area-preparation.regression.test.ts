/** Constructed admissions verify preparation custody; they are not earned balance evidence. */
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
import type { CampaignWave, TrainingCurseRecovery } from './policy';
import { CampaignStop } from './route';
import { prepareCampaignCombo } from './actions';
import { actFourPreparationAreas, actFourPreparationTarget, actFourTrainingSource,
  createActFourAreaPreparation, enterPreparedActFourArea, auditActFourAreaPreparation,
  resumeActFourAreaPreparation, type ActFourWallContinuation } from './act4-area-preparation';

const profile = campaignProfiles['necromancer-bone-intended-v1'];
const safe = 'areas/act1-dark-wood';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793418805210);
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Act4 QA', 'necromancer').ok).toBe(true);
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(47));
  useMapStore.getState().updateQuestProgress('quests/act3-guardian', {
    status: 'completed', rewardClaimed: true, objectives: { 'obj-kill-mephisto': true } });
  for (const area of [safe, 'areas/act3-travincal', 'areas/act3-durance-of-hate'])
    useMapStore.getState().markCleared(area);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

it('records ranked fallback for new default, empty-option and explicit preparation without mutation', () => {
  const before = observeEarnedState();
  const states = [createActFourAreaPreparation(), createActFourAreaPreparation({}),
    createActFourAreaPreparation({ trainingFallbackPolicy: 'ranked-cleared-v1' })];
  expect(states.map(state => state.trainingFallbackPolicy)).toEqual([
    'ranked-cleared-v1', 'ranked-cleared-v1', 'ranked-cleared-v1']);
  expect(states.every(state => state.attempts.length === 0)).toBe(true);
  expect(observeEarnedState()).toEqual(before);
});

function fixture(outcome: (area: string, phase: 'farm' | 'route') => 'victory' | 'draw' | 'interrupted' = () => 'victory', farmXp = 5_000_000,
  trainingFallbackPolicy?: 'ranked-cleared-v1') {
  const state = createActFourAreaPreparation(trainingFallbackPolicy ? { trainingFallbackPolicy } : {}), waves: CampaignWave[] = [];
  const records: Readonly<Record<string, unknown>>[] = [];
  const enter = (act: number, area: string, phase: 'farm' | 'route', recovery?: TrainingCurseRecovery) => {
    prepareCampaignCombo(profile, () => undefined, area, { phase, previousWave: waves.at(-1), trainingRecovery: recovery });
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    map.setCurrentLocation(act, area);
    const result = outcome(area, phase), xp = result === 'draw' ? 0 : phase === 'farm' ? farmXp : 1000;
    usePlayerStore.getState().gainExperience(xp);
    waves.push({ phase, area, ordinal, index: 0, outcome: result === 'interrupted' ? 'victory' : result,
      advance: result === 'interrupted' ? 'next-wave' : result === 'draw' ? 'defeat' : 'victory',
      logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
    if (result === 'interrupted') throw new CampaignStop('budget', 'Constructed interruption');
    if (result === 'draw') throw new CampaignStop('nonwin', 'Constructed settled draw', { area, phase, ordinal, index: 0, outcome: result });
    map.markCleared(area);
  };
  const next = (area: string) => { enterPreparedActFourArea(profile, row => { records.push(row); }, enter, state, area, waves); };
  return { state, waves, records, next, enter, run: () => { for (const area of actFourPreparationAreas) next(area); } };
}

it('keeps the owning Act IV journal label when training in an earlier act', () => {
  const f = fixture(); f.run();
  expect(f.state.attempts.some(row => row.kind === 'training' && row.act === 3)).toBe(true);
  const attempts = f.records.filter(row => typeof row.kind === 'string' && row.kind.endsWith('-area-prepared-attempt'));
  expect(attempts).toEqual(f.state.attempts.map(attempt => ({ kind: 'act4-area-prepared-attempt', attempt })));
});

it('projects full Act IV challenge maxima without admitting or changing state', () => {
  const before = observeEarnedState();
  const targets = actFourPreparationAreas.map(area => {
    const def = resolveSubArea(4, area); assert.ok(def);
    expect(actFourPreparationTarget(area)).toBe(challengeEnemyLevelRange(def).max);
    return actFourPreparationTarget(area);
  });
  expect(targets[0]).toBeGreaterThan(47);
  expect(targets.at(-1)).toBeGreaterThan(targets[0] ?? 0);
  expect(() => actFourPreparationTarget('areas/act3-durance-of-hate')).toThrow();
  expect(observeEarnedState()).toEqual(before);
});

it('uses only prior clears inside the two-level margin, including earned Act IV sources', () => {
  const plains = actFourPreparationAreas[0];
  expect(actFourTrainingSource(47, ['areas/act3-durance-of-hate', 'areas/act3-travincal'])).toEqual({ act: 3, area: 'areas/act3-travincal' });
  expect(actFourTrainingSource(actFourPreparationTarget(plains) + 2, [safe, plains])).toEqual({ act: 4, area: plains });
  expect(actFourTrainingSource(100, ['areas/act5-bloody-foothills'])).toBe(null);
});

it('earns all three entry targets, retains ordered route custody and audits earned XP', () => {
  const f = fixture(); f.run();
  expect(f.state.mode).toBe('challenge-prepared-act4-v1');
  expect(f.state.attempts.filter(row => row.kind === 'route').map(row => row.area)).toEqual(actFourPreparationAreas);
  expect(f.state.attempts.every(row => row.kind !== 'route' || row.fromLevel >= row.targetLevel)).toBe(true);
  expect(auditActFourAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, routeAreas: 3, trainingNonwins: 0 });
});

it('keeps three route attempts spent and refuses a terminal controller', () => {
  const f = fixture((_area, phase) => phase === 'route' ? 'draw' : 'victory');
  expect(f.run).toThrow('Constructed settled draw');
  expect(f.state.attempts.filter(row => row.kind === 'route')).toHaveLength(3);
  expect(auditActFourAreaPreparation(f.state, f.waves)).toMatchObject({ completed: false, routeAreas: 0 });
  expect(() => { f.next(actFourPreparationAreas[0]); }).toThrow('terminal');
});

it('stops at the original per-area allowance without underlevel entry', () => {
  const f = fixture(() => 'victory', 0);
  expect(f.run).toThrow('area training bound');
  expect(auditActFourAreaPreparation(f.state, f.waves)).toMatchObject({ trainingAdmissions: 200, routeAreas: 0 });
});

it('refuses out-of-order entry before any allocation or admission', () => {
  const f = fixture(), before = observeEarnedState();
  expect(() => { f.next(actFourPreparationAreas[1]); }).toThrow();
  expect(observeEarnedState()).toEqual(before); expect(f.state.attempts).toEqual([]);
});

it.each(['quest', 'receipt', 'clear', 'unclaimed'] as const)('rejects a nonfresh %s Act IV boundary', kind => {
  if (kind === 'quest') useMapStore.getState().updateQuestProgress('quests/act4-fallen-angel', { status: 'inProgress' });
  if (kind === 'receipt') useMapStore.setState({ questReceipts: { 'quests/act4-fallen-angel#action:izual-victory': true } });
  if (kind === 'clear') useMapStore.getState().markCleared(actFourPreparationAreas[0]);
  if (kind === 'unclaimed') useMapStore.getState().updateQuestProgress('quests/act3-guardian', { rewardClaimed: false });
  const before = observeEarnedState();
  expect(createActFourAreaPreparation).toThrow(); expect(observeEarnedState()).toEqual(before);
});

it.each(['target', 'source', 'mode', 'xp', 'ordinal'] as const)('rejects forged %s Act IV custody', kind => {
  const f = fixture(); f.run(); const state = structuredClone(f.state);
  const row = state.attempts[0]; assert.ok(row);
  if (kind === 'target') row.targetLevel--;
  if (kind === 'source') row.area = safe;
  if (kind === 'mode') Object.assign(state, { mode: 'challenge-prepared-act3-v1' });
  if (kind === 'xp') row.terminalXp++;
  if (kind === 'ordinal') row.ordinal++;
  expect(() => auditActFourAreaPreparation(state, f.waves)).toThrow();
});

function rankedFallbackFixture(failedPlainsEntries: number, policy: 'default' | 'explicit' = 'explicit') {
  let plainsTraining = 0;
  const plains = actFourPreparationAreas[0];
  const f = fixture((area, phase) => area === plains && phase === 'farm' && ++plainsTraining <= failedPlainsEntries
    ? 'draw' : 'victory', 1_000_000, policy === 'explicit' ? 'ranked-cleared-v1' : undefined);
  const player = usePlayerStore.getState().player; assert.ok(player);
  usePlayerStore.getState().gainExperience(xpTotal(49) - xpTotal(player.level) - player.experience);
  f.next(plains);
  const after = usePlayerStore.getState().player; assert.ok(after);
  usePlayerStore.getState().gainExperience(xpTotal(51) - xpTotal(after.level) - after.experience);
  f.next(actFourPreparationAreas[1]);
  return f;
}

it.each(['default', 'explicit'] as const)('%s ranked fallback retains the next productive cleared source after a failed offensive retry, then resets after route victory', policy => {
  const f = rankedFallbackFixture(2, policy);
  const river = f.state.attempts.filter(row => row.entryArea === actFourPreparationAreas[1] && row.kind === 'training');
  expect(river.slice(0, 2).map(row => row.area)).toEqual(Array(2).fill(actFourPreparationAreas[0]));
  expect(river[1]?.trainingRecovery).toBeDefined();
  expect(river.slice(2).length).toBeGreaterThan(1);
  expect(river.slice(2).every(row => row.area === 'areas/act3-durance-of-hate')).toBe(true);
  f.next(actFourPreparationAreas[2]);
  expect(f.state.attempts.find(row => row.entryArea === actFourPreparationAreas[2] && row.kind === 'training')?.area)
    .toBe(actFourPreparationAreas[0]);
  expect(auditActFourAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, trainingNonwins: 2 });
});

it('keeps a recovered productive source and its learned stance after one training draw', () => {
  const f = rankedFallbackFixture(1);
  const river = f.state.attempts.filter(row => row.entryArea === actFourPreparationAreas[1] && row.kind === 'training');
  expect(river.length).toBeGreaterThan(2);
  expect(river.every(row => row.area === actFourPreparationAreas[0])).toBe(true);
  expect(river.slice(1).every(row => row.trainingRecovery !== undefined)).toBe(true);
  f.next(actFourPreparationAreas[2]);
  expect(auditActFourAreaPreparation(f.state, f.waves)).toMatchObject({ completed: true, trainingNonwins: 1 });
});

it.each(['excluded-source', 'premature-safe-farm'] as const)('rejects consistently forged %s with ranked fallback', kind => {
  const f = rankedFallbackFixture(2); f.next(actFourPreparationAreas[2]);
  const state = structuredClone(f.state), waves = structuredClone(f.waves);
  const row = state.attempts.find(attempt => attempt.entryArea === actFourPreparationAreas[1] &&
    attempt.kind === 'training' && attempt.area === 'areas/act3-durance-of-hate'); assert.ok(row);
  row.area = kind === 'excluded-source' ? actFourPreparationAreas[0] : safe;
  row.act = kind === 'excluded-source' ? 4 : 1;
  const wave = waves.find(value => value.ordinal === row.ordinal); assert.ok(wave);
  Object.assign(wave, { area: row.area });
  expect(() => auditActFourAreaPreparation(state, waves)).toThrow('Undeclared prepared training source');
});

it('rejects an unknown training fallback policy before changing native state', () => {
  const before = observeEarnedState();
  const options = { trainingFallbackPolicy: 'ranked-cleared-v1' as const };
  Reflect.set(options, 'trainingFallbackPolicy', 'unknown');
  expect(() => createActFourAreaPreparation(options)).toThrow('Unknown training fallback policy');
  expect(observeEarnedState()).toEqual(before);
});

it('rejects an unknown retained training fallback policy before allocating or admitting', () => {
  const f = fixture();
  Reflect.set(f.state, 'trainingFallbackPolicy', 'unknown');
  const state = structuredClone(f.state), before = observeEarnedState();
  expect(() => { f.next(actFourPreparationAreas[0]); }).toThrow('Unknown training fallback policy');
  expect(f.state).toEqual(state); expect(observeEarnedState()).toEqual(before);
  expect(() => auditActFourAreaPreparation(f.state, f.waves)).toThrow('Unknown training fallback policy');
});

it('retains the ranked fallback nonwin limit instead of starting another route or source', () => {
  const f = fixture((_area, phase) => phase === 'farm' ? 'draw' : 'victory', 0, 'ranked-cleared-v1');
  expect(f.run).toThrow('training nonwin bound');
  expect(f.state.attempts.map(row => row.area)).toEqual([
    'areas/act3-travincal', 'areas/act3-travincal', safe]);
  expect(f.state.attempts.every(row => row.kind === 'training')).toBe(true);
  expect(auditActFourAreaPreparation(f.state, f.waves)).toMatchObject({
    trainingAdmissions: 3, trainingNonwins: 3, routeAreas: 0 });
  expect(() => { f.next(actFourPreparationAreas[0]); }).toThrow('terminal');
});

it('reconstructs ranked fallback exclusions after interrupted training without replay or renewed costs', () => {
  let interrupted = false;
  const f = fixture((area, phase) => {
    if (phase === 'farm' && area === 'areas/act3-travincal') return 'draw';
    if (phase === 'farm' && !interrupted) { interrupted = true; return 'interrupted'; }
    return 'victory';
  }, 0, 'ranked-cleared-v1');
  expect(f.run).toThrow('Constructed interruption');
  const parent = structuredClone(f.state), before = observeEarnedState();
  const last = f.state.attempts.at(-1); assert.ok(last);
  const proof: ActFourWallContinuation = {
    afterAttempt: f.state.attempts.length, nextOrdinal: f.state.nextOrdinal,
    terminalXp: last.terminalXp, abandonedWaveIndex: 1,
    maxAdmissions: 609, maxCombatMs: 180_000_000, combatMs: f.waves.length,
    maxWallMs: 600_000, wallMs: 600_001,
  };
  const state = resumeActFourAreaPreparation(f.state, f.waves, proof);
  expect(f.state).toEqual(parent); expect(observeEarnedState()).toEqual(before);
  expect(() => { enterPreparedActFourArea(profile, () => undefined, f.enter, state, actFourPreparationAreas[0], f.waves); })
    .toThrow('area training bound');
  expect(state.attempts.slice(3).every(row => row.area === safe)).toBe(true);
  expect(state.attempts[3]?.ordinal).toBe(parent.nextOrdinal);
  expect(state.attempts.slice(0, 3)).toEqual(parent.attempts);
  expect(f.waves.filter(row => row.ordinal === last.ordinal)).toHaveLength(1);
  expect(auditActFourAreaPreparation(state, f.waves)).toMatchObject({
    trainingAdmissions: 200, trainingNonwins: 2, routeAreas: 0 });
});
