import { ACT5_ENCOUNTERS } from '@/engine/map/act5-admission';
import { hasLarzukPresentation, LARZUK } from '@/engine/map/larzuk-quest';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { QuestServiceEntry } from '@/engine/services/quest-services';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';
import { pick, replace, sameCainData as sameData } from './cainPublication';
import { captureFiniteSideWishParticipant, type FiniteSideWishParticipant } from './finiteSideWishParticipant';

const QUESTS = [LARZUK.prerequisite, LARZUK.quest];
const SERVICES = QUESTS.map(id => `${id}#reward:service`);
const PROOFS = [LARZUK.proof, ...ACT5_ENCOUNTERS.filter(row => row.questId === LARZUK.prerequisite).map(row => row.proof)];
const SOURCE = `${LARZUK.quest}#reward:service`;
/** New issuance requires actual Present; legacy charge possession keeps its independent validation. */
export function hasLarzukClaimCompletion(questId: string): boolean {
  if (questId !== LARZUK.quest) return true;
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  if (map.selectedDifficulty !== 'normal' || hasActiveSubAreaRun() || useCombatStore.getState().inCombat) return false;
  try {
    validateQuestItemLedger(inv.questItems, map.questProgress, map.questReceipts);
    validateNative24CurrentCampaignRewards(map, inv.questItems, inv.questServices, map.endgame);
    return hasLarzukPresentation(map.questProgress, map.questReceipts, inv.questItems);
  } catch { return false; }
}
/**
 * Publish exactly one side socket charge under Claim's already-held quest lease.
 * Check after each write, claim last and restore deep source data on any failure.
 * No XP, RNG, item allocation, automatic restoration or browser-crash atomicity.
 */
export function publishLarzukClaim(): 'ok' | 'unsupported-rewards' | 'grant-failed' {
  const map = useMapStore.getState(), inv = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
  if (!hero || !hasLarzukClaimCompletion(LARZUK.quest) || map.questProgress[LARZUK.quest]?.rewardClaimed === true
    || Object.hasOwn(inv.questServices, SOURCE)) return 'unsupported-rewards';
  const before = structuredClone({ hero, equipped: inv.equipped, rows: pick(map.questProgress, QUESTS),
    proofs: pick(map.questReceipts, PROOFS), services: pick(inv.questServices, SERVICES),
    location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
  const row = before.rows[LARZUK.quest]; if (!row) return 'unsupported-rewards';
  const claimedRows: typeof before.rows = { ...before.rows, [LARZUK.quest]: { ...row, rewardClaimed: true } };
  const entry: QuestServiceEntry = { serviceId: 'socket_item', state: 'available' };
  const expectedServices: typeof before.services = { ...before.services, [SOURCE]: entry };
  let restoredHero = before.hero;
  const restorationHero = () => {
    const live = useMapStore.getState(), current = useInventoryStore.getState();
    return sameData(current.equipped, before.equipped) ? structuredClone(before.hero) : { ...structuredClone(before.hero),
      derivedStats: deriveEquippedPlayerStats(before.hero, before.hero.level, current.equipped,
        live.questProgress, current.questItems, live.questReceipts) };
  };
  let wishes: FiniteSideWishParticipant;
  try { wishes = captureFiniteSideWishParticipant(LARZUK.quest); } catch { return 'unsupported-rewards'; }
  const check = (claimed: boolean, granted: boolean, restoring = false): void => {
    const live = useMapStore.getState(), current = useInventoryStore.getState();
    if ((!restoring && (useHydrationStore.getState().status !== 'ready' || isReplacingSave() || hasActiveSubAreaRun()
      || useCombatStore.getState().inCombat || live.selectedDifficulty !== 'normal' || usePlayerStore.getState().player !== hero))
      || !sameData(usePlayerStore.getState().player, restoring ? restoredHero : before.hero)
      || restoring && !sameData(restoredHero, restorationHero())
      || !sameData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location)
      || !sameData(pick(live.questProgress, QUESTS), claimed ? claimedRows : before.rows)
      || !sameData(pick(live.questReceipts, PROOFS), before.proofs)
      || !sameData(pick(current.questServices, SERVICES), granted ? expectedServices : before.services)) throw new Error('Larzuk Claim publication postcondition failed');
    validateQuestItemLedger(current.questItems, live.questProgress, live.questReceipts);
    if (!hasLarzukPresentation(live.questProgress, live.questReceipts, current.questItems)) throw new Error('Larzuk Claim source changed');
    if (!restoring) wishes.check();
  };
  try {
    check(false, false);
    useInventoryStore.setState(state => ({ questServices: { ...state.questServices, [SOURCE]: structuredClone(entry) } }));
    check(false, true);
    wishes.publish(); check(false, true);
    useMapStore.getState().markQuestRewardClaimed(LARZUK.quest);
    check(true, true);
    const live = useMapStore.getState(), current = useInventoryStore.getState();
    validateNative24CurrentCampaignRewards(live, current.questItems, current.questServices, live.endgame);
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
    attempt(() => { wishes.restore(); });
    attempt(() => { useInventoryStore.setState(state => ({ questServices: replace(state.questServices, structuredClone(before.services), SERVICES) })); });
    attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), QUESTS),
      questReceipts: replace(state.questReceipts, structuredClone(before.proofs), PROOFS), ...before.location })); });
    attempt(() => { restoredHero = restorationHero(); usePlayerStore.setState({ player: structuredClone(restoredHero) }); });
    attempt(() => {
      check(false, false, true);
      const live = useMapStore.getState(), current = useInventoryStore.getState();
      validateNative24CurrentCampaignRewards(live, current.questItems, current.questServices, live.endgame);
    });
    attempt(() => { wishes.verifyRestored(); });
    if (errors.length > 0) throw new AggregateError(errors, 'Larzuk Claim restoration failed', { cause });
    return 'grant-failed';
  } finally { wishes.dispose(); }
}
