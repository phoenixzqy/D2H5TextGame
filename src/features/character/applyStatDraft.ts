import type { CoreStats } from '@/engine/types/attributes';
import type { Player } from '@/engine/types/entities';
import { usePlayerStore, type AllocateStatsResult } from '@/stores/playerStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';

export type ApplyStatDraftResult = AllocateStatsResult | 'not-ready';

/** Commit a character draft only after hydration and any save replacement finish. */
export function applyStatDraft(deltas: CoreStats, expectedPlayer: Player): ApplyStatDraftResult {
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  return usePlayerStore.getState().allocateStatPoints(deltas, expectedPlayer);
}
