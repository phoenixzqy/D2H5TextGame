/** Real claim, persistence and save adapter; only IndexedDB IO is faked. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveCurrent } from '@/engine/types/save';
import type { SaveRecord } from '@/stores/save-adapter';
const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined; writes: SaveRecord[] } = { record: undefined, writes: [] };
  const commit = (record: SaveRecord) => {
    const copy = structuredClone(record);
    state.record = copy;
    state.writes.push(copy);
  };
  return {
    state, commit,
    get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => { commit(record); return Promise.resolve(); }),
    delete: vi.fn(() => { state.record = undefined; return Promise.resolve(); })
  };
});
vi.mock('dexie', () => ({ default: class {
  version() {
    return { stores: () => Object.assign(this, {
      saves: { get: disk.get, put: disk.put, delete: disk.delete }
    }) };
  }
} }));

import { createMockPlayer } from '@/features/character/createMockPlayer';
import { toJsonSafe } from '@/engine/save';
import { loadMercPool } from '@/data/loaders/mercs';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { saveSave, loadSave, exportSave } from '@/stores/save-adapter';
import {
  __resetPersistenceForTests, AUTO_SAVE_DEBOUNCE_MS, snapshotStores, hydrateFromSave,
  importIntoStores, isReplacingSave, startAutoSave, stopAutoSave, useHydrationStore
} from '@/stores/persistence';
import mainDocument from '@/data/quests/main.json';
import { loadAwardPools } from '@/data/loaders/loot';
import { createRng, hashSeed } from '@/engine/rng';
import { __resetRollItemSeqForTests, rollItem, rollUniqueItem } from '@/engine/loot/rollItem';
import { claimQuestReward } from './claimReward';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { loadQuests } from '@/data/loaders/quests';
import { awardXp, xpTotal } from '@/engine/progression/xp';

const DEN = 'quests/act1-den-of-evil';
const NOW = 1_792_454_400_000;
function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing claim persistence fixture');
  return value;
}
function deferred() {
  let done: (() => void) | undefined;
  const promise = new Promise<void>(resolve => { done = resolve; });
  return { promise, release: () => { required(done)(); } };
}
function snapshot(): SaveCurrent { return required(snapshotStores()); }
const domains = [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
  useMetaStore, useFormationStore] as const;
function expectPendingReferences(before: unknown[]): void {
  expect(() => snapshotStores()).toThrow(WaveGuardError);
  domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
}
// Zero-bonus fixture: autosave projects both clocks at the flush boundary.
function flushed(save: SaveCurrent): SaveCurrent {
  const at = NOW + AUTO_SAVE_DEBOUNCE_MS;
  return { ...save, timestamp: at, meta: { ...save.meta,
    idleState: { ...save.meta.idleState, lastOnline: at } } };
}
function setup(): void {
  usePlayerStore.getState().setPlayer(createMockPlayer('Saved claim', 'sorceress'));
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
  const hire = useMercStore.getState().hireMerc(def);
  expect(hire.ok).toBe(true);
  useMercStore.getState().setFieldedMerc(required(hire.mercId));
  useMapStore.getState().updateQuestProgress(DEN, { status: 'completed',
    objectives: { 'obj-clear-den': true, 'obj-return': true } });
  useHydrationStore.getState().setStatus('ready');
}
beforeEach(() => {
  __resetPersistenceForTests();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  for (const store of [usePlayerStore, useInventoryStore, useMapStore, useMercStore,
    useMetaStore, useFormationStore]) store.getState().reset();
  disk.state.record = undefined;
  disk.state.writes = [];
  disk.get.mockClear(); disk.put.mockClear(); disk.delete.mockClear();
  setup();
});
afterEach(() => {
  stopAutoSave();
  __resetPersistenceForTests();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('claim settlement at real persistence boundaries', () => {
  it('debounces the complete authored Blood Raven reward and preserves it through import and hydration', async () => {
    const quest = 'quests/act1-sisters-burial-grounds';
    const trainee = 'mercs/act1-rogue-trainee';
    const mercId = required(useMercStore.getState().fieldedMercId);
    const mercXp = () => {
      const merc = required(useMercStore.getState().ownedMercs.find(row => row.id === mercId));
      let total = useMercStore.getState().getMercProgress(mercId).experience;
      for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
      return total;
    };
    const beforeMercXp = mercXp();
    useMapStore.getState().updateQuestProgress(quest, { status: 'completed',
      objectives: { 'obj-kill-blood-raven': true, 'obj-return': true } });
    const before = snapshot();
    startAutoSave();
    try {
      expect(claimQuestReward(quest)).toBe('ok');
      const paid = snapshot();
      expect(xpTotal(paid.player.level) + paid.player.experience)
        .toBe(xpTotal(before.player.level) + before.player.experience + 1500);
      expect(mercXp()).toBe(beforeMercXp + 1125);
      expect(paid.mercs.fieldedMercId).toBe(mercId);
      expect(paid.mercs.ownedMercs).toHaveLength(before.mercs.ownedMercs.length + 1);
      expect(paid.mercs.ownedMercs.find(row => row.id === trainee)).toEqual(
        createMercFromDef(required(loadMercPool().pool.find(row => row.id === trainee))));
      expect(paid.mercs.mercProgress[trainee]).toEqual({
        experience: 0, experienceToNextLevel: mercXpForLevel(3) });
      expect(paid.inventory).toEqual(before.inventory);
      expect(paid.map).toEqual({ ...before.map, questProgress: {
        ...before.map.questProgress,
        [quest]: { ...before.map.questProgress[quest], rewardClaimed: true }
      } });
      expect(disk.state.writes).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(1);
      expect(disk.state.writes[0]?.data).toEqual(flushed(paid));
      const exported = required(await exportSave());
      expect(JSON.parse(exported) as unknown).toEqual(toJsonSafe(flushed(paid)));
      stopAutoSave();
      for (const restore of [() => importIntoStores(exported), () => hydrateFromSave()]) {
        for (const store of [usePlayerStore, useInventoryStore, useMercStore, useMapStore]) store.getState().reset();
        await restore();
        const restored = snapshot();
        expect(restored.player).toEqual(paid.player);
        expect(restored.inventory).toEqual(paid.inventory);
        expect(restored.mercs).toEqual(paid.mercs);
        expect(restored.map).toEqual(paid.map);
        expect(claimQuestReward(quest)).toBe('already-claimed');
        expect(snapshot()).toEqual(restored);
      }
    } finally { stopAutoSave(); }
  });

  it('debounces the complete paid Den payload and preserves once-only safety through real hydration', async () => {
    startAutoSave();
    try {
      expect(claimQuestReward(DEN)).toBe('ok');
      const paid = snapshot();
      expect(paid.player.level).toBe(2);
      expect(paid.player.experience).toBe(400);
      expect(paid.player.skillPoints).toBe(3);
      expect(paid.map.questProgress[DEN]?.rewardClaimed).toBe(true);
      expect(disk.state.writes).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(1);
      for (const record of disk.state.writes) {
        expect(record.data).toEqual(flushed(paid));
      }
      const saved = required(await loadSave());
      stopAutoSave();
      usePlayerStore.getState().reset();
      useMapStore.getState().reset();
      await hydrateFromSave();
      const restored = snapshot();
      expect(restored.player).toEqual(saved.player);
      expect(restored.inventory).toEqual(saved.inventory);
      expect(restored.mercs).toEqual(saved.mercs);
      expect(restored.map).toEqual(saved.map);
      expect(claimQuestReward(DEN)).toBe('already-claimed');
      expect(snapshot()).toEqual(restored);
      expect(disk.state.writes).toHaveLength(1);
    } finally { stopAutoSave(); }
  });

  it('debounces only restored data after a controlled real merc mutation then throw', async () => {
    const before = snapshot();
    const share = useMercStore.getState().shareExperienceWithFielded;
    useMercStore.setState({ shareExperienceWithFielded: amount => {
      share(amount); throw new Error('Controlled post-mutation merc failure');
    } });
    startAutoSave();
    try {
      let result = '';
      expect(() => { result = claimQuestReward(DEN); }).not.toThrow();
      expect(result).toBe('grant-failed');
      expect(snapshot()).toEqual(before);
      expect(disk.state.writes).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(1);
      for (const record of disk.state.writes) {
        expect(record.data).toEqual(flushed(before));
      }
      expect(required(await loadSave()).map.questProgress[DEN]?.rewardClaimed).not.toBe(true);
    } finally {
      stopAutoSave();
      useMercStore.setState({ shareExperienceWithFielded: share });
    }
  });

  it('refuses while a real import is pending with ready hydration, then claims only the imported character', async () => {
    const old = snapshot();
    await saveSave(old);
    const incoming: SaveCurrent = { ...old,
      player: { ...old.player, id: 'incoming-claim', name: 'Imported claim' } };
    const gate = deferred();
    disk.put.mockImplementationOnce(async record => {
      await gate.promise;
      disk.commit(record);
    });
    startAutoSave();
    const references = domains.map(store => store.getState());
    const pending = importIntoStores(JSON.stringify(toJsonSafe(incoming)));
    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(isReplacingSave()).toBe(true);
      expect(useHydrationStore.getState().status).toBe('ready');
      expect(claimQuestReward(DEN)).toBe('not-ready');
      expectPendingReferences(references);
      expect(disk.state.writes).toHaveLength(1);
      expect(disk.state.writes[0]?.data).toEqual(old);
      gate.release();
      await pending;
      expect(isReplacingSave()).toBe(false);
      expect(snapshot()).toEqual(incoming);
      expect(disk.state.writes).toHaveLength(2);
      expect(disk.state.writes[1]?.data).toEqual(incoming);
      expect(required(await loadSave())).toEqual(incoming);
      expect(claimQuestReward(DEN)).toBe('ok');
      const paid = snapshot();
      expect(paid.player.id).toBe('incoming-claim');
      expect(paid.player.experience).toBe(400);
      expect(paid.map.questProgress[DEN]?.rewardClaimed).toBe(true);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(3);
      const expected = [old, incoming, flushed(paid)];
      disk.state.writes.forEach((record, index) => { expect(record.data).toEqual(expected[index]); });
    } finally {
      gate.release();
      await pending;
      stopAutoSave();
    }
  });
});


const UNIQUE_REWARD = { uniqueId: 'items/unique/coif-of-glory', ilvl: 19 };
async function withUniqueRewards(check: () => Promise<void>): Promise<void> {
  const den = required(mainDocument.quests.find(quest => quest.id === DEN));
  const original = required(Object.getOwnPropertyDescriptor(den, 'rewards'));
  try {
    Object.defineProperty(den, 'rewards', { ...original,
      value: { xp: 8000, skillPoints: 0, runeShards: 7, itemDrop: UNIQUE_REWARD } });
    await check();
  } finally { Object.defineProperty(den, 'rewards', original); }
}

describe('explicit unique rewards at real save boundaries', () => {
  it('debounces a paid item/flag, exports it and preserves exact once-only state through import and hydration', async () => {
    await withUniqueRewards(async () => {
      startAutoSave();
      try {
        expect(claimQuestReward(DEN)).toBe('ok');
        const paid = snapshot();
        expect(paid.inventory.backpack).toHaveLength(1);
        expect(paid.inventory.backpack[0]).toMatchObject({ uniqueId: UNIQUE_REWARD.uniqueId, ilvl: 19 });
        expect(paid.map.questProgress[DEN]?.rewardClaimed).toBe(true);
        expect(disk.state.writes).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
        expect(disk.state.writes).toHaveLength(1);
        expect(disk.state.writes[0]?.data).toEqual(flushed(paid));
        const exported = required(await exportSave());
        expect(JSON.parse(exported) as unknown).toEqual(toJsonSafe(flushed(paid)));
        stopAutoSave();
        useInventoryStore.getState().reset(); useMapStore.getState().reset();
        await importIntoStores(exported);
        const imported = snapshot();
        expect(imported.inventory).toEqual(paid.inventory);
        expect(imported.player).toEqual(paid.player);
        expect(imported.mercs).toEqual(paid.mercs);
        expect(imported.map).toEqual(paid.map);
        expect(claimQuestReward(DEN)).toBe('already-claimed');
        expect(snapshot()).toEqual(imported);
        useInventoryStore.getState().reset(); useMapStore.getState().reset();
        await hydrateFromSave();
        const hydrated = snapshot();
        expect(hydrated.inventory).toEqual(paid.inventory);
        expect(hydrated.player).toEqual(paid.player);
        expect(hydrated.mercs).toEqual(paid.mercs);
        expect(hydrated.map).toEqual(paid.map);
        expect(claimQuestReward(DEN)).toBe('already-claimed');
        expect(snapshot()).toEqual(hydrated);
      } finally { stopAutoSave(); }
    });
  });
});


describe('unique rollback persistence and pending import', () => {
  it.each(['item', 'flag'] as const)('debounces restored payload after real %s mutation then throw', async failAt => {
    await withUniqueRewards(async () => {
      const before = snapshot();
      const add = useInventoryStore.getState().addItem;
      const mark = useMapStore.getState().markQuestRewardClaimed;
      useInventoryStore.setState({ addItem: item => {
        add(item); if (failAt === 'item') throw new Error('Controlled saved item insertion failure');
      } });
      useMapStore.setState({ markQuestRewardClaimed: id => {
        mark(id); if (failAt === 'flag') throw new Error('Controlled saved final flag failure');
      } });
      startAutoSave();
      try {
        expect(claimQuestReward(DEN)).toBe('grant-failed');
        expect(snapshot()).toEqual(before);
        expect(disk.state.writes).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
        expect(disk.state.writes).toHaveLength(1);
        expect(disk.state.writes[0]?.data).toEqual(flushed(before));
        const saved = required(await loadSave());
        expect(saved.inventory).toEqual(before.inventory);
        expect(saved.map.questProgress[DEN]?.rewardClaimed).not.toBe(true);
        expect(saved.inventory.backpack).toEqual([]);
      } finally {
        stopAutoSave();
        useInventoryStore.setState({ addItem: add });
        useMapStore.setState({ markQuestRewardClaimed: mark });
      }
    });
  });

  it('refuses pending replacement before allocation, then uses only the imported identity seed and saves once', async () => {
    await withUniqueRewards(async () => {
      const old = snapshot();
      await saveSave(old);
      const incoming: SaveCurrent = { ...old,
        player: { ...old.player, id: 'incoming-unique-claim', name: 'Imported unique claimant' } };
      const gate = deferred();
      disk.put.mockImplementationOnce(async record => { await gate.promise; disk.commit(record); });
      startAutoSave();
      const references = domains.map(store => store.getState());
      const pending = importIntoStores(JSON.stringify(toJsonSafe(incoming)));
      try {
        await vi.advanceTimersByTimeAsync(0);
        expect(isReplacingSave()).toBe(true);
        expect(useHydrationStore.getState().status).toBe('ready');
        const ordinary = () => rollItem({ baseId: 'items/base/sh-buckler', rarity: 'normal', ilvl: 19 },
          loadAwardPools(), createRng(5049));
        __resetRollItemSeqForTests();
        const baseline = required(ordinary());
        __resetRollItemSeqForTests();
        expect(claimQuestReward(DEN)).toBe('not-ready');
        expectPendingReferences(references);
        expect(ordinary()).toEqual(baseline); // No reset following pending-import refusal.
        gate.release(); await pending;
        expect(isReplacingSave()).toBe(false);
        expect(snapshot()).toEqual(incoming);
        expect(claimQuestReward(DEN)).toBe('ok');
        const paid = snapshot();
        const item = required(paid.inventory.backpack[0]);
        const expected = required(rollUniqueItem(UNIQUE_REWARD, loadAwardPools(), createRng(hashSeed(
          JSON.stringify(['quest-unique-v1', incoming.player.id, DEN, UNIQUE_REWARD.uniqueId, UNIQUE_REWARD.ilvl])
        ))));
        expect(item).toEqual({ ...expected, id: item.id });
        expect(item.id.split('-')[1]).toBe(expected.id.split('-')[1]);
        expect(paid.player.id).toBe(incoming.player.id);
        expect(paid.inventory.backpack).toHaveLength(1);
        expect(paid.map.questProgress[DEN]?.rewardClaimed).toBe(true);
        expect(claimQuestReward(DEN)).toBe('already-claimed');
        expect(snapshot()).toEqual(paid);
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
        expect(disk.state.writes).toHaveLength(3);
        const expectedWrites = [old, incoming, flushed(paid)];
        disk.state.writes.forEach((record, index) => { expect(record.data).toEqual(expectedWrites[index]); });
        expect(required(await loadSave())).toEqual(flushed(paid));
      } finally {
        gate.release(); await pending; stopAutoSave();
      }
    });
  });
});

describe('actual authored Andariel reward at real save boundaries', () => {
  it('requires an explicit claim and preserves its sole exact unique and fixed XP through every save boundary', async () => {
    const quest = required(loadQuests().find(row => row.id === 'quests/act1-sisters-to-the-slaughter'));
    const mercId = required(useMercStore.getState().fieldedMercId);
    const mercXp = () => {
      const merc = required(useMercStore.getState().ownedMercs.find(row => row.id === mercId));
      let total = useMercStore.getState().getMercProgress(mercId).experience;
      for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
      return total;
    };
    const beforeMerc = mercXp();
    const before = snapshot();
    useMapStore.getState().updateQuestProgress(quest.id, { status: 'inProgress',
      objectives: { 'obj-kill-andariel': false } });
    expect(claimQuestReward(quest.id)).toBe('not-completed');
    useMapStore.getState().updateQuestProgress(quest.id, { status: 'completed',
      objectives: { 'obj-kill-andariel': true } });
    const completed = snapshot();
    expect(completed.player).toEqual(before.player);
    expect(completed.inventory).toEqual(before.inventory);
    expect(completed.mercs).toEqual(before.mercs);
    expect(completed.map.questProgress[quest.id]?.rewardClaimed).not.toBe(true);
    startAutoSave();
    try {
      expect(claimQuestReward(quest.id)).toBe('ok');
      const paid = snapshot();
      const item = required(paid.inventory.backpack[0]);
      const expected = required(rollUniqueItem(UNIQUE_REWARD, loadAwardPools(), createRng(hashSeed(
        JSON.stringify(['quest-unique-v1', before.player.id, quest.id, UNIQUE_REWARD.uniqueId, UNIQUE_REWARD.ilvl])
      ))));
      expect(item).toEqual({ ...expected, id: item.id });
      expect(item.id.split('-')[1]).toBe(expected.id.split('-')[1]);
      expect(paid.inventory.backpack).toHaveLength(1);
      expect(paid.inventory).toEqual({ ...before.inventory, backpack: [item] });
      const award = awardXp(xpTotal(before.player.level) + before.player.experience, 8000);
      expect(xpTotal(paid.player.level) + paid.player.experience).toBe(award.totalXp);
      expect(paid.player.level).toBe(award.level);
      expect(paid.player.statPoints).toBe(before.player.statPoints + award.statPointsGranted);
      expect(paid.player.skillPoints).toBe(before.player.skillPoints + award.skillPointsGranted);
      expect(mercXp()).toBe(beforeMerc + 6000);
      expect(paid.map).toEqual({ ...completed.map, questProgress: {
        ...completed.map.questProgress,
        [quest.id]: { ...completed.map.questProgress[quest.id], rewardClaimed: true }
      } });
      expect(claimQuestReward(quest.id)).toBe('already-claimed');
      expect(snapshot()).toEqual(paid);
      expect(disk.state.writes).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
      expect(disk.state.writes).toHaveLength(1);
      expect(disk.state.writes[0]?.data).toEqual(flushed(paid));
      const exported = required(await exportSave());
      expect(JSON.parse(exported) as unknown).toEqual(toJsonSafe(flushed(paid)));
      stopAutoSave();
      for (const restore of [
        () => importIntoStores(exported), () => hydrateFromSave()
      ]) {
        for (const store of [usePlayerStore, useInventoryStore, useMercStore, useMapStore]) store.getState().reset();
        await restore();
        const restored = snapshot();
        expect(restored.player).toEqual(paid.player);
        expect(restored.inventory).toEqual(paid.inventory);
        expect(restored.mercs).toEqual(paid.mercs);
        expect(restored.map).toEqual(paid.map);
        expect(claimQuestReward(quest.id)).toBe('already-claimed');
        expect(snapshot()).toEqual(restored);
      }
    } finally { stopAutoSave(); }
  });
});
