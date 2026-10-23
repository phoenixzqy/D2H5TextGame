import { itemBases } from '@/data/index';
import { validateItemServiceFields } from '../items/socket-capacity';
import type { Item } from '../types/items';
import type { SaveV17 } from '../types/save';
const slots = ['head', 'chest', 'gloves', 'belt', 'boots', 'amulet', 'ring-left', 'ring-right', 'weapon', 'offhand'];
const mapFields = ['questTitles', 'questDifficulties', 'selectedTitle', 'selectedDifficulty', 'nightmareClearedSubAreas', 'challengeOrdinals'];
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function activeItems(save: Omit<SaveV17, 'version'>): readonly Item[] {
  return [...save.inventory.backpack, ...save.inventory.stash,
    ...Object.values(save.inventory.equipped).filter((item): item is Item => item !== null),
    ...Object.values(save.mercs.mercEquipment).flatMap(equipment => Object.values(equipment).filter((item): item is Item => item != null))];
}
/** Reject raw reserved future fields on every supported predecessor location, even own undefined. */
export function rejectHistoricalServiceFields(value: unknown): void {
  if (!record(value)) return;
  if (record(value.inventory) && ['questServices', 'legacyGearQuarantine'].some(key => Object.hasOwn(value.inventory as object, key)) ||
    record(value.map) && mapFields.some(key => Object.hasOwn(value.map as object, key))) throw new Error('Invalid save: reserved v17 state in historical input');
  const inspect = (node: unknown): void => {
    if (Array.isArray(node)) { node.forEach(inspect); return; }
    if (!record(node)) return;
    if (Object.hasOwn(node, 'baseId') && ['socketCapacity', 'personalizedBy'].some(key => Object.hasOwn(node, key))) {
      throw new Error('Invalid save: reserved v17 item field in historical input');
    }
    Object.values(node).forEach(inspect);
  };
  inspect(value.inventory); inspect(value.player); inspect(value.mercs);
}
/** Validate active instances and uniqueness across actual ownership containers, excluding actor cache mirrors. */
export function validateNativeItemState(save: Omit<SaveV17, 'version'>): void {
  const ids = new Set<string>();
  const bases = new Map(itemBases.map(base => [base.id, base]));
  for (const item of activeItems(save)) {
    if (ids.has(item.id)) throw new Error('Invalid save: duplicate active item ownership');
    ids.add(item.id);
  }
  for (const item of [...activeItems(save), ...save.player.equipment, ...save.mercs.ownedMercs.flatMap(merc => merc.equipment)]) {
    const base = bases.get(item.baseId);
    if (!base) throw new Error('Invalid save: unknown active item base');
    validateItemServiceFields(item, base);
  }
  if (save.inventory.legacyGearQuarantine.some(entry => ids.has(entry.item.id))) throw new Error('Invalid save: quarantined item remains active');
}
/** Preserved predecessor payloads are inspectable only; each has one exact finite original location. */
export function validateLegacyQuarantine(save: Omit<SaveV17, 'version'>, validateItem: (value: unknown) => void): void {
  const origins = new Set<string>();
  if (!Array.isArray(save.inventory.legacyGearQuarantine)) throw new Error('Invalid save: quarantine must be an array');
  for (const entry of save.inventory.legacyGearQuarantine) {
    if (!record(entry) || Reflect.ownKeys(entry).length !== 2 || !Object.hasOwn(entry, 'item') || !Object.hasOwn(entry, 'origin') ||
      !record(entry.origin)) throw new Error('Invalid save: quarantine entry');
    validateItem(entry.item);
    if (!record(entry.item) || ['socketCapacity', 'personalizedBy'].some(key => Object.hasOwn(entry.item as object, key))) {
      throw new Error('Invalid save: quarantine must preserve literal predecessor fields');
    }
    const origin = entry.origin;
    let key: string;
    if (origin.container === 'backpack' || origin.container === 'stash') {
      if (Reflect.ownKeys(origin).length !== 2 || typeof origin.index !== 'number' || !Number.isSafeInteger(origin.index) || origin.index < 0) throw new Error('Invalid save: quarantine bag origin');
      key = `${origin.container}:${String(origin.index)}`;
    } else if (origin.container === 'equipped' || origin.container === 'mercEquipment') {
      if (typeof origin.slot !== 'string' || !slots.includes(origin.slot) || Reflect.ownKeys(origin).length !== (origin.container === 'equipped' ? 2 : 3) ||
        origin.container === 'mercEquipment' && (typeof origin.mercId !== 'string' || !origin.mercId.length)) throw new Error('Invalid save: quarantine equipment origin');
      key = origin.container === 'equipped' ? `equipped:${origin.slot}` : `merc:${String(origin.mercId)}:${origin.slot}`;
    } else throw new Error('Invalid save: unknown quarantine origin');
    if (origins.has(key)) throw new Error('Invalid save: duplicate quarantine origin');
    origins.add(key);
  }
}
