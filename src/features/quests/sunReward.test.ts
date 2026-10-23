import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import main from '@/data/quests/main.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore,
  useFormationStore, useCombatStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { loadMercPool } from '@/data/loaders/mercs';
import { xpTotal } from '@/engine/progression/xp';
import { mercXpForLevel } from '@/stores/mercStore';
import { claimQuestReward, canClaim } from './claimReward';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing required test fixture');
  return value;
}

const SUN = 'quests/act2-tainted-sun';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore,
  useFormationStore, useCombatStore] as const;
const player = () => required(usePlayerStore.getState().player);
const bytes = () => JSON.stringify(stores.map(store => store.getState()));
const heroXp = () => xpTotal(player().level) + player().experience;
function complete() { useMapStore.getState().updateQuestProgress(SUN, {
  status: 'completed', objectives: { 'obj-destroy-altar': true }
}); }
function withStat(stat: Record<string, unknown>, check: () => void, xp = 4500) {
  const row = required(main.quests.find(q => q.id === SUN));
  const original = required(Object.getOwnPropertyDescriptor(row, 'rewards'));
  try { Object.defineProperty(row, 'rewards', { ...original, value: { xp, stat } }); check(); }
  finally { Object.defineProperty(row, 'rewards', original); }
}
beforeEach(() => {
  __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  const hero = createMockPlayer('Sun claim', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, derivedStats: { ...hero.derivedStats, life: 17, mana: 11 } });
});
afterEach(() => { vi.restoreAllMocks(); __resetPersistenceForTests(); for (const store of stores) store.getState().reset(); });

describe('Tainted Sun explicit permanent resistance Claim', () => {
  it('grants actual4500XP, native level points and immediate resistance once without healing', () => {
    complete(); const before = player(), prior = heroXp();
    expect(canClaim(SUN)).toBe(true); expect(claimQuestReward(SUN)).toBe('ok');
    expect(heroXp()).toBe(prior + 4500);
    expect(player().statPoints).toBe(before.statPoints + 5 * (player().level - before.level));
    expect(player().skillPoints).toBe(before.skillPoints + player().level - before.level);
    expect(player().derivedStats.resistances).toMatchObject({ fire: 30, cold: 30, lightning: 0 });
    expect(player().derivedStats.life).toBe(17); expect(player().derivedStats.mana).toBe(11);
    const settled = bytes(); expect(canClaim(SUN)).toBe(false);
    expect(claimQuestReward(SUN)).toBe('already-claimed'); expect(bytes()).toBe(settled);
  });
  it('shares3375XP with the fielded merc through the native XP path', () => {
    const merc = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight'));
    const hired = useMercStore.getState().hireMerc(merc); expect(hired.ok).toBe(true);
    if (!hired.ok) throw new Error('Expected hired merc');
    if (!hired.mercId) throw new Error('Missing hired merc identity');
    const id = hired.mercId;
    useMercStore.getState().setFieldedMerc(id);
    const cumulative = () => {
      const owned = required(useMercStore.getState().ownedMercs.find(m => m.id === id));
      let total = useMercStore.getState().getMercProgress(id).experience;
      for (let level = 1; level < owned.level; level++) total += mercXpForLevel(level);
      return total;
    };
    const before = cumulative();
    const share = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    complete(); expect(claimQuestReward(SUN)).toBe('ok'); expect(share).toHaveBeenCalledWith(4500);
    expect(cumulative()).toBe(before + 3375);
  });
  it.each([{}, { 'obj-destroy-altar': false }, { 'obj-amulet': true }])('refuses incomplete altar credit %j without writes', objectives => {
    useMapStore.getState().updateQuestProgress(SUN, { status: 'completed', objectives });
    const before = bytes(); expect(canClaim(SUN)).toBe(false);
    expect(claimQuestReward(SUN)).toBe('not-completed'); expect(bytes()).toBe(before);
  });
  it('restores the player and quest when final permanent-stat publication mutates then throws, allowing retry', () => {
    complete(); const before = bytes(), real = usePlayerStore.setState;
    vi.spyOn(usePlayerStore, 'setState').mockImplementationOnce(value => { real(value); throw new Error('permanent publication'); });
    expect(claimQuestReward(SUN)).toBe('grant-failed'); expect(bytes()).toBe(before);
    vi.restoreAllMocks(); expect(claimQuestReward(SUN)).toBe('ok');
    expect(player().derivedStats.resistances.fire).toBe(30);
  });
  it('includes stat-only rewards in player rollback if the claimed flag throws after mutation', () => {
    complete(); const before = bytes(), original = useMapStore.getState().markQuestRewardClaimed;
    withStat({ fire_resist: 30, cold_resist: 30 }, () => {
      vi.spyOn(useMapStore.getState(), 'markQuestRewardClaimed').mockImplementationOnce(id => { original(id); throw new Error('receipt'); });
      expect(claimQuestReward(SUN)).toBe('grant-failed'); expect(bytes()).toBe(before);
      vi.restoreAllMocks(); expect(claimQuestReward(SUN)).toBe('ok');
      expect(heroXp()).toBe(0); expect(player().derivedStats.resistances.fire).toBe(30);
    }, 0);
  });
  it('keeps other authored stat reward shapes unsupported without partial XP', () => {
    complete(); withStat({ all_resist: 30 }, () => {
      const before = bytes(); expect(claimQuestReward(SUN)).toBe('unsupported-rewards'); expect(bytes()).toBe(before);
    });
  });
});
