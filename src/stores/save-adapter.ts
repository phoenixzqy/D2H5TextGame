/**
 * Save adapter using Dexie (IndexedDB)
 * Handles persistence for all stores
 */

import Dexie, { type Table } from 'dexie';
import type { SaveV1 } from '@/engine/types/save';

export interface SaveRecord {
  id: string; // Always "current" for single-player
  version: number;
  data: SaveV1;
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
 * Load the current save
 */
export async function loadSave(): Promise<SaveV1 | null> {
  try {
    const record = await db.saves.get('current');
    return record?.data ?? null;
  } catch (error) {
    console.error('Failed to load save:', error);
    return null;
  }
}

/**
 * Save the current state
 */
export async function saveSave(data: SaveV1): Promise<void> {
  try {
    await db.saves.put({
      id: 'current',
      version: data.version,
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to save:', error);
    throw error;
  }
}

/**
 * Export save as JSON string
 */
export async function exportSave(): Promise<string | null> {
  const record = await db.saves.get('current');
  if (!record) return null;
  return JSON.stringify(record.data, null, 2);
}

/**
 * Import save from JSON string
 */
export async function importSave(json: string): Promise<void> {
  try {
    const data = JSON.parse(json) as SaveV1;
    await saveSave(data);
  } catch (error) {
    console.error('Failed to import save:', error);
    throw error;
  }
}

/**
 * Delete the current save
 */
export async function deleteSave(): Promise<void> {
  try {
    await db.saves.delete('current');
  } catch (error) {
    console.error('Failed to delete save:', error);
    throw error;
  }
}

/**
 * Check if a save exists
 */
export async function hasSave(): Promise<boolean> {
  try {
    const record = await db.saves.get('current');
    return !!record;
  } catch (error) {
    console.error('Failed to check save:', error);
    return false;
  }
}
