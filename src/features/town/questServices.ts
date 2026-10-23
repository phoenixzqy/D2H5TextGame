import { loadItemBases } from '@/data/loaders/loot';
import { loadTownNpcs } from '@/data/loaders/towns';
import { effectiveSocketCapacity } from '@/engine/items/socket-capacity';
import { validateCanonicalSocketItem } from '@/engine/items/socket-contents';
import { validateAct5CampaignRewards } from '@/engine/save/act5-campaign';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { QUEST_SERVICE_SOURCES, type QuestServiceId, type QuestServiceLedger } from '@/engine/services/quest-services';
import type { Item } from '@/engine/types/items';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';

export type QuestServiceResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active'
  | 'claim-in-progress' | 'already-consumed' | 'grant-failed';
export interface NpcQuestService {
  readonly source: string;
  readonly serviceId: QuestServiceId;
  readonly state: 'available' | 'consumed';
  readonly targetItemId?: string;
}
type Source = keyof typeof QUEST_SERVICE_SOURCES;
const destinations: Readonly<Record<Source, { readonly act: number; readonly npcId: string }>> = {
  'quests/act5-siege-on-harrogath#reward:service': { act: 5, npcId: 'npc/larzuk' },
  'quests/side-act5-larzuks-sockets#reward:service': { act: 5, npcId: 'npc/larzuk' },
  'quests/side-act4-halbus-soul#reward:service': { act: 4, npcId: 'npc/halbu' },
  'quests/act5-prison-of-ice#reward:service': { act: 5, npcId: 'npc/anya' },
  'quests/side-act5-anyas-gift#reward:service': { act: 5, npcId: 'npc/anya' }
};
const sources = Object.keys(QUEST_SERVICE_SOURCES) as Source[];
function isSource(source: string): source is Source { return Object.hasOwn(QUEST_SERVICE_SOURCES, source); }

/** These live checks are safe inside the acquired quest lease; idle guards are preflight-only. */
function readiness(): 'not-ready' | 'no-player' | 'combat-active' | null {
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  if (hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return 'combat-active';
  return null;
}
function atDestination(source: Source): boolean {
  const map = useMapStore.getState(), destination = destinations[source];
  return map.currentAct === destination.act && map.selectedDifficulty === 'normal'
    && map.isActUnlocked(destination.act) && loadTownNpcs(destination.act).some(npc => npc.id === destination.npcId);
}
/** Validate the full live graph directly: snapshotting while owning a quest lease is forbidden. */
function validateGraph(services: QuestServiceLedger): void {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
  validateAct5CampaignRewards(map, items, services);
}
function ownedItems(): readonly Item[] {
  const inventory = useInventoryStore.getState();
  return [...inventory.backpack, ...inventory.stash,
    ...Object.values(inventory.equipped).filter((item): item is Item => item != null),
    ...Object.values(useMercStore.getState().mercEquipment).flatMap(equipment =>
      Object.values(equipment).filter((item): item is Item => item != null))];
}
function inActorEquipment(id: string): boolean {
  return (usePlayerStore.getState().player?.equipment.some(item => item.id === id) ?? false)
    || useMercStore.getState().ownedMercs.some(merc => merc.equipment.some(item => item.id === id));
}
function uniqueBackpackItem(id: string): Item | undefined {
  const inventory = useInventoryStore.getState();
  const item = inventory.backpack.find(row => row.id === id);
  return item && typeof item.equipped === 'boolean' && !item.equipped && ownedItems().filter(row => row.id === id).length === 1
    && !inventory.legacyGearQuarantine.some(entry => entry.item.id === id) && !inventory.socketQuarantine.some(entry => entry.item.id === id) && !inActorEquipment(id) ? item : undefined;
}
function eligible(item: Item, serviceId: QuestServiceId): boolean {
  const base = loadItemBases().get(item.baseId);
  if (!base || (base.type !== 'weapon' && base.type !== 'armor') || item.rarity === 'runeword'
    || 'runewordId' in item || !['normal', 'magic', 'rare', 'unique', 'set'].includes(item.rarity)) return false;
  try { validateCanonicalSocketItem(item, base); } catch { return false; }
  if (serviceId === 'personalize_item') {
    const hero = usePlayerStore.getState().player;
    return !('personalizedBy' in item) && !!hero && typeof hero.id === 'string' && hero.id.length > 0
      && typeof hero.name === 'string' && hero.name === hero.name.trim() && hero.name.length >= 1 && hero.name.length <= 16;
  }
  return (serviceId !== 'socket_armor' || base.type === 'armor') && effectiveSocketCapacity(item, base) === 0
    && (item.socketContents?.length ?? 0) === 0 && typeof base.maxSockets === 'number' && base.maxSockets > 0;
}

/** Actual current-town offerings, including historical consumed sources; never infer charges from flags. */
export function questServicesForNpc(npcId: string): readonly NpcQuestService[] {
  if (readiness()) return [];
  const services = useInventoryStore.getState().questServices;
  try { validateGraph(services); } catch { return []; }
  return sources.flatMap(source => {
    const entry = Object.hasOwn(services, source) ? services[source] : undefined;
    return entry && destinations[source].npcId === npcId && atDestination(source) ? [{ source, ...entry }] : [];
  });
}

/** Return actual eligible backpack instances, never detached lookalikes or another ownership container. */
export function questServiceCandidates(source: string): readonly Item[] {
  if (!isSource(source) || readiness() !== null || !atDestination(source)) return [];
  const inventory = useInventoryStore.getState();
  try { validateGraph(inventory.questServices); } catch { return []; }
  const entry = Object.hasOwn(inventory.questServices, source) ? inventory.questServices[source] : undefined;
  return entry?.state === 'available' ? inventory.backpack.filter(item => uniqueBackpackItem(item.id) === item
    && eligible(item, entry.serviceId)) : [];
}

/** Include legacy Map affix rolls when checking observer mutation of an otherwise identical instance. */
function fingerprint(value: unknown): string {
  return JSON.stringify(value, (_key, field: unknown) => field instanceof Map ? [...field.entries()] : field);
}

/** Restore only this instance and source, including observer moves, while preserving unrelated writes. */
function restore(source: Source, original: Item, backup: Item, index: number,
  previousEntry: NonNullable<QuestServiceLedger[string]>, cause: unknown): void {
  const errors: unknown[] = [];
  const expectedItem = fingerprint(backup), expectedEntry = fingerprint(previousEntry);
  const restored = fingerprint(original) === expectedItem ? original : backup;
  const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
  attempt(() => { useInventoryStore.setState(state => {
    const backpack = state.backpack.filter(item => item.id !== original.id);
    backpack.splice(Math.min(index, backpack.length), 0, restored);
    return { backpack, stash: state.stash.filter(item => item.id !== original.id),
      equipped: Object.fromEntries(Object.entries(state.equipped).map(([slot, item]) => [slot, item?.id === original.id ? null : item])),
      questServices: { ...state.questServices, [source]: previousEntry },
      legacyGearQuarantine: state.legacyGearQuarantine.filter(entry => entry.item.id !== original.id) };
  }); });
  attempt(() => {
    const mercs = useMercStore.getState();
    if (!Object.values(mercs.mercEquipment).some(equipment => Object.values(equipment).some(item => item?.id === original.id))
      && !mercs.ownedMercs.some(merc => merc.equipment.some(item => item.id === original.id))) return;
    useMercStore.setState(state => ({
      mercEquipment: Object.fromEntries(Object.entries(state.mercEquipment).map(([id, equipment]) => [id,
        Object.fromEntries(Object.entries(equipment).map(([slot, item]) => [slot, item?.id === original.id ? null : item]))])),
      ownedMercs: state.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.filter(item => item.id !== original.id) }))
    }));
  });
  attempt(() => {
    if (usePlayerStore.getState().player?.equipment.some(item => item.id === original.id)) usePlayerStore.setState(state => ({
      player: state.player ? { ...state.player, equipment: state.player.equipment.filter(item => item.id !== original.id) } : null
    }));
  });
  attempt(() => {
    const inventory = useInventoryStore.getState(), item = uniqueBackpackItem(original.id);
    if (!item || fingerprint(item) !== expectedItem
      || fingerprint(inventory.questServices[source]) !== expectedEntry) throw new Error('Incomplete quest service restoration');
  });
  if (errors.length > 0) throw new AggregateError(errors, 'Quest service restoration failed', { cause });
}

/** One selected-item operation: validate, publish, verify and restore under the shared quest lease. */
export function useQuestService(source: string, itemId: string): QuestServiceResult {
  try { const refusal = questActionPreflight(); if (refusal) return refusal; }
  catch (error) {
    if (error instanceof WaveGuardError && error.code === 'questBusy') return 'claim-in-progress';
    throw error;
  }
  return withQuestTransaction<QuestServiceResult>(() => {
    const refusal = readiness(); if (refusal) return refusal;
    if (!isSource(source) || !atDestination(source)) return 'not-eligible';
    const inventory = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
    try { validateGraph(inventory.questServices); } catch { return 'not-eligible'; }
    const entry = Object.hasOwn(inventory.questServices, source) ? inventory.questServices[source] : undefined;
    if (!entry) return 'not-eligible';
    if (entry.state === 'consumed') return 'already-consumed';
    const item = uniqueBackpackItem(itemId);
    if (!item || !hero || !eligible(item, entry.serviceId)) return 'not-eligible';
    const characterId = hero.id, characterName = hero.name;
    const base = loadItemBases().get(item.baseId);
    if (!base || typeof base.maxSockets !== 'number') return 'not-eligible';
    const nextItem: Item = entry.serviceId === 'personalize_item'
      ? { ...item, personalizedBy: { characterId, name: characterName } }
      : { ...item, socketCapacity: item.rarity === 'normal' ? base.maxSockets : Math.min(1, base.maxSockets) };
    const nextEntry = { serviceId: entry.serviceId, state: 'consumed' as const, targetItemId: item.id };
    const services = { ...inventory.questServices, [source]: nextEntry };
    try { validateCanonicalSocketItem(nextItem, base); validateGraph(services); } catch { return 'not-eligible'; }
    const backup = structuredClone(item), previousEntry = structuredClone(entry), index = inventory.backpack.indexOf(item);
    const expectedItem = fingerprint(nextItem), expectedEntry = fingerprint(nextEntry);
    try {
      useInventoryStore.setState(state => ({ backpack: state.backpack.map(row => row === item ? nextItem : row),
        questServices: { ...state.questServices, [source]: nextEntry } }));
      const actual = uniqueBackpackItem(item.id), player = usePlayerStore.getState().player;
      if (actual !== nextItem || fingerprint(actual) !== expectedItem
        || fingerprint(useInventoryStore.getState().questServices[source]) !== expectedEntry
        || !atDestination(source) || readiness() !== null || player?.id !== characterId
        || entry.serviceId === 'personalize_item' && player.name !== characterName) throw new Error('Incomplete quest service publication');
      validateGraph(useInventoryStore.getState().questServices);
      return 'ok';
    } catch (cause) {
      restore(source, item, backup, index, previousEntry, cause);
      return 'grant-failed';
    }
  });
}
