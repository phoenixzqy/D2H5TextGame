/** Constructed shared-Claim boundary reproduction supporting D11; no Countess source credit. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward } from '@/features/quests/claimReward';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMercStore, mercXpForLevel } from '@/stores/mercStore';
import { useMetaStore } from '@/stores/metaStore';
import { useFormationStore } from '@/stores/formationStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { xpTotal } from '@/engine/progression/xp';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';

const QUEST = 'quests/act1-den-of-evil';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useCombatStore, useMercStore, useMetaStore, useFormationStore] as const;
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Claim fixture'); return value; }
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function snapshot() {
  return structuredClone(stores.map(store => Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value !== 'function'))));
}
function heroXp() { const player = required(usePlayerStore.getState().player); return xpTotal(player.level) + player.experience; }
function addMerc(definitionId: string) {
  const merc = createMercFromDef(required(loadMercPool().pool.find(row => row.id === definitionId)));
  useMercStore.getState().addMerc(merc); return merc.id;
}
function mercXp(id: string) {
  const store = useMercStore.getState(), merc = required(store.ownedMercs.find(row => row.id === id));
  let total = store.getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Shared Claim constructed fixture', 'sorceress'));
  useMapStore.getState().updateQuestProgress(QUEST, { status: 'completed', rewardClaimed: false,
    objectives: { 'obj-clear-den': true, 'obj-return': true } });
});
afterEach(() => { vi.restoreAllMocks(); reset(); });

describe('shared Claim boundary required by Countess integration', () => {
  it('control grants the authored500hero/375merc XP once through the real Claim path', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight');
    useMercStore.getState().setFieldedMerc(recipient);
    const beforeHero = heroXp(), beforeMerc = mercXp(recipient);
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(heroXp()).toBe(beforeHero + 500);
    expect(mercXp(recipient)).toBe(beforeMerc + 375);
    expect(useMapStore.getState().questProgress[QUEST]?.rewardClaimed).toBe(true);
    const paid = snapshot(); expect(claimQuestReward(QUEST)).toBe('already-claimed'); expect(snapshot()).toEqual(paid);
  });
  it('keeps the original recipient when a heroXP observer changes the fielded merc', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight'), other = addMerc('mercs/act1-rogue-fire');
    useMercStore.getState().setFieldedMerc(recipient);
    const before = mercXp(recipient), otherBefore = mercXp(other); let fired = false;
    const stop = usePlayerStore.subscribe(() => {
      if (fired) return; fired = true; useMercStore.setState({ fieldedMercId: other });
    });
    try { expect(claimQuestReward(QUEST)).toBe('ok'); } finally { stop(); }
    expect(fired).toBe(true);
    expect(mercXp(recipient)).toBe(before + 375);
    expect(mercXp(other)).toBe(otherBefore);
  });
  it('rejects a silently lost claimed-last publication and restores the bundle before retry', () => {
    const recipient = addMerc('mercs/act1-rogue-inner-sight');
    useMercStore.getState().setFieldedMerc(recipient);
    const before = snapshot(), beforeHero = heroXp(), beforeMerc = mercXp(recipient);
    const lost = vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementation(() => undefined);
    expect(claimQuestReward(QUEST)).toBe('grant-failed');
    expect(snapshot()).toEqual(before);
    lost.mockRestore();
    expect(claimQuestReward(QUEST)).toBe('ok');
    expect(heroXp()).toBe(beforeHero + 500);
    expect(mercXp(recipient)).toBe(beforeMerc + 375);
    const paid = snapshot(); expect(claimQuestReward(QUEST)).toBe('already-claimed'); expect(snapshot()).toEqual(paid);
  });
});
