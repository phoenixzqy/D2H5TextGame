import type { Item } from '../../src/engine/types/items';
import type { SaveCurrent, LegacyGearQuarantineEntry } from '../../src/engine/types/save';

/** Construct genuine predecessor fixtures before adding deliberate corruption. */
export function withoutV17Fields<T extends Omit<SaveCurrent, 'inventory'> & {
  inventory: Omit<SaveCurrent['inventory'], 'questItems'> & { questItems?: unknown }
}>(save: T) {
  const { materials: _materials, questServices: _services, legacyGearQuarantine: _quarantine, ...inventory } = save.inventory;
  const { questTitles: _titles, questDifficulties: _difficulties, selectedTitle: _title,
    selectedDifficulty: _difficulty, nightmareClearedSubAreas: _nightmare,
    challengeOrdinals: _ordinals, ...map } = save.map;
  const item = (value: Item): Item => {
    const { socketCapacity: _capacity, personalizedBy: _identity, ...historical } = value;
    return historical;
  };
  const equipment = (slots: Readonly<Record<string, Item | null | undefined>>) =>
    Object.fromEntries(Object.entries(slots).map(([slot, value]) => [slot, value ? item(value) : null]));
  return { ...save, map, inventory: { ...inventory,
    backpack: inventory.backpack.map(item), stash: inventory.stash.map(item),
    equipped: equipment(inventory.equipped) },
  player: { ...save.player, equipment: save.player.equipment.map(item) },
  mercs: { ...save.mercs,
    ownedMercs: save.mercs.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.map(item) })),
    mercEquipment: Object.fromEntries(Object.entries(save.mercs.mercEquipment)
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
