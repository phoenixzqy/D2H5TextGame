import { loadAnyaUniqueCatalog, type AnyaTradeEntryId, type AnyaUniqueEntry } from '@/data/loaders/anya-vendor';
import { loadAwardPools } from '@/data/loaders/loot';
import { ANYA, ANYA_DOMAIN, hasAnyaEntitlement } from '@/engine/map/anya-quest';
import { isMaterialLedger } from '@/engine/loot/materials';
import { rollUniqueItem } from '@/engine/loot/rollItem';
import { createRng, hashSeed } from '@/engine/rng';
import { validateCanonicalSocketItem } from '@/engine/items/socket-contents';
import type { Item } from '@/engine/types/items';
import { anyaOrdinaryReady, anyaTownReady, captureAnyaAuthority, sameAnyaAuthority, validateLiveAnyaGraph } from '@/features/quests/anyaContract';
import { pick } from '@/features/quests/cainPublication';
import { assertCountedData, replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from '@/features/quests/countedQuestContract';
import { captureQuestRewardOwnership } from '@/features/quests/questRewardOwnership';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { blockSavesForRecovery, resumeWaveDeferredSave, useHydrationStore } from '@/stores/persistence';
import { beginMaterialTransaction, endMaterialTransaction } from '@/stores/waveTransitionGuard';
import { beginAnyaTradeCostPublication, endAnyaTradeCostPublication, prepareAnyaTradeItem,
  verifyAnyaTradeCostPublication, type AnyaTradeCostPublication } from '@/stores/anyaTradeJournal';

export type { AnyaTradeEntryId } from '@/data/loaders/anya-vendor';
export type AnyaTradeStatus = 'ready' | 'locked' | 'sold-out' | 'insufficient-materials' | 'insufficient-currency' | 'backpack-full' | 'unavailable';
export type AnyaTradeResult = 'ok' | 'not-ready' | 'no-player' | 'combat-active' | 'not-eligible' | 'sold-out' |
  'insufficient-materials' | 'insufficient-currency' | 'backpack-full' | 'stale-selection' | 'grant-failed';
export interface AnyaTradeOffer {
  readonly entryId: AnyaTradeEntryId; readonly uniqueId: string; readonly ilvl: 66; readonly requiredLevel: 49;
  readonly costs: AnyaUniqueEntry['costs']; readonly stock: 0 | 1; readonly owned: number; readonly status: AnyaTradeStatus;
}
const selectionBrand = Symbol('anyaTradeSelection');
/** Process-local read-only confirmation witness; it never grants stock or allocates an item. */
export interface AnyaTradeSelection { readonly entryId: AnyaTradeEntryId; readonly [selectionBrand]: true }
const ids: readonly AnyaTradeEntryId[] = ['frostburn-gauntlet', 'waterwalk'];
const costs = { materials: { 'materials/scrap': 40 as const }, currencies: { 'rune-shard': 2000 as const } };
const catalogContract = { id: ANYA.vendorId, version: 1, entries: ids.map(id => ({ id,
  uniqueId: `items/unique/${id}`, ilvl: 66, stock: 1, costs })) };
function captureTradeAuthority() {
  const source = captureAnyaAuthority(), catalog = snapshotCountedData(loadAnyaUniqueCatalog());
  if (!sameData(catalog, catalogContract)) throw new Error('Anya finite catalog changed');
  const pools = loadAwardPools(); assertCountedData(pools);
  const outputs = catalog.entries.map(entry => {
    const matches = pools.uniques?.filter(unique => unique.id === entry.uniqueId), unique = matches?.[0];
    const baseId = entry.id === 'frostburn-gauntlet' ? 'items/base/glove-vampirebone' : 'items/base/boot-demonhide';
    const base = pools.bases.get(baseId);
    assertCountedData({ unique, base });
    if (matches?.length !== 1 || !unique || !base || unique.baseId !== baseId || unique.reqLevel !== 49 ||
      base.id !== baseId || base.type !== 'armor' || base.reqLevel !== 48 || base.sockets !== 3 || base.maxSockets !== 3) throw new Error('Anya existing unique authority changed');
    return snapshotCountedData({ unique, base });
  });
  return { source, catalog, outputs };
}
function sameTradeAuthority(authority: ReturnType<typeof captureTradeAuthority>): boolean {
  try { return sameAnyaAuthority(authority.source) && sameData(captureTradeAuthority(), authority); } catch { return false; }
}
function physicalItems(): readonly (Item | null | undefined)[] {
  const inventory = useInventoryStore.getState(), mercs = useMercStore.getState();
  const all = [...inventory.backpack, ...inventory.stash, ...Object.values(inventory.equipped),
    ...inventory.legacyGearQuarantine.map(row => row.item), ...inventory.socketQuarantine.map(row => row.item),
    ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear)),
    ...mercs.ownedMercs.flatMap(merc => merc.equipment), ...(usePlayerStore.getState().player?.equipment ?? [])];
  assertCountedData(all); return all;
}
function safeCurrency(): number {
  const currencies = useInventoryStore.getState().currencies; assertCountedData(currencies);
  const value = Object.getOwnPropertyDescriptor(currencies, 'rune-shard')?.value as unknown;
  if (value === undefined && !Object.hasOwn(currencies, 'rune-shard')) return 0;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Invalid Anya shard balance');
  return value;
}
function status(entry: AnyaTradeEntryId): AnyaTradeStatus {
  try {
    validateLiveAnyaGraph();
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    if (!hasAnyaEntitlement(map.questProgress, inventory.questItems, map.questReceipts, ANYA_DOMAIN)) return 'locked';
    if (!anyaTownReady()) return 'unavailable';
    if (Object.hasOwn(map.questReceipts, ANYA.tradeProofs[entry])) return 'sold-out';
    if (!isMaterialLedger(inventory.materials)) return 'unavailable';
    const shards = safeCurrency(); physicalItems();
    if ((inventory.materials['materials/scrap'] ?? 0) < 40) return 'insufficient-materials';
    if (shards < 2000) return 'insufficient-currency';
    if (inventory.backpack.length >= BACKPACK_CAPACITY) return 'backpack-full';
    return 'ready';
  } catch { return 'unavailable'; }
}
/** Pure two-row catalog projection; no RNG, allocation, writes or stock normalization. */
export function listAnyaTrades(): readonly AnyaTradeOffer[] {
  try {
    const authority = captureTradeAuthority(), all = physicalItems();
    return authority.catalog.entries.map(entry => ({ entryId: entry.id, uniqueId: entry.uniqueId, ilvl: 66,
      requiredLevel: 49, costs: snapshotCountedData(entry.costs),
      stock: Object.hasOwn(useMapStore.getState().questReceipts, ANYA.tradeProofs[entry.id]) ? 0 : 1,
      owned: new Set(all.filter(item => item?.uniqueId === entry.uniqueId).map(item => item?.id)).size, status: status(entry.id) }));
  } catch { return []; }
}
/** Read-only availability for a single literal row. */
export function anyaTradeStatus(entryId: AnyaTradeEntryId): AnyaTradeStatus {
  try { captureTradeAuthority(); return ids.includes(entryId) ? status(entryId) : 'unavailable'; } catch { return 'unavailable'; }
}
function sourceWitness() {
  const map = useMapStore.getState();
  return snapshotCountedData({ row: pick(map.questProgress, [ANYA.quest, ANYA.prerequisite.quest]),
    receipts: pick(map.questReceipts, [ANYA.proof, ...Object.values(ANYA.tradeProofs), ANYA.prerequisite.inspectProof,
      ANYA.prerequisite.potionSource, ANYA.prerequisite.thawProof]),
    potion: pick(useInventoryStore.getState().questItems, [ANYA.prerequisite.potionSource]) });
}
function location() {
  const map = useMapStore.getState();
  return { act: map.currentAct, area: map.currentSubAreaId, profile: map.selectedDifficulty };
}
interface Context { hero: NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
  heroBefore: NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
  source: ReturnType<typeof sourceWitness>; location: ReturnType<typeof location>; authority: ReturnType<typeof captureTradeAuthority> }
const selections = new WeakMap<AnyaTradeSelection, Context>();
/** Capture one current confirmation context; material/space preflight never constructs a reward. */
export function prepareAnyaTrade(entryId: AnyaTradeEntryId): AnyaTradeSelection | null {
  try {
    if (!ids.includes(entryId) || anyaTradeStatus(entryId) !== 'ready') return null;
    const hero = usePlayerStore.getState().player; if (!hero) return null;
    const selection: AnyaTradeSelection = Object.freeze({ entryId, [selectionBrand]: true as const });
    selections.set(selection, { hero, heroBefore: snapshotCountedData(hero), source: sourceWitness(), location: location(), authority: captureTradeAuthority() });
    return selection;
  } catch { return null; }
}
function current(context: Context): boolean {
  return anyaTownReady() && usePlayerStore.getState().player === context.hero && sameData(context.hero, context.heroBefore) &&
    sameData(location(), context.location) && sameData(sourceWitness(), context.source) && sameTradeAuthority(context.authority);
}
function resultFor(value: AnyaTradeStatus): AnyaTradeResult {
  return value === 'locked' || value === 'unavailable' || value === 'ready' ? 'not-eligible' : value;
}
/** Execute one fixed paid unique under the existing material lease; selected stock proof is last. */
export function executeAnyaTrade(selection: AnyaTradeSelection): AnyaTradeResult {
  const lease = beginMaterialTransaction(useHydrationStore.getState().status === 'ready');
  let owner: AnyaTradeCostPublication | undefined, physical: ReturnType<typeof captureQuestRewardOwnership> | undefined;
  const outcome = { unrestorable: false };
  try {
    const context = selections.get(selection);
    if (!context || !ids.includes(selection.entryId) || !current(context)) return 'stale-selection';
    const available = status(selection.entryId); if (available !== 'ready') return resultFor(available);
    if (!anyaOrdinaryReady()) return 'not-ready';
    const entry = context.authority.catalog.entries.find(row => row.id === selection.entryId);
    if (!entry) return 'not-eligible';
    const map = useMapStore.getState(), inventory = useInventoryStore.getState(), proof = ANYA.tradeProofs[entry.id];
    const beforeProof = snapshotCountedData(pick(map.questReceipts, [proof]));
    const costOwner = beginAnyaTradeCostPublication(lease, entry.id, inventory.currencies, inventory.materials); owner = costOwner;
    const item = rollUniqueItem({ uniqueId: entry.uniqueId, ilvl: 66 }, loadAwardPools(),
      createRng(hashSeed(JSON.stringify(['anya-trade-v1', context.hero.id, ANYA.vendorId, entry.id, entry.uniqueId, 66]))));
    assertCountedData(item);
    const base = context.authority.outputs.find(output => output.unique.id === entry.uniqueId)?.base;
    if (!item || !base || typeof item.id !== 'string' || item.id.length === 0 || item.baseId !== base.id || item.uniqueId !== entry.uniqueId ||
      item.rarity !== 'unique' || item.level !== 66 || item.ilvl !== 66 || !item.identified || item.equipped ||
      item.socketCapacity !== 3 || (item.socketContents?.length ?? 0) !== 0 || item.personalizedBy !== undefined ||
      item.runewordId !== undefined || item.setId !== undefined || item.setPieceId !== undefined || item.equipSlot !== undefined) return 'not-eligible';
    validateCanonicalSocketItem(item, base);
    prepareAnyaTradeItem(costOwner, item); physical = captureQuestRewardOwnership(item); physical.preflight();
    let debited = false, itemPublished = false, proofPublished = false;
    const check = () => {
      const live = useMapStore.getState(), inv = useInventoryStore.getState();
      const source = sourceWitness();
      // Only this selected proof may differ from the confirmation's source snapshot.
      if (proofPublished) source.receipts = replace(source.receipts, beforeProof, [proof]);
      if (!anyaTownReady() || usePlayerStore.getState().player !== context.hero || !sameData(context.hero, context.heroBefore) ||
        !sameData(location(), context.location) || !sameData(source, context.source) || !sameTradeAuthority(context.authority) ||
        !sameData(pick(live.questReceipts, [proof]), proofPublished ? { [proof]: true } : beforeProof) ||
        inv.backpack.length > BACKPACK_CAPACITY || !itemPublished && inv.backpack.length >= BACKPACK_CAPACITY) throw new Error('Anya trade authority changed');
      validateLiveAnyaGraph(); verifyAnyaTradeCostPublication(costOwner, inv.currencies, inv.materials, debited);
      if (itemPublished) physical?.checkPublished(); else physical?.preflight();
    };
    try {
      check(); useInventoryStore.getState().debitAnyaTradeCosts(costOwner); debited = true; check();
      useInventoryStore.getState().addAnyaTradeItem(costOwner, item); itemPublished = true; check();
      useMapStore.setState(state => ({ questReceipts: replace(state.questReceipts, { [proof]: true as const }, [proof]) })); proofPublished = true; check();
      selections.delete(selection); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { failures.push(error); } };
      attempt(() => { useMapStore.setState(state => ({ questReceipts: replace(state.questReceipts, snapshotCountedData(beforeProof), [proof]) })); });
      attempt(() => { physical?.restore(); });
      attempt(() => { useInventoryStore.getState().restoreAnyaTradeCosts(costOwner); });
      attempt(() => {
        const inv = useInventoryStore.getState();
        if (!sameData(pick(useMapStore.getState().questReceipts, [proof]), beforeProof)) throw new Error('Anya stock restoration changed');
        verifyAnyaTradeCostPublication(costOwner, inv.currencies, inv.materials, false); validateLiveAnyaGraph();
      });
      if (failures.length) {
        outcome.unrestorable = true; attempt(blockSavesForRecovery);
        throw new AggregateError(failures, 'Anya trade scoped restoration failed', { cause });
      }
      return 'grant-failed';
    }
  } finally {
    try { physical?.dispose(); } finally {
      try { if (owner !== undefined) endAnyaTradeCostPublication(owner); } finally {
        const wake = endMaterialTransaction(lease); if (wake && !outcome.unrestorable) resumeWaveDeferredSave();
      }
    }
  }
}
