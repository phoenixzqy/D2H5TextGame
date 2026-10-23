import assert from 'node:assert/strict';
import type { SaveCurrent, SaveV17 } from '@/engine/types/save';
import type { MaterialLedger } from '@/engine/loot/materials';
import type { EarnedState } from './earned-state';

/** Compare frozen v17 evidence only after separately proving the v18 addition is empty. */
function withoutEmptyMaterials<T extends { readonly materials: MaterialLedger }>(inventory: T): Omit<T, 'materials'> {
  assert.deepEqual(inventory.materials, {}, 'Historical v17 projection cannot discard owned materials');
  const { materials: _materials, ...historical } = inventory;
  return historical;
}

/** All v17 saved values remain authoritative; only version and the new empty ledger differ. */
export function historicalV17Save(save: SaveCurrent): SaveV17 {
  assert.equal(save.version, 18, 'Historical projection requires a validated current v18 save');
  return { ...save, version: 17, inventory: withoutEmptyMaterials(save.inventory) };
}

/** The historical observation predates material ownership; refuse any nonempty live ledger. */
export function historicalV17EarnedState(state: EarnedState) {
  return { ...state, inventory: withoutEmptyMaterials(state.inventory) };
}
