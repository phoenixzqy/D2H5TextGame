/** Versioned compatibility for the two historical Amazon factory signatures. */
import type { Item } from '../types/items';
import type { SaveV7, SaveV8 } from '../types/save';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';
import { restoreEquipment } from './restore';

const ORIGINAL_KEYS = ['id', 'baseId', 'rarity', 'level', 'identified', 'equipped', 'equipSlot'];
const RECIPE_KEYS = [...ORIGINAL_KEYS, 'ilvl', 'baseRolls'];

function exactKeys(value: object, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isProvenStarter(item: Item): boolean {
  const match = /^starter-amazon-bow-(0|[1-9]\d*)$/.exec(item.id);
  if (!match || !Number.isSafeInteger(Number(match[1]))) return false;
  if (item.rarity !== 'normal' || item.level !== 1 || !item.identified ||
    !item.equipped || item.equipSlot !== 'weapon') return false;
  if (item.baseId === 'items/base/weapon-bow') return exactKeys(item, ORIGINAL_KEYS);
  return item.baseId === 'items/base/weapon-bow-training' && exactKeys(item, RECIPE_KEYS) &&
    item.ilvl === 1 && item.baseRolls !== undefined &&
    exactKeys(item.baseRolls, ['attack']) && item.baseRolls.attack === 13;
}

/**
 * Move only a proven, unclaimed singleton starter into an absent canonical slot.
 * Decode validates the legacy shape before calling this migration. Ambiguous
 * ownership and explicit empty slots preserve every item and stat unchanged.
 */
export function migrateLegacyStarter(save: SaveV7): SaveV8 {
  const upgraded: SaveV8 = { ...save, version: 8 };
  const { player, inventory, mercs } = save;
  if (player.class !== 'amazon' || player.equipment.length !== 1 ||
    Object.hasOwn(inventory.equipped, 'weapon') || inventory.equipped.offhand) return upgraded;
  const starter = player.equipment[0];
  if (!starter || !isProvenStarter(starter)) return upgraded;
  const retained = [
    ...inventory.backpack, ...inventory.stash, ...Object.values(inventory.equipped),
    ...Object.values(mercs.mercEquipment).flatMap((equipment) => Object.values(equipment)),
    ...mercs.ownedMercs.flatMap((merc) => merc.equipment)
  ];
  if (retained.some((item) => item?.id === starter.id)) return upgraded;

  const weapon: Item = {
    ...starter, baseId: 'items/base/weapon-bow-training', ilvl: 1, baseRolls: { attack: 13 }
  };
  const equipped = { ...inventory.equipped, weapon };
  return {
    ...upgraded,
    player: {
      ...player, equipment: [],
      // Restore only an aggregation view; retained payloads keep their values.
      derivedStats: deriveEquippedPlayerStats(player, player.level, restoreEquipment(equipped))
    },
    inventory: { ...inventory, equipped }
  };
}
