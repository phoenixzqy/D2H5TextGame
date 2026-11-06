import { isDeepStrictEqual } from 'node:util';
import assert from 'node:assert/strict';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { playEarnedWave, type EarnedRunHandle, type EarnedWave } from '../sim/production/earned-playback';
import { earnedDelta, observeEarnedState, type EarnedState } from '../sim/production/earned-state';
import { campaignState, type CampaignState } from './campaign-state';

/** Small actual graph observation; ordinary loot remains in the existing economy stream. */
function questGraph() {
  const map = useMapStore.getState();
  return structuredClone({ items: useInventoryStore.getState().questItems,
    progress: map.questProgress, receipts: map.questReceipts, campaign: campaignState(map) });
}
const awardGraph = (state: EarnedState) => ({ items: state.inventory.questItems,
  progress: state.map.questProgress, receipts: state.map.questReceipts, campaign: campaignState(state.map) });
/** Old disclosed fixtures may omit ownership; every actual live observation includes it. */
type QuestGraph = Omit<ReturnType<typeof questGraph>, 'campaign'> & { readonly campaign?: CampaignState };
interface SettlementContext {
  readonly act: number;
  readonly area: string;
  readonly ordinal: number;
  readonly index: number;
  readonly actionIndex: number;
}
export interface CampaignQuestSettlement extends SettlementContext {
  readonly nativeReturned: boolean;
  readonly winner: NonNullable<EarnedWave['played']['outcome']>['winner'] | null;
  readonly heroLife: number | null;
  readonly advance: EarnedWave['advanceResult'] | null;
  readonly before: QuestGraph;
  readonly after: QuestGraph;
}

/** Retain committed graph changes even if native playback throws after publication. */
export function playCampaignQuestWave(handle: EarnedRunHandle, context: SettlementContext,
  entries: CampaignQuestSettlement[], onReturned: (wave: EarnedWave) => void = () => undefined,
  onThrown?: (delta: ReturnType<typeof earnedDelta>, error: unknown) => void): EarnedWave {
  const before = questGraph();
  // Only transient snapshots are needed to account for a native commit followed by a throw.
  const attemptBefore = onThrown ? observeEarnedState() : undefined;
  let after = before;
  let native: EarnedWave | undefined;
  let threw = false, cause: unknown;
  try { native = playEarnedWave(handle, context.index); }
  catch (error) { threw = true; cause = error; }
  finally {
    after = questGraph();
    const hero = native?.opening.playerTeam.find(unit => unit.kind === 'hero');
    const finalHero = native?.played.outcome?.finalPlayerTeam.find(unit => unit.id === hero?.id);
    const throneRetry = context.act === 5 && context.area === 'areas/act5-throne-of-destruction' &&
      context.index === 4 && native?.played.outcome?.winner === 'player' && (finalHero?.life ?? 0) > 0 &&
      native.advanceResult === 'next-wave' &&
      before.receipts['quests/act5-eve-of-destruction#action:throne-waves-victory'] === true &&
      isDeepStrictEqual(after, before);
    if (!isDeepStrictEqual(after, before) || throneRetry) {
      entries.push({ ...context, before, after, nativeReturned: native !== undefined,
        winner: native?.played.outcome?.winner ?? null, heroLife: finalHero?.life ?? null,
        advance: native?.advanceResult ?? null });
    }
  }
  if (threw) {
    if (attemptBefore && onThrown) {
      try { onThrown(earnedDelta(attemptBefore, observeEarnedState()), cause); }
      catch (error) { throw new AggregateError([cause, error], 'Native failure residual observation failed'); }
    }
    throw cause;
  }
  assert.ok(native);
  // Retain ordinary income before any validation or diagnostic can fail.
  onReturned(native);
  assert.deepEqual(before, awardGraph(native.beforeAward), 'Returned award quest graph before');
  assert.deepEqual(after, awardGraph(native.afterAward), 'Returned award quest graph after');
  return native;
}
