import { loadMercPool } from '@/data/loaders/mercs';
import { loadQuests } from '@/data/loaders/quests';
import { hasWarbandEnlistment, WARBAND } from '@/engine/map/warband-quest';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { sameCainData as sameData } from './cainPublication';
import { beginQuestCurrencyPublication, endQuestCurrencyPublication } from '@/stores/questCurrencyJournal';
import { hasCanonicalWarbandDefinition, publishWarbandChange, validWarbandSource } from './warbandPublication';

function ordinaryContext(): boolean {
  return useHydrationStore.getState().status === 'ready' && !isReplacingSave()
    && !!usePlayerStore.getState().player && !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat
    && useMapStore.getState().selectedDifficulty === 'normal';
}
function source() { return loadQuests().find(row => row.id === WARBAND.quest); }
function definition() { return loadMercPool().pool.find(row => row.id === WARBAND.mercId); }
/** Only this exact authored ensure-owned reward can use Warband's historical proof. */
export function hasWarbandClaimCompletion(questId: string): boolean {
  if (questId !== WARBAND.quest) return true;
  const map = useMapStore.getState(), mercs = useMercStore.getState(), quest = source();
  if (!ordinaryContext() || !validWarbandSource() || !hasCanonicalWarbandDefinition() || !definition() || !quest?.rewards
    || Object.keys(quest.rewards).length !== 2 || quest.rewards.mercenaryUnlock !== WARBAND.mercId || quest.rewards.wishstones !== 10
    || new Set(mercs.ownedMercs.map(merc => merc.id)).size !== mercs.ownedMercs.length
    || mercs.fieldedMercId !== null && !mercs.ownedMercs.some(merc => merc.id === mercs.fieldedMercId)) return false;
  const owned = mercs.ownedMercs.some(merc => merc.id.split('#')[0] === WARBAND.mercId);
  if (!owned && (Object.hasOwn(mercs.mercEquipment, WARBAND.mercId) || Object.hasOwn(mercs.mercProgress, WARBAND.mercId))) return false;
  return hasWarbandEnlistment(map.questProgress, map.questReceipts, useInventoryStore.getState().questItems);
}
/** Under Claim's held lease, ensure ownership once and preserve prior fielding; mark claimed last. */
export function publishWarbandClaim(): 'ok' | 'unsupported-rewards' | 'grant-failed' {
  const map = useMapStore.getState(), mercs = useMercStore.getState(), def = definition(), quest = source();
  if (!def || !quest || !hasWarbandClaimCompletion(WARBAND.quest) || map.questProgress[WARBAND.quest]?.rewardClaimed === true) return 'unsupported-rewards';
  const before = structuredClone({ def, quest });
  const recruit = mercs.ownedMercs.some(merc => merc.id.split('#')[0] === WARBAND.mercId) ? null : createMercFromDef(def);
  const wishes = quest.rewards?.wishstones; if (typeof wishes !== 'number') return 'unsupported-rewards';
  let currencyOwner;
  try { currencyOwner = beginQuestCurrencyPublication(WARBAND.quest, 'wishstone', wishes, useInventoryStore.getState().currencies); }
  catch { return 'unsupported-rewards'; }
  try {
    return publishWarbandChange({ kind: 'claim', currencyOwner, recruit, fieldedId: mercs.fieldedMercId,
      context: () => ordinaryContext() && hasCanonicalWarbandDefinition() && sameData(definition(), before.def) && sameData(source(), before.quest) });
  } finally { endQuestCurrencyPublication(currencyOwner); }
}
