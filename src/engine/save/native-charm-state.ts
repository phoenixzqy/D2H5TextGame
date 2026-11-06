import { loadItemBases } from '@/data/loaders/loot';
import { baseMatchesEquipmentSlot, hasUniqueCharmOwnership } from '../inventory/equipValidator';
import type { SaveV25 } from '../types/save';
import type { ItemBase } from '../types/items';

/** Enforce native charm ownership after raw descriptor, structure and item admission. */
export function validateNativeCharmState(save: Pick<SaveV25, 'inventory' | 'mercs'>,
  bases: ReadonlyMap<string, ItemBase> = loadItemBases()): void {
  for (const [slot, item] of Object.entries(save.inventory.equipped)) {
    if (!item) continue;
    const base = bases.get(item.baseId);
    if ((slot === 'charm' || item.baseId === 'items/base/small-charm' || base?.type === 'charm' || base?.slot === 'charm') &&
      !(slot === 'charm' && baseMatchesEquipmentSlot(base, 'charm'))) {
      throw new Error('Invalid save: hero charm slot');
    }
  }
  for (const equipment of Object.values(save.mercs.mercEquipment)) {
    if (Object.hasOwn(equipment, 'charm')) throw new Error('Invalid save: mercenary charm slot');
    for (const item of Object.values(equipment)) {
      if (!item) continue;
      const base = bases.get(item.baseId);
      if (item.baseId === 'items/base/small-charm' || base?.type === 'charm' || base?.slot === 'charm') {
        throw new Error('Invalid save: mercenary charm item');
      }
    }
  }
  if (!hasUniqueCharmOwnership(save.inventory, save.mercs.mercEquipment)) {
    throw new Error('Invalid save: duplicate charm ownership');
  }
}
