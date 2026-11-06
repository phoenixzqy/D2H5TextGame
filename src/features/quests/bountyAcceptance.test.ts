/** Constructed equipped hero; actual public actions/native combat/material transaction.
 * These controls prove capability, not earned campaign balance or pacing. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { REGIONAL_BOUNTY_DOMAIN } from '@/engine/map/regional-bounties';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, startSubAreaRun, advanceWaveOrFinish } from '@/stores/combatHelpers';
import { useCombatStore, usePlayerStore, useInventoryStore, useMapStore, useMercStore,
  useFormationStore, useMetaStore } from '@/stores';
import { useHydrationStore, __resetPersistenceForTests } from '@/stores/persistence';
import { executeLiveMaterialAction, prepareLiveMaterialAction } from '@/stores/materialActions';
import { acceptRegionalBounty, repeatRegionalBounty, regionalBountyStatus } from './bountyQuestActions';
import { canClaim, claimQuestReward } from './claimReward';
const first = REGIONAL_BOUNTY_DOMAIN[0];
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  resetRegistry(); loadDefaultSkills();
}
function arrange() {
  const hero = createMockPlayer('Bounty acceptance', 'necromancer');
  usePlayerStore.getState().setPlayer({ ...hero, level: 32, comboOrder: [], skillLevels: {} });
  const cap = { id: 'bounty-acceptance-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'fixture-imported',
      values: new Map([['statMods.life', 1_000_000], ['statMods.defense', 1_000_000],
        ['statMods.attack', 1_000_000], ['statMods.attackSpeed', 200]]) }] };
  useInventoryStore.getState().addItem(cap); expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: first.area, selectedDifficulty: 'normal' });
}
function cull() {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  for (;;) {
    const combat = useCombatStore.getState(); expect(combat.outcome?.winner).toBe('player');
    combat.recordedEvents.forEach(() => { combat.advanceEvent(); });
    const result = advanceWaveOrFinish(); if (result === 'victory') break; expect(result).toBe('next-wave');
  }
  expect(useCombatStore.getState().inCombat).toBe(true);
  expect(canClaim(first.quest)).toBe(false);
  // Use the same public exit action as the native victory screen before journal actions.
  useCombatStore.getState().endCombat();
}
function shardCount() { return useInventoryStore.getState().currencies['gem-shard'] ?? 0; }
function pay(expected: number) {
  const actors = structuredClone({ hero: usePlayerStore.getState().player, mercs: useMercStore.getState().ownedMercs });
  const backpack = structuredClone(useInventoryStore.getState().backpack);
  const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  expect(canClaim(first.quest)).toBe(true); expect(claimQuestReward(first.quest)).toBe('ok');
  expect(xp).not.toHaveBeenCalled(); xp.mockRestore();
  expect({ hero: usePlayerStore.getState().player, mercs: useMercStore.getState().ownedMercs }).toEqual(actors);
  expect(useInventoryStore.getState().backpack).toEqual(backpack); expect(shardCount()).toBe(expected);
  expect(claimQuestReward(first.quest)).not.toBe('ok'); expect(shardCount()).toBe(expected);
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready'); });
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });
describe('regional bounty actual public acceptance', () => {
  it('executes Accept → native full cull → Claim → Repeat → fresh cull → Claim for exactly2 paid shards', () => {
    arrange(); expect(acceptRegionalBounty(first.quest)).toBe('ok');
    const xpBefore = usePlayerStore.getState().player?.experience ?? 0; cull();
    expect(usePlayerStore.getState().player?.experience).toBeGreaterThan(xpBefore);
    expect(regionalBountyStatus(first.quest)).toBe('completed'); expect(shardCount()).toBe(0); pay(1);
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 1, victoryOrdinal: 1 });
    // An extra actual win before explicit Repeat cannot prepay the next cycle.
    cull(); expect(regionalBountyStatus(first.quest)).toBe('paid');
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 1, victoryOrdinal: 1 }); expect(shardCount()).toBe(1);
    expect(repeatRegionalBounty(first.quest)).toBe('ok'); expect(regionalBountyStatus(first.quest)).toBe('active');
    cull(); expect(regionalBountyStatus(first.quest)).toBe('completed'); expect(shardCount()).toBe(1); pay(2);
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 2, victoryOrdinal: 2 });
  });
  it('spends a genuinely paid bounty shard only with the actual3 chipped gem fusion inputs', () => {
    arrange(); acceptRegionalBounty(first.quest); cull(); pay(1);
    useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 2, 'gems/ruby/perfect': 1 } });
    const before = useInventoryStore.getState();
    expect(() => prepareLiveMaterialAction({ recipeId: 'recipes/gem-fusion/amethyst/chipped' })).toThrow();
    expect(useInventoryStore.getState()).toBe(before); expect(shardCount()).toBe(1);
    useInventoryStore.getState().addMaterials({ 'gems/amethyst/chipped': 1 });
    const request = prepareLiveMaterialAction({ recipeId: 'recipes/gem-fusion/amethyst/chipped' });
    expect(executeLiveMaterialAction(request).replay).toBe(false);
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/amethyst/flawed': 1, 'gems/ruby/perfect': 1 });
    expect(shardCount()).toBe(0); expect(executeLiveMaterialAction(request).replay).toBe(true); expect(shardCount()).toBe(0);
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 1, victoryOrdinal: 1 });
  });
});
