import { afterEach, describe, expect, it, vi } from 'vitest';
import { rejectSocketSaveAccessors } from './native-socket-state';

afterEach(() => { vi.restoreAllMocks(); });

describe('native save descriptor inspection', () => {
  it('avoids materializing a bulk descriptor map for every saved object', () => {
    const save = { inventory: { backpack: Array.from({ length: 100 }, (_, id) => ({ id, affixes: [{ value: id }] })) } };
    const materializations = vi.spyOn(Object, 'getOwnPropertyDescriptors');
    rejectSocketSaveAccessors(save);
    const allocatedMaps = materializations.mock.calls.length;
    materializations.mockRestore();
    expect(allocatedMaps).toBe(0);
  });

  it('accepts shared data, own hidden/symbol fields and Map/Set contents without mutating them', () => {
    const shared = { amount: 3 }, symbol = Symbol('hidden');
    const node = { first: shared, second: shared, map: new Map([[shared, { value: shared }]]), set: new Set([shared]) };
    Object.defineProperty(node, 'hidden', { value: shared });
    Object.defineProperty(node, symbol, { value: shared });
    const descriptors = Object.getOwnPropertyDescriptors(node);
    expect(() => { rejectSocketSaveAccessors(node); }).not.toThrow();
    expect(Object.getOwnPropertyDescriptors(node)).toEqual(descriptors);
    expect(node.map.get(shared)?.value).toBe(shared);
    expect(node.set.has(shared)).toBe(true);
  });

  it.each(['own', 'hidden', 'symbol', 'prototype', 'map-key', 'map-value', 'set-value'] as const)('rejects a %s getter without executing it', location => {
    let reads = 0;
    const hostile = {};
    Object.defineProperty(hostile, location === 'symbol' ? Symbol('field') : 'field', {
      enumerable: location !== 'hidden', get: () => { reads++; return 1; } });
    const value = location === 'prototype' ? Object.create(hostile) as object
      : location === 'map-key' ? new Map([[hostile, 1]])
      : location === 'map-value' ? new Map([['key', hostile]])
      : location === 'set-value' ? new Set([hostile]) : { nested: [hostile] };
    expect(() => { rejectSocketSaveAccessors(value); }).toThrow('accessor');
    expect(reads).toBe(0);
  });

  it('rejects setter-only descriptors before a write can occur', () => {
    let writes = 0;
    const value = Object.defineProperty({}, 'field', { set: () => { writes++; } });
    expect(() => { rejectSocketSaveAccessors(value); }).toThrow('accessor');
    expect(writes).toBe(0);
  });

  it.each(['object', 'map', 'set'] as const)('rejects a %s cycle while allowing repeated aliases', kind => {
    const object: { next?: unknown } = {};
    const map = new Map<unknown, unknown>(), set = new Set<unknown>();
    if (kind === 'object') object.next = object;
    if (kind === 'map') map.set(map, map);
    if (kind === 'set') set.add(set);
    expect(() => { rejectSocketSaveAccessors(kind === 'object' ? object : kind === 'map' ? map : set); }).toThrow('cyclic');
  });

  it('matches descriptor enumeration when an observable key disappears before descriptor lookup', () => {
    const node = new Proxy({}, { ownKeys: () => ['vanished'], getOwnPropertyDescriptor: () => undefined });
    expect(Object.getOwnPropertyDescriptors(node)).toEqual({});
    expect(() => { rejectSocketSaveAccessors(node); }).not.toThrow();
  });
});
