import snapshot from './frozen-v22-quests.json';
import type { NativeQuestDomain } from './quest-domain';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Literal22 authority, captured at f3b66255 before extending Act I sources. */
export const FROZEN_V22: NativeQuestDomain = deepFreeze(snapshot as unknown as NativeQuestDomain);
