import type { QuestItemLedger, SaveCurrent } from '../types/save';
import { validateQuestItemLedger } from '../save/validate';
import { validateNative24CurrentCampaignRewards } from '../save/current-campaign';
import { readEndgameState } from '../endgame/state';

/**
 * Source-backed profile authority shared by advisory controls and live actions.
 * Validate the complete current quest/item graph and both current and requested
 * profile states. Action-specific leases/readiness remain the caller's boundary.
 */
export function hasReplayProfileAuthority(profile: unknown, map: SaveCurrent['map'],
  items: QuestItemLedger, services: unknown, endgame: unknown): boolean {
  if (profile !== 'normal' && profile !== 'nightmare' && profile !== 'hell') return false;
  try {
    validateQuestItemLedger(items, map.questProgress, map.questReceipts);
    readEndgameState(endgame, { questProgress: map.questProgress, questReceipts: map.questReceipts, questItems: items });
    validateNative24CurrentCampaignRewards(map, items, services, endgame);
    validateNative24CurrentCampaignRewards({ ...map, selectedDifficulty: profile }, items, services, endgame);
    return true;
  } catch { return false; }
}
