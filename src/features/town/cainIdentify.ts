import { loadAffixPool, loadItemBases, loadSetPieces, loadUniques } from '@/data/loaders/loot';
import { CAIN_QUEST, CAIN_SIDE_QUEST, CAIN_SCROLL_SOURCE, CAIN_RECEIPTS, hasCainCompletion } from '@/engine/map/cain-quest';
import { validateCanonicalSocketItem } from '@/engine/items/socket-contents';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { Item } from '@/engine/types/items';
import { isCainTownPresent } from '@/features/quests/cainQuestActions';
import { pick, replace, sameCainData } from '@/features/quests/cainPublication';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { resolveIronGolemSelection } from '@/stores/ironGolemSelection';
import { WaveGuardError } from '@/stores/waveTransitionGuard';

type Hero = NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
/** Displayed hero and actual item/preimage are stale-selection witnesses, not persisted authority. */
export interface CainIdentifySelection {
  readonly hero: Hero;
  readonly heroBefore: Hero;
  readonly item: Item;
  readonly itemBefore: Item;
}
/** Explicit selected-item operation outcomes; restoration failures throw AggregateError. */
export type CainIdentifyResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active'
  | 'claim-in-progress' | 'grant-failed';
const QUESTS = [CAIN_QUEST, CAIN_SIDE_QUEST];
const SOURCES = QUESTS.map(id => `${id}#reward:service`);

function readiness(): 'not-ready' | 'no-player' | 'combat-active' | null {
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  return hasActiveSubAreaRun() || useCombatStore.getState().inCombat ? 'combat-active' : null;
}
/** Both validated source Claims alias one permanent entitlement, including in replay difficulty. */
export function hasCainIdentifyEntitlement(): boolean {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  try { validateQuestItemLedger(items, map.questProgress, map.questReceipts); } catch { return false; }
  return QUESTS.some(id => Object.hasOwn(map.questProgress, id) && map.questProgress[id]?.rewardClaimed === true
    && hasCainCompletion(id, map.questProgress, items, map.questReceipts));
}
/** Current unlocked canonical Cain, live readiness and actual permanent source authority. */
export function canUseCainIdentify(): boolean {
  return readiness() === null && isCainTownPresent() && hasCainIdentifyEntitlement();
}
function actualBackpackItem(id: string): Item | undefined {
  const inventory = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
  const mercs = useMercStore.getState();
  const resolved = resolveIronGolemSelection(hero?.id ?? null, hero ? { heroId: hero.id, itemId: id } : null,
    { ...inventory, mercEquipment: mercs.mercEquipment });
  if (!resolved.ok || inventory.legacyGearQuarantine.some(entry => entry.item.id === id)
    || inventory.socketQuarantine.some(entry => entry.item.id === id)
    || (hero?.equipment.some(row => row.id === id) ?? false)
    || mercs.ownedMercs.some(merc => merc.equipment.some(row => row.id === id))) return undefined;
  return resolved.item;
}
function itemLocations(): readonly (Item | null | undefined)[] {
  const inv = useInventoryStore.getState(), mercs = useMercStore.getState();
  return [...inv.backpack, ...inv.stash, ...Object.values(inv.equipped),
    ...inv.legacyGearQuarantine.map(entry => entry.item), ...inv.socketQuarantine.map(entry => entry.item),
    ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear)),
    ...mercs.ownedMercs.flatMap(merc => merc.equipment), ...(usePlayerStore.getState().player?.equipment ?? [])];
}
function exactFalse(value: unknown): boolean { return value === false; }
function optionalArray(value: unknown): boolean { return value === undefined || Array.isArray(value); }
function eligible(item: Item): boolean {
  const base = loadItemBases().get(item.baseId);
  if (!base || !['weapon', 'armor', 'jewelry', 'charm'].includes(base.type)
    || typeof item.id !== 'string' || item.id.length === 0 || !exactFalse(item.identified) || !exactFalse(item.equipped)
    || !Number.isSafeInteger(item.level) || item.level < 1
    || item.ilvl !== undefined && (!Number.isSafeInteger(item.ilvl) || item.ilvl < 1)
    || item.rarity === 'runeword' || 'runewordId' in item) return false;
  if (item.rarity === 'unique') {
    const definition = loadUniques().find(row => row.id === item.uniqueId);
    if (!definition || definition.baseId !== item.baseId || item.setId !== undefined || item.setPieceId !== undefined) return false;
  } else if (item.rarity === 'set') {
    const definition = loadSetPieces().find(row => row.id === item.setPieceId);
    if (!definition || definition.baseId !== item.baseId || item.uniqueId !== undefined
      || item.setId !== undefined && item.setId !== definition.setId) return false;
  } else if (!['normal', 'magic', 'rare'].includes(item.rarity)
    || item.uniqueId !== undefined || item.setId !== undefined || item.setPieceId !== undefined) return false;
  if (!optionalArray(item.affixes)
    || (item.affixes?.length ?? 0) > 0 && item.rarity !== 'magic' && item.rarity !== 'rare') return false;
  const definitions = new Map(loadAffixPool().map(row => [row.id, row]));
  for (const roll of item.affixes ?? []) {
    if ('values' in roll) {
      // Historical native Maps intentionally keep opaque predecessor affix IDs.
      if (typeof roll.affixId !== 'string' || !roll.affixId || !(roll.values instanceof Map)
        || [...roll.values].some(([key, value]) => typeof key !== 'string' || !Number.isFinite(value))) return false;
    } else {
      const definition = definitions.get(roll.id), tier = Number.isSafeInteger(roll.tier) ? definition?.tiers[roll.tier] : undefined;
      if (!definition || !tier || !definition.appliesTo.includes(base.type)
        || !Number.isFinite(roll.rolledValue) || roll.rolledValue < tier.valueMin || roll.rolledValue > tier.valueMax) return false;
    }
  }
  try { validateCanonicalSocketItem(item, base); } catch { return false; }
  return true;
}

/** Actual eligible backpack instances; wearing requirements do not apply. */
export function cainIdentifyCandidates(): readonly Item[] {
  return canUseCainIdentify() ? useInventoryStore.getState().backpack.filter(item => actualBackpackItem(item.id) === item && eligible(item)) : [];
}
/** Capture the actual displayed instance, refusing detached copies and unavailable service. */
export function selectCainIdentifyItem(item: Item): CainIdentifySelection | null {
  const hero = usePlayerStore.getState().player;
  return hero && canUseCainIdentify() && actualBackpackItem(item.id) === item && eligible(item)
    ? { hero, heroBefore: structuredClone(hero), item, itemBefore: structuredClone(item) } : null;
}

/** Resolve a displayed selection without silently replacing its same-ID instance or preimage. */
export function currentCainIdentifyItem(selection: CainIdentifySelection | null): Item | null {
  if (!selection || !canUseCainIdentify()) return null;
  const hero = usePlayerStore.getState().player, item = actualBackpackItem(selection.item.id);
  return hero === selection.hero && sameCainData(hero, selection.heroBefore)
    && item === selection.item && sameCainData(item, selection.itemBefore) && eligible(item) ? item : null;
}

/** One free, selected-instance Identify, with guarded publication and scoped verified rollback. */
export function identifyCainItem(selection: CainIdentifySelection | null): CainIdentifyResult {
  try { const refusal = questActionPreflight(); if (refusal) return refusal; }
  catch (error) {
    if (error instanceof WaveGuardError && error.code === 'questBusy') return 'claim-in-progress';
    throw error;
  }
  return withQuestTransaction<CainIdentifyResult>(() => {
    const refusal = readiness(); if (refusal) return refusal;
    const hero = usePlayerStore.getState().player, item = currentCainIdentifyItem(selection);
    if (!hero || !item) return 'not-eligible';
    const inventory = useInventoryStore.getState(), map = useMapStore.getState();
    const index = inventory.backpack.indexOf(item);
    const before = structuredClone({ hero, item, rows: pick(map.questProgress, QUESTS),
      items: pick(inventory.questItems, [CAIN_SCROLL_SOURCE]), receipts: pick(map.questReceipts, CAIN_RECEIPTS),
      services: pick(inventory.questServices, SOURCES),
      location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
    const nextItem = { ...item, identified: true }, expected = structuredClone(nextItem);
    const targetId = before.item.id;
    const isTarget = (row: Item | null | undefined): boolean =>
      row === item || row === nextItem || row?.id === targetId;
    const participantsMatch = () => {
      const live = useMapStore.getState(), inv = useInventoryStore.getState();
      return sameCainData(pick(live.questProgress, QUESTS), before.rows)
        && sameCainData(pick(live.questReceipts, CAIN_RECEIPTS), before.receipts)
        && sameCainData(pick(inv.questItems, [CAIN_SCROLL_SOURCE]), before.items)
        && sameCainData(pick(inv.questServices, SOURCES), before.services)
        && sameCainData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location)
        && sameCainData(usePlayerStore.getState().player, before.hero);
    };
    try {
      useInventoryStore.setState(state => ({ backpack: state.backpack.map(row => row === item ? nextItem : row) }));
      const locations = itemLocations();
      if (locations.includes(item) || locations.filter(row => row === nextItem).length !== 1
        || actualBackpackItem(targetId) !== nextItem || !sameCainData(nextItem, expected)
        || usePlayerStore.getState().player !== hero || !participantsMatch() || !canUseCainIdentify()) {
        throw new Error('Cain Identify publication postcondition failed');
      }
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      const attempt = (operation: () => void) => { try { operation(); } catch (error) { errors.push(error); } };
      attempt(() => { useInventoryStore.setState(state => {
        const backpack = state.backpack.filter(row => !isTarget(row));
        backpack.splice(Math.min(index, backpack.length), 0, structuredClone(before.item));
        return { backpack, stash: state.stash.filter(row => !isTarget(row)),
          equipped: Object.fromEntries(Object.entries(state.equipped).map(([slot, row]) => [slot, isTarget(row) ? null : row])),
          legacyGearQuarantine: state.legacyGearQuarantine.filter(entry => !isTarget(entry.item)),
          socketQuarantine: state.socketQuarantine.filter(entry => !isTarget(entry.item)),
          questItems: replace(state.questItems, structuredClone(before.items), [CAIN_SCROLL_SOURCE]),
          questServices: replace(state.questServices, structuredClone(before.services), SOURCES) };
      }); });
      attempt(() => {
        const mercs = useMercStore.getState();
        if (!Object.values(mercs.mercEquipment).some(gear => Object.values(gear).some(row => isTarget(row)))
          && !mercs.ownedMercs.some(merc => merc.equipment.some(row => isTarget(row)))) return;
        useMercStore.setState(state => ({ mercEquipment: Object.fromEntries(Object.entries(state.mercEquipment).map(([id, gear]) => [id,
          Object.fromEntries(Object.entries(gear).map(([slot, row]) => [slot, isTarget(row) ? null : row]))])),
          ownedMercs: state.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.filter(row => !isTarget(row)) })) }));
      });
      attempt(() => { usePlayerStore.setState({ player: structuredClone(before.hero) }); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), QUESTS),
        questReceipts: replace(state.questReceipts, structuredClone(before.receipts), CAIN_RECEIPTS), ...before.location })); });
      attempt(() => {
        const knownReference = (row: Item | null | undefined) => row === item || row === nextItem;
        if (!sameCainData(actualBackpackItem(targetId), before.item) || itemLocations().some(knownReference)
          || !participantsMatch()) throw new Error('Cain Identify restoration postcondition failed');
      });
      if (errors.length > 0) throw new AggregateError(errors, 'Cain Identify restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
