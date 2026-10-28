import type { SaveV23, SaveV24 } from '../types/save';
import { validateFrozenV23Save } from './validate';

/** Validate the raw predecessor, then preserve its values with only two defaults. */
export function migrateSaveV24(old: SaveV23): SaveV24 {
  validateFrozenV23Save(old);
  return { ...old, version: 24, map: { ...old.map,
    hellClearedSubAreas: [], challengeOrdinals: { ...old.map.challengeOrdinals, hell: 0 } } };
}
