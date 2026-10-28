import { endgameDefinition } from '@/data/loaders/endgame';
import { hasEndgameAccess, projectEndgameAchievement, readEndgameState } from '@/engine/endgame/state';
import type { EndgameState } from '@/engine/endgame/types';
import { mergeMaterials } from '@/engine/loot/materials';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { questActionPreflight } from '@/features/quests/questTransaction';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useHydrationStore } from './hydrationStore';
import { blockSavesForRecovery, resumeWaveDeferredSave } from './persistence';
import { beginMaterialTransaction, endMaterialTransaction } from './waveTransitionGuard';

export type EndgameClaimResult = 'ok' | 'not-eligible' | 'already-claimed' | 'grant-failed'
  | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress';

export type EndgamePanelModel = { readonly kind: 'invalid' } | {
  readonly kind: 'locked' | 'unlocked'; readonly state: EndgameState;
  readonly achievement: ReturnType<typeof projectEndgameAchievement>;
};

/** Read-only validated projection; malformed progress cannot grant controls or title ownership. */
export function readEndgamePanelModel(): EndgamePanelModel {
  const map = useMapStore.getState(), inventory = useInventoryStore.getState();
  const campaign = { questProgress: map.questProgress, questReceipts: map.questReceipts, questItems: inventory.questItems };
  try {
    validateQuestItemLedger(inventory.questItems, map.questProgress, map.questReceipts);
    validateNative24CurrentCampaignRewards(map, inventory.questItems, inventory.questServices, map.endgame);
    return { kind: hasEndgameAccess(campaign) ? 'unlocked' : 'locked',
      state: readEndgameState(map.endgame, campaign), achievement: projectEndgameAchievement(map.endgame, campaign) };
  } catch { return { kind: 'invalid' }; }
}

/** Check a map navigation request without starting combat or spending a durable ordinal. */
export function checkEndgameEntry(modifierId: string): 'ok' | 'locked' | 'invalid' | 'exhausted'
  | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  const model = readEndgamePanelModel();
  if (!endgameDefinition.modifiers.some(row => row.id === modifierId) || model.kind === 'invalid') return 'invalid';
  if (model.kind === 'locked') return 'locked';
  return model.state.attemptOrdinal === Number.MAX_SAFE_INTEGER ? 'exhausted' : 'ok';
}

function publishClaim(): EndgameClaimResult {
  const map = useMapStore.getState(), inventory = useInventoryStore.getState();
  const campaign = { questProgress: map.questProgress, questReceipts: map.questReceipts, questItems: inventory.questItems };
  try {
    validateQuestItemLedger(inventory.questItems, map.questProgress, map.questReceipts);
    validateNative24CurrentCampaignRewards(map, inventory.questItems, inventory.questServices, map.endgame);
    const achievement = projectEndgameAchievement(map.endgame, campaign);
    if (achievement.claimed) return 'already-claimed';
    if (!achievement.available) return 'not-eligible';
  } catch { return 'not-eligible'; }
  let materials: typeof inventory.materials;
  try { materials = mergeMaterials(inventory.materials, endgameDefinition.achievement.reward.materials); }
  catch { return 'grant-failed'; }
  const next = readEndgameState({ ...map.endgame, achievementRewardClaimed: true }, campaign);
  try {
    useInventoryStore.setState({ materials });
    if (useMapStore.getState().endgame !== map.endgame) throw new Error('Achievement claim state changed');
    useMapStore.setState({ endgame: next });
    if (useMapStore.getState().endgame !== next || useInventoryStore.getState().materials !== materials) {
      throw new Error('Achievement claim publication changed');
    }
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    try { if (useInventoryStore.getState().materials !== inventory.materials) useInventoryStore.setState({ materials: inventory.materials }); }
    catch (error) { errors.push(error); }
    try { if (useMapStore.getState().endgame !== map.endgame) useMapStore.setState({ endgame: map.endgame }); }
    catch (error) { errors.push(error); }
    if (useInventoryStore.getState().materials !== inventory.materials || useMapStore.getState().endgame !== map.endgame) {
      errors.push(new Error('Achievement claim restoration changed'));
    }
    if (errors.length > 0) {
      try { blockSavesForRecovery(); } catch (error) { errors.push(error); }
      throw new AggregateError(errors, 'Achievement claim restoration failed', { cause });
    }
    return 'grant-failed';
  }
}

/** Explicit once-only achievement Claim; material ownership spans publication and every rollback. */
export function claimEndgameAchievement(): EndgameClaimResult {
  const refusal = questActionPreflight();
  if (refusal) return refusal;
  const lease = beginMaterialTransaction(useHydrationStore.getState().status === 'ready');
  let outcome: { ok: true; result: EndgameClaimResult } | { ok: false; error: unknown };
  try { outcome = { ok: true, result: publishClaim() }; }
  catch (error) { outcome = { ok: false, error }; }
  const wakeSave = endMaterialTransaction(lease);
  try { if (wakeSave) resumeWaveDeferredSave(); }
  catch (error) {
    if (!outcome.ok) throw new AggregateError([outcome.error, error], 'Achievement claim and save notification failed');
    throw error;
  }
  if (!outcome.ok) throw outcome.error;
  return outcome.result;
}
