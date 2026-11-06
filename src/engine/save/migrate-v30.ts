import type { SaveV29, SaveV30 } from '../types/save';
import { validateFrozenV29Save } from './validate';

/** Validate actual29, then change only version; infer no enlistment, recruit or reward. */
export function migrateSaveV30(old: SaveV29): SaveV30 {
  validateFrozenV29Save(old);
  return { ...old, version: 30 };
}
