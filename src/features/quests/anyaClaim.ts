import { ANYA, ANYA_DOMAIN, hasAnyaTalkProof } from '@/engine/map/anya-quest';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { captureAnyaResistanceParticipant } from '@/stores/anyaResistanceParticipant';
import { anyaOrdinaryReady, captureAnyaAuthority, sameAnyaActor, sameAnyaAuthority, validateAnyaState, validateLiveAnyaGraph } from './anyaContract';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import type { ClaimResult } from './claimReward';
import { captureFiniteSideWishParticipant, type FiniteSideWishParticipant } from './finiteSideWishParticipant';

/** Exact completed Talk source enables separate Claim anywhere in any earned profile. */
export function hasAnyaClaimCompletion(questId: string): boolean {
  if (questId !== ANYA.quest || !anyaOrdinaryReady()) return false;
  try {
    captureAnyaAuthority(); validateLiveAnyaGraph();
    const map = useMapStore.getState(), inv = useInventoryStore.getState();
    return hasAnyaTalkProof(map.questProgress, inv.questItems, map.questReceipts, ANYA_DOMAIN) &&
      map.questProgress[ANYA.quest]?.rewardClaimed !== true && !Object.hasOwn(inv.questServices, ANYA.serviceSource);
  } catch { return false; }
}
/** Publish the service charge, canonical resistance vector and wishes, with claimed last. */
export function publishAnyaClaim(): ClaimResult {
  const hero = usePlayerStore.getState().player;
  if (!hero) return 'no-player'; if (!anyaOrdinaryReady()) return 'not-ready';
  let authority: ReturnType<typeof captureAnyaAuthority>;
  try { authority = captureAnyaAuthority(); validateLiveAnyaGraph(); } catch { return 'unsupported-rewards'; }
  const map = useMapStore.getState(), inventory = useInventoryStore.getState();
  if (map.questProgress[ANYA.quest]?.rewardClaimed === true) return 'already-claimed';
  if (!hasAnyaClaimCompletion(ANYA.quest)) return 'not-completed';
  const actor = { hero, id: hero.id }, before = snapshotCountedData({ rows: pick(map.questProgress, [ANYA.quest]),
    receipts: pick(map.questReceipts, [ANYA.proof, ...Object.values(ANYA.tradeProofs)]), services: pick(inventory.questServices, [ANYA.serviceSource]) });
  const row = before.rows[ANYA.quest]; if (!row) return 'not-completed';
  const claimed = { [ANYA.quest]: { ...row, rewardClaimed: true } };
  const service = { [ANYA.serviceSource]: { serviceId: 'personalize_item' as const, state: 'available' as const } };
  let participant: ReturnType<typeof captureAnyaResistanceParticipant>;
  let expected: ReturnType<ReturnType<typeof captureAnyaResistanceParticipant>['plan']>;
  try {
    validateAnyaState(replace(map.questProgress, claimed, [ANYA.quest]), inventory.questItems, map.questReceipts,
      replace(inventory.questServices, service, [ANYA.serviceSource]));
    participant = captureAnyaResistanceParticipant(hero);
    try { expected = participant.plan(replace(map.questProgress, claimed, [ANYA.quest]), inventory.questItems, map.questReceipts); }
    catch (error) { participant.dispose(); throw error; }
  } catch { return 'unsupported-rewards'; }
  let wishes: FiniteSideWishParticipant;
  try { wishes = captureFiniteSideWishParticipant(ANYA.quest); } catch { participant.dispose(); return 'unsupported-rewards'; }
  let servicePublished = false, resistancePublished = false, claimedPublished = false;
  const exact = () => {
    const live = useMapStore.getState(), inv = useInventoryStore.getState();
    return sameData(pick(live.questProgress, [ANYA.quest]), claimedPublished ? claimed : before.rows) &&
      sameData(pick(live.questReceipts, [ANYA.proof, ...Object.values(ANYA.tradeProofs)]), before.receipts) &&
      sameData(pick(inv.questServices, [ANYA.serviceSource]), servicePublished ? service : before.services);
  };
  const check = () => {
    const live = useMapStore.getState(), inv = useInventoryStore.getState();
    if (!anyaOrdinaryReady() || !sameAnyaActor(actor) || !sameAnyaAuthority(authority) || !exact()) throw new Error('Anya Claim authority changed');
    validateAnyaState(replace(live.questProgress, claimed, [ANYA.quest]), inv.questItems, live.questReceipts,
      replace(inv.questServices, service, [ANYA.serviceSource]));
    if (resistancePublished) participant.check(expected);
    else if (!sameData(usePlayerStore.getState().player, hero)) throw new Error('Anya Claim actor changed before protection');
    wishes.check();
  };
  try {
    try {
      check();
      useInventoryStore.setState(state => ({ questServices: replace(state.questServices, snapshotCountedData(service), [ANYA.serviceSource]) }));
      servicePublished = true; check();
      participant.publish(expected); resistancePublished = true; check();
      wishes.publish(); check();
      useMapStore.getState().markQuestRewardClaimed(ANYA.quest); claimedPublished = true; check();
      validateLiveAnyaGraph(); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { failures.push(error); } };
      attempt(() => { wishes.restore(); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [ANYA.quest]),
        questReceipts: replace(state.questReceipts, snapshotCountedData(before.receipts), [ANYA.proof, ...Object.values(ANYA.tradeProofs)]) })); });
      attempt(() => { useInventoryStore.setState(state => ({ questServices: replace(state.questServices, snapshotCountedData(before.services), [ANYA.serviceSource]) })); });
      attempt(() => { participant.restore(); });
      attempt(() => { participant.verifyRestored(); });
      attempt(() => {
        const live = useMapStore.getState(), inv = useInventoryStore.getState();
        if (!sameData(pick(live.questProgress, [ANYA.quest]), before.rows) ||
          !sameData(pick(live.questReceipts, [ANYA.proof, ...Object.values(ANYA.tradeProofs)]), before.receipts) ||
          !sameData(pick(inv.questServices, [ANYA.serviceSource]), before.services)) throw new Error('Anya Claim source restoration changed');
        validateLiveAnyaGraph();
      });
      attempt(() => { wishes.verifyRestored(); });
      if (failures.length) throw new AggregateError(failures, 'Anya Claim scoped restoration failed', { cause });
      return 'grant-failed';
    }
  } finally { try { participant.dispose(); } finally { wishes.dispose(); } }
}
