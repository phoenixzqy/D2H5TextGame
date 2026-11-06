import type { SaveV27, SaveV28 } from '../types/save';
import { validateFrozenV27Save } from './validate';

/** Validate actual27, then change only version; infer no tome, completion, points or compensation. */
export function migrateSaveV28(old: SaveV27): SaveV28 {
  validateFrozenV27Save(old);
  return { ...old, version: 28 };
}
