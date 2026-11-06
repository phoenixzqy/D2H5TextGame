import type { SaveV28, SaveV29 } from '../types/save';
import { validateFrozenV28Save } from './validate';

/** Validate actual28, then change only version; infer no relic, main proof, XP or unique reward. */
export function migrateSaveV29(old: SaveV28): SaveV29 {
  validateFrozenV28Save(old);
  return { ...old, version: 29 };
}
