import { emptyEndgameState } from '../endgame/state';
import type { SaveV19, SaveV20 } from '../types/save';
import { validateSocketSave } from './validate';

/** Validate frozen history before adding empty progress; never infer rewards or attempts. */
export function migrateSaveV20(old: SaveV19): SaveV20 {
  validateSocketSave(old);
  return { ...old, version: 20, endgame: emptyEndgameState() };
}
