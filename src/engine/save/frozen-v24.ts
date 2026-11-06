import snapshot from './frozen-v24-quests.json';
import type { FrozenNativeQuestDomain } from './quest-domain';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Literal24 authority captured before the first charm changes live quest ownership. */
export const FROZEN_V24: FrozenNativeQuestDomain = deepFreeze(snapshot as unknown as FrozenNativeQuestDomain);
