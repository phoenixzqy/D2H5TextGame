/** Constructed entitlement/power verifies runtime authority, not earned campaign balance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { registerSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { ACT5_ENCOUNTERS, EVE_QUEST, THRONE_PROOF } from '@/engine/map/act5-admission';
import { NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import { abortSubAreaRun, advanceWaveOrFinish, recoverRecordedWavePublication, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { useMapStore } from './mapStore';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { __resetPersistenceForTests, useHydrationStore, snapshotStores, importIntoStores } from './persistence';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import * as currency from '@/engine/loot/orbs-and-currency';
import * as dropRoller from '@/engine/loot/drop-roller';
// Native persistence/restore remains real; this file replaces only IndexedDB IO.
vi.mock('./save-adapter', async importOriginal => ({
  ...await importOriginal<typeof import('./save-adapter')>(), saveSave: vi.fn(() => Promise.resolve())
}));
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing replay fixture'); return value; }
const area = 'areas/act5-throne-of-destruction';
function reset(): void {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of [useMapStore, useCombatStore, usePlayerStore, useInventoryStore, useMercStore]) store.getState().reset();
}
function entitlement(): void {
  const quest = required(loadQuests().find(row => row.id === EVE_QUEST));
  useMapStore.setState({ currentAct: 5, currentSubAreaId: area,
    questProgress: { [EVE_QUEST]: { id: EVE_QUEST, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(quest.objectives.map(row => [row.id, true])) } },
    questReceipts: { [THRONE_PROOF]: true, [`${EVE_QUEST}#action:baal-victory`]: true },
    questDifficulties: { [NIGHTMARE_UNLOCK]: true },
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
}
function start(options: Parameters<typeof startSubAreaRun>[0] = {}) {
  return required(startSubAreaRun({ subAreaId: area, act: 5, runSeed: 13, ...options }));
}
function accept() {
  useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
  return advanceWaveOrFinish();
}
function strongGear(): void {
  const gear = { id: 'replay-fixture-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
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
  registerSkill({ id: 'fixture.replay-finisher', archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 0, manaCost: 0, effects: [{ kind: 'damage', damageType: 'arcane', base: [10000000, 10000000] }] });
  const player = createMockPlayer('Replay', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, comboOrder: ['fixture.replay-finisher'] });
});
afterEach(() => { vi.restoreAllMocks(); reset(); loadDefaultSkills(); });
describe('production replay profile authority', () => {
  it('refuses forged or unknown selected profiles before publishing a run or incrementing an ordinal', () => {
    for (const selectedDifficulty of ['nightmare', 'hell'] as const) {
      useMapStore.setState({ selectedDifficulty: selectedDifficulty as 'nightmare' });
      expect(() => start()).toThrow();
      expect(combatRunLifecycle.activeRun).toBeNull();
      expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 0, nightmare: 0, hell: 0 });
    }
  });
  it('captures level-scaled Normal and Nightmare plans with independent persisted default ordinals', () => {
    entitlement(); useMapStore.setState({ challengeOrdinals: { normal: 8, nightmare: 21, hell: 0 } });
    expect(start().challengeOrdinal).toBe(8);
    const normal = required(combatRunLifecycle.activeRun).plan;
    abortSubAreaRun(); useCombatStore.getState().reset(); useMapStore.setState({ selectedDifficulty: 'nightmare' });
    expect(start().challengeOrdinal).toBe(21);
    const nightmare = required(combatRunLifecycle.activeRun).plan;
    expect(nightmare.replayProfileId).toBe('nightmare');
    // Explicit ordinal removes count-rotation differences for exact level comparison.
    abortSubAreaRun(); useCombatStore.getState().reset(); start({ challengeOrdinal: 8 });
    const matched = required(combatRunLifecycle.activeRun).plan;
    expect(matched.waves.map(wave => wave.spawns.map(spawn => spawn.level))).toEqual(
      normal.waves.map(wave => wave.spawns.map(spawn => spawn.level + 20)));
    const last = required(matched.waves.at(-1)?.spawns[0]);
    expect(last.level).toBe(102); expect(last.chapterBoss?.hp).toBeGreaterThan(7200);
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 9, nightmare: 22, hell: 0 });
    abortSubAreaRun(); useCombatStore.getState().reset();
    expect(decodeSave(required(snapshotStores())).map.challengeOrdinals).toEqual({ normal: 9, nightmare: 22, hell: 0 });
  });
  it('retains the original profile in replay, recording and settlement despite later preference changes', () => {
    entitlement(); useMapStore.setState({ selectedDifficulty: 'nightmare' });
    start({ challengeOrdinal: 0 });
    const run = required(combatRunLifecycle.activeRun);
    expect(run.plan.replayProfileId).toBe('nightmare');
    expect(run.recording).toHaveProperty('replayProfileId', 'nightmare');
    expect(inspectRecordedWaves().currentPublished?.binding).toHaveProperty('replayProfileId', 'nightmare');
    useMapStore.setState({ selectedDifficulty: 'normal' });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(run.recording).toHaveProperty('replayProfileId', 'nightmare');
    expect(inspectRecordedWaves().currentPublished?.binding).toHaveProperty('replayProfileId', 'nightmare');
    expect(accept()).toBe('next-wave');
    expect(required(combatRunLifecycle.activeRun).recording).toHaveProperty('replayProfileId', 'nightmare');
  });
  it('clears Nightmare independently with captured chapter sources and a separate first-clear award', () => {
    entitlement(); strongGear(); useMapStore.setState({ selectedDifficulty: 'nightmare' });
    const initial = useMapStore.getState(), receipts = initial.questReceipts, progress = initial.questProgress;
    const total = start().totalWaves;
    expect(required(combatRunLifecycle.activeRun).plan.questSourceProjection).toBeUndefined();
    for (let wave = 1; wave < total; wave++) expect(accept()).toBe('next-wave');
    const rewardBefore = useCombatStore.getState().runRewards.wishstones;
    const drops = vi.spyOn(currency, 'rollCurrencyDrops');
    const treasure = vi.spyOn(dropRoller, 'rollDrops');
    useMapStore.setState({ selectedDifficulty: 'normal' });
    expect(accept()).toBe('victory');
    expect(drops).toHaveBeenLastCalledWith(102, 'chapter-boss', 5, 'nightmare', expect.any(Number), expect.any(Object));
    expect(drops.mock.results.at(-1)?.value).toHaveProperty('wishstones', 48);
    // BUG152 admits equipment at102; the native TC now selects two40-stone picks.
    const chapterDrops = required(treasure.mock.results.at(-1)?.value as ReturnType<typeof dropRoller.rollDrops> | undefined);
    expect(chapterDrops.filter(drop => drop.kind === 'item').length).toBeGreaterThan(0);
    expect(chapterDrops.filter(drop => drop.kind === 'direct' && drop.currency === 'wishstones'))
      .toEqual(Array.from({ length: 2 }, () => ({ kind: 'direct', currency: 'wishstones', itemId: 'currency/wishstone', quantity: 40, ilvl: 102 })));
    // This seed misses the independent 2% kill coin; the first-clear award bypasses it.
    expect(useCombatStore.getState().runRewards.wishstones - rewardBefore).toBe(5);
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual([area]);
    expect(useMapStore.getState().clearedSubAreas).toEqual(initial.clearedSubAreas);
    expect(useMapStore.getState().questReceipts).toBe(receipts);
    expect(useMapStore.getState().questProgress).toBe(progress);
    const rewards = useCombatStore.getState().runRewards;
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useCombatStore.getState().runRewards).toBe(rewards);
  });
  it('cannot complete a tracked Normal Shenk quest from an actual Nightmare victory', () => {
    entitlement(); strongGear(); useMapStore.setState({ selectedDifficulty: 'nightmare' });
    const shenk = required(ACT5_ENCOUNTERS.find(row => row.questId === 'quests/act5-siege-on-harrogath'));
    const quest = required(loadQuests().find(row => row.id === shenk.questId));
    useMapStore.getState().updateQuestProgress(quest.id, { status: 'inProgress', rewardClaimed: false,
      objectives: Object.fromEntries(quest.objectives.map(row => [row.id, false])) });
    const before = useMapStore.getState().questProgress[quest.id];
    const total = start({ subAreaId: shenk.areaId }).totalWaves;
    for (let wave = 1; wave <= total; wave++) expect(accept()).toBe(wave === total ? 'victory' : 'next-wave');
    expect(useMapStore.getState().questProgress[quest.id]).toBe(before);
    expect(useMapStore.getState().questReceipts[shenk.proof]).toBeUndefined();
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual([shenk.areaId]);
    expect(useMapStore.getState().clearedSubAreas).not.toContain(shenk.areaId);
  });
  it('keeps Normal chapter anchors and ungated sources while paying first clear separately', () => {
    entitlement(); strongGear();
    const total = start({ challengeOrdinal: 0 }).totalWaves;
    const last = required(required(combatRunLifecycle.activeRun).plan.waves.at(-1)?.spawns[0]);
    expect(last.level).toBe(82); expect(last.chapterBoss).toMatchObject({ hp: 7200, atk: 520, def: 560 });
    for (let wave = 1; wave < total; wave++) expect(accept()).toBe('next-wave');
    const rewardBefore = useCombatStore.getState().runRewards.wishstones;
    const drops = vi.spyOn(currency, 'rollCurrencyDrops');
    const treasure = vi.spyOn(dropRoller, 'rollDrops');
    expect(accept()).toBe('victory');
    expect(drops).toHaveBeenLastCalledWith(82, 'chapter-boss', 5, 'normal', expect.any(Number), expect.any(Object));
    expect(drops.mock.results.at(-1)?.value).toHaveProperty('wishstones', 40);
    const chapterDrops = required(treasure.mock.results.at(-1)?.value as ReturnType<typeof dropRoller.rollDrops> | undefined);
    expect(chapterDrops.filter(drop => drop.kind === 'item').length).toBeGreaterThan(0);
    expect(chapterDrops.filter(drop => drop.kind === 'direct' && drop.currency === 'wishstones'))
      .toEqual(Array.from({ length: 2 }, () => ({ kind: 'direct', currency: 'wishstones', itemId: 'currency/wishstone', quantity: 40, ilvl: 82 })));
    // Raw chapter sources remain forty plus eighty; this seed misses the kill coin.
    expect(useCombatStore.getState().runRewards.wishstones - rewardBefore).toBe(5);
    expect(useMapStore.getState().clearedSubAreas).toContain(area);
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual([]);
  });
  it('persists separate ordinals across abort and native save restoration without persisting a run', async () => {
    entitlement(); useMapStore.setState({ selectedDifficulty: 'nightmare', challengeOrdinals: { normal: 7, nightmare: 360359, hell: 0 } });
    expect(start().challengeOrdinal).toBe(360359);
    abortSubAreaRun(); useCombatStore.getState().reset();
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 7, nightmare: 0, hell: 0 });
    const save = required(snapshotStores());
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(combatRunLifecycle.activeRun).toBeNull();
    expect(useMapStore.getState().selectedDifficulty).toBe('nightmare');
    expect(start().challengeOrdinal).toBe(0);
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 7, nightmare: 1, hell: 0 });
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual([]);
  });
  it.each(['silent', 'before', 'after'] as const)('recovers a %s ordinal publication fault using captured profile and next value', fault => {
    entitlement(); useMapStore.setState({ selectedDifficulty: 'nightmare', challengeOrdinals: { normal: 5, nightmare: 8, hell: 0 } });
    const original = useMapStore.setState;
    const failure = new Error('ordinal publication');
    const write = vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      if (fault === 'after') original(...args);
      if (fault !== 'silent') throw failure;
    });
    expect(() => start()).toThrow(fault === 'silent' ? 'bindingMismatch' : failure);
    write.mockRestore();
    const pending = required(inspectRecordedWaves().pending);
    expect(pending.phase).toBe('committedPendingPublication');
    expect(pending.binding.replayProfileId).toBe('nightmare');
    useMapStore.setState({ selectedDifficulty: 'normal' });
    recoverRecordedWavePublication(pending.receipt);
    expect(inspectRecordedWaves().pending).toBeNull();
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 5, nightmare: 9, hell: 0 });
    expect(required(combatRunLifecycle.activeRun).recording?.replayProfileId).toBe('nightmare');
    expect(() => { recoverRecordedWavePublication(pending.receipt); }).toThrow('staleReceipt');
    expect(useMapStore.getState().challengeOrdinals).toEqual({ normal: 5, nightmare: 9, hell: 0 });
  });
});
