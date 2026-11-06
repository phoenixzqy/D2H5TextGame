/** Constructed trade capability; source ingress and actual UI are independently covered. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import * as itemRoller from '@/engine/loot/rollItem';
import { loadAwardPools } from '@/data/loaders/loot';
import { loadAnyaUniqueCatalog } from '@/data/loaders/anya-vendor';
import { createRng } from '@/engine/rng';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { loadQuests } from '@/data/loaders/quests';
import { ANYA as A } from '@/engine/map/anya-quest';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward } from '@/features/quests/claimReward';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { assertWaveSnapshotAllowed, beginMaterialTransaction, endMaterialTransaction } from '@/stores/waveTransitionGuard';
import { anyaTradeStatus, executeAnyaTrade, listAnyaTrades, prepareAnyaTrade, type AnyaTradeEntryId } from './anyaTrade';
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [], originalUnlock = useMapStore.getState().isActUnlocked;
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing fixture'); return value; }
function hero() { return required(usePlayerStore.getState().player); }
function selection(entry: AnyaTradeEntryId = 'waterwalk') { return required(prepareAnyaTrade(entry)); }
function item(id = 'independent-item'): Item {
  const pools = loadAwardPools(), base = required([...pools.bases.values()].find(base => base.type === 'armor'));
  return { ...required(itemRoller.rollItem({ baseId: base.id, rarity: 'normal', ilvl: 1 }, pools, createRng(7))), id };
}
function snapshot() { const inv = useInventoryStore.getState(); return structuredClone({ hero: usePlayerStore.getState().player,
  currencies: inv.currencies, materials: inv.materials, backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped,
  services: inv.questServices, receipts: useMapStore.getState().questReceipts }); }
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  const p = createMockPlayer('Anya Trade', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...p, derivedStats: { ...p.derivedStats, defense: 999, life: 3, mana: 2,
    resistances: { fire: 10, cold: 10, lightning: 10, poison: 10, arcane: 10, physical: 10 } } });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: 'areas/act5-crystalline-passage', isActUnlocked: () => true,
    questProgress: { [A.quest]: { id: A.quest, status: 'completed', rewardClaimed: true, objectives: { [A.objective]: true } },
    [A.prerequisite.quest]: { id: A.prerequisite.quest, status: 'completed', rewardClaimed: true, objectives: Object.fromEntries(A.prerequisite.objectiveIds.map(id => [id, true])) } },
    questReceipts: { [A.proof]: true, [A.prerequisite.inspectProof]: true, [A.prerequisite.potionSource]: true, [A.prerequisite.thawProof]: true } });
  useInventoryStore.setState({ currencies: { 'rune-shard': 5000, independent: 9 }, materials: { 'materials/scrap': 100 },
    questItems: { [A.prerequisite.potionSource]: { itemId: A.prerequisite.potionItemId, state: 'consumed' } },
    questServices: { [A.serviceSource]: { serviceId: 'personalize_item', state: 'available' } } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); useMapStore.setState({ isActUnlocked: originalUnlock }); __resetPersistenceForTests(); });
describe('finite paid Anya trades', () => {
  it('lists/prepares without RNG or allocation and publishes debit then genuine unique then selected stock', () => {
    const roll = vi.spyOn(itemRoller, 'rollUniqueItem'), before = snapshot();
    expect(listAnyaTrades().map(row => [row.entryId, row.stock, row.status])).toEqual([['frostburn-gauntlet', 1, 'ready'], ['waterwalk', 1, 'ready']]);
    const selected = selection('frostburn-gauntlet'); expect(roll).not.toHaveBeenCalled(); expect(snapshot()).toEqual(before);
    let debit = false, output = false;
    stops.push(useInventoryStore.subscribe(state => {
      if (state.currencies['rune-shard'] !== 3000) return; debit = true;
      expect(useMapStore.getState().questReceipts[A.tradeProofs['frostburn-gauntlet']]).toBeUndefined();
      if (state.backpack.length) { output = true; expect(state.materials['materials/scrap']).toBe(60); }
    }));
    expect(executeAnyaTrade(selected)).toBe('ok'); expect(debit).toBe(true); expect(output).toBe(true); expect(roll).toHaveBeenCalledTimes(1);
    const awarded = required(useInventoryStore.getState().backpack[0]); expect(awarded).toMatchObject({ uniqueId: 'items/unique/frostburn-gauntlet',
      baseId: 'items/base/glove-vampirebone', rarity: 'unique', level: 66, ilvl: 66, socketCapacity: 3, identified: true, equipped: false });
    expect(awarded.socketContents ?? []).toEqual([]);
    expect(useInventoryStore.getState().equipItem(awarded)).toEqual({ ok: false, reason: 'requirements_not_met' });
    expect(hero()).toEqual(before.hero); expect(useInventoryStore.getState().questServices).toEqual(before.services);
  });
  it.each([['waterwalk', 'frostburn-gauntlet'], ['frostburn-gauntlet', 'waterwalk']] as const)('purchases lifetime stock in order %s then %s', (first, second) => {
    expect(executeAnyaTrade(selection(first))).toBe('ok'); const bought = required(useInventoryStore.getState().backpack[0]);
    useInventoryStore.getState().removeItem(bought.id); expect(anyaTradeStatus(first)).toBe('sold-out'); expect(prepareAnyaTrade(first)).toBeNull();
    expect(executeAnyaTrade(selection(second))).toBe('ok'); expect(listAnyaTrades().map(row => row.stock)).toEqual([0, 0]);
    expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 1000, independent: 9 }); expect(useInventoryStore.getState().materials).toEqual({ 'materials/scrap': 20 });
  });
  it('uses canonical zero remainder conventions', () => {
    useInventoryStore.setState({ currencies: { 'rune-shard': 2000 }, materials: { 'materials/scrap': 40 } });
    expect(executeAnyaTrade(selection())).toBe('ok'); expect(useInventoryStore.getState().materials).toEqual({}); expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 0 });
  });
  it.each(['scrap', 'shards', 'unsafe-shards', 'full', 'overflow', 'missing-thaw', 'wrong-act', 'locked-act', 'legacy', 'combat', 'hydrating'] as const)(
    'refuses %s before allocation or payment', fault => {
      if (fault === 'scrap') useInventoryStore.setState({ materials: { 'materials/scrap': 39 } });
      if (fault === 'shards') useInventoryStore.setState({ currencies: { 'rune-shard': 1999 } });
      if (fault === 'unsafe-shards') useInventoryStore.setState({ currencies: { 'rune-shard': Number.MAX_SAFE_INTEGER + 1 } });
      if (fault === 'full' || fault === 'overflow') { const filler = item(); useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY + (fault === 'overflow' ? 1 : 0) }, (_, index) => ({ ...filler, id: `fill-${String(index)}` })) }); }
      if (fault === 'missing-thaw' || fault === 'legacy') useMapStore.setState(state => { const receipts = { ...state.questReceipts }; Reflect.deleteProperty(receipts, fault === 'legacy' ? A.proof : A.prerequisite.thawProof); return { questReceipts: receipts }; });
      if (fault === 'wrong-act') useMapStore.setState({ currentAct: 4 });
      if (fault === 'locked-act') useMapStore.setState({ isActUnlocked: () => false });
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
      if (fault === 'hydrating') useHydrationStore.getState().setStatus('loading');
      const before = snapshot(), roll = vi.spyOn(itemRoller, 'rollUniqueItem'); expect(prepareAnyaTrade('waterwalk')).toBeNull();
      expect(roll).not.toHaveBeenCalled(); expect(snapshot()).toEqual(before);
    });
  it.each(['actor', 'import', 'area', 'source', 'catalog'] as const)('refuses stale %s selection before allocation', fault => {
    const selected = selection(), catalog = loadAnyaUniqueCatalog(), previous = structuredClone(catalog);
    try {
      if (fault === 'actor') usePlayerStore.getState().addXP(1);
      if (fault === 'import') usePlayerStore.setState({ player: structuredClone(hero()) });
      if (fault === 'area') useMapStore.setState({ currentSubAreaId: null });
      if (fault === 'source') useMapStore.setState(state => { const receipts = { ...state.questReceipts }; Reflect.deleteProperty(receipts, A.prerequisite.thawProof); return { questReceipts: receipts }; });
      if (fault === 'catalog') Reflect.set(required(catalog.entries[0]), 'stock', 2);
      const before = snapshot(), roll = vi.spyOn(itemRoller, 'rollUniqueItem'); expect(executeAnyaTrade(selected)).toBe('stale-selection'); expect(roll).not.toHaveBeenCalled(); expect(snapshot()).toEqual(before);
    } finally { if (fault === 'catalog') Object.assign(catalog, previous); }
  });
  it.each(['template-id', 'base-id'] as const)('rejects selected %s descriptor before executing its getter or allocating', field => {
    const pools = loadAwardPools(), target = field === 'template-id' ? required(pools.uniques?.find(row => row.id === 'items/unique/waterwalk')) : required(pools.bases.get('items/base/boot-demonhide'));
    const previous = required(Object.getOwnPropertyDescriptor(target, 'id')), getter = vi.fn(() => previous.value as unknown), before = snapshot();
    const roll = vi.spyOn(itemRoller, 'rollUniqueItem'); Object.defineProperty(target, 'id', { enumerable: true, configurable: true, get: getter });
    try { expect(prepareAnyaTrade('waterwalk')).toBeNull(); expect(getter).not.toHaveBeenCalled(); expect(roll).not.toHaveBeenCalled(); expect(snapshot()).toEqual(before); }
    finally { Object.defineProperty(target, 'id', previous); }
  });
  it('releases its owner/lease when private constructor throws before any write, then allows a clean retry', () => {
    const selected = selection(), before = snapshot(); vi.spyOn(itemRoller, 'rollUniqueItem').mockImplementationOnce(() => { throw new Error('private allocation failure'); });
    expect(() => executeAnyaTrade(selected)).toThrow('private allocation failure'); expect(snapshot()).toEqual(before); assertWaveSnapshotAllowed();
    expect(executeAnyaTrade(selection())).toBe('ok');
  });
  it.each(['debit-noop', 'debit-prethrow', 'debit-postthrow', 'item-noop', 'item-prethrow', 'item-postthrow', 'proof-noop', 'proof-prethrow', 'proof-postthrow'] as const)(
    'restores exact owned payment/output/proof after %s then retries', fault => {
      const selected = selection(), before = snapshot(); let fired = false;
      if (fault === 'debit-noop' || fault === 'debit-prethrow') vi.spyOn(useInventoryStore.getState(), 'debitAnyaTradeCosts').mockImplementationOnce(() => { if (fault.endsWith('prethrow')) throw new Error(fault); });
      if (fault === 'item-noop' || fault === 'item-prethrow') vi.spyOn(useInventoryStore.getState(), 'addAnyaTradeItem').mockImplementationOnce(() => { if (fault.endsWith('prethrow')) throw new Error(fault); });
      if (fault === 'proof-noop' || fault === 'proof-prethrow') vi.spyOn(useMapStore, 'setState').mockImplementationOnce(() => { if (fault.endsWith('prethrow')) throw new Error(fault); });
      const observe = () => { if (fired) return; const inv = useInventoryStore.getState();
        const reached = fault === 'debit-postthrow' ? inv.currencies['rune-shard'] === 3000 : fault === 'item-postthrow' ? inv.backpack.length === 1 : fault === 'proof-postthrow' && useMapStore.getState().questReceipts[A.tradeProofs.waterwalk];
        if (reached) { fired = true; throw new Error(fault); }
      };
      stops.push(useInventoryStore.subscribe(observe), useMapStore.subscribe(observe)); expect(executeAnyaTrade(selected)).toBe('grant-failed'); expect(snapshot()).toEqual(before);
      vi.restoreAllMocks(); assertWaveSnapshotAllowed(); expect(executeAnyaTrade(selection())).toBe('ok');
    });
  it('fences direct supported currency/gear/material/quest/snapshot/nested trade calls under the actual debit observer', () => {
    const selected = selection(); let fired = false;
    stops.push(useInventoryStore.subscribe(state => { if (fired || state.currencies['rune-shard'] !== 3000) return; fired = true;
      expect(() => state.spendCurrency('rune-shard', 1)).toThrow('materialBusy'); expect(() => { state.addCurrency('rune-shard', 1); }).toThrow('materialBusy');
      expect(() => { state.addMaterials({ 'materials/scrap': 1 }); }).toThrow('materialBusy'); expect(() => state.equipItem(item())).toThrow('materialBusy');
      expect(() => { assertWaveSnapshotAllowed(); }).toThrow('materialBusy'); expect(() => executeAnyaTrade(selected)).toThrow('materialBusy'); expect(() => claimQuestReward(A.quest)).toThrow('materialBusy');
    })); expect(executeAnyaTrade(selected)).toBe('ok'); expect(fired).toBe(true); assertWaveSnapshotAllowed();
  });
  it('retains independently filled slot and unrelated wallet field while refunding its costs', () => {
    const filler = item(), independent = item('late-slot'); useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY - 1 }, (_, index) => ({ ...filler, id: `fill-${String(index)}` })) });
    const selected = selection(); let fired = false;
    stops.push(useInventoryStore.subscribe(state => { if (fired || state.currencies['rune-shard'] !== 3000) return; fired = true;
      useInventoryStore.setState(live => ({ backpack: [...live.backpack, independent], currencies: { ...live.currencies, other: 2 } }));
    })); expect(executeAnyaTrade(selected)).toBe('grant-failed'); expect(useInventoryStore.getState().backpack).toHaveLength(BACKPACK_CAPACITY);
    expect(useInventoryStore.getState().backpack).toContain(independent); expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 5000, independent: 9, other: 2 });
    expect(useInventoryStore.getState().materials).toEqual({ 'materials/scrap': 100 }); expect(useMapStore.getState().questReceipts[A.tradeProofs.waterwalk]).toBeUndefined();
  });
  it.each(['rename-stash', 'hero-equipped', 'quarantine', 'merc-mirror'] as const)('removes failed physical lineage after %s and preserves accepted stale actor caches', mode => {
    const before = snapshot(), selected = selection(); let fired = false;
    stops.push(useInventoryStore.subscribe(state => { const reward = state.backpack.find(row => row.uniqueId === 'items/unique/waterwalk'); if (fired || !reward) return; fired = true;
      Reflect.set(reward, 'id', 'renamed-failed-reward');
      if (mode === 'quarantine') useInventoryStore.setState(live => ({ backpack: live.backpack.filter(row => row !== reward), legacyGearQuarantine: [...live.legacyGearQuarantine, { item: reward, origin: { container: 'backpack' as const, index: 0 } }] }));
      else if (mode === 'merc-mirror') useMercStore.setState({ mercEquipment: { independent: { boots: reward } } });
      else if (mode === 'rename-stash') useInventoryStore.setState(live => ({ backpack: live.backpack.filter(row => row !== reward), stash: [...live.stash, reward] }));
      else {
        const equipped = { ...reward, equipped: true, equipSlot: 'boots' as const };
        useInventoryStore.setState(live => ({ backpack: live.backpack.filter(row => row !== reward), equipped: { ...live.equipped, boots: equipped } }));
        usePlayerStore.setState({ player: { ...hero(), equipment: [equipped] } });
      }
      throw new Error('physical observer failure');
    })); expect(executeAnyaTrade(selected)).toBe('grant-failed'); expect(fired).toBe(true); expect(snapshot()).toEqual(before); assertWaveSnapshotAllowed();
  });
  it.each(['raw-xp', 'real-xp', 'core', 'source', 'damage', 'foreign', 'removed'] as const)(
    'physical cleanup preserves independently surviving %s without failed gear/cache effects', action => {
      const before = structuredClone(hero()), selected = selection(); let fired = false, applied = false;
      let independent: ReturnType<typeof usePlayerStore.getState>['player'] = structuredClone(hero());
      stops.push(useInventoryStore.subscribe(state => {
        const reward = state.backpack.find(row => row.uniqueId === 'items/unique/waterwalk'); if (fired || !reward) return; fired = true;
        const equipped = { ...reward, equipped: true, equipSlot: 'boots' as const };
        useInventoryStore.setState(live => ({ backpack: live.backpack.filter(row => row !== reward), equipped: { ...live.equipped, boots: equipped } }));
        usePlayerStore.setState({ player: { ...hero(), equipment: [equipped] } });
        if (action === 'raw-xp') usePlayerStore.getState().addXP(100000);
        if (action === 'real-xp') usePlayerStore.getState().gainExperience(100000);
        if (action === 'core') usePlayerStore.getState().updateStats({ energy: hero().coreStats.energy + 3 });
        if (action === 'source') {
          const q = required(loadQuests().find(row => row.id === 'quests/act2-tainted-sun'));
          useMapStore.setState(map => ({ questProgress: { ...map.questProgress, [q.id]: { id: q.id, status: 'completed', rewardClaimed: true,
            objectives: Object.fromEntries(q.objectives.map(objective => [objective.id, true])) } } }));
        }
        if (action === 'damage') usePlayerStore.setState({ player: { ...hero(), name: 'independent-damaged', derivedStats: { ...hero().derivedStats, life: 1, mana: 1 } } });
        if (action === 'foreign') usePlayerStore.setState({ player: createMockPlayer('Foreign after equip', 'barbarian') });
        if (action === 'removed') usePlayerStore.setState({ player: null });
        independent = structuredClone(usePlayerStore.getState().player); applied = true; throw new Error('failed equipped item');
      }));
      expect(executeAnyaTrade(selected)).toBe('grant-failed'); expect(applied).toBe(true);
      expect(useInventoryStore.getState().backpack).toEqual([]); expect(useInventoryStore.getState().equipped).toEqual({});
      expect(useInventoryStore.getState().currencies['rune-shard']).toBe(5000); expect(useInventoryStore.getState().materials['materials/scrap']).toBe(100);
      if (action === 'removed' || action === 'foreign') expect(usePlayerStore.getState().player).toEqual(independent);
      else {
        const after = hero(), expected = required(independent), inv = useInventoryStore.getState(), map = useMapStore.getState();
        const derived = ['raw-xp', 'damage'].includes(action) ? { ...before.derivedStats, life: expected.derivedStats.life, mana: expected.derivedStats.mana }
          : { ...deriveEquippedPlayerStats(expected, expected.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts), life: expected.derivedStats.life, mana: expected.derivedStats.mana };
        expect(after).toEqual({ ...expected, equipment: [], derivedStats: derived });
      }
      assertWaveSnapshotAllowed();
    });
  it('reports unattributable same-cost overwrite as aggregate recovery failure and releases the exact lease', () => {
    const selected = selection(); let fired = false;
    stops.push(useInventoryStore.subscribe(state => { if (fired || state.currencies['rune-shard'] !== 3000) return; fired = true;
      useInventoryStore.setState(live => ({ currencies: { ...live.currencies, 'rune-shard': 3001 } })); throw new Error('raw ambiguous balance');
    })); expect(() => executeAnyaTrade(selected)).toThrow(AggregateError); expect(useHydrationStore.getState().status).toBe('error');
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(3001); expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useMapStore.getState().questReceipts[A.tradeProofs.waterwalk]).toBeUndefined(); const lease = beginMaterialTransaction(true); endMaterialTransaction(lease);
  });
});
