import type { SaveV22, SaveV23 } from '../types/save';
import { validateFrozenV22Save } from './validate';

/** Validate literal22 before current authority; never infer a quest action or service. */
export function migrateSaveV23(old: SaveV22): SaveV23 {
  validateFrozenV22Save(old);
  return { ...old, version: 23 };
}
