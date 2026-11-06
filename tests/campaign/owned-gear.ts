import assert from 'node:assert/strict';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { BACKPACK_CAPACITY, STASH_CAPACITY } from '@/stores/inventoryCapacity';
import { observeEarnedState } from '../sim/production/earned-state';
import type { CampaignRecord } from './actions';

export type CampaignGearRetrievalPolicy = 'stash-room-v1';

/** Retrieve gear and reserve net equip-displacement room through preflighted native transfers. */
export function retrieveCampaignGear(itemId: string, record: CampaignRecord, policy?: CampaignGearRetrievalPolicy,
  extraBackpackRoom = 0) {
  const inventory = useInventoryStore.getState();
  assert.ok(Number.isSafeInteger(extraBackpackRoom) && extraBackpackRoom >= 0);
  assert.ok(extraBackpackRoom === 0 || policy === 'stash-room-v1');
  const owned = inventory.backpack.find(item => item.id === itemId);
  if (owned && extraBackpackRoom === 0) return owned;
  assert.ok(owned !== undefined || inventory.stash.some(item => item.id === itemId), 'Unowned campaign gear retrieval');
  const stage = (items: readonly typeof inventory.backpack[number][]) => {
    for (const item of items) {
      const result = useInventoryStore.getState().moveToStash(item.id);
      record({ kind: 'campaign-gear-stage', policy, itemId: item.id, result });
      assert.deepEqual(result, { ok: true }, 'Preflighted campaign gear staging refused');
    }
  };
  let afterRetrieval: readonly typeof inventory.backpack[number][] = [];
  if (policy === 'stash-room-v1') {
    assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(),
      'Managed campaign gear retrieval requires an idle boundary');
    const incoming = owned ? 0 : 1;
    const retrievalRoom = owned ? 0 : Math.max(0, inventory.backpack.length - BACKPACK_CAPACITY + 1);
    const needed = Math.max(0, inventory.backpack.length + incoming - BACKPACK_CAPACITY + extraBackpackRoom);
    const selection = useIronGolemSelectionStore.getState().selection;
    const reserved = selection?.heroId === usePlayerStore.getState().player?.id ? selection?.itemId : undefined;
    const movable = inventory.backpack.filter(item => !item.equipped && item.id !== reserved && item.id !== itemId)
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const freeStash = STASH_CAPACITY - inventory.stash.length;
    if (retrievalRoom <= freeStash && needed <= freeStash + incoming && needed <= movable.length) {
      const beforeRetrieval = owned ? needed : retrievalRoom;
      stage(movable.slice(0, beforeRetrieval));
      afterRetrieval = movable.slice(beforeRetrieval, needed);
    } else if (owned !== undefined || inventory.backpack.length < BACKPACK_CAPACITY) {
      record({ kind: 'campaign-gear-room-refused', itemId, extraBackpackRoom,
        result: { ok: false, reason: 'backpack_full' } });
      return null;
    }
  }
  if (owned) return owned;
  const before = observeEarnedState(), result = useInventoryStore.getState().moveToBackpack(itemId);
  record({ kind: 'campaign-gear-retrieve', itemId, result });
  if (!result.ok) {
    assert.equal(result.reason, 'backpack_full');
    assert.deepEqual(observeEarnedState(), before, 'Gear retrieval refusal changed earned state');
    return null;
  }
  const transferred = useInventoryStore.getState().backpack.find(item => item.id === itemId);
  assert.ok(transferred);
  stage(afterRetrieval);
  return transferred;
}
