/**
 * Save adapter using Dexie (IndexedDB)
 * Handles persistence for all stores
 */

import Dexie, { type Table } from 'dexie';
import { type SaveCurrent } from '@/engine/types/save';
import { type VersionedSave } from '@/engine/save';
import { decodeSave, decodeSaveJson } from '@/engine/save/validate';
import { stringifySave } from '@/engine/save/serialize';

interface SaveRecordMetadata {
  id: string; // Always "current" for single-player
  version: number;
  timestamp: number;
}

/** Physical storage encoding is independent of the logical save version. */
export type SaveRecord = SaveRecordMetadata & (
  | { encoding?: never; data: SaveCurrent | VersionedSave }
  | { encoding: 'json-v1'; data: string }
);

/** Read either physical envelope; logical validation and migration follow separately. */
function readPayload(record: SaveRecord): unknown {
  if (!Object.hasOwn(record, 'encoding')) return record.data;
  return JSON.parse(readJsonPayload(record)) as unknown;
}

function readJsonPayload(record: SaveRecord): string {
  if (record.encoding !== 'json-v1' || typeof record.data !== 'string') {
    throw new Error('Unsupported or invalid save storage encoding');
  }
  return record.data;
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
  return Object.hasOwn(record, 'encoding')
    ? decodeSaveJson(readJsonPayload(record)) : decodeSave(record.data);
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

/** Capture immutable JSON immediately, before any asynchronous queued write. */
export function saveSave(data: SaveCurrent): Promise<void> {
  const version = data.version;
  const snapshot = stringifySave(data);
  return enqueueWrite(async () => {
    await db.saves.put({
      id: 'current',
      version,
      encoding: 'json-v1',
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
  return stringifySave(readPayload(record), 2);
}

/**
 * Import save from JSON string. Runs migrations to current version.
 */
export async function importSave(json: string): Promise<void> {
  await saveSave(decodeSaveJson(json));
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
 * Check the current key without deserializing the save payload.
 */
export async function hasSave(): Promise<boolean> {
  return (await db.saves.where('id').equals('current').count()) > 0;
}
