import { endgameDefinition } from '../../data/loaders/endgame';
import { readEndgameState } from '../endgame/state';
import type { CurrentMapSaveData, QuestItemLedger } from '../types/save';
import { validateAct5CampaignRewards } from './act5-campaign';

export const RIFTWALKER_TITLE = endgameDefinition.achievement.reward.titleId;

/**
 * Current title ownership extends the frozen campaign contract only for the
 * exact claimed achievement title. Historical maps and questTitles stay closed.
 * The projection is validation-only; serialized/live selection is preserved.
 */
export function validateCurrentCampaignRewards(map: CurrentMapSaveData, items: QuestItemLedger,
  services: unknown, endgame: unknown): void {
  const selectedTitle = map.selectedTitle;
  if (selectedTitle === RIFTWALKER_TITLE) {
    const state = readEndgameState(endgame, { questProgress: map.questProgress,
      questReceipts: map.questReceipts, questItems: items });
    if (!state.achievementRewardClaimed) throw new Error('Invalid save: achievement title is not owned');
    validateAct5CampaignRewards({ ...map, selectedTitle: null }, items, services);
  } else {
    validateAct5CampaignRewards({ ...map, selectedTitle }, items, services);
  }
}
