import type { Item } from '../../src/engine/types/items';
import type { HistoricalItem } from '../../src/engine/save/historical-items';
import type { SaveCurrent, LegacyGearQuarantineEntry } from '../../src/engine/types/save';
import { emptyEndgameState } from '../../src/engine/endgame/state';

/** Historical save roots never contain the new durable endgame namespace. */
export function withoutV20Fields<T extends { endgame?: unknown; map: SaveCurrent['map'] }>(save: T) {
  const { endgame: _endgame, ...historical } = save;
  const selectedTitle = save.map.selectedTitle;
  if (selectedTitle !== null && selectedTitle !== 'titles/slayer_of_baal') {
    throw new Error('An achievement title has no historical representation');
  }
  return { ...historical, map: { ...save.map, selectedTitle } };
}

/** Remove current-only state before constructing a genuine v18 or earlier fixture. */
export function withoutV19Fields<T extends Omit<SaveCurrent, 'inventory'> & {
  inventory: Omit<SaveCurrent['inventory'], 'questItems'> & { questItems?: unknown }
}>(save: T) {
  const { materialActionOrdinal: _ordinal, latestMaterialAction: _receipt,
    socketQuarantine: _quarantine, ...inventory } = save.inventory;
  const item = (value: Item): HistoricalItem => {
    const { socketContents, ...historical } = value;
    if (socketContents === undefined) return historical;
    if (socketContents.some(content => content.kind !== 'rune')) {
      throw new Error('A gem socket fixture has no historical rune representation');
    }
    return { ...historical, runes: socketContents.map(content => content.id) };
  };
  const equipment = (slots: Readonly<Record<string, Item | null | undefined>>) =>
    Object.fromEntries(Object.entries(slots).map(([slot, value]) => [slot, value ? item(value) : null]));
  return { ...withoutV20Fields(save), inventory: { ...inventory,
    backpack: inventory.backpack.map(item), stash: inventory.stash.map(item),
    equipped: equipment(inventory.equipped) },
  player: { ...save.player, equipment: save.player.equipment.map(item) },
  mercs: { ...save.mercs,
    ownedMercs: save.mercs.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.map(item) })),
    mercEquipment: Object.fromEntries(Object.entries(save.mercs.mercEquipment)
      .map(([id, slots]) => [id, equipment(slots)])) } };
}

/** Construct genuine predecessor fixtures before adding deliberate corruption. */
export function withoutV17Fields<T extends Omit<SaveCurrent, 'inventory'> & {
  inventory: Omit<SaveCurrent['inventory'], 'questItems'> & { questItems?: unknown }
}>(save: T) {
  const predecessor = withoutV19Fields(save);
  const { materials: _materials, questServices: _services, legacyGearQuarantine: _quarantine, ...inventory } = predecessor.inventory;
  const { questTitles: _titles, questDifficulties: _difficulties, selectedTitle: _title,
    selectedDifficulty: _difficulty, nightmareClearedSubAreas: _nightmare,
    challengeOrdinals: _ordinals, ...map } = predecessor.map;
  const item = (value: HistoricalItem): HistoricalItem => {
    const { socketCapacity: _capacity, personalizedBy: _identity, ...historical } = value;
    return historical;
  };
  const equipment = (slots: Readonly<Record<string, HistoricalItem | null | undefined>>) =>
    Object.fromEntries(Object.entries(slots).map(([slot, value]) => [slot, value ? item(value) : null]));
  return { ...predecessor, map, inventory: { ...inventory,
    backpack: inventory.backpack.map(item), stash: inventory.stash.map(item),
    equipped: equipment(inventory.equipped) },
  player: { ...predecessor.player, equipment: predecessor.player.equipment.map(item) },
  mercs: { ...predecessor.mercs,
    ownedMercs: predecessor.mercs.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.map(item) })),
    mercEquipment: Object.fromEntries(Object.entries(predecessor.mercs.mercEquipment)
      .map(([id, slots]) => [id, equipment(slots)])) } };
}

/** Explicit empty native17 state expected when historical saves acquire no new entitlements. */
export function withV17Defaults<T extends { inventory: object; map: object }>(save: T) {
  return { ...save, version: 17,
    inventory: { questServices: {}, legacyGearQuarantine: [] as LegacyGearQuarantineEntry[], ...save.inventory },
    map: { questTitles: {}, questDifficulties: {}, selectedTitle: null, selectedDifficulty: 'normal' as const,
      nightmareClearedSubAreas: [], challengeOrdinals: { normal: 0, nightmare: 0 }, ...save.map } };
}

/** Explicit v17→v18 expectation: one empty ledger, no reconstruction of old rewards. */
export function withV18Defaults<T extends { inventory: object; map: object }>(save: T) {
  const v17 = withV17Defaults(save);
  return { ...v17, version: 18, inventory: { ...v17.inventory, materials: {} } };
}

/** Empty v19 action/socket state; unchanged gear and validated actor caches stay exact. */
export function withV19Defaults<T extends { inventory: object; map: object }>(save: T) {
  const v18 = withV18Defaults(save);
  return { ...v18, version: 19,
    inventory: { ...v18.inventory, socketQuarantine: [], materialActionOrdinal: 0 } };
}

/** Exact v19→20 expectation: preserve all holdings and add only empty endgame. */
export function withV20Defaults<T extends { version: number }>(save: T) {
  const { version: _version, ...unchanged } = save;
  return { ...unchanged, version: 20 as const, endgame: emptyEndgameState() };
}

/** Older fixture expectations explicitly compose every added empty ownership domain. */
export function withCurrentDefaults<T extends { inventory: object; map: object }>(save: T) {
  return withV20Defaults(withV19Defaults(save));
}
