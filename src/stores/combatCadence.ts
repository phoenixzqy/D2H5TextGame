/** Read-only timing presentation from consumed scheduler observations. */
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import { inferKind, type CombatUnit } from '@/engine/combat/types';

type CadenceEvent = Extract<RecordedBattleEvent, { kind: 'cadence-state' }>;
/** One observation's position in the original recording; never persisted. */
export interface HeroCadenceObservation {
  readonly eventIndex: number;
  readonly event: CadenceEvent;
}

/** Index once per recording/hero; no future observation is selected here. */
export function indexHeroCadence(
  events: readonly RecordedBattleEvent[], heroId: string | undefined
): readonly HeroCadenceObservation[] {
  if (heroId === undefined) return [];
  return events.flatMap((event, eventIndex) => event.kind === 'cadence-state' && event.target === heroId
    ? [{ eventIndex, event }] : []);
}

/** Return the latest strictly consumed observation for the living original hero. */
export function readHeroCadence(
  observations: readonly HeroCadenceObservation[], eventCursor: number, hero: CombatUnit | undefined
): CadenceEvent | null {
  if (!hero || hero.side !== 'player' || inferKind(hero) !== 'hero' || !(hero.life > 0)) return null;
  for (let index = observations.length - 1; index >= 0; index--) {
    const observation = observations[index];
    if (observation && observation.eventIndex < eventCursor && observation.event.target === hero.id) {
      return observation.event;
    }
  }
  return null;
}
