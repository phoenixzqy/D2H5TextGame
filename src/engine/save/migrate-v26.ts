import type { SaveV25, SaveV26 } from '../types/save';
import { validateFrozenV25Save } from './validate';

/** Validate actual25, then change only the version; infer no presentation, completion or charge. */
export function migrateSaveV26(old: SaveV25): SaveV26 {
  validateFrozenV25Save(old);
  return { ...old, version: 26 };
}
