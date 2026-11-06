import { loadMercPool } from '@/data/loaders/mercs';
import { loadQuests } from '@/data/loaders/quests';
import { TOWN_ENLISTMENTS, hasTownEnlistmentProof, type TownEnlistmentKey } from '@/engine/map/town-enlistment-quest';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { sameCainData as sameData } from './cainPublication';
import { beginQuestCurrencyPublication, endQuestCurrencyPublication } from '@/stores/questCurrencyJournal';
import { hasCanonicalTownEnlistment, ordinaryTownEnlistmentContext, publishTownEnlistmentChange, validTownEnlistmentSource } from './townEnlistmentPublication';

/** Lookup is finite quest identity, never an arbitrary mercenaryUnlock reward. */
export function townEnlistmentKeyForQuest(questId: string): TownEnlistmentKey | undefined {
  return (Object.keys(TOWN_ENLISTMENTS) as TownEnlistmentKey[]).find(key => TOWN_ENLISTMENTS[key].quest === questId);
}
/** Historical proof permits ordinary Normal Claim away from its captain and hero gate. */
export function hasTownEnlistmentClaimCompletion(questId: string): boolean {
  const key = townEnlistmentKeyForQuest(questId); if (key === undefined) return true;
  const c = TOWN_ENLISTMENTS[key], map = useMapStore.getState(), mercs = useMercStore.getState();
  if (!ordinaryTownEnlistmentContext() || !hasCanonicalTownEnlistment(key) || !validTownEnlistmentSource()
    || !hasTownEnlistmentProof(map.questProgress, map.questReceipts, c)
    || new Set(mercs.ownedMercs.map(row => row.id)).size !== mercs.ownedMercs.length
    || mercs.fieldedMercId !== null && !mercs.ownedMercs.some(row => row.id === mercs.fieldedMercId)) return false;
  const owned = mercs.ownedMercs.some(row => row.id.split('#')[0] === c.mercId);
  return owned || !Object.hasOwn(mercs.mercEquipment, c.mercId) && !Object.hasOwn(mercs.mercProgress, c.mercId);
}
/** Under Claim's held lease, ensure ownership once without writing existing mercenaries. */
export function publishTownEnlistmentClaim(key: TownEnlistmentKey): 'ok' | 'unsupported-rewards' | 'grant-failed' {
  const c = TOWN_ENLISTMENTS[key], map = useMapStore.getState(), mercs = useMercStore.getState();
  const def = loadMercPool().pool.find(row => row.id === c.mercId), quest = loadQuests().find(row => row.id === c.quest);
  if (!def || !quest || !hasTownEnlistmentClaimCompletion(c.quest) || map.questProgress[c.quest]?.rewardClaimed === true) return 'unsupported-rewards';
  const before = structuredClone({ def, quest });
  const recruit = mercs.ownedMercs.some(row => row.id.split('#')[0] === c.mercId) ? null : createMercFromDef(def);
  const wishes = quest.rewards?.wishstones; if (typeof wishes !== 'number') return 'unsupported-rewards';
  let currencyOwner;
  try { currencyOwner = beginQuestCurrencyPublication(c.quest, 'wishstone', wishes, useInventoryStore.getState().currencies); }
  catch { return 'unsupported-rewards'; }
  try {
    return publishTownEnlistmentChange({ key, kind: 'claim', currencyOwner, recruit, selected: null,
      context: () => ordinaryTownEnlistmentContext() && hasCanonicalTownEnlistment(key)
        && sameData(loadMercPool().pool.find(row => row.id === c.mercId), before.def)
        && sameData(loadQuests().find(row => row.id === c.quest), before.quest) });
  } finally { endQuestCurrencyPublication(currencyOwner); }
}
