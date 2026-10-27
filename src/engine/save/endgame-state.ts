import { emptyEndgameState, readEndgameState, type EndgameCampaignEvidence } from '../endgame/state';
import type { EndgameState } from '../endgame/types';
import type { Act5QuestDomain } from './quest-domain';

function object(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

/** Read a container descriptor without evaluating own or inherited getters. */
function container(value: object, key: string): unknown {
  let current: object | null = value;
  while (current !== null) {
    const field = Object.getOwnPropertyDescriptor(current, key);
    if (field) {
      if (!Object.hasOwn(field, 'value')) throw new Error('Invalid save: endgame container accessor');
      return field.value;
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  return undefined;
}

/** Canonical endgame state is root-only; refuse raw shadow namespaces before normalization. */
export function rejectEndgameShadows(value: unknown): void {
  if (!object(value)) return;
  for (const key of ['map', 'inventory']) {
    const nested = container(value, key);
    if (object(nested) && 'endgame' in nested) throw new Error('Invalid save: reserved endgame shadow');
  }
}

/** Predecessors never owned endgame; even undefined/hidden/inherited fields are reserved. */
export function rejectPreV20State(value: unknown): void {
  if (object(value) && 'endgame' in value) throw new Error('Invalid save: reserved pre20 endgame');
  rejectEndgameShadows(value);
}

/** Strict raw enclosing descriptor, plus campaign-authorized private state copy. */
export function readEndgameSaveField(value: object, campaign: EndgameCampaignEvidence,
  allowMissing = false, domain?: Act5QuestDomain): EndgameState {
  rejectEndgameShadows(value);
  const field = Object.getOwnPropertyDescriptor(value, 'endgame');
  if (!field && !('endgame' in value) && allowMissing) return emptyEndgameState();
  if (!field || field.enumerable !== true || !Object.hasOwn(field, 'value')) {
    throw new Error('Invalid save: endgame must be an own enumerable data field');
  }
  return readEndgameState(field.value, campaign, domain);
}
