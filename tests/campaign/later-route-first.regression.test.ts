/** Constructed admissions verify measurement policy, never campaign balance or pacing. */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCharacter } from '@/features/character/createCharacter';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useMapStore } from '@/stores/mapStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useMercStore } from '@/stores/mercStore';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { captureEarnedRestorers, resetEarnedStores } from '../sim/production/earned-state';
import { createChallengeAreaController } from './challenge-area-preparation';
import { actThreePreparationAreas } from './act3-area-preparation';
import { actFourPreparationAreas } from './act4-area-preparation';
import { actFivePreparationAreas } from './act5-area-preparation';
import { campaignProfiles } from './profiles';
import { campaignExecution, assertCampaignExecutionProfile } from './execution';
import { CampaignStop } from './route';
import type { CampaignWave } from './policy';

const profile = campaignProfiles['necromancer-bone-intended-v1'];
const safe = 'areas/act1-dark-wood';
const definitions = [
  { act: 3, areas: actThreePreparationAreas, prerequisite: 'quests/act2-seven-tombs' },
  { act: 4, areas: actFourPreparationAreas, prerequisite: 'quests/act3-guardian' },
  { act: 5, areas: actFivePreparationAreas, prerequisite: 'quests/act4-terrors-end' }
] as const;
type Result = 'victory' | 'defeat' | 'draw' | 'budget' | 'technical' | 'invalid';
let restores: (() => void)[];
beforeEach(() => {
  restores = captureEarnedRestorers(); resetEarnedStores();
  vi.spyOn(Date, 'now').mockReturnValue(1793304000000);
  useHydrationStore.getState().setStatus('ready');
  expect(createCharacter('Route-first QA', 'necromancer').ok).toBe(true);
  const merc = loadMercHireRoster().find(row => row.act === 1)?.mercs[0]; assert.ok(merc);
  expect(useMercStore.getState().hireMerc(merc).ok).toBe(true);
  usePlayerStore.getState().gainExperience(xpTotal(15));
  for (const area of [safe, 'areas/act1-blood-moor', 'areas/act1-den-of-evil', 'areas/act1-cold-plains'])
    useMapStore.getState().markCleared(area);
});
afterEach(() => { vi.restoreAllMocks(); for (const restore of restores) restore(); });

function fixture(definition: typeof definitions[number],
  outcome: (phase: 'farm' | 'route', ordinal: number) => Result = () => 'victory',
  options: { prefixLevel?: boolean; noFarmXp?: boolean } = {}) {
  const { act, areas, prerequisite } = definition;
  useMapStore.getState().updateQuestProgress(prerequisite, { status: 'completed', rewardClaimed: true });
  const controller = createChallengeAreaController(act, areas, prerequisite);
  const state = controller.createState({ entryPolicy: 'route-first-v1' }), waves: CampaignWave[] = [];
  const enter = (sourceAct: number, area: string, phase: 'farm' | 'route') => {
    const map = useMapStore.getState(), ordinal = map.challengeOrdinals.normal;
    map.setCurrentLocation(sourceAct, area);
    useMapStore.setState({ challengeOrdinals: { ...map.challengeOrdinals, normal: ordinal + 1 } });
    const result = outcome(phase, ordinal);
    if (result === 'technical') throw new Error('Constructed technical failure');
    if (result === 'invalid') throw new CampaignStop('nonwin', 'Unsettled failure');
    const player = usePlayerStore.getState().player; assert.ok(player);
    const xp = xpTotal(player.level + 1) - xpTotal(player.level) - player.experience;
    if (options.prefixLevel && phase === 'route' && ordinal === 0) {
      usePlayerStore.getState().gainExperience(xp);
      waves.push({ phase, area, ordinal, index: 0, outcome: 'victory', advance: 'next-wave',
        logicalMs: 1, xp, items: 0, heroLife: 1, heroMana: 1 });
    }
    const earned = phase === 'farm' && !options.noFarmXp && result !== 'defeat' && result !== 'draw' ? xp : 0;
    usePlayerStore.getState().gainExperience(earned);
    const lost = result === 'defeat' || result === 'draw';
    waves.push({ phase, area, ordinal, index: waves.filter(row => row.ordinal === ordinal).length,
      outcome: lost ? result : 'victory', advance: lost ? 'defeat' : result === 'budget' ? 'next-wave' : 'victory',
      logicalMs: 1, xp: earned, items: 0, heroLife: result === 'defeat' ? 0 : 1, heroMana: 1 });
    if (result === 'budget') throw new CampaignStop('budget', 'Constructed wall stop');
    if (lost) throw new CampaignStop('nonwin', 'Constructed settled loss', { area, phase, ordinal,
      index: waves.filter(row => row.ordinal === ordinal).length - 1, outcome: result });
    map.markCleared(area);
  };
  const next = (area: string = areas[0]) => { controller.enterArea(profile, () => undefined, enter, state, area, waves); };
  return { controller, state, waves, enter, next, run: () => { for (const area of areas) next(area); },
    audit: () => controller.audit(state, waves) };
}

it('selects full route-first execution explicitly and rejects earlier phases', () => {
  const execution = campaignExecution('route-first-campaign-v1');
  for (const phase of ['act2', 'act3', 'act4', 'act5'])
    expect(() => { assertCampaignExecutionProfile(execution, phase, 'necromancer-bone-intended-v1'); }).not.toThrow();
  for (const phase of ['intro', 'act1'])
    expect(() => { assertCampaignExecutionProfile(execution, phase, 'necromancer-bone-intended-v1'); }).toThrow();
  expect(campaignExecution().maxAdmissions).toBe(160);
});

for (const definition of definitions) {
  const { act, areas } = definition;
  it(`Act ${String(act)} attempts every earned route below advisory levels without training`, () => {
    const f = fixture(definition); f.run();
    expect(f.state.entryPolicy).toBe('route-first-v1');
    expect(f.state.attempts.map(row => row.kind)).toEqual(areas.map(() => 'route'));
    expect(f.state.attempts.map(row => row.fromLevel)).toEqual(areas.map(() => 15));
    expect(f.audit()).toMatchObject({ completed: true, trainingAdmissions: 0, admissions: areas.length });
  });

  it(`Act ${String(act)} earns two recovery levels and retains all three settled losses`, () => {
    const f = fixture(definition, phase => phase === 'route' ? 'defeat' : 'victory');
    expect(f.next).toThrow('Constructed settled loss');
    expect(f.state.attempts.map(row => [row.kind, row.fromLevel, row.targetLevel]))
      .toEqual([['route', 15, f.controller.preparationTarget(areas[0])], ['training', 15, 16],
        ['route', 16, f.controller.preparationTarget(areas[0])], ['training', 16, 17],
        ['route', 17, f.controller.preparationTarget(areas[0])]]);
    expect(f.audit()).toMatchObject({ completed: false, admissions: 5, trainingAdmissions: 2,
      nonwinOrdinals: [0, 2, 4] });
    expect(f.next).toThrow('terminal'); expect(f.state.attempts).toHaveLength(5);
  });

  it(`Act ${String(act)} recovers from terminal earned prefix XP and resets after each victory`, () => {
    const f = fixture(definition, (_phase, ordinal) => ordinal === 0 ? 'draw' : 'victory', { prefixLevel: true });
    f.run();
    expect(f.state.attempts.slice(0, 3)).toMatchObject([
      { kind: 'route', fromLevel: 15, terminalLevel: 16, outcome: 'nonwin' },
      { kind: 'training', fromLevel: 16, targetLevel: 17 }, { kind: 'route', fromLevel: 17 }]);
    expect(f.audit()).toMatchObject({ completed: true, trainingAdmissions: 1, nonwinOrdinals: [0] });
  });

  it.each(['technical', 'invalid', 'budget'] as const)(`Act ${String(act)} never recovers from a %s route failure`, result => {
    const f = fixture(definition, () => result);
    expect(f.next).toThrow();
    expect(f.state.attempts.map(row => row.kind)).toEqual(['route']);
    expect(f.audit()).toMatchObject({ completed: false, trainingAdmissions: 0 });
  });

  it(`Act ${String(act)} carries interrupted recovery and spent route attempts through a proven wall stop`, () => {
    let interrupted = true;
    const f = fixture(definition, phase => phase === 'route' ? 'defeat' : interrupted ? 'budget' : 'victory',
      { noFarmXp: true });
    expect(f.next).toThrow('wall stop');
    const parent = structuredClone(f.state);
    const resumed = f.controller.resume(f.state, f.waves, { afterAttempt: 2, nextOrdinal: 2,
      terminalXp: xpTotal(15), abandonedWaveIndex: 1, maxAdmissions: 50, maxCombatMs: 100,
      combatMs: 2, maxWallMs: 10, wallMs: 10 });
    expect(f.state).toEqual(parent);
    interrupted = false;
    const recoveryEnter = (sourceAct: number, area: string, phase: 'farm' | 'route') => {
      if (phase === 'farm') {
        const player = usePlayerStore.getState().player; assert.ok(player);
        // The normal fixture suppresses XP; publish an explicitly observed earned wave instead.
        const before = xpTotal(player.level) + player.experience;
        f.enter(sourceAct, area, phase);
        const earned = xpTotal(player.level + 1) - before;
        usePlayerStore.getState().gainExperience(earned);
        const wave = f.waves.at(-1); assert.ok(wave);
        f.waves[f.waves.length - 1] = { ...wave, xp: earned };
      } else f.enter(sourceAct, area, phase);
    };
    expect(() => { f.controller.enterArea(profile, () => undefined, recoveryEnter, resumed, areas[0], f.waves); })
      .toThrow('Constructed settled loss');
    expect(resumed.attempts.filter(row => row.kind === 'route')).toHaveLength(3);
    expect(f.controller.audit(resumed, f.waves)).toMatchObject({ admissions: 6, trainingAdmissions: 3 });
  });

  it(`Act ${String(act)} stops at the recovery ceiling without another admission`, () => {
    const f = fixture(definition, () => 'defeat'), last = areas.at(-1); assert.ok(last);
    usePlayerStore.getState().gainExperience(xpTotal(f.controller.preparationTarget(last)) - xpTotal(15));
    // Keep creation custody consistent with the constructed high-level prerequisite.
    const high = f.controller.createState({ entryPolicy: 'route-first-v1' });
    expect(() => { f.controller.enterArea(profile, () => undefined, f.enter, high, areas[0], f.waves); })
      .toThrow('recovery level ceiling');
    expect(high.attempts).toHaveLength(1);
    expect(f.controller.audit(high, f.waves).trainingAdmissions).toBe(0);
    // Even XP gained between actions cannot authorize a retry above the farming ceiling.
    const invalid = structuredClone(high), prior = invalid.attempts[0]; assert.ok(prior);
    const level = prior.terminalLevel + 1;
    invalid.attempts.push({ ...prior, ordinal: 1, nextOrdinal: 2, fromLevel: level, terminalLevel: level,
      fromXp: xpTotal(level), terminalXp: xpTotal(level) });
    invalid.nextOrdinal = 2;
    const wave = f.waves[0]; assert.ok(wave);
    expect(() => f.controller.audit(invalid, [...f.waves, { ...wave, ordinal: 1 }]))
      .toThrow('recovery ceiling');
  });

  it(`Act ${String(act)} stops when no cleared safe source meets the level margin`, () => {
    const player = usePlayerStore.getState().player; assert.ok(player);
    usePlayerStore.setState({ player: { ...player, level: 1, experience: 0 } });
    const f = fixture(definition, () => 'defeat');
    expect(f.next).toThrow('No cleared lower-level');
    expect(f.audit()).toMatchObject({ admissions: 1, trainingAdmissions: 0 });
  });

  it(`Act ${String(act)} retains the existing shared training nonwin limit`, () => {
    const f = fixture(definition, () => 'defeat'); expect(f.next).toThrow('training nonwin bound');
    expect(f.state.attempts.map(row => row.kind)).toEqual(['route', 'training', 'training', 'training']);
    expect(f.audit()).toMatchObject({ trainingAdmissions: 3, trainingNonwins: 3 });
  });

  it(`Act ${String(act)} rejects changed policy, unearned retries, recovery targets and premature training`, () => {
    const f = fixture(definition, (_phase, ordinal) => ordinal === 0 ? 'defeat' : 'victory'); f.run(); f.audit();
    for (const mutate of [
      (state: typeof f.state) => { Object.assign(state, { entryPolicy: 'unknown' }); },
      (state: typeof f.state) => { delete (state as { entryPolicy?: string }).entryPolicy; },
      (state: typeof f.state) => { const row = state.attempts[1]; assert.ok(row); row.targetLevel++; },
      (state: typeof f.state) => { const row = state.attempts[0]; assert.ok(row); row.kind = 'training'; },
      (state: typeof f.state) => { const row = state.attempts[2]; assert.ok(row); row.fromLevel = 15; }
    ]) {
      const state = structuredClone(f.state); mutate(state);
      expect(() => f.controller.audit(state, f.waves)).toThrow();
    }
  });
}
