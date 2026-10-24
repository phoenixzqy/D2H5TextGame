import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { campaignEvidence } from '../../tests/helpers/endgame';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { emptyEndgameState } from '@/engine/endgame/state';
import type { SaveCurrent } from '@/engine/types/save';
import { decodeSave } from '@/engine/save/validate';
import { checkEndgameEntry, claimEndgameAchievement, readEndgamePanelModel } from './endgameActions';
import { useMapStore } from './mapStore';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { useHydrationStore } from './hydrationStore';
import { abortSubAreaRun, startEndgameRun } from './combatHelpers';
import { beginMaterialTransaction, endMaterialTransaction, reserveWaveRestore, releaseWaveRestore } from './waveTransitionGuard';
import { selectQuestTitle } from '@/features/quests/questTitles';
import { selectReplayProfile } from '@/features/map/replayProfile';
import { __resetPersistenceForTests, flushSave, hydrateFromSave, snapshotStores, useSaveStatusStore } from './persistence';

let disk: SaveCurrent | null = null;
vi.mock('./save-adapter', () => ({
  saveSave: (save: SaveCurrent) => { disk = structuredClone(save); return Promise.resolve(); },
  loadSave: () => Promise.resolve(disk && decodeSave(disk)), hasSave: () => Promise.resolve(disk !== null),
  deleteSave: () => { disk = null; return Promise.resolve(); }
}));

function eligible() {
  const campaign = campaignEvidence();
  useMapStore.setState({ questProgress: campaign.questProgress, questReceipts: campaign.questReceipts, questDifficulties: { 'difficulty/nightmare': true },
    endgame: { attemptOrdinal: 3, clearCounts: { ashen: 2, glacial: 1 }, achievementRewardClaimed: false } });
}
beforeEach(() => {
  __resetPersistenceForTests(); disk = null;
  abortSubAreaRun();
  for (const store of [useMapStore, useInventoryStore, usePlayerStore, useCombatStore]) store.getState().reset();
  usePlayerStore.getState().setPlayer(createMockPlayer('Claim owner', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => { vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); useHydrationStore.getState().setStatus('idle'); });

describe('explicit endgame achievement Claim', () => {
  it('projects valid locked/owned state and checks navigation without starting or spending an attempt', () => {
    expect(readEndgamePanelModel().kind).toBe('locked');
    expect(checkEndgameEntry('ashen')).toBe('locked');
    eligible(); const map = useMapStore.getState();
    expect(readEndgamePanelModel()).toMatchObject({ kind: 'unlocked', achievement: { available: true, claimed: false } });
    expect(checkEndgameEntry('glacial')).toBe('ok');
    expect(checkEndgameEntry('foreign')).toBe('invalid');
    expect(useMapStore.getState()).toBe(map);
    useMapStore.setState({ endgame: { ...map.endgame, attemptOrdinal: Number.MAX_SAFE_INTEGER } });
    expect(checkEndgameEntry('ashen')).toBe('exhausted');
    useMapStore.setState({ endgame: { ...map.endgame, clearCounts: { ashen: 9, glacial: 1 } } });
    expect(readEndgamePanelModel().kind).toBe('invalid');
    expect(checkEndgameEntry('ashen')).toBe('invalid');
  });
  it('requires actual campaign authority and both modifier clears without any mutation', () => {
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(claimEndgameAchievement()).toBe('not-eligible');
    expect(useMapStore.getState()).toBe(map); expect(useInventoryStore.getState()).toBe(inventory);
    eligible(); useMapStore.setState({ endgame: { ...emptyEndgameState(), attemptOrdinal: 1, clearCounts: { ashen: 1, glacial: 0 } } });
    expect(claimEndgameAchievement()).toBe('not-eligible');
    expect(useInventoryStore.getState()).toBe(inventory);
  });
  it('grants exactly one of each perfect gem and the flag, once, preserving unrelated ownership', () => {
    eligible(); useInventoryStore.setState({ materials: { 'runes/el': 7, 'gems/ruby/perfect': 2 } });
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(claimEndgameAchievement()).toBe('ok');
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 7, 'gems/ruby/perfect': 3, 'gems/sapphire/perfect': 1 });
    expect(useMapStore.getState().endgame).toEqual({ ...map.endgame, achievementRewardClaimed: true });
    expect(useMapStore.getState().questTitles).toBe(map.questTitles);
    expect(useInventoryStore.getState().backpack).toBe(inventory.backpack);
    expect(useInventoryStore.getState().currencies).toBe(inventory.currencies);
    const paid = useInventoryStore.getState(), claimed = useMapStore.getState();
    expect(claimEndgameAchievement()).toBe('already-claimed');
    expect(useInventoryStore.getState()).toBe(paid); expect(useMapStore.getState()).toBe(claimed);
    expect(selectQuestTitle('titles/worldstone-adapt')).toBe('ok');
    expect(snapshotStores()?.map.selectedTitle).toBe('titles/worldstone-adapt');
    expect(selectReplayProfile('nightmare')).toBe('ok');
    expect(selectReplayProfile('normal')).toBe('ok');
  });
  it('rejects title selection before Claim and permits clearing it after Claim', () => {
    eligible(); expect(selectQuestTitle('titles/worldstone-adapt')).toBe('not-eligible');
    expect(claimEndgameAchievement()).toBe('ok');
    expect(selectQuestTitle('titles/worldstone-adapt')).toBe('ok');
    expect(selectQuestTitle(null)).toBe('ok');
    expect(useMapStore.getState().selectedTitle).toBeNull();
  });
  it('refuses overflow before either publication', () => {
    eligible(); useInventoryStore.setState({ materials: { 'gems/sapphire/perfect': Number.MAX_SAFE_INTEGER } });
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(claimEndgameAchievement()).toBe('grant-failed');
    expect(useMapStore.getState()).toBe(map); expect(useInventoryStore.getState()).toBe(inventory);
  });
  it.each(['materials', 'flag'] as const)('restores both slices if %s publication throws after writing', domain => {
    eligible(); const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    if (domain === 'materials') {
      const set = useInventoryStore.setState;
      vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { set(...args); throw new Error('materials observer'); });
    } else {
      const set = useMapStore.setState;
      vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => { set(...args); throw new Error('flag observer'); });
    }
    expect(claimEndgameAchievement()).toBe('grant-failed');
    expect(useInventoryStore.getState().materials).toBe(inventory.materials);
    expect(useMapStore.getState().endgame).toBe(map.endgame);
    expect(claimEndgameAchievement()).toBe('ok');
  });
  it.each(['normal', 'save-status', 'hydration'] as const)('blocks repeat Claim and saving after rollback failure with %s notifications', async notification => {
    eligible(); const original = useMapStore.getState().endgame;
    await flushSave(); const saved = structuredClone(disk);
    const set = useMapStore.setState;
    const inventorySet = useInventoryStore.setState;
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { inventorySet(...args); })
      .mockImplementationOnce(() => { throw new Error('rollback refused'); });
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => { set(...args); throw new Error('flag observer'); });
    const unsubscribe = notification === 'save-status'
      ? useSaveStatusStore.subscribe(() => { throw new Error('save status observer'); })
      : notification === 'hydration'
        ? useHydrationStore.subscribe(() => { throw new Error('hydration observer'); }) : null;
    try { expect(claimEndgameAchievement).toThrow(AggregateError); } finally { unsubscribe?.(); }
    expect(useMapStore.getState().endgame).toBe(original);
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/ruby/perfect': 1, 'gems/sapphire/perfect': 1 });
    expect(useHydrationStore.getState().status).toBe('error');
    expect(claimEndgameAchievement()).toBe('not-ready');
    await expect(flushSave()).rejects.toThrow('recovery');
    expect(disk).toEqual(saved);
    vi.restoreAllMocks();
    expect(await hydrateFromSave()).toBe(true);
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(useInventoryStore.getState().materials).toEqual({});
    expect(claimEndgameAchievement()).toBe('ok');
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/ruby/perfect': 1, 'gems/sapphire/perfect': 1 });
  });
  it.each([
    ['materials', 'refusal'], ['materials', 'replacement'], ['flag', 'refusal'], ['flag', 'replacement']
  ] as const)('blocks saves and Claim if %s restoration silently leaves a %s', async (domain, mode) => {
    eligible(); await flushSave(); const saved = structuredClone(disk);
    const inventory = useInventoryStore.getState(), map = useMapStore.getState();
    const inventorySet = useInventoryStore.setState, mapSet = useMapStore.setState;
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { inventorySet(...args); })
      .mockImplementationOnce((...args) => {
        if (domain !== 'materials') inventorySet(...args);
        else if (mode === 'replacement') inventorySet({ materials: { ...inventory.materials } });
      });
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => { mapSet(...args); throw new Error('flag observer'); })
      .mockImplementationOnce((...args) => {
        if (domain !== 'flag') mapSet(...args);
        else if (mode === 'replacement') mapSet({ endgame: { ...map.endgame } });
      });
    expect(claimEndgameAchievement).toThrow(AggregateError);
    if (domain === 'materials') expect(useMapStore.getState().endgame).toBe(map.endgame);
    else expect(useInventoryStore.getState().materials).toBe(inventory.materials);
    expect(useHydrationStore.getState().status).toBe('error');
    expect(claimEndgameAchievement()).toBe('not-ready');
    await expect(flushSave()).rejects.toThrow('recovery');
    expect(disk).toEqual(saved);
  });
  it('holds the material guard across notifications, including snapshot and nested Claim', () => {
    eligible(); const errors: unknown[] = [];
    const currencies = useInventoryStore.getState().currencies;
    const stop = useInventoryStore.subscribe(() => {
      for (const action of [claimEndgameAchievement, snapshotStores, () => { useInventoryStore.getState().addCurrency('rune-shard', 1); }]) {
        try { action(); } catch (error) { errors.push(error); }
      }
    });
    try { expect(claimEndgameAchievement()).toBe('ok'); } finally { stop(); }
    expect(errors).toHaveLength(3);
    expect(useInventoryStore.getState().currencies).toBe(currencies);
  });
  it('refuses unready, absent-hero, active-run and restore/material ownership', () => {
    eligible(); useHydrationStore.getState().setStatus('idle'); expect(claimEndgameAchievement()).toBe('not-ready');
    useHydrationStore.getState().setStatus('ready'); usePlayerStore.getState().reset(); expect(claimEndgameAchievement()).toBe('no-player');
    usePlayerStore.getState().setPlayer(createMockPlayer('Claim owner', 'sorceress'));
    startEndgameRun('ashen'); expect(claimEndgameAchievement()).toBe('combat-active'); abortSubAreaRun();
    const restore = reserveWaveRestore(); try { expect(claimEndgameAchievement).toThrow('restorePending'); } finally { releaseWaveRestore(restore); }
    const material = beginMaterialTransaction(true); try { expect(claimEndgameAchievement).toThrow('materialBusy'); } finally { endMaterialTransaction(material); }
  });
});
