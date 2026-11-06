import assert from 'node:assert/strict';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { usePlayerStore } from '@/stores/playerStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { BACKPACK_CAPACITY, STASH_CAPACITY } from '@/stores/inventoryCapacity';
import { executeLiveMaterialAction, prepareLiveMaterialAction } from '@/stores/materialActions';
import { earnedDelta, observeEarnedState } from '../sim/production/earned-state';
import type { CampaignRecord } from './actions';
import type { CampaignReward } from './economy';

/** Explicit earned sink policy; preserve equipped, socketed, non-normal and reserved gear. */
export function recoverCampaignCapacity(record: CampaignRecord,
  onSink: (delta: CampaignReward) => void): 'ready' | 'protected-capacity-blocked' {
  assert.equal(useHydrationStore.getState().status, 'ready');
  assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(), 'Capacity recovery requires a safe boundary');
  const hero = usePlayerStore.getState().player; assert.ok(hero);
  const inventory = useInventoryStore.getState(), target = BACKPACK_CAPACITY - 3;
  if (inventory.backpack.length <= target) return 'ready';
  const selection = useIronGolemSelectionStore.getState().selection;
  const reserved = selection?.heroId === hero.id ? selection.itemId : undefined;
  const ids = inventory.backpack.filter(item => item.rarity === 'normal' && !item.equipped &&
    !item.socketContents?.length && item.id !== reserved).map(item => item.id);
  const transfers = Math.max(0, inventory.backpack.length - ids.length - target);

  if (ids.length) {
    const before = observeEarnedState();
    const consumedItems = before.inventory.backpack.filter(item => ids.includes(item.id));
    const request = prepareLiveMaterialAction({ recipeId: 'actions/salvage', itemIds: ids });
    const result = executeLiveMaterialAction(request);
    const delta = earnedDelta(before, observeEarnedState());
    // The sink already occurred: retain its delta before any fallible assertion or logging.
    onSink({ ...delta, inventorySink: { policy: 'salvage-overflow-normals-v1', ordinal: request.ordinal, consumedItems } });
    assert.equal(result.replay, false);
    assert.deepEqual(delta.removedItemIds, ids); assert.deepEqual(delta.addedItems, []);
    assert.equal(delta.xp, 0);
    record({ kind: 'campaign-inventory-sink', policy: 'salvage-overflow-normals-v1', request, result, delta });
  }
  if (transfers > STASH_CAPACITY - inventory.stash.length) return 'protected-capacity-blocked';
  for (let index = 0; index < transfers; index++) {
    const item = [...useInventoryStore.getState().backpack].sort((a, b) => a.id.localeCompare(b.id))[0];
    assert.ok(item);
    const result = useInventoryStore.getState().moveToStash(item.id);
    assert.deepEqual(result, { ok: true });
    record({ kind: 'campaign-capacity-transfer', itemId: item.id, result });
  }
  assert.ok(useInventoryStore.getState().backpack.length <= target);
  return 'ready';
}
