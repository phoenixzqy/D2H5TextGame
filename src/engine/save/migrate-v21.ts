import { RESPEC_POLICY } from '@/data/loaders/respec';
import type { SaveV20, SaveV21 } from '../types/save';
import { validateEndgameSave } from './validate';
import { rejectPreV21Respec } from './respec-state';

/** Validate the complete predecessor before granting the previously unavailable free uses. */
export function migrateSaveV21(old: SaveV20): SaveV21 {
  rejectPreV21Respec(old);
  validateEndgameSave(old);
  return { ...old, version: 21, player: { ...old.player,
    respecsRemaining: { stat: RESPEC_POLICY.freeUses, skill: RESPEC_POLICY.freeUses } } };
}
