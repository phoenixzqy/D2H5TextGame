import { createHash } from 'node:crypto';

/** Inert JSON values for versioned observations; reserved tags preserve native values. */
export type ObservationJson = null | boolean | number | string | ObservationJson[] |
  { [key: string]: ObservationJson };

function dataEntries(value: object, array: boolean): [string, unknown][] {
  if (array && Object.getPrototypeOf(value) !== Array.prototype)
    throw new Error('Only native observation arrays are supported');
  const entries: [string, unknown][] = [];
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string') throw new Error('Observation symbol keys are unsupported');
    if (array && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || !descriptor.enumerable)
      throw new Error('Observation accessors and nonenumerable fields are unsupported');
    if (array && (!/^(0|[1-9]\d*)$/u.test(key) || Number(key) >= (value as unknown[]).length))
      throw new Error('Observation arrays cannot have extra fields');
    const field: unknown = descriptor.value;
    entries.push([key, field]);
  }
  if (array && entries.length !== (value as unknown[]).length)
    throw new Error('Sparse observation arrays are unsupported');
  return entries;
}

function plain(value: object): boolean {
  return Object.getPrototypeOf(value) === Object.prototype;
}

/** Preserve Maps, own undefined fields and special numbers; reject lossy/executable inputs. */
export function encodeObservation(input: unknown): ObservationJson {
  const active = new Set<object>();
  function encode(value: unknown): ObservationJson {
    if (value === undefined) return { $d2h5: 'undefined' };
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (Object.is(value, -0)) return { $d2h5: 'number', value: '-0' };
      return Number.isFinite(value) ? value : { $d2h5: 'number', value: String(value) };
    }
    if (typeof value !== 'object') throw new Error('Unsupported observation value');
    if (active.has(value)) throw new Error('Cyclic observation values are unsupported');
    active.add(value);
    try {
      if (value instanceof Map && Object.getPrototypeOf(value) === Map.prototype) {
        if (Reflect.ownKeys(value).length) throw new Error('Observation Maps cannot have extra fields');
        return { $d2h5: 'map', entries: [...(value as Map<unknown, unknown>)].map(([key, item]) =>
          [encode(key), encode(item)]) };
      }
      if (Array.isArray(value)) return dataEntries(value, true).map(([, item]) => encode(item));
      if (!plain(value)) throw new Error('Only plain observation records are supported');
      const entries = dataEntries(value, false);
      if (entries.some(([key]) => key === '$d2h5')) throw new Error('Reserved observation tag collision');
      entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
      return Object.fromEntries(entries.map(([key, item]) => [key, encode(item)]));
    } finally { active.delete(value); }
  }
  return encode(input);
}

/** Decode inert v1 observation tags, refusing malformed or ambiguous encoded values. */
export function decodeObservation(input: unknown): unknown {
  const active = new Set<object>();
  function decode(value: unknown): unknown {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0)) return value;
    if (typeof value !== 'object' || value === null) throw new Error('Invalid encoded observation');
    if (active.has(value)) throw new Error('Cyclic encoded observation');
    active.add(value);
    try {
      if (Array.isArray(value)) return dataEntries(value, true).map(([, item]) => decode(item));
      if (!plain(value)) throw new Error('Invalid encoded observation record');
      const entries = dataEntries(value, false);
      const fields = Object.fromEntries(entries) as Record<string, unknown>;
      if (Object.hasOwn(fields, '$d2h5')) {
        const keys = entries.map(([key]) => key).sort().join(',');
        if (fields.$d2h5 === 'undefined' && keys === '$d2h5') return undefined;
        if (fields.$d2h5 === 'number' && keys === '$d2h5,value') {
          switch (fields.value) {
            case '-0': return -0;
            case 'NaN': return NaN;
            case 'Infinity': return Infinity;
            case '-Infinity': return -Infinity;
          }
        }
        if (fields.$d2h5 === 'map' && keys === '$d2h5,entries' && Array.isArray(fields.entries)) {
          const result = new Map<unknown, unknown>();
          for (const [, pair] of dataEntries(fields.entries, true)) {
            if (!Array.isArray(pair) || pair.length !== 2 || dataEntries(pair, true).length !== 2)
              throw new Error('Invalid observation Map entry');
            const key = decode(pair[0]);
            if (result.has(key)) throw new Error('Duplicate decoded Map key');
            result.set(key, decode(pair[1]));
          }
          return result;
        }
        throw new Error('Invalid observation tag');
      }
      return Object.fromEntries(entries.map(([key, item]) => [key, decode(item)]));
    } finally { active.delete(value); }
  }
  return decode(input);
}

/** Canonical value JSON: record keys sort; array and Map entry order remain significant. */
export function observationJson(value: unknown): string {
  return JSON.stringify(encodeObservation(value));
}

/** SHA-256 of UTF-8 lossless observation JSON, including identities and simulation timestamps. */
export function hashObservation(value: unknown): string {
  return createHash('sha256').update(observationJson(value)).digest('hex');
}
