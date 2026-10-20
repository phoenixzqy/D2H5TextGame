import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { decodeObservation, encodeObservation, hashObservation, observationJson } from './earned-report';

describe('v2 lossless observation values — synthetic codec contracts, no gameplay', () => {
  it('retains nested Maps, entry order and explicit undefined through JSON and decoding', () => {
    const input = { inventory: new Map<string, unknown>([['weapon', { id: 'original', option: undefined }],
      ['offhand', null]]), absentValue: undefined, nested: [undefined, { z: 1, a: 2 }] };
    const json = JSON.stringify(encodeObservation(input));
    const decoded = decodeObservation(JSON.parse(json));
    expect(decoded).toEqual(input);
    expect(Object.hasOwn(decoded as object, 'absentValue')).toBe(true);
    expect(json).toContain('original');
    expect(json).toContain('map');
    expect(observationJson(input)).not.toBe(observationJson({ ...input, absentValue: null }));
    const { absentValue: _omitted, ...absent } = input;
    expect(observationJson(input)).not.toBe(observationJson(absent));
  });
  it('canonicalizes record key order while preserving array and Map order', () => {
    expect(observationJson({ z: 1, a: { d: 4, b: 2 } }))
      .toBe(observationJson({ a: { b: 2, d: 4 }, z: 1 }));
    expect(observationJson([1, 2])).not.toBe(observationJson([2, 1]));
    expect(observationJson(new Map([['a', 1], ['b', 2]])))
      .not.toBe(observationJson(new Map([['b', 2], ['a', 1]])));
    expect(observationJson(new Map([['a', 1]]))).not.toBe(observationJson({ a: 1 }));
  });
  it('preserves special numbers without converting them to null or zero', () => {
    for (const value of [NaN, Infinity, -Infinity, -0, 0, 1.25]) {
      expect(Object.is(decodeObservation(JSON.parse(JSON.stringify(encodeObservation(value)))), value)).toBe(true);
    }
    expect(observationJson(-0)).not.toBe(observationJson(0));
    expect(observationJson(NaN)).not.toBe(observationJson(null));
  });
  it('hashes the complete canonical lossless bytes with SHA256', () => {
    const input = { b: undefined, a: new Map([['x', 3]]) };
    expect(hashObservation(input)).toBe(createHash('sha256').update(observationJson(input)).digest('hex'));
    expect(hashObservation(input)).not.toBe(hashObservation({ a: new Map([['x', 4]]), b: undefined }));
    expect(hashObservation(input)).not.toBe(hashObservation({ a: new Map([['x', 3]]) }));
  });
  it('encodes repeated independent references as values, without a graph identity claim', () => {
    const shared = { x: 1 };
    expect(decodeObservation(encodeObservation([shared, shared]))).toEqual([{ x: 1 }, { x: 1 }]);
  });
  it('preserves own prototype-named data without invoking prototype setters', () => {
    const input = JSON.parse('{"__proto__":{"polluted":true},"constructor":"data"}') as unknown;
    const output = decodeObservation(encodeObservation(input));
    expect(Object.hasOwn(output as object, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(output)).toBe(Object.prototype);
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
    expect(output).toEqual(input);
  });
  it.each([
    ['function', () => 1], ['symbol', Symbol('x')], ['bigint', 1n], ['Date', new Date(0)],
    ['Set', new Set([1])], ['reserved-tag record', { $d2h5: 'undefined' }],
    ['symbol-key record', { [Symbol('secret')]: 1 }],
    ['accessor', Object.defineProperty({}, 'x', { enumerable: true, get() { throw new Error('must not read getter'); } })],
    ['nonenumerable', Object.defineProperty({}, 'x', { value: 1 })],
    ['sparse array', new Array(2)]
  ])('rejects unsupported %s rather than silently losing it', (_name, value) => {
    expect(() => encodeObservation(value)).toThrow();
  });
  it('rejects actual cycles in records and Maps', () => {
    const record: { self?: unknown } = {}; record.self = record;
    const map = new Map<string, unknown>(); map.set('self', map);
    expect(() => encodeObservation(record)).toThrow();
    expect(() => encodeObservation(map)).toThrow();
  });
  it.each([
    { $d2h5: 'unknown' }, { $d2h5: 'undefined', extra: 1 },
    { $d2h5: 'map' }, { $d2h5: 'map', entries: [[1]] },
    { $d2h5: 'number', value: '100' }, { $d2h5: 'number', value: 'NaN', extra: 1 },
    { $d2h5: 'map', entries: [['a', 1], ['a', 2]] }
  ])('rejects malformed or ambiguous tagged input %#', value => {
    expect(() => decodeObservation(value)).toThrow();
  });
});


it('rejects an accessor before reading it, rather than failing from the getter itself', () => {
  let calls = 0;
  const input = Object.defineProperty({}, 'value', { enumerable: true,
    get() { calls++; return 1; } });
  expect(() => encodeObservation(input)).toThrow();
  expect(calls).toBe(0);
});
it('preserves decoded Map insertion order and the nested own undefined property', () => {
  const input = new Map<string, unknown>([['weapon', { option: undefined }], ['offhand', null]]);
  const decoded = decodeObservation(JSON.parse(JSON.stringify(encodeObservation(input))));
  expect(decoded).toBeInstanceOf(Map);
  if (!(decoded instanceof Map)) throw new Error('Missing decoded Map');
  expect([...decoded.keys()]).toEqual(['weapon', 'offhand']);
  const weapon: unknown = decoded.get('weapon');
  expect(typeof weapon).toBe('object');
  if (typeof weapon !== 'object' || weapon === null) throw new Error('Missing decoded weapon');
  expect(Object.hasOwn(weapon, 'option')).toBe(true);
  expect(weapon).toStrictEqual({ option: undefined });
});
it.each([
  [Object.assign([1], { extra: 2 })],
  [Object.assign([1], { [Symbol('array-field')]: 2 })]
])('rejects extra array properties instead of silently dropping data %#', input => {
  expect(() => encodeObservation(input)).toThrow();
});


class DenseArray extends Array<number> {}
for (const [mode, codec] of [['encoder', encodeObservation], ['decoder', decodeObservation]] as const) {
  it.each([
    { name: 'array subclass', input: DenseArray.of(1) },
    { name: 'custom array prototype', input: Object.setPrototypeOf([1], Object.create(Array.prototype)) as unknown }
  ])(`${mode} rejects arbitrary $name`, ({ input }) => {
    expect(() => codec(input)).toThrow();
  });
}
