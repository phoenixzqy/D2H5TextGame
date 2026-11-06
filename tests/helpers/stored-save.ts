import type { SaveRecord } from '../../src/stores/save-adapter';

/** Observe raw logical JSON without running migrations, validation or cache repair. */
export function readStoredSaveJson(record: SaveRecord | undefined): unknown {
  if (!record) throw new Error('Missing stored save');
  if (Object.hasOwn(record, 'encoding')) {
    if (record.encoding !== 'json-v1' || typeof record.data !== 'string') {
      throw new Error('Unexpected storage encoding');
    }
    return JSON.parse(record.data) as unknown;
  }
  return JSON.parse(JSON.stringify(record.data, (_key, value: unknown): unknown => {
    if (value instanceof Map) return [...value.entries()];
    if (value instanceof Set) return [...value.values()];
    return value;
  })) as unknown;
}
