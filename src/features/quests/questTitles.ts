import { BAAL_TITLE, validateAct5CampaignRewards } from '@/engine/save/act5-campaign';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { questActionPreflight, withQuestTransaction } from './questTransaction';
export type QuestTitleResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' | 'grant-failed';
/** Select or clear one actually owned title, with the same graph and transaction boundary as Claim. */
export function selectQuestTitle(title: string | null): QuestTitleResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<QuestTitleResult>(() => {
    const map = useMapStore.getState(), inventory = useInventoryStore.getState();
    if (title !== null && title !== BAAL_TITLE) return 'not-eligible';
    try { validateAct5CampaignRewards({ ...map, selectedTitle: title }, inventory.questItems, inventory.questServices); }
    catch { return 'not-eligible'; }
    try { useMapStore.setState({ selectedTitle: title }); return 'ok'; }
    catch (cause) {
      try { useMapStore.setState({ selectedTitle: map.selectedTitle }); }
      catch (error) { throw new AggregateError([error], 'Title selection restoration failed', { cause }); }
      return 'grant-failed';
    }
  });
}
