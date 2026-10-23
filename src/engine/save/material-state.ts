import { isMaterialLedger, type MaterialLedger } from '../loot/materials';

/** Read raw native ownership before normalization can erase descriptors or inherited data. */
export function readMaterialLedger(inventory: object, allowAbsent = false): MaterialLedger {
  const descriptor = Object.getOwnPropertyDescriptor(inventory, 'materials');
  if (!descriptor && allowAbsent && !('materials' in inventory)) return {};
  if (!descriptor || !descriptor.enumerable || !('value' in descriptor) || !isMaterialLedger(descriptor.value)) {
    throw new Error('Invalid save: materials must be an own concrete material ledger');
  }
  return descriptor.value;
}
