import { COUNTESS } from '@/engine/map/countess-admission';
import { COW } from '@/engine/map/cow-quest';
import { readEndgameRequest } from '@/features/endgame/navigation';
import type { EndgameModifierId } from '@/engine/endgame/types';

/** Explicit quest/dungeon requests never fall through to ordinary combat. */
export function readCombatRequest(search: string): { readonly kind: 'none' }
  | { readonly kind: 'invalid'; readonly target: 'questEncounter' | 'endgame' }
  | { readonly kind: 'countess' }
  | { readonly kind: 'cow' }
  | { readonly kind: 'endgame'; readonly modifierId: EndgameModifierId } {
  const params = new URLSearchParams(search), encounters = params.getAll('questEncounter');
  if (encounters.length > 0) {
    if (encounters.length !== 1 || params.has('endgame')) return { kind: 'invalid', target: 'questEncounter' };
    if (encounters[0] === COUNTESS.encounter) return { kind: 'countess' };
    if (encounters[0] === COW.encounter) return { kind: 'cow' };
    return { kind: 'invalid', target: 'questEncounter' };
  }
  const endgame = readEndgameRequest(search);
  if (endgame.kind === 'endgame') return endgame;
  return endgame.kind === 'invalid' ? { kind: 'invalid', target: 'endgame' } : { kind: 'none' };
}
