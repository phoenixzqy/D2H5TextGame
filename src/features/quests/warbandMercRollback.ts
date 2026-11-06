import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import type { Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { sameCainData as sameData } from './cainPublication';

/** Capture deep task participants and their physical ownership preimages. */
export function captureWarbandMercParticipants(ids: readonly string[], newRecruit: Mercenary | null = null) {
  const mercs = useMercStore.getState(), inv = useInventoryStore.getState();
  const references = [...mercs.ownedMercs.filter(merc => ids.includes(merc.id)), ...(newRecruit ? [newRecruit] : [])];
  const gearReferences = [...references.flatMap(merc => merc.equipment),
    ...ids.flatMap(id => Object.values(mercs.mercEquipment[id] ?? {}))].filter((item): item is Item => item != null);
  return { ...structuredClone({ ids: [...new Set(ids)], ownedMercs: mercs.ownedMercs,
    mercEquipment: mercs.mercEquipment, mercProgress: mercs.mercProgress, fieldedMercId: mercs.fieldedMercId,
    inventory: { backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped,
      legacyGearQuarantine: inv.legacyGearQuarantine, socketQuarantine: inv.socketQuarantine },
    hero: usePlayerStore.getState().player }), references, gearReferences,
    gearOriginalIds: new Map(gearReferences.map(item => [item, item.id] as const)) };
}

/**
 * Restore named mercenaries and the physical items originally/currently on them.
 * Unknown callback-attached gear is retained once, unequipped, at the end of the
 * backpack. Like lossless award ingestion this may exceed manual capacity.
 * If an original gear slot now holds an unrelated item, keep that independent
 * equipment and recover the original affected item to the backpack instead.
 * Callers restore quest sources first and include the previous fielded merc ID.
 * Every domain is attempted; a failed write or final verification is explicit.
 */
export function restoreWarbandMercParticipants(snapshot: ReturnType<typeof captureWarbandMercParticipants>): void {
  const ids = new Set(snapshot.ids), references = new Set(snapshot.references), live = useMercStore.getState();
  const independentIds = new Set([...snapshot.ownedMercs.map(merc => merc.id), ...Object.keys(snapshot.mercEquipment),
    ...Object.keys(snapshot.mercProgress), ...live.ownedMercs.filter(merc => !references.has(merc)).map(merc => merc.id)]
    .filter(id => !ids.has(id)));
  const mapIds = new Set([...ids, ...snapshot.references.map(merc => merc.id).filter(id => !independentIds.has(id))]);
  const participatingGear = (state: Pick<typeof live, 'ownedMercs' | 'mercEquipment'>): Item[] => [
    ...state.ownedMercs.filter(merc => ids.has(merc.id) || references.has(merc)).flatMap(merc => merc.equipment),
    ...Object.entries(state.mercEquipment).filter(([id]) => mapIds.has(id)).flatMap(([, gear]) => Object.values(gear))
  ].filter((item): item is Item => item != null);
  const currentGear = [...participatingGear(live), ...snapshot.references.flatMap(merc => merc.equipment)];
  const itemId = (item: Item) => snapshot.gearOriginalIds.get(item) ?? item.id;
  const affected = new Set([...participatingGear(snapshot), ...currentGear, ...snapshot.gearReferences].map(itemId));
  const known = new Set([
    ...snapshot.inventory.backpack, ...snapshot.inventory.stash, ...Object.values(snapshot.inventory.equipped),
    ...snapshot.inventory.legacyGearQuarantine.map(row => row.item), ...snapshot.inventory.socketQuarantine.map(row => row.item),
    ...snapshot.ownedMercs.flatMap(merc => merc.equipment), ...Object.values(snapshot.mercEquipment).flatMap(gear => Object.values(gear)),
    ...(snapshot.hero?.equipment ?? [])
  ].filter(item => item != null).map(item => item.id));
  const recovery = new Map<string, Item>();
  const recover = (item: Item): void => {
    const { equipSlot: _slot, ...fields } = structuredClone(item);
    recovery.set(item.id, { ...fields, equipped: false });
  };
  currentGear.filter(item => !known.has(itemId(item)) && !snapshot.gearReferences.includes(item)).forEach(recover);
  const list = <T>(current: readonly T[], original: readonly T[], identity: (entry: T) => string): T[] => {
    const next = current.filter(entry => !affected.has(identity(entry)));
    original.forEach((entry, index) => {
      if (affected.has(identity(entry)) && !recovery.has(identity(entry))) next.splice(Math.min(index, next.length), 0, structuredClone(entry));
    });
    return next;
  };
  const slots = <T extends Record<string, Item | null | undefined>>(current: T, original: T): T => {
    const next = { ...current };
    for (const [slot, item] of Object.entries(next)) if (item && affected.has(itemId(item))) {
      if (Object.hasOwn(original, slot)) Reflect.set(next, slot, null); else Reflect.deleteProperty(next, slot);
    }
    for (const [slot, item] of Object.entries(original)) if (item && affected.has(itemId(item))) {
      const currentItem = next[slot];
      if (currentItem && !affected.has(itemId(currentItem))) recover(item);
      else Reflect.set(next, slot, structuredClone(item));
    }
    return next;
  };
  const errors: unknown[] = [];
  const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
  // Keep the actual planned affected locations, including original list indexes.
  const inventoryView = (inventory: typeof snapshot.inventory) => ({
    backpack: inventory.backpack.flatMap((item, index) => affected.has(itemId(item)) ? [{ index, item }] : []),
    stash: inventory.stash.flatMap((item, index) => affected.has(itemId(item)) ? [{ index, item }] : []),
    equipped: Object.fromEntries(Object.entries(inventory.equipped).filter(([, item]) => item && affected.has(itemId(item)))),
    legacy: inventory.legacyGearQuarantine.flatMap((entry, index) => affected.has(itemId(entry.item)) ? [{ index, entry }] : []),
    socket: inventory.socketQuarantine.flatMap((entry, index) => affected.has(itemId(entry.item)) ? [{ index, entry }] : [])
  });
  let expectedInventory: ReturnType<typeof inventoryView> | undefined;
  let expectedMercGear: Record<string, Record<string, Item | null | undefined>> | undefined;
  let expectedMirrors: { id: string; equipment: readonly Item[] }[] | undefined;
  let expectedParticipantRows: { index: number; merc: Mercenary }[] | undefined;
  attempt(() => { useMercStore.setState(state => {
    const mercEquipment = { ...state.mercEquipment }, mercProgress = { ...state.mercProgress };
    for (const id of new Set([...Object.keys(mercEquipment), ...Object.keys(snapshot.mercEquipment)])) {
      if (mapIds.has(id)) {
        if (Object.hasOwn(snapshot.mercEquipment, id)) Reflect.set(mercEquipment, id, structuredClone(snapshot.mercEquipment[id]));
        else Reflect.deleteProperty(mercEquipment, id);
      } else {
        const restored = slots(mercEquipment[id] ?? {}, snapshot.mercEquipment[id] ?? {});
        if (!sameData(restored, mercEquipment[id] ?? {})) mercEquipment[id] = restored;
      }
    }
    for (const id of mapIds) {
      if (Object.hasOwn(snapshot.mercProgress, id)) Reflect.set(mercProgress, id, structuredClone(snapshot.mercProgress[id]));
      else Reflect.deleteProperty(mercProgress, id);
    }
    const ownedMercs = state.ownedMercs.filter(merc => !ids.has(merc.id) && !references.has(merc)).map(merc => {
      const original = snapshot.ownedMercs.find(before => before.id === merc.id);
      const equipment = list(merc.equipment, original?.equipment ?? [], itemId);
      return sameData(equipment, merc.equipment) ? merc : { ...merc, equipment };
    });
    snapshot.ownedMercs.forEach((merc, index) => { if (ids.has(merc.id)) ownedMercs.splice(Math.min(index, ownedMercs.length), 0, structuredClone(merc)); });
    expectedParticipantRows = structuredClone(ownedMercs.flatMap((merc, index) => ids.has(merc.id) ? [{ index, merc }] : []));
    expectedMercGear = structuredClone(mercEquipment);
    expectedMirrors = structuredClone(ownedMercs.map(merc => ({ id: merc.id, equipment: merc.equipment })));
    return { ownedMercs, mercEquipment, mercProgress, fieldedMercId: snapshot.fieldedMercId };
  }); });
  attempt(() => { useInventoryStore.setState(state => {
    const equipped = slots(state.equipped, snapshot.inventory.equipped);
    const restored = { backpack: [...list(state.backpack, snapshot.inventory.backpack, itemId), ...structuredClone([...recovery.values()])],
      stash: list(state.stash, snapshot.inventory.stash, itemId), equipped,
      legacyGearQuarantine: list(state.legacyGearQuarantine, snapshot.inventory.legacyGearQuarantine, entry => itemId(entry.item)),
      socketQuarantine: list(state.socketQuarantine, snapshot.inventory.socketQuarantine, entry => itemId(entry.item)) };
    expectedInventory = structuredClone(inventoryView(restored));
    return restored;
  }); });
  const restoredHero = () => {
    const currentHero = usePlayerStore.getState().player;
    if (!currentHero) return null;
    const inv = useInventoryStore.getState(), map = useMapStore.getState();
    const hero = { ...currentHero, equipment: list(currentHero.equipment, snapshot.hero?.equipment ?? [], itemId) };
    return { ...hero,
      derivedStats: deriveEquippedPlayerStats(hero, hero.level, inv.equipped, map.questProgress, inv.questItems, map.questReceipts) };
  };
  attempt(() => { usePlayerStore.setState({ player: restoredHero() }); });
  attempt(() => {
    const current = useMercStore.getState(), inv = useInventoryStore.getState();
    const participantRows = current.ownedMercs.flatMap((merc, index) => ids.has(merc.id) ? [{ index, merc }] : []);
    if (current.ownedMercs.some(merc => references.has(merc)) || !sameData(participantRows, expectedParticipantRows) || current.fieldedMercId !== snapshot.fieldedMercId ||
      !sameData(inventoryView(inv), expectedInventory) || !sameData(usePlayerStore.getState().player, restoredHero())) {
      throw new Error('Warband mercenary/ownership restoration postcondition failed');
    }
    for (const id of mapIds) for (const key of ['mercEquipment', 'mercProgress'] as const) {
      if (Object.hasOwn(current[key], id) !== Object.hasOwn(snapshot[key], id) || !sameData(current[key][id], snapshot[key][id])) {
        throw new Error('Warband mercenary equipment/progression restoration failed');
      }
    }
    const gearView = (gear: Record<string, Record<string, Item | null | undefined>>) => {
      const result: Record<string, Record<string, Item>> = {};
      for (const [id, equipment] of Object.entries(gear)) {
        const relevant: Record<string, Item> = {};
        for (const [slot, item] of Object.entries(equipment)) if (item && affected.has(itemId(item))) relevant[slot] = item;
        if (Object.keys(relevant).length > 0) result[id] = relevant;
      }
      return result;
    };
    const mirrorView = (rows: readonly { id: string; equipment: readonly Item[] }[]) => rows.map(merc => ({ id: merc.id,
      equipment: merc.equipment.flatMap((item, index) => affected.has(itemId(item)) ? [{ index, item }] : []) })).filter(merc => merc.equipment.length > 0);
    if (!expectedMercGear || !expectedMirrors || !sameData(gearView(current.mercEquipment), gearView(expectedMercGear)) ||
      !sameData(mirrorView(current.ownedMercs), mirrorView(expectedMirrors))) throw new Error('Warband physical gear restoration failed');
  });
  if (errors.length > 0) throw new AggregateError(errors, 'Warband mercenary restoration failed');
}
