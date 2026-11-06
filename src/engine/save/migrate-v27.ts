import type { SaveV26, SaveV27 } from '../types/save';
import { validateFrozenV26Save } from './validate';

/** Validate actual26, then change only version; infer no enlistment, completion, recruit or reward. */
export function migrateSaveV27(old: SaveV26): SaveV27 {
  validateFrozenV26Save(old);
  return { ...old, version: 27 };
}
