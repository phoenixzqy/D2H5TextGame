const reservedInventory = ['materialActionOrdinal', 'latestMaterialAction', 'socketQuarantine'];

/** Reject raw future socket/action state before a historical normalizer can erase or evaluate it. */
export function rejectPreV19State(value: unknown): void {
  const inventory: unknown = value && typeof value === 'object'
    ? Object.getOwnPropertyDescriptor(value, 'inventory')?.value : undefined;
  if (inventory && typeof inventory === 'object') {
    if (reservedInventory.some(key => key in inventory)) {
      throw new Error('Invalid save: reserved v19 material or socket state in predecessor');
    }
    const quarantine: unknown = Object.getOwnPropertyDescriptor(inventory, 'legacyGearQuarantine')?.value;
    if (Array.isArray(quarantine) && Object.values(Object.getOwnPropertyDescriptors(quarantine)).some(field => {
      const entry: unknown = field.value;
      return entry !== null && typeof entry === 'object' && 'sourceVersion' in entry;
    })) {
      throw new Error('Invalid save: reserved v19 quarantine discriminator in predecessor');
    }
  }
  const seen = new Set<object>();
  const inspect = (node: unknown): void => {
    if (node === null || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if ('baseId' in node && 'socketContents' in node) {
      throw new Error('Invalid save: reserved v19 material or socket state in predecessor');
    }
    if (node instanceof Map) {
      for (const entry of Map.prototype.values.call(node)) inspect(entry);
    }
    if (node instanceof Set) {
      for (const entry of Set.prototype.values.call(node)) inspect(entry);
    }
    const descriptors = Object.getOwnPropertyDescriptors(node);
    for (const key of Reflect.ownKeys(descriptors)) {
      const field = Reflect.get(descriptors, key) as PropertyDescriptor;
      if (!Object.hasOwn(field, 'value')) throw new Error(`Invalid save: accessor for ${String(key)} in predecessor state`);
      inspect(field.value as unknown);
    }
  };
  inspect(value);
}
