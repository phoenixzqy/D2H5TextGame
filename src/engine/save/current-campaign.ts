import { endgameDefinition } from '../../data/loaders/endgame';
import { readEndgameState } from '../endgame/state';
import type { CurrentMapSaveData, Native24MapSaveData, QuestItemLedger } from '../types/save';
import { BAAL_TITLE, validateAct5CampaignRewards, validateNative24CampaignRewards, validateNative24ReplayFields } from './act5-campaign';
import type { CampaignValidationDomain } from './quest-domain';

export const RIFTWALKER_TITLE = endgameDefinition.achievement.reward.titleId;

/**
 * Current title ownership extends the frozen campaign contract only for the
 * exact claimed achievement title. Historical maps and questTitles stay closed.
 * The projection is validation-only; serialized/live selection is preserved.
 */
export function validateCurrentCampaignRewards(map: CurrentMapSaveData, items: QuestItemLedger,
  services: unknown, endgame: unknown, domain?: CampaignValidationDomain): void {
  const selectedTitle = map.selectedTitle;
  if (selectedTitle === (domain?.achievementTitleId ?? RIFTWALKER_TITLE)) {
    const state = readEndgameState(endgame, { questProgress: map.questProgress,
      questReceipts: map.questReceipts, questItems: items }, domain?.act5);
    if (!state.achievementRewardClaimed) throw new Error('Invalid save: achievement title is not owned');
    validateAct5CampaignRewards({ ...map, selectedTitle: null }, items, services, domain);
  } else {
    if (selectedTitle !== null && selectedTitle !== (domain?.campaignTitleId ?? BAAL_TITLE)) throw new Error('Invalid save: selected title is not owned');
    validateAct5CampaignRewards({ ...map, selectedTitle }, items, services, domain);
  }
}

/** Native24 keeps three profile namespaces; explicit domains preserve historical authority. */
export function validateNative24CurrentCampaignRewards(map: Omit<Native24MapSaveData, 'selectedTitle'> & {
  readonly selectedTitle: string | null
}, items: QuestItemLedger,
  services: unknown, endgame: unknown, domain?: CampaignValidationDomain): void {
  validateNative24ReplayFields(map, false, domain);
  const selectedTitle = map.selectedTitle;
  if (selectedTitle === (domain?.achievementTitleId ?? RIFTWALKER_TITLE)) {
    const state = readEndgameState(endgame, { questProgress: map.questProgress,
      questReceipts: map.questReceipts, questItems: items }, domain?.act5);
    if (!state.achievementRewardClaimed) throw new Error('Invalid save: achievement title is not owned');
    validateNative24CampaignRewards({ ...map, selectedTitle: null }, items, services, domain);
  } else {
    if (selectedTitle !== null && selectedTitle !== (domain?.campaignTitleId ?? BAAL_TITLE)) throw new Error('Invalid save: selected title is not owned');
    validateNative24CampaignRewards({ ...map, selectedTitle }, items, services, domain);
  }
}
