import type { SaveV32, SaveV33 } from '../types/save';
import { validateFrozenV32Save } from './validate';

/** Preserve every predecessor value; unknown SR/history and shard/star earnings start empty. */
export function migrateSaveV33(old: SaveV32): SaveV33 {
  validateFrozenV32Save(old);
  return { ...old, version: 33,
    meta: { ...old.meta, recruitmentState: { srPityCounter: 0, totalPulls: 0, history: [] } },
    mercs: { ...old.mercs, recruitmentProgress: {} }
  };
}
