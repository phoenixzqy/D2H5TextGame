/**
 * Save adapter using Dexie (IndexedDB)
 * Handles persistence for all stores
 */

import Dexie, { type Table } from 'dexie';
import { type SaveCurrent } from '@/engine/types/save';
import { type VersionedSave } from '@/engine/save';
import { decodeSave } from '@/engine/save/validate';

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
  return decodeSave(record.data);
}

/**
 * Save the current state
 */
let writes: Promise<void> = Promise.resolve();

/** Serialize mutations so an older delayed write cannot replace a newer save. */
function enqueueWrite(write: () => Promise<void>): Promise<void> {
  const pending = writes.then(write);
  // Keep the queue usable after failure; the caller still receives rejection.
  writes = pending.catch(() => undefined);
  return pending;
}

export function saveSave(data: SaveCurrent): Promise<void> {
  const snapshot = structuredClone(data);
  return enqueueWrite(async () => {
    await db.saves.put({
      id: 'current',
      version: snapshot.version,
      data: snapshot,
      timestamp: Date.now()
    });
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
  await saveSave(decodeSave(JSON.parse(json) as unknown));
}

/**
 * Delete the current save
 */
export async function deleteSave(): Promise<void> {
  await enqueueWrite(async () => {
    await db.saves.delete('current');
  });
}

/**
 * Check if a save exists
 */
export async function hasSave(): Promise<boolean> {
  const record = await db.saves.get('current');
  return !!record;
}
