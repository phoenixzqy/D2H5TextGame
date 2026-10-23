import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadMercPool } from '@/data/loaders/mercs';
import { loadAwardPools } from '@/data/loaders/loot';
import { rollQuestTableRewards } from '@/engine/loot/award';
import { createRng, hashSeed } from '@/engine/rng';
import { xpTotal } from '@/engine/progression/xp';
import { decodeSave, validateQuestItemLedger } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { snapshotStores, useHydrationStore } from '@/stores/persistence';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { canClaim, claimQuestReward, readQuestItem, recoverClaimedQuestRewardItem, questRewardItemRecoveryStatus } from './claimReward';

const QUEST = 'quests/act3-guardian', KHALIM = 'quests/act3-khalims-will';
const SOULSTONE = `${QUEST}#reward:questItem`, WILL = `${KHALIM}#objective:obj-transmute`;
const COUNCIL = `${KHALIM}#action:council-victory`, ORB = `${QUEST}#action:break-compelling-orb`;
const CUBE = 'quests/act2-horadric-staff#objective:obj-cube';
const PROFILE = { tableId: 'loot/mephisto-q', ilvl: 47, picks: 5 };
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore] as const;
const actions = {
  gainExperience: usePlayerStore.getState().gainExperience,
  shareExperienceWithFielded: useMercStore.getState().shareExperienceWithFielded,
  addItem: useInventoryStore.getState().addItem, addCurrency: useInventoryStore.getState().addCurrency,
  markQuestRewardClaimed: useMapStore.getState().markQuestRewardClaimed
};
function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Missing Guardian reward fixture');
  return value;
}
function xp(): number {
  const hero = required(usePlayerStore.getState().player);
  return xpTotal(hero.level) + hero.experience;
}
function mercXp(): number {
  const state = useMercStore.getState(), merc = required(state.ownedMercs.find(row => row.id === state.fieldedMercId));
  let total = state.getMercProgress(merc.id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function reset(): void {
  usePlayerStore.setState({ gainExperience: actions.gainExperience });
  useMercStore.setState({ shareExperienceWithFielded: actions.shareExperienceWithFielded });
  useInventoryStore.setState({ addItem: actions.addItem, addCurrency: actions.addCurrency });
  useMapStore.setState({ markQuestRewardClaimed: actions.markQuestRewardClaimed });
  for (const store of stores) store.getState().reset();
}
function state() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))));
}
function expectedCache() {
  return required(rollQuestTableRewards(PROFILE, loadAwardPools(), createRng(hashSeed(JSON.stringify([
    'quest-loot-table-v1', 'qa-a3-hero', QUEST, PROFILE.tableId, PROFILE.ilvl, PROFILE.picks
  ])))));
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Guardian reward fixture', 'sorceress'),
    id: 'qa-a3-hero', level: 30, experience: 0 });
  const hired = useMercStore.getState().hireMerc(required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight')));
  expect(hired.ok).toBe(true); useMercStore.getState().setFieldedMerc(required(hired.mercId));
  // Constructed completed Claim fixture; live accepted Mephisto admission is tested by the store suite.
  useMapStore.setState({ currentAct: 3, questProgress: {
    'quests/act2-horadric-staff': { id: 'quests/act2-horadric-staff', status: 'inProgress', objectives: {
      'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } },
    [KHALIM]: { id: KHALIM, status: 'completed', rewardClaimed: false, objectives: {
      'obj-heart': true, 'obj-brain': true, 'obj-eye': true, 'obj-flail': true, 'obj-transmute': true } },
    [QUEST]: { id: QUEST, status: 'completed', rewardClaimed: false, objectives: { 'obj-kill-mephisto': true } }
  }, questReceipts: { [COUNCIL]: true, [ORB]: true } });
  useInventoryStore.setState({ questItems: {
    [CUBE]: { itemId: 'quest/horadric_cube', state: 'owned' },
    ...Object.fromEntries(['heart', 'brain', 'eye', 'flail'].map(part =>
      [`${KHALIM}#objective:obj-${part}`, { itemId: `quest/khalims_${part}`, state: 'consumed' }])),
    [WILL]: { itemId: 'items/khalims_will', state: 'consumed' }
  } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });

describe('Guardian exact cache and retained reward', () => {
  it('claims 18000 hero XP, 13500 fielded merc XP, the private level47/five-pick cache and one retained Soulstone once', () => {
    const heroBefore = xp(), mercBefore = mercXp(), cache = expectedCache();
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(xp()).toBe(heroBefore + 18000); expect(mercXp()).toBe(mercBefore + 13500);
    expect(useInventoryStore.getState().questItems[SOULSTONE]).toEqual({ itemId: 'items/soulstone_mephisto', state: 'owned' });
    expect(useInventoryStore.getState().backpack.map(item => ({ ...item, id: '' })))
      .toEqual(cache.items.map(item => ({ ...item, id: '' })));
    expect(useInventoryStore.getState().currencies['rune-shard'] ?? 0).toBe(cache.runes + cache.runeShards);
    expect(claimQuestReward(QUEST)).toBe('already-claimed');
    expect(xp()).toBe(heroBefore + 18000); expect(mercXp()).toBe(mercBefore + 13500);
  });

  it('retains Soulstone without Read, automatic legacy recovery or implicit consumption', () => {
    expect(canClaim(QUEST)).toBe(true); expect(claimQuestReward(QUEST)).toBe('ok');
    const before = state();
    expect(readQuestItem(SOULSTONE)).toBe('unsupported-rewards');
    expect(questRewardItemRecoveryStatus(QUEST)).toBe('unavailable');
    expect(recoverClaimedQuestRewardItem(QUEST)).toBe('not-eligible');
    expect(state()).toEqual(before);
    const map = useMapStore.getState();
    expect(() => validateQuestItemLedger({ ...useInventoryStore.getState().questItems,
      [SOULSTONE]: { itemId: 'items/soulstone_mephisto', state: 'consumed' } }, map.questProgress, map.questReceipts)).toThrow(/retained reward/);
  });

  it.each(['flags-only', 'no-orb', 'owned-will', 'wrong-will-source', 'missing-cube'] as const)(
    'refuses %s completion without paying any reward', fault => {
      if (fault === 'flags-only') {
        useInventoryStore.setState({ questItems: {} }); useMapStore.setState({ questReceipts: {} });
      }
      if (fault === 'no-orb') useMapStore.setState({ questReceipts: { [COUNCIL]: true } });
      if (fault === 'owned-will') useInventoryStore.setState(store => ({ questItems: {
        ...store.questItems, [WILL]: { itemId: 'items/khalims_will', state: 'owned' } } }));
      if (fault === 'wrong-will-source') useInventoryStore.setState(store => {
        const { [WILL]: will, ...other } = store.questItems;
        return { questItems: { ...other, [`${QUEST}#objective:obj-transmute`]: required(will) } };
      });
      if (fault === 'missing-cube') useInventoryStore.setState(store => {
        const { [CUBE]: _cube, ...questItems } = store.questItems; return { questItems };
      });
      const before = state();
      expect(canClaim(QUEST)).toBe(false); expect(claimQuestReward(QUEST)).toBe('not-completed');
      expect(state()).toEqual(before);
    });

  it('roundtrips the exact paid graph and rejects future Soulstone in frozen14 without minting legacy rewards', () => {
    expect(claimQuestReward(QUEST)).toBe('ok');
    const paid = required(snapshotStores()), restored = decodeSave(toJsonSafe(paid));
    expect(restored).toEqual(paid);
    const map = useMapStore.getState();
    const { [SOULSTONE]: soulstone, ...items } = useInventoryStore.getState().questItems;
    expect(() => validateQuestItemLedger({ ...items, [`${KHALIM}#reward:questItem`]: required(soulstone) },
      map.questProgress, map.questReceipts)).toThrow(/unknown/);
    const { questReceipts: _receipts, ...historicalMap } = paid.map;
    expect(() => decodeSave({ ...paid, version: 14, map: historicalMap })).toThrow(/v14/);
    const historical = { ...paid, version: 14, map: historicalMap,
      inventory: { ...paid.inventory, questItems: { [CUBE]: required(paid.inventory.questItems[CUBE]) } } };
    const decoded = decodeSave(historical);
    expect(decoded.inventory.questItems).toEqual(historical.inventory.questItems);
    expect(decoded.map.questReceipts).toEqual({});
    expect(decoded.map.questProgress[QUEST]).toEqual(paid.map.questProgress[QUEST]);
    expect(decoded.player).toEqual(paid.player);
  });

  it('keeps every prepared cache item in lossless overflow while the bound Soulstone uses no gear slot', () => {
    const filler = { id: 'existing-gear', baseId: 'items/base/helm-cap', rarity: 'normal' as const,
      level: 1, identified: true, equipped: false };
    useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY }, (_, i) => ({ ...filler, id: `gear-${String(i)}` })) });
    const cache = expectedCache(); expect(cache.items.length).toBeGreaterThan(0);
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(useInventoryStore.getState().backpack).toHaveLength(BACKPACK_CAPACITY + cache.items.length);
    expect(useInventoryStore.getState().backpack.slice(BACKPACK_CAPACITY).map(item => ({ ...item, id: '' })))
      .toEqual(cache.items.map(item => ({ ...item, id: '' })));
    expect(useInventoryStore.getState().questItems[SOULSTONE]?.state).toBe('owned');
  });

  it.each(['hero', 'merc', 'currency', 'item', 'ledger', 'claimed'] as const)(
    'restores all participating reward state after %s mutation then retries the identical cache', fault => {
      const before = state(), cache = expectedCache();
      const fail = (): never => { expect(readQuestItem(SOULSTONE)).toBe('claim-in-progress'); throw new Error(fault); };
      if (fault === 'hero') usePlayerStore.setState({ gainExperience: amount => { actions.gainExperience(amount); return fail(); } });
      if (fault === 'merc') useMercStore.setState({ shareExperienceWithFielded: amount => { actions.shareExperienceWithFielded(amount); fail(); } });
      if (fault === 'currency') useInventoryStore.setState({ addCurrency: (kind, amount) => { actions.addCurrency(kind, amount); fail(); } });
      if (fault === 'item') useInventoryStore.setState({ addItem: item => { actions.addItem(item); fail(); } });
      if (fault === 'ledger') {
        const write = useInventoryStore.setState;
        vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { write(...args); fail(); });
      }
      if (fault === 'claimed') useMapStore.setState({ markQuestRewardClaimed: id => { actions.markQuestRewardClaimed(id); fail(); } });
      expect(claimQuestReward(QUEST)).toBe('grant-failed'); expect(state()).toEqual(before);
      vi.restoreAllMocks();
      usePlayerStore.setState({ gainExperience: actions.gainExperience });
      useMercStore.setState({ shareExperienceWithFielded: actions.shareExperienceWithFielded });
      useInventoryStore.setState({ addItem: actions.addItem, addCurrency: actions.addCurrency });
      useMapStore.setState({ markQuestRewardClaimed: actions.markQuestRewardClaimed });
      expect(claimQuestReward(QUEST)).toBe('ok');
      expect(useInventoryStore.getState().backpack.map(item => ({ ...item, id: '' })))
        .toEqual(cache.items.map(item => ({ ...item, id: '' })));
      expect(useInventoryStore.getState().questItems[SOULSTONE]?.state).toBe('owned');
    });

  it('attempts all four restorations and holds the shared lock until aggregated failures escape', () => {
    const before = state(), errors = [new Error('hero restore'), new Error('merc restore'),
      new Error('inventory restore'), new Error('map restore')] as const;
    const attempted: string[] = [];
    useMapStore.setState({ markQuestRewardClaimed: id => { actions.markQuestRewardClaimed(id); throw new Error('claimed publication'); } });
    const inventoryWrite = useInventoryStore.setState;
    const playerWrite = usePlayerStore.setState, mercWrite = useMercStore.setState, mapWrite = useMapStore.setState;
    vi.spyOn(usePlayerStore, 'setState').mockImplementationOnce((...args) => {
      attempted.push('hero'); playerWrite(...args); expect(claimQuestReward(QUEST)).toBe('claim-in-progress'); throw errors[0];
    });
    vi.spyOn(useMercStore, 'setState').mockImplementationOnce((...args) => {
      attempted.push('merc'); mercWrite(...args); expect(readQuestItem(SOULSTONE)).toBe('claim-in-progress'); throw errors[1];
    });
    vi.spyOn(useInventoryStore, 'setState').mockImplementationOnce((...args) => { inventoryWrite(...args); })
      .mockImplementationOnce((...args) => {
        attempted.push('inventory'); inventoryWrite(...args); expect(claimQuestReward(QUEST)).toBe('claim-in-progress'); throw errors[2];
      });
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce((...args) => {
      attempted.push('map'); mapWrite(...args); expect(readQuestItem(SOULSTONE)).toBe('claim-in-progress'); throw errors[3];
    });
    let caught: unknown;
    try { claimQuestReward(QUEST); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(AggregateError);
    expect((caught as AggregateError).errors).toEqual(errors);
    expect(attempted).toEqual(['hero', 'merc', 'inventory', 'map']);
    expect(state()).toEqual(before);
  });
});
