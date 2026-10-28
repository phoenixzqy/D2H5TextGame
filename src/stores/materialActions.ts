import { hasReplayProfileAuthority } from '@/engine/map/replay-profile-authority';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import { canonicalActionValue } from '@/engine/crafting/action-state';
import { planMaterialAction, prepareMaterialAction, type MaterialActionContext, type MaterialActionInventory,
  type MaterialActionPlan, type MaterialActionRequest, type MaterialActionSelection } from '@/engine/crafting/material-actions';
import type { MaterialProfile } from '@/data/loaders/materials';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useCombatStore } from './combatStore';
import { hasActiveSubAreaRun } from './combatHelpers';
import { useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { blockSavesForRecovery, isReplacingSave, resumeWaveDeferredSave, useHydrationStore } from './persistence';
import { assertRecordedWaveNewTransitionAllowed } from './recordedWaveAccess';
import { runMaterialActionTransaction, type MaterialActionPort } from './materialActionTransaction';
import { BACKPACK_CAPACITY, STASH_CAPACITY } from './inventoryCapacity';

function ready(): boolean { return useHydrationStore.getState().status === 'ready' && !isReplacingSave(); }
function preflight(): void {
  assertRecordedWaveNewTransitionAllowed();
  if (!ready()) throw new Error('Material action hydration is not ready');
  if (useCombatStore.getState().inCombat || hasActiveSubAreaRun()) throw new Error('Material action requires an idle character');
}
function readInventory(): MaterialActionInventory {
  const inv = useInventoryStore.getState();
  return { backpack: inv.backpack, stash: inv.stash, materials: inv.materials, currencies: inv.currencies,
    quarantine: inv.socketQuarantine, materialActionOrdinal: inv.materialActionOrdinal,
    ...(inv.latestMaterialAction === null ? {} : { latestMaterialAction: inv.latestMaterialAction }) };
}
function readContext(recoverId?: string): MaterialActionContext {
  const hero = usePlayerStore.getState().player;
  if (!hero) throw new Error('Material action requires a character');
  const inv = useInventoryStore.getState(), mercs = useMercStore.getState(), map = useMapStore.getState();
  if (!hasReplayProfileAuthority(map.selectedDifficulty, map, inv.questItems, inv.questServices, map.endgame)) {
    throw new Error('Material action replay profile is not earned');
  }
  let highestUnlockedAct: MaterialProfile['act'] = 1;
  for (const act of [2, 3, 4, 5] as const) if (map.isActUnlocked(act)) highestUnlockedAct = act;
  const otherOwnedItemIds = new Set([
    ...Object.values(inv.equipped).flatMap(item => item ? [item.id] : []),
    ...Object.values(mercs.mercEquipment).flatMap(slots => Object.values(slots).flatMap(item => item ? [item.id] : [])),
    ...inv.legacyGearQuarantine.map(entry => entry.item.id),
    ...inv.socketQuarantine.filter(entry => entry.item.id !== recoverId).map(entry => entry.item.id)
  ]);
  const reservedItemIds = new Set(Object.values(inv.questItems).filter(entry => entry.state === 'owned').map(entry => entry.itemId));
  const selection = useIronGolemSelectionStore.getState().selection;
  if (selection?.heroId === hero.id) reservedItemIds.add(selection.itemId);
  return { characterId: hero.id, highestUnlockedAct, difficulty: map.selectedDifficulty,
    backpackCapacity: BACKPACK_CAPACITY, stashCapacity: STASH_CAPACITY, reservedItemIds, otherOwnedItemIds,
    bases: loadItemBases(), affixes: loadAffixPool() };
}
function recoveryId(recipeId: string, ids: readonly string[]): string | undefined {
  return recipeId === 'actions/recover-v18' && ids.length === 1 ? ids[0] : undefined;
}
function publish(inventory: MaterialActionInventory): void {
  useInventoryStore.setState({ backpack: [...inventory.backpack], stash: [...inventory.stash],
    materials: inventory.materials, currencies: { ...inventory.currencies }, socketQuarantine: inventory.quarantine,
    materialActionOrdinal: inventory.materialActionOrdinal, latestMaterialAction: inventory.latestMaterialAction ?? null });
}

/**
 * Live intents retain their preparation context without changing the engine
 * request hash/RNG or durable receipt. Weak ownership keeps discarded intents
 * collectible. A restored save can retry the same retained intent only in the
 * same authoritative character/act/profile context.
 */
const preparedContexts = new WeakMap<MaterialActionRequest,
  Pick<MaterialActionContext, 'characterId' | 'highestUnlockedAct' | 'difficulty'>>();
function boundContext(request: MaterialActionRequest): MaterialActionContext {
  const prepared = preparedContexts.get(request);
  if (!prepared) throw new Error('Material action request was not prepared in this runtime');
  canonicalActionValue(request);
  const context = readContext(recoveryId(request.recipeId, request.targets.map(target => target.id)));
  if (prepared.characterId !== context.characterId || prepared.highestUnlockedAct !== context.highestUnlockedAct ||
    prepared.difficulty !== context.difficulty) throw new Error('Material action context changed');
  return context;
}

/** Prepare exactly once from current authoritative ownership, costs, progression and reservations. */
export function prepareLiveMaterialAction(selection: MaterialActionSelection): MaterialActionRequest {
  preflight();
  const context = readContext(recoveryId(selection.recipeId, selection.itemIds ?? []));
  const request = prepareMaterialAction(readInventory(), context, selection);
  preparedContexts.set(request, { characterId: context.characterId,
    highestUnlockedAct: context.highestUnlockedAct, difficulty: context.difficulty });
  return request;
}

/** Revalidate a retained request and return the exact deterministic preview without publication. */
export function previewLiveMaterialAction(request: MaterialActionRequest): MaterialActionPlan {
  preflight();
  return planMaterialAction(readInventory(), boundContext(request), request);
}

/** Publish whole material/gear/result state under the shared lease; complete rollback retains the request for retry. */
export function executeLiveMaterialAction(request: MaterialActionRequest): MaterialActionPlan {
  preflight();
  const port: MaterialActionPort = {
    hydrationReady: ready,
    read: () => ({ inventory: readInventory(), context: boundContext(request) }),
    publish: next => {
      const expected = canonicalActionValue(next);
      publish(next);
      if (canonicalActionValue(readInventory()) !== expected) throw new Error('Incomplete material action publication');
    },
    restore: snapshot => {
      try {
        const expected = canonicalActionValue(snapshot);
        publish(snapshot);
        if (canonicalActionValue(readInventory()) !== expected) throw new Error('Incomplete material action rollback');
      } catch (error) {
        blockSavesForRecovery();
        throw error;
      }
    },
    onReleased: wakeSave => { if (wakeSave) resumeWaveDeferredSave(); }
  };
  return runMaterialActionTransaction(port, request);
}
