import type { StoreApi } from 'zustand';
import { materialDelta } from './material-delta';
import type { Item } from '@/engine/types/items';
import type { SaveCurrent, InventorySaveData, MercSaveData } from '@/engine/types/save';
import { seedItemSeqFromIds } from '@/engine/loot/rollItem';
import { computeStats } from '@/engine/items/computeStats';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import { xpTotal } from '@/engine/progression/xp';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import type { EarnedItemSelector } from './earned-fixture';

type Data<S> = { [K in keyof S as S[K] extends (...args: never[]) => unknown ? never : K]: S[K] };

/** Independently clone every nonfunction field, including Maps and optional fields. */
export function observeStore<S extends object>(store: Pick<StoreApi<S>, 'getState'>): Data<S> {
  return structuredClone(Object.fromEntries(Object.entries(store.getState())
    .filter(([, value]) => typeof value !== 'function'))) as Data<S>;
}

/** Complete domain observations; combat recordings are captured separately. */
export function observeEarnedState() {
  return {
    player: observeStore(usePlayerStore), inventory: observeStore(useInventoryStore),
    map: observeStore(useMapStore), merc: observeStore(useMercStore),
    formation: observeStore(useFormationStore), meta: observeStore(useMetaStore)
  };
}
export type EarnedState = ReturnType<typeof observeEarnedState>;
export type EarnedCombatState = Data<ReturnType<typeof useCombatStore.getState>>;

function restoreStore<S extends object>(store: Pick<StoreApi<S>, 'getState' | 'setState'>) {
  const original = store.getState();
  const data = observeStore(store);
  return () => { store.setState({ ...original, ...data }, true); };
}

/** Snapshot original methods and cloned data before any task mutation. */
export function captureEarnedRestorers(): (() => void)[] {
  return [restoreStore(usePlayerStore), restoreStore(useInventoryStore),
    restoreStore(useMapStore), restoreStore(useMercStore), restoreStore(useFormationStore),
    restoreStore(useCombatStore), restoreStore(useMetaStore), restoreStore(useHydrationStore)];
}

/** Production reset only. The caller must freeze its clock before resetting meta. */
export function resetEarnedStores(): void {
  usePlayerStore.getState().reset();
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useMercStore.getState().reset();
  useFormationStore.getState().reset();
  useCombatStore.getState().reset();
  useMetaStore.getState().reset();
}

/**
 * Reconstruct a prevalidated save in isolated, quiescent service stores.
 * Includes production item-sequence hydration; does not perform browser IO,
 * offline reconciliation or the public persistence restore protocol.
 */
export function restoreEarnedSave(save: SaveCurrent, idleBonusAnchor: number): void {
  const copy = structuredClone(save);
  if (!Number.isFinite(idleBonusAnchor)) throw new RangeError('Earned restore needs a finite bonus anchor');
  const owned = ownedItems(copy.inventory, copy.mercs);
  assertUniqueOwnedItems(owned);
  if (hasActiveSubAreaRun() || useCombatStore.getState().inCombat)
    throw new Error('Earned restore requires quiescent service stores');

  useHydrationStore.getState().setStatus('loading');
  resetEarnedStores();
  usePlayerStore.setState({ player: copy.player });
  useInventoryStore.setState({ ...copy.inventory,
    backpack: [...copy.inventory.backpack], stash: [...copy.inventory.stash] });
  useMercStore.setState({ ...copy.mercs, ownedMercs: [...copy.mercs.ownedMercs] });
  useMapStore.setState({ ...copy.map, discoveredAreas: [...copy.map.discoveredAreas],
    clearedSubAreas: [...copy.map.clearedSubAreas] });
  useMetaStore.setState({ ...copy.meta, idleBonusAnchor });
  useFormationStore.getState().hydrate(copy.formation);
  seedItemSeqFromIds(owned.map(item => item.id));
  useHydrationStore.getState().setStatus('ready');
}

/** Preserve acquisition order while resolving the original current backpack object. */
export function selectEarnedBackpackItem(
  selector: EarnedItemSelector, slot: 'gloves' | 'boots',
  journal: readonly Item[], backpack: readonly Item[]
): Item | undefined {
  const bases = loadItemBases();
  const affixes = new Map(loadAffixPool().map(affix => [affix.id, affix]));
  for (const earned of journal) {
    const item = backpack.find(candidate => candidate.id === earned.id);
    if (item && item.baseId === selector.baseId && item.rarity === selector.rarity &&
      bases.get(item.baseId)?.slot === slot &&
      computeStats(item, bases.get(item.baseId), affixes).defense === selector.defense) return item;
  }
  return undefined;
}

function ownedItems(inventory: InventorySaveData, mercs: MercSaveData): Item[] {
  return [...inventory.backpack, ...inventory.stash,
    ...Object.values(inventory.equipped).filter((item): item is Item => item !== null),
    ...Object.values(mercs.mercEquipment).flatMap(equipment =>
      Object.values(equipment).filter((item): item is Item => item != null))];
}
function assertUniqueOwnedItems(items: readonly Item[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate owned item ID: ${item.id}`);
    seen.add(item.id);
  }
}
function mercXp(state: EarnedState, id: string): number {
  const merc = state.merc.ownedMercs.find(candidate => candidate.id === id);
  if (!merc) return 0;
  let total = state.merc.mercProgress[id]?.experience ?? 0;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}

/** Actual observed changes, independent of winner or production reward flags. */
export function earnedDelta(before: EarnedState, after: EarnedState) {
  const playerXp = (state: EarnedState) => {
    const player = state.player.player;
    if (!player) throw new Error('Earned observation lost production player');
    return xpTotal(player.level) + player.experience;
  };
  const oldItems = ownedItems(before.inventory, before.merc);
  const newItems = ownedItems(after.inventory, after.merc);
  assertUniqueOwnedItems(oldItems);
  assertUniqueOwnedItems(newItems);
  const oldIds = new Set(oldItems.map(item => item.id));
  const newIds = new Set(newItems.map(item => item.id));
  const currencyKeys = new Set([...Object.keys(before.inventory.currencies), ...Object.keys(after.inventory.currencies)]);
  const mercIds = new Set([...before.merc.ownedMercs, ...after.merc.ownedMercs].map(merc => merc.id));
  return {
    xp: playerXp(after) - playerXp(before),
    mercXp: Object.fromEntries([...mercIds].map(id => [id, mercXp(after, id) - mercXp(before, id)])),
    materials: materialDelta(before.inventory.materials, after.inventory.materials),
    currencies: Object.fromEntries([...currencyKeys].map(id => [id,
      (after.inventory.currencies[id] ?? 0) - (before.inventory.currencies[id] ?? 0)])),
    addedItems: structuredClone(newItems.filter(item => !oldIds.has(item.id))),
    removedItemIds: oldItems.filter(item => !newIds.has(item.id)).map(item => item.id),
    addedClears: after.map.clearedSubAreas.filter(id => !before.map.clearedSubAreas.includes(id))
  };
}
