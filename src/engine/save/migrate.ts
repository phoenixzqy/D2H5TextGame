/**
 * Save migration runner.
 *
 * Migrations are keyed by the **target** version. To upgrade a save from
 * version N to N+1, call MIGRATIONS[N+1](save).
 *
 * @module engine/save/migrate
 */

import { MIGRATIONS, type SaveV1 } from '../types/save';

/** A save in any past or current version. */
export interface VersionedSave {
  readonly version: number;
}

/**
 * Run all migrations needed to bring `save` up to the current version.
 * Throws if a required migration is missing.
 */
export function runMigrations(save: VersionedSave, targetVersion = 1): SaveV1 {
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
  return current as SaveV1;
}
