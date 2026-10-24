import { RESPEC_POLICY } from '@/data/loaders/respec';
import { loadTownNpcs } from '@/data/loaders/towns';
import { planRespec, type RespecKind, type RespecPlan } from '@/engine/progression/respec';
import type { Player } from '@/engine/types/entities';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { hasActiveSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { usePlayerStore } from './playerStore';
import { blockSavesForRecovery, isReplacingSave, resumeWaveDeferredSave, useHydrationStore } from './persistence';
import { assertRecordedWaveNewTransitionAllowed } from './recordedWaveAccess';
import { beginMaterialTransaction, endMaterialTransaction } from './waveTransitionGuard';

export type TownRespecResult = 'ok' | 'no-player' | 'wrong-town' | 'not-ready' | 'combat-active' | 'stale'
  | 'grant-failed' | Exclude<RespecPlan['kind'], 'ok'>;
/** Exact live basis retained by confirmation; not a save payload or a replayable command. */
export interface TownRespecRequest {
  readonly npcId: string; readonly kind: RespecKind; readonly act: number;
  readonly player: Player; readonly currencies: Record<string, number>;
}
const issued = new WeakSet<TownRespecRequest>();
function readiness(npcId: string): Exclude<TownRespecResult, 'ok'> | null {
  assertRecordedWaveNewTransitionAllowed();
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  if (useCombatStore.getState().inCombat || hasActiveSubAreaRun()) return 'combat-active';
  const map = useMapStore.getState(), key = String(map.currentAct) as keyof typeof RESPEC_POLICY.townNpcs;
  if (!map.isActUnlocked(map.currentAct) || RESPEC_POLICY.townNpcs[key] !== npcId
    || !loadTownNpcs(map.currentAct).some(npc => npc.id === npcId)) return 'wrong-town';
  return null;
}
/** Read the existing NPC/currency/refund policy without publishing or consuming anything. */
export function prepareTownRespec(npcId: string, kind: RespecKind):
  { readonly kind: 'ok'; readonly request: TownRespecRequest; readonly refund: number; readonly cost: number }
  | { readonly kind: Exclude<TownRespecResult, 'ok'> } {
  const refusal = readiness(npcId); if (refusal) return { kind: refusal };
  const player = usePlayerStore.getState().player;
  if (!player) return { kind: 'no-player' };
  const currencies = useInventoryStore.getState().currencies;
  const plan = planRespec(player, kind, currencies[RESPEC_POLICY.currency] ?? 0);
  if (plan.kind !== 'ok') return plan;
  const request = Object.freeze({ npcId, kind, act: useMapStore.getState().currentAct, player, currencies });
  issued.add(request);
  return { kind: 'ok', request, refund: plan.refund, cost: plan.cost };
}
/** Publish real payment and refund under snapshot/restore exclusion; verify and roll back both on failure. */
export function executeTownRespec(request: TownRespecRequest): TownRespecResult {
  const refusal = readiness(request.npcId); if (refusal) return refusal;
  if (!issued.has(request) || usePlayerStore.getState().player !== request.player
    || useInventoryStore.getState().currencies !== request.currencies || useMapStore.getState().currentAct !== request.act) return 'stale';
  const balance = request.currencies[RESPEC_POLICY.currency] ?? 0;
  const plan = planRespec(request.player, request.kind, balance);
  if (plan.kind !== 'ok') return plan.kind;
  const inventory = useInventoryStore.getState(), map = useMapStore.getState();
  const next = { ...plan.player, derivedStats: deriveEquippedPlayerStats(plan.player, plan.player.level,
    inventory.equipped, map.questProgress, inventory.questItems, map.questReceipts) };
  const currencies = plan.cost > 0 ? { ...request.currencies, [RESPEC_POLICY.currency]: balance - plan.cost } : request.currencies;
  const lease = beginMaterialTransaction(true);
  try {
    try {
      if (plan.cost > 0) useInventoryStore.setState({ currencies });
      usePlayerStore.setState({ player: next });
      if (usePlayerStore.getState().player !== next || useInventoryStore.getState().currencies !== currencies) {
        throw new Error('Incomplete reset publication');
      }
      issued.delete(request);
      return 'ok';
    } catch (cause) {
      const errors: unknown[] = [];
      try { useInventoryStore.setState({ currencies: request.currencies }); } catch (error) { errors.push(error); }
      try { usePlayerStore.setState({ player: request.player }); } catch (error) { errors.push(error); }
      if (usePlayerStore.getState().player !== request.player || useInventoryStore.getState().currencies !== request.currencies) {
        errors.push(new Error('Incomplete reset rollback'));
      }
      if (errors.length > 0) { blockSavesForRecovery(); throw new AggregateError(errors, 'Reset restoration failed', { cause }); }
      return 'grant-failed';
    }
  } finally { if (endMaterialTransaction(lease)) resumeWaveDeferredSave(); }
}
