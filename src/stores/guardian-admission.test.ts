/** Constructed battle fixture checks settlement authority, not earned campaign balance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import * as combatEngine from '@/engine/combat/combat';
import { assembleQuestItem, recoverQuestTool } from '@/features/quests/interactObject';
import { executeQuestAction } from '@/features/quests/questActions';
import { claimQuestReward } from '@/features/quests/claimReward';
import { inspectRecordedWaves, RecordedWaveReceiptError } from './recordedWaveReceipt';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { snapshotStores } from './persistence';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { useMercStore } from './mercStore';
import { __resetPersistenceForTests, useHydrationStore } from './persistence';

const QUEST = 'quests/act3-guardian';
const ORB = `${QUEST}#action:break-compelling-orb`;
const AREA = 'areas/act3-durance-of-hate';
const KHALIM = 'quests/act3-khalims-will', STAFF = 'quests/act2-horadric-staff';
const WILL = `${KHALIM}#objective:obj-transmute`;
function prepareWill(): void {
  if (useInventoryStore.getState().questItems[WILL]) return;
  useMapStore.setState(state => ({ currentAct: 2, currentSubAreaId: 'areas/act2-dry-hills',
    clearedSubAreas: [...new Set([...state.clearedSubAreas, 'areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
      'areas/act3-flayer-jungle', 'areas/act3-great-marsh', 'areas/act3-kurast-bazaar', 'areas/act3-travincal'])],
    // Constructed source clears/Council proof; actual recovery, assembly and Orb runtime below.
    questReceipts: { ...state.questReceipts, [`${KHALIM}#action:council-victory`]: true },
    questProgress: { ...state.questProgress,
      [STAFF]: { id: STAFF, status: 'inProgress', objectives: { 'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
      [KHALIM]: { id: KHALIM, status: 'inProgress', rewardClaimed: false, objectives: {
        'obj-heart': false, 'obj-brain': false, 'obj-eye': false, 'obj-flail': false, 'obj-transmute': false } } } }));
  expect(recoverQuestTool(`${STAFF}#objective:obj-cube`)).toBe('ok');
  for (const [objective, area] of [['obj-heart', 'areas/act3-flayer-jungle'], ['obj-brain', 'areas/act3-great-marsh'],
    ['obj-eye', 'areas/act3-kurast-bazaar'], ['obj-flail', 'areas/act3-travincal']]) {
    useMapStore.getState().setCurrentLocation(3, required(area));
    expect(recoverQuestTool(`${KHALIM}#objective:${required(objective)}`)).toBe('ok');
  }
  expect(assembleQuestItem(WILL)).toBe('ok');
}
function breakOrb(): void { prepareWill(); expect(executeQuestAction(ORB)).toBe('ok'); }
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Guardian fixture');
  return value;
}
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore]) store.getState().reset();
}
function track(orb = true): void {
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-kill-mephisto': false } });
  if (orb) breakOrb();
}
function progress() { return required(useMapStore.getState().questProgress[QUEST]); }
function preparePlayer(): void {
  const player = createMockPlayer('Guardian constructed fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: [] });
  const gear = { id: 'guardian-fixture-cap', baseId: 'items/base/helm-cap', socketCapacity: 0, rarity: 'rare' as const,
    level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
}
function start(): number {
  return required(startSubAreaRun({ subAreaId: AREA, act: 3, runSeed: 7, challengeOrdinal: 0 })).totalWaves;
}
function drain(): void {
  useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function reachFinal(): void {
  const total = start();
  for (let wave = 1; wave < total; wave++) {
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  }
}
function finish(): void {
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  drain(); expect(advanceWaveOrFinish()).toBe('victory');
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); preparePlayer(); });
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('post-Orb Guardian accepted settlement', () => {
  it('completes only after actual original Mephisto final playback, without claiming a reward', () => {
    track(); reachFinal();
    expect(progress().status).toBe('inProgress');
    expect(advanceWaveOrFinish()).toBe('idle');
    finish();
    expect(progress()).toEqual({ id: QUEST, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-kill-mephisto': true } });
    expect(useMapStore.getState().questReceipts).toEqual({ [`${KHALIM}#action:council-victory`]: true, [ORB]: true });
    expect(useMapStore.getState().clearedSubAreas).toContain(AREA);
    expect(useMapStore.getState().isActUnlocked(4)).toBe(true);
    const save = required(snapshotStores()); expect(decodeSave(toJsonSafe(save))).toEqual(save);
    const settled = progress();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(progress()).toBe(settled);
  });

  it('preserves ordinary early victory and Act IV access, requiring a new post-Orb victory', () => {
    track(false); reachFinal(); finish();
    expect(progress().status).toBe('inProgress');
    expect(progress().objectives['obj-kill-mephisto']).toBe(false);
    expect(useMapStore.getState().clearedSubAreas).toContain(AREA);
    expect(useMapStore.getState().isActUnlocked(4)).toBe(true);
    expect(useInventoryStore.getState().backpack.length).toBeGreaterThan(0);
    expect(required(usePlayerStore.getState().player).level).toBeGreaterThan(1);
    useCombatStore.getState().endCombat();
    breakOrb();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(progress().status).toBe('inProgress');
    reachFinal(); finish();
    expect(progress().status).toBe('completed');
  });

  it('does not bank an untracked win or accept a direct boss event with canonical source metadata', () => {
    reachFinal(); finish();
    expect(useMapStore.getState().questProgress[QUEST]).toBeUndefined();
    useCombatStore.getState().endCombat();
    track();
    useMapStore.getState().recordBossKill({ actId: 'acts/act3', areaId: AREA,
      bossArchetypeId: 'monsters/act3.mephisto',
      source: { kind: 'chapterBoss', archetypeId: 'monsters/act3.mephisto' } });
    expect(progress().status).toBe('inProgress');
    expect(advanceWaveOrFinish()).toBe('idle');
    reachFinal(); finish(); expect(progress().status).toBe('completed');
  });

  it.each([true, false])('retains original chapter provenance present=%s through replay', present => {
    track(); const total = start();
    const run = required(combatRunLifecycle.activeRun), final = required(run.plan.waves[total - 1]);
    const source = final.source;
    if (!present) Object.assign(final, { source: undefined });
    for (let wave = 1; wave < total; wave++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
    Object.assign(final, { source: present ? undefined : source });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    finish(); expect(progress().status).toBe(present ? 'completed' : 'inProgress');
  });

  it.each(['clone-outcome', 'clone-events', 'prior-run', 'pre-replay'] as const)('refuses %s stale playback authority', fault => {
    track(); reachFinal(); const original = useCombatStore.getState();
    if (fault === 'prior-run') { abortSubAreaRun(); reachFinal(); }
    if (fault === 'pre-replay') refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = useCombatStore.getState(); drain();
    useCombatStore.setState(fault === 'clone-outcome' ? { outcome: { ...required(current.outcome) } }
      : fault === 'clone-events' ? { recordedEvents: [...current.recordedEvents] }
      : { outcome: original.outcome, recordedEvents: original.recordedEvents });
    const before = useMapStore.getState(), authority = inspectRecordedWaves();
    expect(advanceWaveOrFinish).toThrow(new RecordedWaveReceiptError('bindingMismatch'));
    expect(useMapStore.getState()).toBe(before); expect(inspectRecordedWaves()).toBe(authority);
  });

  it('does not credit abandoned playback', () => {
    track(); reachFinal(); drain(); const before = progress();
    abortSubAreaRun(); expect(advanceWaveOrFinish()).toBe('idle'); expect(progress()).toBe(before);
  });

  it.each(['missing', 'alive', 'wrong-side', 'summon', 'wrong-tier', 'replacement', 'wrong-archetype', 'duplicate', 'nonfinite'] as const)(
    'retains ordinary victory without Guardian credit for a %s final boss', fault => {
      const runBattle = combatEngine.runBattleRecorded; let injected = 0;
      vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
        const actual = runBattle(input), boss = actual.result.enemyTeam.find(unit => unit.tier === 'chapter-boss');
        if (!boss) return actual; injected++;
        const changed = fault === 'alive' ? { ...boss, life: 1 }
          : fault === 'wrong-side' ? { ...boss, side: 'player' as const }
          : fault === 'summon' ? { ...boss, kind: 'summon' as const }
          : fault === 'wrong-tier' ? { ...boss, tier: 'boss' as const }
          : fault === 'replacement' ? { ...boss, id: 'replacement-mephisto' }
          : fault === 'wrong-archetype' ? { ...boss, monsterArchetypeId: 'monsters/mephisto' }
          : fault === 'nonfinite' ? { ...boss, life: -Infinity } : boss;
        return { ...actual, result: { ...actual.result, enemyTeam: fault === 'duplicate'
          ? [...actual.result.enemyTeam, boss] : actual.result.enemyTeam.flatMap(unit => unit !== boss ? [unit]
            : fault === 'missing' ? [] : [changed]) } };
      });
      track(); reachFinal(); expect(injected).toBe(1); const before = progress();
      finish(); expect(progress()).toBe(before); expect(useMapStore.getState().isActUnlocked(4)).toBe(true);
    });

  it.each(['enemy', 'draw/timeout', 'dead-hero'] as const)('refuses terminal %s', fault => {
    const runBattle = combatEngine.runBattleRecorded;
    vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementation(input => {
      const actual = runBattle(input);
      if (!actual.result.enemyTeam.some(unit => unit.tier === 'chapter-boss')) return actual;
      return { ...actual, result: { ...actual.result,
        ...(fault === 'dead-hero' ? { playerTeam: actual.result.playerTeam.map(unit => ({ ...unit, life: 0 })) }
          : { winner: fault === 'draw/timeout' ? null : 'enemy' as const }) } };
    });
    track(); reachFinal(); const before = progress(); drain();
    expect(advanceWaveOrFinish()).toBe('defeat'); expect(progress()).toBe(before);
    expect(useMapStore.getState().clearedSubAreas).not.toContain(AREA);
  });

  it.each(['orb', 'guardian'] as const)('does not admit %s supplied by an income observer after eligibility was captured', late => {
    prepareWill(); if (late === 'orb') track(false);
    reachFinal();
    const gain = usePlayerStore.getState().gainExperience;
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => {
      const result = gain(amount);
      if (late === 'guardian') useMapStore.getState().updateQuestProgress(QUEST, { status: 'inProgress', rewardClaimed: false,
        objectives: { 'obj-kill-mephisto': false } });
      // Inject a valid prospective graph as a synchronous observer, not as an authorized player action.
      useInventoryStore.setState(state => ({ questItems: { ...state.questItems, [WILL]: { itemId: 'items/khalims_will', state: 'consumed' } } }));
      useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [ORB]: true } }));
      return result;
    });
    finish(); expect(progress().status).toBe('inProgress');
    expect(useMapStore.getState().clearedSubAreas).toContain(AREA);
  });

  it('does not accept a flag-only Orb without its actual retained graph', () => {
    track(false); useMapStore.setState({ questReceipts: { [ORB]: true } });
    const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore] as const;
    const before = stores.map(store => store.getState()), holder = inspectRecordedWaves();
    expect(start).toThrow('action proof requires its tracked owner and exact consumed assembled input');
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(inspectRecordedWaves()).toBe(holder);
    expect(progress()).toMatchObject({ status: 'inProgress', rewardClaimed: false,
      objectives: { 'obj-kill-mephisto': false } });
  });

  it('revalidates the graph at publication and surfaces invalidation without granting credit', () => {
    track(); reachFinal(); const before = progress(), gain = usePlayerStore.getState().gainExperience;
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => {
      const result = gain(amount); useInventoryStore.setState({ questItems: {} }); return result;
    });
    drain(); expect(advanceWaveOrFinish).toThrow(); expect(progress()).toBe(before);
    expect(advanceWaveOrFinish).toThrow(); expect(progress()).toBe(before);
  });

  it.each([false, true])('restores only the named quest after publication failure after-write=%s, holding both locks', afterWrite => {
    track(); reachFinal(); drain(); const before = progress(), setter = useMapStore.setState;
    let injected = false;
    vi.spyOn(useMapStore, 'setState').mockImplementation((...args) => {
      const patch = typeof args[0] === 'function' ? args[0](useMapStore.getState()) : args[0];
      const completed = patch.questProgress?.[QUEST]?.status === 'completed';
      if (!completed || injected) { setter(...args); return; }
      injected = true; if (afterWrite) setter(...args);
      expect(claimQuestReward(KHALIM)).toBe('claim-in-progress');
      expect(() => executeQuestAction(ORB)).toThrow();
      expect(advanceWaveOrFinish).toThrow();
      useMapStore.getState().updateQuestProgress('quests/act3-lam-esens-tome', { status: 'inProgress', objectives: { 'obj-find-tome': false, 'obj-return': false } });
      throw new Error('Guardian publication failure');
    });
    expect(advanceWaveOrFinish).toThrow('Guardian publication failure'); expect(injected).toBe(true);
    expect(progress()).toBe(before); expect(useMapStore.getState().questProgress['quests/act3-lam-esens-tome']).toBeDefined();
    expect(advanceWaveOrFinish).toThrow();
  });

  it('surfaces restoration failure instead of claiming the completed row was restored', () => {
    track(); reachFinal(); drain(); const setter = useMapStore.setState;
    let publication = false;
    vi.spyOn(useMapStore, 'setState').mockImplementation((...args) => {
      const patch = typeof args[0] === 'function' ? args[0](useMapStore.getState()) : args[0];
      if (patch.questProgress?.[QUEST]?.status === 'completed') {
        publication = true; setter(...args); throw new Error('publication observer');
      }
      if (publication && patch.questProgress?.[QUEST]?.status === 'inProgress') throw new Error('restoration observer');
      setter(...args);
    });
    expect(advanceWaveOrFinish).toThrow(AggregateError);
    expect(progress().status).toBe('completed'); expect(advanceWaveOrFinish).toThrow();
  });

});
