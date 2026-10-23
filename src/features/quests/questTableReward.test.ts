import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mainDocument from '@/data/quests/main.json';
import { loadAwardPools } from '@/data/loaders/loot';
import * as lootLoader from '@/data/loaders/loot';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { createRng, hashSeed } from '@/engine/rng';
import { rollQuestTableRewards, type QuestTableRewardInput } from '@/engine/loot/award';
import * as award from '@/engine/loot/award';
import * as itemRoll from '@/engine/loot/rollItem';
import { xpTotal } from '@/engine/progression/xp';
import { decodeSave } from '@/engine/save/validate';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { __resetPersistenceForTests, exportCurrentSave, snapshotStores, useHydrationStore } from '@/stores/persistence';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { claimQuestReward } from './claimReward';
import { assembleQuestItem } from './questCrafting';

const QUEST = 'quests/act2-seven-tombs';
const profile = { tableId: 'loot/duriel-q', ilvl: 32, picks: 5 };
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore] as const;
const inventoryActions = { addItem: useInventoryStore.getState().addItem, addCurrency: useInventoryStore.getState().addCurrency };
const mapActions = { markQuestRewardClaimed: useMapStore.getState().markQuestRewardClaimed };
function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Missing quest cache fixture');
  return value;
}
function state() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))));
}
function reset() {
  __resetPersistenceForTests();
  useInventoryStore.setState(inventoryActions); useMapStore.setState(mapActions);
  for (const store of stores) store.getState().reset();
}
beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(1792497600000);
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Cache fixture', 'sorceress'), id: 'cache-fixed' });
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed', rewardClaimed: false,
    objectives: { 'obj-open-tomb': true, 'obj-kill-duriel': true } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });
function withRewards(rewards: Record<string, unknown>, check: () => void) {
  const quest = required(mainDocument.quests.find(row => row.id === QUEST));
  const original = required(Object.getOwnPropertyDescriptor(quest, 'rewards'));
  try { Object.defineProperty(quest, 'rewards', { ...original, value: rewards }); check(); }
  finally { Object.defineProperty(quest, 'rewards', original); }
}
function predict(input: QuestTableRewardInput = profile) {
  const player = required(usePlayerStore.getState().player);
  return required(rollQuestTableRewards(input, loadAwardPools(), createRng(hashSeed(JSON.stringify([
    'quest-loot-table-v1', player.id, QUEST, input.tableId, input.ilvl, input.picks
  ])))));
}
function properties(items = useInventoryStore.getState().backpack) {
  return items.map(item => ({ ...item, id: '' }));
}
function xp() { const hero = required(usePlayerStore.getState().player); return xpTotal(hero.level) + hero.experience; }
function mercXp(id: string) {
  const merc = required(useMercStore.getState().ownedMercs.find(row => row.id === id));
  let total = useMercStore.getState().getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function noWrites(result: string) {
  const before = state(); let publications = 0;
  const unsub = stores.map(store => store.subscribe(() => { publications++; }));
  try { expect(claimQuestReward(QUEST)).toBe(result); expect(state()).toEqual(before); expect(publications).toBe(0); }
  finally { unsub.forEach(stop => { stop(); }); }
}

describe('explicit deterministic quest-table Claim', () => {
  it('grants the actual Duriel cache plus12000XP and9000 fielded-mercXP exactly once', () => {
    const definition = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
    const hired = useMercStore.getState().hireMerc(definition); expect(hired.ok).toBe(true);
    const id = required(hired.mercId); useMercStore.getState().setFieldedMerc(id);
    const expected = predict(), before = xp(), mercBefore = mercXp(id);
    expect(claimQuestReward(QUEST)).toBe('ok'); expect(xp()).toBe(before + 12000);
    expect(mercXp(id)).toBe(mercBefore + 9000);
    expect(properties()).toEqual(properties([...expected.items]));
    const currencies = useInventoryStore.getState().currencies;
    expect(currencies['rune-shard'] ?? 0).toBe(expected.runes + expected.runeShards);
    expect(currencies['gem-shard'] ?? 0).toBe(expected.gems);
    expect(currencies.wishstone ?? 0).toBe(expected.wishstones);
    expect(currencies).not.toHaveProperty('gold'); expect(currencies).not.toHaveProperty('runes');
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(true);
    const settled = state(); expect(claimQuestReward(QUEST)).toBe('already-claimed'); expect(state()).toEqual(settled);
  });

  it('supports a table-only bag and saves every exact item/currency/claim', () => {
    withRewards({ lootTable: profile }, () => {
      const before = xp(); expect(claimQuestReward(QUEST)).toBe('ok'); expect(xp()).toBe(before);
      const bytes = required(exportCurrentSave());
      expect(decodeSave(JSON.parse(bytes) as unknown)).toEqual(snapshotStores());
    });
  });

  it('keeps legacy numeric currency targets alongside canonical cache currencies', () => {
    withRewards({ lootTable: profile, runeShards: 7, runes: 9 }, () => {
      const expected = predict(); expect(claimQuestReward(QUEST)).toBe('ok');
      expect(useInventoryStore.getState().currencies).toMatchObject({ runeShards: 7, runes: 9,
        'rune-shard': expected.runes + expected.runeShards });
    });
  });

  it.each([
    { lootTable: 'loot/duriel-q', xp: 12000 },
    { lootTable: { ...profile, tableId: 'loot/missing' }, xp: 12000 },
    { lootTable: { ...profile, picks: Number.MAX_SAFE_INTEGER + 1 }, xp: 12000 }
  ])('refuses the entire unsupported/unavailable bag %j', rewards => {
    withRewards(rewards, () => { noWrites('unsupported-rewards'); });
  });

  it('refuses an entirely ineligible table before publication', () => {
    const pools = loadAwardPools();
    vi.spyOn(lootLoader, 'loadAwardPools').mockReturnValue({ ...pools,
      treasureClasses: new Map([[profile.tableId, { id: profile.tableId, picks: [
        { type: 'rune', weight: 1, qlvlMin: 40, qlvlMax: 99 }
      ] }]]) });
    noWrites('unsupported-rewards');
  });

  it('rejects unsupported neighboring rewards before any item allocation', () => {
    withRewards({ lootTable: profile, gold: 1, xp: 12000 }, () => {
      const roll = vi.spyOn(itemRoll, 'rollItem'); noWrites('unsupported-rewards'); expect(roll).not.toHaveBeenCalled();
    });
  });

  it('refuses combined rune destinations even when each table total is separately safe', () => {
    vi.spyOn(award, 'rollQuestTableRewards').mockReturnValue({ items: [],
      runes: Number.MAX_SAFE_INTEGER, runeShards: 1, gems: 0, wishstones: 0 });
    noWrites('unsupported-rewards');
  });

  it('keeps cache properties independent of live level, gear, navigation and clock', () => {
    withRewards({ lootTable: profile }, () => {
      expect(claimQuestReward(QUEST)).toBe('ok');
      const first = properties(), currencies = useInventoryStore.getState().currencies;
      // Separate constructed Claim fixture, retaining only the seed identity/profile.
      const hero = required(usePlayerStore.getState().player);
      usePlayerStore.getState().setPlayer({ ...hero, level: 30, experience: 0,
        derivedStats: { ...hero.derivedStats, magicFind: 900, goldFind: 800 } });
      useInventoryStore.setState({ backpack: [], currencies: {} });
      useMapStore.getState().updateQuestProgress(QUEST, { rewardClaimed: false });
      useMapStore.getState().setCurrentLocation(5, 'areas/act5-worldstone-keep');
      vi.mocked(Date.now).mockReturnValue(1792497700000);
      expect(claimQuestReward(QUEST)).toBe('ok');
      expect(properties()).toEqual(first); expect(useInventoryStore.getState().currencies).toEqual(currencies);
    });
  });

  it('prepares a mixed unique and cache bag before publishing either item source', () => {
    withRewards({ itemDrop: { uniqueId: 'items/unique/coif-of-glory', ilvl: 19 }, lootTable: profile }, () => {
      const expected = predict(); expect(claimQuestReward(QUEST)).toBe('ok');
      const backpack = useInventoryStore.getState().backpack;
      expect(backpack[0]).toMatchObject({ uniqueId: 'items/unique/coif-of-glory', ilvl: 19 });
      expect(properties(backpack.slice(1))).toEqual(properties([...expected.items]));
    });
  });

  it.each(['rune-shard', 'runeShards'] as const)('preflights %s overflow before publishing any reward', target => {
    const expected = predict(); expect(expected.runes + expected.runeShards).toBeGreaterThan(0);
    useInventoryStore.setState({ currencies: { [target]: Number.MAX_SAFE_INTEGER } });
    withRewards({ lootTable: profile, runeShards: 1, xp: 12000 }, () => { noWrites('unsupported-rewards'); });
  });

  it.each(['currency', 'second-item', 'claimed-flag'] as const)('restores every participant after %s mutation, then retries deterministically', failure => {
    const expected = predict(); expect(expected.items.length).toBeGreaterThanOrEqual(2);
    const before = state(); let nested: string | undefined;
    if (failure === 'currency') useInventoryStore.setState({ addCurrency: (kind, amount) => {
      inventoryActions.addCurrency(kind, amount); nested = assembleQuestItem('invalid'); throw new Error('after currency');
    } });
    if (failure === 'second-item') {
      let calls = 0; useInventoryStore.setState({ addItem: item => {
        inventoryActions.addItem(item); calls++; if (calls === 2) throw new Error('after second item');
      } });
    }
    if (failure === 'claimed-flag') useMapStore.setState({ markQuestRewardClaimed: id => {
      mapActions.markQuestRewardClaimed(id); useMapStore.getState().updateQuestProgress('unrelated', { status: 'available', objectives: {} });
      throw new Error('after claimed flag');
    } });
    expect(claimQuestReward(QUEST)).toBe('grant-failed');
    if (failure === 'claimed-flag') {
      expect(useMapStore.getState().questProgress.unrelated?.status).toBe('available');
      useMapStore.setState(state => ({ questProgress: Object.fromEntries(Object.entries(state.questProgress).filter(([id]) => id !== 'unrelated')) }));
    }
    expect(state()).toEqual(before);
    if (failure === 'currency') expect(nested).toBe('claim-in-progress');
    useInventoryStore.setState(inventoryActions); useMapStore.setState(mapActions);
    expect(claimQuestReward(QUEST)).toBe('ok'); expect(properties()).toEqual(properties([...expected.items]));
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(expected.runes + expected.runeShards);
  });

  it('refuses preparation failure without XP/currency/claim publication', () => {
    vi.spyOn(itemRoll, 'rollItem').mockReturnValueOnce(undefined); noWrites('unsupported-rewards');
  });

  it('reports a constructor exception without publication', () => {
    vi.spyOn(itemRoll, 'rollItem').mockImplementationOnce(() => { throw new Error('constructor'); }); noWrites('grant-failed');
  });

  it('retains all existing items and new rewards beyond display capacity', () => {
    const item = required(predict().items[0]);
    const original = Array.from({ length: BACKPACK_CAPACITY }, (_, index) => ({ ...item, id: `existing-cache-${String(index)}` }));
    useInventoryStore.setState({ backpack: original });
    const expected = predict(); expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().backpack.slice(0, original.length)).toEqual(original);
    expect(properties(useInventoryStore.getState().backpack.slice(original.length))).toEqual(properties([...expected.items]));
  });
});
