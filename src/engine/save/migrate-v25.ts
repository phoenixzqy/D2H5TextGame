import type { Item } from '../types/items';
import type { SaveV24, SaveV25 } from '../types/save';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';
import { restoreEquipment } from './restore';
import { validateFrozenV24Save } from './validate';

/** Recover old reserved-slot owners once; never infer a charm, quest proof or reward. */
export function migrateSaveV25(old: SaveV24): SaveV25 {
  validateFrozenV24Save(old);
  const recovered: Item[] = [];
  const detach = (item: Item): void => {
    const { equipSlot: _slot, ...fields } = item;
    recovered.push({ ...fields, equipped: false });
  };
  const heroItem = old.inventory.equipped.charm;
  if (heroItem) detach(heroItem);
  const equipped = Object.hasOwn(old.inventory.equipped, 'charm')
    ? { ...old.inventory.equipped, charm: null } : old.inventory.equipped;
  const changedMercs = new Set<string>();
  const mercEquipment = { ...old.mercs.mercEquipment };
  for (const id of Object.keys(mercEquipment).sort()) {
    const slots = mercEquipment[id];
    if (!slots || !Object.hasOwn(slots, 'charm')) continue;
    if (slots.charm) detach(slots.charm);
    const { charm: _charm, ...remaining } = slots;
    mercEquipment[id] = remaining;
    changedMercs.add(id);
  }
  const present = (item: Item | null | undefined): item is Item => item != null;
  const player = heroItem ? { ...old.player,
    equipment: Object.values(equipped).filter(present),
    derivedStats: deriveEquippedPlayerStats(old.player, old.player.level, restoreEquipment(equipped),
      old.map.questProgress, old.inventory.questItems, old.map.questReceipts, {}) } : old.player;
  return { ...old, version: 25, player,
    inventory: { ...old.inventory, equipped, backpack: [...old.inventory.backpack, ...recovered] },
    mercs: { ...old.mercs, mercEquipment, ownedMercs: old.mercs.ownedMercs.map(merc => changedMercs.has(merc.id)
      ? { ...merc, equipment: Object.values(mercEquipment[merc.id] ?? {}).filter(present) } : merc) } };
}
