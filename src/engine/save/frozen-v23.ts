import snapshot from './frozen-v23-quests.json';
import type { FrozenV23Domain } from './quest-domain';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Literal23 identities captured at 423d16e9, before Hell changes any live domain. */
export const FROZEN_V23: FrozenV23Domain = deepFreeze(snapshot as unknown as FrozenV23Domain);

/** Inspect inherited descriptors too, without executing untrusted getters. */
function dataField(value: object, key: string): unknown {
  let owner: object | null = value;
  while (owner !== null) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);
    if (descriptor) {
      if (!Object.hasOwn(descriptor, 'value')) throw new Error('Invalid save: replay field accessor');
      return descriptor.value;
    }
    owner = Object.getPrototypeOf(owner) as object | null;
  }
  return undefined;
}

/** Narrow future namespace reservation, before any predecessor can strip it. */
export function rejectPreV24ReplayState(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  const version: unknown = Object.getOwnPropertyDescriptor(value, 'version')?.value;
  if (typeof version !== 'number' || version > 23) return;
  const map = dataField(value, version === 1 ? 'mapProgress' : 'map');
  if (map === null || typeof map !== 'object') return;
  if ('hellClearedSubAreas' in map || dataField(map, 'selectedDifficulty') === 'hell') {
    throw new Error('Invalid save: reserved Hell replay state');
  }
  const ordinals = dataField(map, 'challengeOrdinals');
  if (ordinals !== null && typeof ordinals === 'object' &&
    ('hell' in ordinals || (ordinals instanceof Map && Map.prototype.has.call(ordinals, 'hell')))) {
    throw new Error('Invalid save: reserved Hell challenge ordinal');
  }
}
