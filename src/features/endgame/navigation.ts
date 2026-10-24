import { endgameDefinition } from '@/data/loaders/endgame';
import type { EndgameModifierId } from '@/engine/endgame/types';

/** An explicit but invalid dungeon request must never fall through to campaign admission. */
export function readEndgameRequest(search: string): { readonly kind: 'none' | 'invalid' }
  | { readonly kind: 'endgame'; readonly modifierId: EndgameModifierId } {
  const values = new URLSearchParams(search).getAll('endgame');
  if (values.length === 0) return { kind: 'none' };
  const modifier = values.length === 1 ? endgameDefinition.modifiers.find(row => row.id === values[0]) : undefined;
  return modifier ? { kind: 'endgame', modifierId: modifier.id } : { kind: 'invalid' };
}
