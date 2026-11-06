import { findRegionalBounty, REGIONAL_BOUNTY_DOMAIN, REGIONAL_BOUNTY_MAX_CLAIMS,
  regionalBountyState } from '@/engine/map/regional-bounties';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { pick } from './cainPublication';
import { replaceCountedDataKeys as replace, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import { bountyOrdinaryReady, captureBountyAuthority, sameBountyActor, sameBountyAuthority, validateLiveBountyGraph } from './bountyContract';
import { questActionPreflight, withQuestTransaction } from './questTransaction';

export type BountyActionResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active' |
  'claim-in-progress' | 'grant-failed' | 'exhausted';

/** Pure journal projection; invalid authoring or reciprocal state exposes no action. */
export function regionalBountyStatus(questId: string) {
  try {
    captureBountyAuthority(); validateLiveBountyGraph(); const map = useMapStore.getState();
    return regionalBountyState(questId, map.questProgress, map.bounties, REGIONAL_BOUNTY_DOMAIN);
  } catch { return undefined; }
}
function eligible(questId: string): boolean {
  const definition = findRegionalBounty(questId);
  return definition !== undefined && bountyOrdinaryReady() && useMapStore.getState().isAreaUnlocked(Number(definition.actId.slice(-1)));
}
/** Accept is journal-wide once its existing regional area is unlocked. */
export function canAcceptRegionalBounty(questId: string): boolean {
  return eligible(questId) && regionalBountyStatus(questId) === 'never-accepted';
}
/** Exhaustion disables Repeat without resetting either durable counter. */
export function canRepeatRegionalBounty(questId: string): boolean {
  const definition = findRegionalBounty(questId);
  return definition !== undefined && eligible(questId) && regionalBountyStatus(questId) === 'paid' &&
    (useMapStore.getState().bounties[definition.quest]?.claims ?? REGIONAL_BOUNTY_MAX_CLAIMS) < REGIONAL_BOUNTY_MAX_CLAIMS;
}
function activate(questId: string, repeat: boolean): BountyActionResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<BountyActionResult>(() => {
    const definition = findRegionalBounty(questId); if (!definition) return 'not-eligible';
    let authority: ReturnType<typeof captureBountyAuthority>;
    try { authority = captureBountyAuthority(); validateLiveBountyGraph(); } catch { return 'not-eligible'; }
    const map = useMapStore.getState(), hero = usePlayerStore.getState().player;
    if (!hero) return 'no-player';
    const status = regionalBountyStatus(questId), entry = map.bounties[definition.quest];
    if (repeat && status === 'paid' && entry?.claims === REGIONAL_BOUNTY_MAX_CLAIMS) return 'exhausted';
    if (!eligible(questId) || status !== (repeat ? 'paid' : 'never-accepted')) return 'not-eligible';
    const actor = { hero, id: hero.id }, before = snapshotCountedData({ rows: pick(map.questProgress, [questId]), entries: pick(map.bounties, [questId]) });
    const next = { rows: { [questId]: { id: questId, status: 'inProgress' as const,
      objectives: { [definition.objective]: false }, rewardClaimed: false } },
    entries: { [questId]: repeat && entry ? snapshotCountedData(entry) : { claims: 0, victoryOrdinal: 0 } } };
    const exact = (state: typeof before) => sameData(pick(useMapStore.getState().questProgress, [questId]), state.rows) &&
      sameData(pick(useMapStore.getState().bounties, [questId]), state.entries);
    const check = () => {
      if (!eligible(questId) || !sameBountyActor(actor) || !sameBountyAuthority(authority) || !exact(next)) throw new Error('Regional bounty activation changed');
      validateLiveBountyGraph();
    };
    try {
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(next.rows), [questId]),
        bounties: replace(state.bounties, snapshotCountedData(next.entries), [questId]) }));
      check(); return 'ok';
    } catch (cause) {
      const failures: unknown[] = [];
      try { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, snapshotCountedData(before.rows), [questId]),
        bounties: replace(state.bounties, snapshotCountedData(before.entries), [questId]) })); } catch (error) { failures.push(error); }
      try { if (!exact(before)) throw new Error('Regional bounty activation restoration changed'); validateLiveBountyGraph(); } catch (error) { failures.push(error); }
      if (failures.length) throw new AggregateError(failures, 'Regional bounty activation restoration failed', { cause });
      return 'grant-failed';
    }
  });
}
/** Explicitly accept one future Normal/manual full cull; history supplies no credit. */
export function acceptRegionalBounty(questId: string): BountyActionResult { return activate(questId, false); }
/** Start a fresh cycle after payment while retaining the exact completed cycle counters. */
export function repeatRegionalBounty(questId: string): BountyActionResult { return activate(questId, true); }
