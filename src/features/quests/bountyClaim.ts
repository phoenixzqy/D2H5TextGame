import { findRegionalBounty, REGIONAL_BOUNTY_DOMAIN, regionalBountyState } from '@/engine/map/regional-bounties';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { beginQuestGemShardPublication, endQuestGemShardPublication, verifyQuestGemShardPublication,
  type QuestGemShardPublication } from '@/stores/questGemShardJournal';
import { bountyOrdinaryReady, captureBountyAuthority, sameBountyActor, sameBountyAuthority, validateLiveBountyGraph } from './bountyContract';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import type { ClaimResult } from './claimReward';

/** Only the exact complete-unpaid cycle permits a separate journal-wide Claim. */
export function hasRegionalBountyClaimCompletion(questId: string): boolean {
  if (!findRegionalBounty(questId) || !bountyOrdinaryReady()) return false;
  try {
    captureBountyAuthority(); validateLiveBountyGraph(); const map = useMapStore.getState();
    return regionalBountyState(questId, map.questProgress, map.bounties, REGIONAL_BOUNTY_DOMAIN) === 'completed';
  } catch { return false; }
}
/** Publish exactly one currency increment and matching cycle payment under the caller's quest lease. */
export function publishRegionalBountyClaim(questId: string): ClaimResult {
  const definition = findRegionalBounty(questId); if (!definition) return 'unknown-quest';
  const hero = usePlayerStore.getState().player;
  if (!hero) return 'no-player'; if (!bountyOrdinaryReady()) return 'not-ready';
  let authority: ReturnType<typeof captureBountyAuthority>;
  try { authority = captureBountyAuthority(); validateLiveBountyGraph(); } catch { return 'unsupported-rewards'; }
  const map = useMapStore.getState(), status = regionalBountyState(questId, map.questProgress, map.bounties, REGIONAL_BOUNTY_DOMAIN);
  if (status === 'paid') return 'already-claimed';
  if (status !== 'completed') return 'not-completed';
  const entry = map.bounties[definition.quest], row = map.questProgress[questId];
  if (!entry || !row) return 'not-completed';
  const actor = { hero, id: hero.id }, before = snapshotCountedData({ rows: pick(map.questProgress, [questId]), entries: pick(map.bounties, [questId]) });
  const claimed = { rows: { [questId]: { ...row, rewardClaimed: true } },
    entries: { [questId]: { claims: entry.claims + 1, victoryOrdinal: entry.victoryOrdinal } } };
  let owner: QuestGemShardPublication;
  try { owner = beginQuestGemShardPublication(questId, useInventoryStore.getState().currencies); } catch { return 'unsupported-rewards'; }
  const exact = (state: typeof before) => sameData(pick(useMapStore.getState().questProgress, [questId]), state.rows) &&
    sameData(pick(useMapStore.getState().bounties, [questId]), state.entries);
  const check = (outstanding: boolean, state: typeof before) => {
    if (!bountyOrdinaryReady() || !sameBountyActor(actor) || !sameBountyAuthority(authority) || !exact(state)) throw new Error('Regional bounty Claim authority changed');
    validateLiveBountyGraph(); verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, outstanding);
  };
  try {
    try {
      check(false, before);
      useInventoryStore.getState().addQuestGemShard(owner); check(true, before);
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(claimed.rows), [questId]),
        bounties: replace(state.bounties, snapshotCountedData(claimed.entries), [questId]) }));
      check(true, claimed); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [], attempt = (operation: () => void) => { try { operation(); } catch (error) { failures.push(error); } };
      attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [questId]),
        bounties: replace(state.bounties, snapshotCountedData(before.entries), [questId]) })); });
      attempt(() => { useInventoryStore.getState().restoreQuestGemShard(owner); });
      attempt(() => { if (!exact(before)) throw new Error('Regional bounty Claim source restoration changed'); validateLiveBountyGraph(); });
      attempt(() => { verifyQuestGemShardPublication(owner, useInventoryStore.getState().currencies, false); });
      if (failures.length) throw new AggregateError(failures, 'Regional bounty Claim scoped restoration failed', { cause });
      return 'grant-failed';
    }
  } finally { endQuestGemShardPublication(owner); }
}
