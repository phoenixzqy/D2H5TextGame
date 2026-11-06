import { FARA, FARA_DOMAIN, hasFaraTalkProof } from '@/engine/map/fara-quest';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { beginQuestGemShardPublication, endQuestGemShardPublication, verifyQuestGemShardPublication, type QuestGemShardPublication } from '@/stores/questGemShardJournal';
import { beginQuestCurrencyPublication, endQuestCurrencyPublication, verifyQuestCurrencyPublication, type QuestCurrencyPublication } from '@/stores/questCurrencyJournal';
import { captureFaraAuthority, faraOrdinaryReady, sameFaraActor, sameFaraAuthority, validateLiveFaraGraph } from './faraContract';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import type { ClaimResult } from './claimReward';

/** Actual Talk proof plus ordinary readiness; Claim has no town, area or difficulty gate. */
export function hasFaraClaimCompletion(questId: string): boolean {
  if (questId !== FARA.quest || !faraOrdinaryReady()) return false;
  try {
    captureFaraAuthority(); validateLiveFaraGraph(); const map = useMapStore.getState();
    return hasFaraTalkProof(map.questProgress, map.questReceipts, FARA_DOMAIN) && map.questProgress[FARA.quest]?.rewardClaimed !== true;
  } catch { return false; }
}
/** Publish the catalyst and wishes under the public Claim caller's existing quest lease. */
export function publishFaraClaim(): ClaimResult {
  const hero = usePlayerStore.getState().player;
  if (!hero) return 'no-player'; if (!faraOrdinaryReady()) return 'not-ready';
  let authority: ReturnType<typeof captureFaraAuthority>;
  try { authority = captureFaraAuthority(); validateLiveFaraGraph(); } catch { return 'unsupported-rewards'; }
  const map = useMapStore.getState();
  if (map.questProgress[FARA.quest]?.rewardClaimed === true) return 'already-claimed';
  if (!hasFaraClaimCompletion(FARA.quest)) return 'not-completed';
  const actor = { hero, id: hero.id }, before = snapshotCountedData({ rows: pick(map.questProgress, [FARA.quest]), receipts: pick(map.questReceipts, [FARA.proof]) });
  const row = before.rows[FARA.quest]; if (!row) return 'not-completed';
  const claimed = { rows: { [FARA.quest]: { ...row, rewardClaimed: true } }, receipts: before.receipts };
  const wishAmount = authority.quest.rewards?.wishstones;
  if (typeof wishAmount !== 'number') return 'unsupported-rewards';
  let owner: QuestGemShardPublication | undefined, wishOwner: QuestCurrencyPublication;
  try {
    owner = beginQuestGemShardPublication(FARA.quest, useInventoryStore.getState().currencies);
    wishOwner = beginQuestCurrencyPublication(FARA.quest, 'wishstone', wishAmount, useInventoryStore.getState().currencies);
  } catch { if (owner) endQuestGemShardPublication(owner); return 'unsupported-rewards'; }
  const shardOwner = owner;
  const exact = (state: typeof before) => sameData(pick(useMapStore.getState().questProgress, [FARA.quest]), state.rows) &&
    sameData(pick(useMapStore.getState().questReceipts, [FARA.proof]), state.receipts);
  const check = (shardOutstanding: boolean, wishOutstanding: boolean, state: typeof before) => {
    if (!faraOrdinaryReady() || !sameFaraActor(actor) || !sameFaraAuthority(authority) || !exact(state)) throw new Error('Fara Claim authority changed');
    validateLiveFaraGraph(); verifyQuestGemShardPublication(shardOwner, useInventoryStore.getState().currencies, shardOutstanding);
    verifyQuestCurrencyPublication(wishOwner, useInventoryStore.getState().currencies, wishOutstanding);
  };
  try {
    try {
      check(false, false, before);
      useInventoryStore.getState().addQuestGemShard(shardOwner); check(true, false, before);
      useInventoryStore.getState().addQuestCurrency(wishOwner); check(true, true, before);
      useMapStore.getState().markQuestRewardClaimed(FARA.quest); check(true, true, claimed);
      return 'ok';
    } catch (cause) {
      const failures: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { failures.push(error); } };
      attempt(() => { useInventoryStore.getState().restoreQuestCurrency(wishOwner); });
      attempt(() => { useInventoryStore.getState().restoreQuestGemShard(shardOwner); });
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [FARA.quest]),
        questReceipts: replace(state.questReceipts, snapshotCountedData(before.receipts), [FARA.proof]) })); });
      attempt(() => { if (!exact(before)) throw new Error('Fara Claim source restoration changed'); validateLiveFaraGraph(); });
      attempt(() => { verifyQuestGemShardPublication(shardOwner, useInventoryStore.getState().currencies, false); });
      attempt(() => { verifyQuestCurrencyPublication(wishOwner, useInventoryStore.getState().currencies, false); });
      if (failures.length) throw new AggregateError(failures, 'Fara Claim scoped restoration failed', { cause });
      return 'grant-failed';
    }
  } finally { try { endQuestCurrencyPublication(wishOwner); } finally { endQuestGemShardPublication(shardOwner); } }
}
