/**
 * Save adapter using Dexie (IndexedDB)
 * Handles persistence for all stores
 */

import Dexie, { type Table } from 'dexie';
import {
  CURRENT_SAVE_VERSION,
  type SaveCurrent
} from '@/engine/types/save';
import { runMigrations, type VersionedSave } from '@/engine/save';

export interface SaveRecord {
  id: string; // Always "current" for single-player
  version: number;
  data: SaveCurrent | VersionedSave;
  timestamp: number;
}

class SaveDatabase extends Dexie {
  saves!: Table<SaveRecord>;

  constructor() {
    super('D2H5TextGame');
    this.version(1).stores({
      saves: 'id, version, timestamp'
    });
  }
}

const db = new SaveDatabase();

/**
 * Load the current save, applying migrations if needed.
 * Returns null if no save exists. Throws if migration fails.
 */
export async function loadSave(): Promise<SaveCurrent | null> {
  const record = await db.saves.get('current');
  if (!record) return null;
  const raw = record.data as VersionedSave;
  if (raw.version === CURRENT_SAVE_VERSION) {
    return raw as SaveCurrent;
  }
  // Migrate up. Caller (persistence layer) decides whether to write back.
  return runMigrations(raw, CURRENT_SAVE_VERSION);
}

/**
 * Save the current state
 */
export async function saveSave(data: SaveCurrent): Promise<void> {
  await db.saves.put({
    id: 'current',
    version: data.version,
    data,
    timestamp: Date.now()
  });
}

/**
 * Export save as JSON string (raw, pre-migration form on disk)
 */
export async function exportSave(): Promise<string | null> {
  const record = await db.saves.get('current');
  if (!record) return null;
  return JSON.stringify(record.data, null, 2);
}

/**
 * Import save from JSON string. Runs migrations to current version.
 */
export async function importSave(json: string): Promise<void> {
  const raw = JSON.parse(json) as VersionedSave;
  if (typeof raw.version !== 'number') {
    throw new Error('Invalid save: missing version field');
  }
  const migrated = runMigrations(raw, CURRENT_SAVE_VERSION);
  await saveSave(migrated);
}

/**
 * Delete the current save
 */
export async function deleteSave(): Promise<void> {
  await db.saves.delete('current');
}

/**
 * Check if a save exists
 */
export async function hasSave(): Promise<boolean> {
  try {
    const record = await db.saves.get('current');
    return !!record;
  } catch {
    return false;
  }
}
