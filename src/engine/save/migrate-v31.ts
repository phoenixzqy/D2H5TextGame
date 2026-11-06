import type { SaveV30, SaveV31 } from '../types/save';
import { validateFrozenV30Save } from './validate';

/** Validate actual30, then change only version; infer no counted source, reward or stat entitlement. */
export function migrateSaveV31(old: SaveV30): SaveV31 {
  validateFrozenV30Save(old);
  return { ...old, version: 31 };
}
