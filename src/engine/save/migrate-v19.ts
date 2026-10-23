import { loadItemBases } from '@/data/loaders/loot';
import { aggregateCanonicalEquipmentMods } from '../progression/equipment-mods';
import { prepareEquipmentStatComposition } from '../progression/equipped-stats';
import type { CanonicalSocketItem } from '../items/socket-contents';
import type { MaterialRecoveryEntry, MaterialRecoveryOrigin } from '../crafting/material-actions';
import type { SaveV18, SaveV19 } from '../types/save';
import type { HistoricalItem } from './historical-items';
import { convertV18SocketItem } from './socket-v19';
import { restoreEquipment } from './restore';

/**
 * Convert validated v18 ownership, preserving unsupported exact payloads for
 * explicit recovery. Actor arrays are cache mirrors, never additional owners.
 * This pure target migration is registered only with the connected v19 rollout.
 */
export function migrateSaveV19(old: SaveV18): SaveV19 {
  const bases = loadItemBases();
  const quarantine: MaterialRecoveryEntry[] = [];
  const convert = (item: HistoricalItem, origin: MaterialRecoveryOrigin): CanonicalSocketItem | null => {
    const converted = convertV18SocketItem(item, bases.get(item.baseId));
    if (!converted) quarantine.push({ sourceVersion: 18, item, origin });
    return converted;
  };
  const bag = (container: 'backpack' | 'stash'): CanonicalSocketItem[] =>
    old.inventory[container].flatMap((item, index) => {
      const converted = convert(item, { container, index });
      return converted ? [converted] : [];
    });
  const slots = (equipment: Readonly<Record<string, HistoricalItem | null | undefined>>, mercId?: string) =>
    Object.fromEntries(Object.entries(equipment).map(([slot, item]) => [slot, item ? convert(item,
      mercId === undefined ? { container: 'equipped', slot }
        : { container: 'mercEquipment', mercId, slot }) : null]));
  const backpack = bag('backpack'), stash = bag('stash'), equipped = slots(old.inventory.equipped);
  const mercEquipment = Object.fromEntries(Object.entries(old.mercs.mercEquipment)
    .map(([id, equipment]) => [id, slots(equipment, id)]));
  const compose = prepareEquipmentStatComposition(old.player, old.player.level,
    old.map.questProgress, old.inventory.questItems, old.map.questReceipts);
  const present = (item: CanonicalSocketItem | null | undefined): item is CanonicalSocketItem => item != null;
  return { ...old, version: 19,
    inventory: { ...old.inventory, backpack, stash, equipped,
      socketQuarantine: quarantine, materialActionOrdinal: 0 },
    player: { ...old.player, equipment: Object.values(equipped).filter(present),
      derivedStats: compose(aggregateCanonicalEquipmentMods(restoreEquipment(equipped))) },
    mercs: { ...old.mercs, mercEquipment, ownedMercs: old.mercs.ownedMercs.map(merc => ({ ...merc,
      equipment: Object.values(mercEquipment[merc.id] ?? {}).filter(present) })) }
  };
}
