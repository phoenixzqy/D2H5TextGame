import { rejectPreV21Respec } from './respec-state';
/**
 * Save migration runner.
 *
 * Migrations are keyed by the **target** version. To upgrade a save from
 * version N to N+1, call MIGRATIONS[N+1](save).
 *
 * @module engine/save/migrate
 */

import { CURRENT_SAVE_VERSION, MIGRATIONS, type SaveCurrent, type SaveV7, type SaveV8, type SaveV9, type SaveV10 } from '../types/save';
import { rejectPreV20State } from './endgame-state';

/** A save in any past or current version. */
export interface VersionedSave {
  readonly version: number;
}

/**
 * Run all migrations needed to bring `save` up to the current version.
 * Throws if a required migration is missing.
 */
export function runMigrations(save: VersionedSave, targetVersion?: typeof CURRENT_SAVE_VERSION): SaveCurrent;
export function runMigrations(save: VersionedSave, targetVersion: 7): SaveV7;
export function runMigrations(save: VersionedSave, targetVersion: 8): SaveV8;
export function runMigrations(save: VersionedSave, targetVersion: 9): SaveV9;
export function runMigrations(save: VersionedSave, targetVersion: 10): SaveV10;
export function runMigrations(save: VersionedSave, targetVersion: number): VersionedSave;
export function runMigrations(
  save: VersionedSave,
  targetVersion: number = CURRENT_SAVE_VERSION
): VersionedSave {
  if (save.version < 21 && targetVersion >= 21) rejectPreV21Respec(save);
  if (save.version < 20 && targetVersion >= 20) rejectPreV20State(save);
  let current: VersionedSave = save;
  while (current.version < targetVersion) {
    const next = current.version + 1;
    const m = MIGRATIONS[next];
    if (!m) {
      throw new Error(
        `No migration registered to version ${String(next)} (have ${String(current.version)})`
      );
    }
    current = m(current) as VersionedSave;
  }
  if (current.version > targetVersion) {
    throw new Error(
      `Save version ${String(current.version)} is newer than target ${String(targetVersion)}`
    );
  }
  return current;
}
