import { beforeEach, describe, expect, it, vi } from 'vitest';

const disk = vi.hoisted(() => ({
  records: new Map<string, unknown>(),
  valueReads: 0,
  failure: null as Error | null
}));
vi.mock('dexie', () => ({
  default: class {
    version() {
      return { stores: () => Object.assign(this, { saves: {
        get: (id: string) => {
          disk.valueReads++;
          return disk.failure ? Promise.reject(disk.failure)
            : Promise.resolve(structuredClone(disk.records.get(id)));
        },
        where: (index: string) => ({ equals: (id: string) => ({ count: () => {
          if (index !== 'id') throw new Error('Unknown save index');
          return disk.failure ? Promise.reject(disk.failure)
            : Promise.resolve(disk.records.has(id) ? 1 : 0);
        } }) })
      } }) };
    }
  }
}));

import { hasSave } from './save-adapter';

beforeEach(() => {
  disk.records.clear();
  disk.valueReads = 0;
  disk.failure = null;
});

describe('current-save existence', () => {
  it('reflects only the current key without caching missing, present or deleted records', async () => {
    expect(await hasSave()).toBe(false);
    disk.records.set('other', { id: 'other' });
    expect(await hasSave()).toBe(false);
    // Existence must not hide a damaged save; the ordinary loader validates it.
    disk.records.set('current', { id: 'current', data: { damaged: true } });
    expect(await hasSave()).toBe(true);
    disk.records.delete('current');
    expect(await hasSave()).toBe(false);
  });

  it('does not materialize a large save payload just to check the current key', async () => {
    disk.records.set('current', { id: 'current', data: { backup: 'x'.repeat(1_000_000) } });
    expect(await hasSave()).toBe(true);
    expect(disk.valueReads).toBe(0);
  });

  it('propagates storage failures so startup can enter its recovery state', async () => {
    disk.failure = new Error('Save storage unavailable');
    await expect(hasSave()).rejects.toBe(disk.failure);
  });
});
