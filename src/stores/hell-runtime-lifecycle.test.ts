/** Constructed authority/power verifies lifecycle behavior, never earned progression or pacing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { registerSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { ACT5_ENCOUNTERS, EVE_QUEST, THRONE_PROOF } from '@/engine/map/act5-admission';
import { selectReplayProfile } from '@/features/map/replayProfile';
import { abortSubAreaRun, advanceWaveOrFinish, recoverRecordedWavePublication,
  refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { __resetPersistenceForTests, useHydrationStore, snapshotStores, importIntoStores } from './persistence';
import { toJsonSafe } from '@/engine/save/serialize';
import * as currency from '@/engine/loot/orbs-and-currency';
vi.mock('./save-adapter', async importOriginal => ({
  ...await importOriginal<typeof import('./save-adapter')>(), saveSave: vi.fn(() => Promise.resolve())
}));
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing constructed Hell lifecycle input'); return value;
}
const area = 'areas/act5-throne-of-destruction';
const stores = [useMapStore, useCombatStore, usePlayerStore, useInventoryStore, useMercStore] as const;
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function qualify(nightmare = false): void {
  const proof = campaignEvidence();
  useMapStore.setState({ currentAct: 5, currentSubAreaId: area,
    questProgress: proof.questProgress, questReceipts: proof.questReceipts,
    questDifficulties: nightmare ? { 'difficulty/nightmare': true } : {},
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha',
      'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
  useInventoryStore.setState({ questItems: proof.questItems });
}
function start(options: Parameters<typeof startSubAreaRun>[0] = {}) {
  return required(startSubAreaRun({ subAreaId: area, act: 5, runSeed: 13, ...options }));
}
function accept() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  return advanceWaveOrFinish();
}
function selectHell(): void { expect(selectReplayProfile('hell')).toBe('ok'); }
function power(): void {
  const gear = { id: 'constructed-hell-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0,
    affixes: [{ affixId: 'constructed-power', values: new Map([['statMods.attack', 99978],
      ['statMods.defense', 99973], ['statMods.life', 999880]]) }] };
  useInventoryStore.getState().addItem(gear);
  expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  usePlayerStore.setState(state => state.player ? { player: { ...state.player,
    derivedStats: { ...state.player.derivedStats, life: state.player.derivedStats.lifeMax } } } : state);
}
beforeEach(() => {
  reset(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  registerSkill({ id: 'fixture.hell-finisher', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 0, manaCost: 0, effects: [{ kind: 'damage', damageType: 'arcane', base: [10000000, 10000000] }] });
  const player = createMockPlayer('Constructed Hell lifecycle', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: ['fixture.hell-finisher'] });
});
afterEach(() => { vi.restoreAllMocks(); reset(); loadDefaultSkills(); });

describe('native Hell run and persistence boundaries', () => {
  it('derives Hell from existing claimed Eve without adding Nightmare entitlement or any receipt', () => {
    qualify(); const before = useMapStore.getState(); selectHell();
    expect(useMapStore.getState().questDifficulties).toBe(before.questDifficulties);
    expect(useMapStore.getState().questReceipts).toBe(before.questReceipts);
    expect(useMapStore.getState().questProgress).toBe(before.questProgress);
    expect(start().challengeOrdinal).toBe(0);
    const run = required(combatRunLifecycle.activeRun);
    expect(run.plan.replayProfileId).toBe('hell');
    expect(run.plan.questSourceProjection).toBeUndefined();
    expect(required(run.plan.waves.at(-1)?.spawns[0]).level).toBe(122);
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 0, nightmare: 0, hell: 1 });
  });
  it.each(['missing-throne', 'loose-claimed-flags'] as const)('rechecks %s at actual entry with no run or debit', fault => {
    qualify(); selectHell();
    if (fault === 'loose-claimed-flags') useMapStore.setState({ questReceipts: {} });
    else useMapStore.setState(state => {
      const receipts = { ...state.questReceipts }; Reflect.deleteProperty(receipts, THRONE_PROOF);
      return { questReceipts: receipts };
    });
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(() => start()).toThrow();
    expect(combatRunLifecycle.activeRun).toBeNull();
    expect(useMapStore.getState()).toBe(map); expect(useInventoryStore.getState()).toBe(inventory);
  });
  it('refuses synthetic Hell and explicit Normal quest projection before ordinal publication', () => {
    qualify(); selectHell(); const map = useMapStore.getState();
    expect(() => start({ subAreaId: 'areas/foreign-synthetic' })).toThrow();
    expect(() => start({ questSource: 'act5-throne' })).toThrow();
    expect(combatRunLifecycle.activeRun).toBeNull(); expect(useMapStore.getState()).toBe(map);
  });
  it('captures Hell in engine input, replay, later waves and settlement after a preference change', () => {
    qualify(); power(); selectHell(); const initial = useMapStore.getState();
    const total = start().totalWaves; const run = required(combatRunLifecycle.activeRun);
    expect(run.origin).toEqual({ kind: 'area', replayProfileId: 'hell' });
    const capture = () => required(inspectRecordedWaves().currentPublished).binding;
    expect(capture().engineInput.difficulty).toBe('hell');
    expect(capture().replayProfileId).toBe('hell');
    useMapStore.setState({ selectedDifficulty: 'normal' });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(run.recording?.replayProfileId).toBe('hell');
    expect(capture().engineInput.difficulty).toBe('hell');
    for (let wave = 1; wave < total; wave++) {
      expect(accept()).toBe('next-wave');
      expect(capture().replayProfileId).toBe('hell');
      expect(capture().engineInput.difficulty).toBe('hell');
    }
    const drops = vi.spyOn(currency, 'rollCurrencyDrops');
    expect(accept()).toBe('victory');
    expect(drops).toHaveBeenLastCalledWith(122, 'chapter-boss', 5, 'hell', expect.any(Number), expect.any(Object));
    expect(drops.mock.results.at(-1)?.value).toHaveProperty('wishstones', 60);
    expect(useMapStore.getState().hellClearedSubAreas).toEqual([area]);
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual([]);
    expect(useMapStore.getState().clearedSubAreas).toBe(initial.clearedSubAreas);
    expect(useMapStore.getState().questProgress).toBe(initial.questProgress);
    expect(useMapStore.getState().questReceipts).toBe(initial.questReceipts);
    const rewards = useCombatStore.getState().runRewards;
    expect(advanceWaveOrFinish()).toBe('idle'); expect(useCombatStore.getState().runRewards).toBe(rewards);
  });
  it('cannot repay or advance tracked Normal Shenk objectives from a complete Hell victory', () => {
    qualify(); power(); selectHell();
    const shenk = required(ACT5_ENCOUNTERS.find(row => row.questId === 'quests/act5-siege-on-harrogath'));
    const quest = required(loadQuests().find(row => row.id === shenk.questId));
    useMapStore.getState().updateQuestProgress(quest.id, { status: 'inProgress', rewardClaimed: false,
      objectives: Object.fromEntries(quest.objectives.map(row => [row.id, false])) });
    const progress = useMapStore.getState().questProgress[quest.id];
    const total = start({ subAreaId: shenk.areaId }).totalWaves;
    for (let wave = 1; wave <= total; wave++) expect(accept()).toBe(wave === total ? 'victory' : 'next-wave');
    expect(useMapStore.getState().questProgress[quest.id]).toBe(progress);
    expect(useMapStore.getState().questReceipts[shenk.proof]).toBeUndefined();
    expect(useMapStore.getState().hellClearedSubAreas).toEqual([shenk.areaId]);
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual([]);
    expect(useMapStore.getState().clearedSubAreas).not.toContain(shenk.areaId);
    expect(useMapStore.getState().questProgress[EVE_QUEST]?.rewardClaimed).toBe(true);
  });
  it.each(['before', 'after'] as const)('restores all three clear histories after %s-write terminal publication failure', when => {
    qualify(true); power(); selectHell();
    useMapStore.setState({ nightmareClearedSubAreas: ['areas/act1-blood-moor'],
      hellClearedSubAreas: ['areas/act2-rocky-waste'] });
    const total = start().totalWaves;
    for (let wave = 1; wave < total; wave++) expect(accept()).toBe('next-wave');
    const count = useCombatStore.getState().recordedEvents.length;
    for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
    const run = required(combatRunLifecycle.activeRun), map = useMapStore.getState();
    const victory = useCombatStore.getState().markRunVictory, failure = new Error('Hell terminal publication');
    vi.spyOn(useCombatStore.getState(), 'markRunVictory').mockImplementation(() => {
      if (when === 'after') victory();
      throw failure;
    });
    const inventory = useInventoryStore.getState(), player = usePlayerStore.getState();
    expect(advanceWaveOrFinish).toThrow(failure);
    expect(combatRunLifecycle.activeRun).toBe(run);
    expect(useMapStore.getState().clearedSubAreas).toBe(map.clearedSubAreas);
    expect(useMapStore.getState().nightmareClearedSubAreas).toBe(map.nightmareClearedSubAreas);
    expect(useMapStore.getState().hellClearedSubAreas).toBe(map.hellClearedSubAreas);
    expect(useMapStore.getState().questProgress).toBe(map.questProgress);
    expect(useMapStore.getState().questReceipts).toBe(map.questReceipts);
    expect(useInventoryStore.getState()).toBe(inventory); expect(usePlayerStore.getState()).toBe(player);
    expect(useCombatStore.getState().runVictory).toBe(false);
    expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress)
      .toMatchObject({ phase: 'settlementFailed', failure: { error: failure } });
    expect(advanceWaveOrFinish).toThrow('settlementFailed');
  });
  it('restores all three histories and wrapped ordinals without persisting an active run', async () => {
    qualify(true); selectHell();
    useMapStore.setState({ challengeOrdinals: { normal: 7, nightmare: 11, hell: 360359 },
      nightmareClearedSubAreas: ['areas/act1-blood-moor'], hellClearedSubAreas: ['areas/act2-rocky-waste'] });
    expect(start().challengeOrdinal).toBe(360359);
    abortSubAreaRun(); useCombatStore.getState().reset();
    const save = required(snapshotStores());
    expect(save.version).toBe(32);
    expect(save.map.challengeOrdinals).toEqual({ normal: 7, nightmare: 11, hell: 0 });
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(combatRunLifecycle.activeRun).toBeNull();
    expect(useMapStore.getState().selectedDifficulty).toBe('hell');
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual(['areas/act1-blood-moor']);
    expect(useMapStore.getState().hellClearedSubAreas).toEqual(['areas/act2-rocky-waste']);
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 7, nightmare: 11, hell: 0 });
    expect(start().challengeOrdinal).toBe(0);
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 7, nightmare: 11, hell: 1 });
  });
  it.each(['silent', 'before', 'after'] as const)('recovers %s Hell ordinal publication exactly once', fault => {
    qualify(true); selectHell(); useMapStore.setState({ challengeOrdinals: { normal: 5, nightmare: 6, hell: 8 } });
    const original = useMapStore.setState; const failure = new Error('Hell ordinal publication');
    const write = vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      if (fault === 'after') original(...args);
      if (fault !== 'silent') throw failure;
    });
    expect(() => start()).toThrow(fault === 'silent' ? 'bindingMismatch' : failure); write.mockRestore();
    const pending = required(inspectRecordedWaves().pending);
    expect(pending.phase).toBe('committedPendingPublication'); expect(pending.binding.replayProfileId).toBe('hell');
    useMapStore.setState({ selectedDifficulty: 'normal' }); recoverRecordedWavePublication(pending.receipt);
    expect(inspectRecordedWaves().pending).toBeNull();
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 5, nightmare: 6, hell: 9 });
    expect(required(combatRunLifecycle.activeRun).recording?.replayProfileId).toBe('hell');
    expect(() => { recoverRecordedWavePublication(pending.receipt); }).toThrow('staleReceipt');
  });
});
