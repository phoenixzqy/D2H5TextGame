import type { SaveV31, SaveV32 } from '../types/save';
import { validateFrozenV31Save } from './validate';

/** Validate literal31 before admitting the unpublished P14 union; infer no activity. */
export function migrateSaveV32(old: SaveV31): SaveV32 {
  validateFrozenV31Save(old);
  return { ...old, version: 32, map: { ...old.map, bounties: {} } };
}
