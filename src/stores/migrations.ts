/**
 * Save schema versioning shim.
 *
 * The authoritative version + migration registry lives in
 * `src/engine/types/save.ts` (engine-side, framework-free). This module just
 * re-exports for the stores layer and provides a convenience helper.
 */

import {
  CURRENT_SAVE_VERSION,
  MIGRATIONS as ENGINE_MIGRATIONS
} from '@/engine/types/save';
import { runMigrations, type VersionedSave } from '@/engine/save';

export const SAVE_SCHEMA_VERSION = CURRENT_SAVE_VERSION;
export const migrations = ENGINE_MIGRATIONS;

/**
 * Apply all necessary migrations to bring data up to the current version.
 * Accepts either an explicit `{ version }` shape or legacy `{ schemaVersion }`.
 */
export function applyMigrations(data: { version?: number; schemaVersion?: number }): unknown {
  const version = data.version ?? data.schemaVersion ?? 0;
  return runMigrations({ ...data, version } as VersionedSave, SAVE_SCHEMA_VERSION);
}
