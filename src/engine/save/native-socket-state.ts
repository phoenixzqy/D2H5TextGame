import { loadItemBases } from '@/data/loaders/loot';
import { actionData, readMaterialActionState } from '../crafting/action-state';
import { validateCanonicalSocketItem, type CanonicalSocketItem } from '../items/socket-contents';
import { historicalSocketBases, validateItemServiceFields } from './historical-sockets';
import type { HistoricalItem } from './historical-items';
import { rejectPreV19State } from './pre-v19-state';

/** Reject imported accessors throughout the graph before reading or normalizing save fields. */
export function rejectSocketSaveAccessors(value: unknown): void {
  const seen = new Set<object>(), ancestors = new Set<object>();
  const intrinsicPrototypes = new Set<object>([Object.prototype, Array.prototype, Map.prototype, Set.prototype]);
  const inspect = (node: unknown): void => {
    if (node === null || typeof node !== 'object') return;
    if (ancestors.has(node)) throw new Error('Invalid save: cyclic socket state');
    if (seen.has(node)) return;
    ancestors.add(node);
    if (node instanceof Map) {
      for (const [key, entry] of Map.prototype.entries.call(node)) { inspect(key); inspect(entry); }
    }
    if (node instanceof Set) for (const entry of Set.prototype.values.call(node)) inspect(entry);
    const owners = [node];
    let prototype: object | null = Object.getPrototypeOf(node) as object | null;
    while (prototype !== null && !intrinsicPrototypes.has(prototype)) {
      owners.push(prototype); prototype = Object.getPrototypeOf(prototype) as object | null;
    }
    for (const owner of owners) {
      const descriptors = Object.getOwnPropertyDescriptors(owner);
      for (const key of Reflect.ownKeys(descriptors)) {
        const field = Reflect.get(descriptors, key) as PropertyDescriptor;
        if (!Object.hasOwn(field, 'value')) throw new Error(`Invalid save: accessor for ${String(key)} in socket state`);
        inspect(field.value as unknown);
      }
    }
    ancestors.delete(node); seen.add(node);
  };
  inspect(value);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null)) throw new Error('Invalid save: socket ownership record');
  return value as Record<string, unknown>;
}
function list(value: unknown): readonly unknown[] {
  if (!Array.isArray(value) || Reflect.ownKeys(value).length !== value.length + 1) throw new Error('Invalid save: socket ownership array');
  return Array.from({ length: value.length }, (_, index) => {
    if (!Object.hasOwn(value, String(index))) throw new Error('Invalid save: sparse socket ownership');
    return actionData(value, String(index));
  });
}
function identity(item: Record<string, unknown>): string {
  const id = actionData(item, 'id');
  if (typeof id !== 'string') throw new Error('Invalid save: socket item identity');
  return id;
}
function originKey(value: unknown): string {
  const origin = record(value), container = actionData(origin, 'container');
  if (container === 'backpack' || container === 'stash') {
    const index = actionData(origin, 'index');
    if (Reflect.ownKeys(origin).length !== 2 || typeof index !== 'number' || !Number.isSafeInteger(index) || index < 0) {
      throw new Error('Invalid save: socket quarantine bag origin');
    }
    return JSON.stringify([container, index]);
  }
  const slot = actionData(origin, 'slot');
  if (typeof slot !== 'string') throw new Error('Invalid save: socket quarantine slot');
  if (container === 'equipped' && Reflect.ownKeys(origin).length === 2) return JSON.stringify([container, slot]);
  const mercId = actionData(origin, 'mercId');
  if (container !== 'mercEquipment' || Reflect.ownKeys(origin).length !== 3 || typeof mercId !== 'string') {
    throw new Error('Invalid save: socket quarantine mercenary origin');
  }
  return JSON.stringify([container, mercId, slot]);
}

/**
 * Validate raw v19 sockets, action state and recovery ownership before generic
 * normalization. Actor equipment arrays are validated mirrors, not extra owners;
 * frozen v16 quarantine keeps its historical internal-ID collision allowance.
 */
export function validateNativeSocketState(value: unknown, validateHistoricalItem: (item: unknown) => void): void {
  const save = record(value), inventory = record(actionData(save, 'inventory'));
  readMaterialActionState(inventory);
  const mercs = record(actionData(save, 'mercs')), bases = loadItemBases(), active = new Set<string>();
  const validateItem = (value: unknown, owner: boolean): void => {
    const item = record(value), id = identity(item), baseId = actionData(item, 'baseId');
    const base = typeof baseId === 'string' ? bases.get(baseId) : undefined;
    if (!base) throw new Error('Invalid save: unknown canonical item base');
    validateCanonicalSocketItem(item as unknown as CanonicalSocketItem, base);
    if (owner && active.has(id)) throw new Error('Invalid save: duplicate active item ownership');
    if (owner) active.add(id);
  };
  const equipment = (value: unknown): void => {
    const map = record(value);
    for (const key of Reflect.ownKeys(map)) {
      if (typeof key !== 'string') throw new Error('Invalid save: canonical equipment slot');
      const item = actionData(map, key);
      if (item !== null) validateItem(item, true);
    }
  };
  for (const field of ['backpack', 'stash']) for (const item of list(actionData(inventory, field))) validateItem(item, true);
  equipment(actionData(inventory, 'equipped'));
  const mercEquipment = record(actionData(mercs, 'mercEquipment'));
  for (const key of Reflect.ownKeys(mercEquipment)) {
    if (typeof key !== 'string') throw new Error('Invalid save: mercenary equipment identity');
    equipment(actionData(mercEquipment, key));
  }
  const actors = [actionData(save, 'player'), ...list(actionData(mercs, 'ownedMercs'))];
  for (const actor of actors) for (const item of list(actionData(record(actor), 'equipment'))) validateItem(item, false);
  const oldIds = new Set(list(actionData(inventory, 'legacyGearQuarantine')).map(entry => {
    const item = record(actionData(record(entry), 'item'));
    rejectPreV19State(item);
    if (Object.hasOwn(item, 'socketCapacity') || Object.hasOwn(item, 'personalizedBy')) {
      throw new Error('Invalid save: quarantine must preserve literal predecessor fields');
    }
    return identity(item);
  }));
  if ([...oldIds].some(id => active.has(id))) throw new Error('Invalid save: frozen quarantined item remains active');
  const origins = new Set<string>(), recovered = new Set<string>();
  for (const value of list(actionData(inventory, 'socketQuarantine'))) {
    const entry = record(value);
    if (Reflect.ownKeys(entry).length !== 3 || actionData(entry, 'sourceVersion') !== 18) throw new Error('Invalid save: socket quarantine entry');
    const item = record(actionData(entry, 'item')), id = identity(item), baseId = actionData(item, 'baseId');
    const base = historicalSocketBases.find(row => row.id === baseId);
    if (!base || active.has(id) || oldIds.has(id) || recovered.has(id)) throw new Error('Invalid save: colliding socket quarantine ownership');
    rejectPreV19State(item);
    validateHistoricalItem(item);
    validateItemServiceFields(item as unknown as HistoricalItem, base);
    const origin = originKey(actionData(entry, 'origin'));
    if (origins.has(origin)) throw new Error('Invalid save: duplicate socket quarantine origin');
    origins.add(origin); recovered.add(id);
  }
}
