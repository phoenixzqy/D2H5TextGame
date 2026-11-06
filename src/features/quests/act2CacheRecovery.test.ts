import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { ACT2_CACHES, type Act2CacheKey } from '@/engine/map/act2-cache-quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { recoverQuestTool } from './interactObject';
import { canClaim, claimQuestReward } from './claimReward';
import { act2CacheStatus } from './act2CacheRecovery';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
function prepare(key: Act2CacheKey) {
  const d = ACT2_CACHES[key];
  useMapStore.setState(state => ({ currentAct: 2, currentSubAreaId: d.areaId, selectedDifficulty: 'normal',
    clearedSubAreas: ['areas/act1-catacombs'], questProgress: { ...state.questProgress,
      [d.quest]: { id: d.quest, status: 'inProgress', rewardClaimed: false, objectives: { [d.objective]: false } } } }));
  return d;
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  const player = createMockPlayer('Recovery cache', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, equipment: [], derivedStats: { ...player.derivedStats, defense: 777, life: 3, mana: 2 } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });
describe.each(['horazon', 'elzix'] as const)('cache %s exact Recover', key => {
  it('is read-only until actual Recover; grants no income or cache normalization; repeated Recover is inert', () => {
    const d = prepare(key), beforeHero = structuredClone(usePlayerStore.getState().player), beforeCurrency = structuredClone(useInventoryStore.getState().currencies);
    expect(act2CacheStatus(key)).toBe('ready'); expect(useInventoryStore.getState().questItems).toEqual({});
    expect(canClaim(d.quest)).toBe(false); expect(recoverQuestTool(d.source)).toBe('ok');
    expect(usePlayerStore.getState().player).toEqual(beforeHero); expect(useInventoryStore.getState().currencies).toEqual(beforeCurrency);
    expect(useInventoryStore.getState().backpack).toEqual([]); expect(useMercStore.getState().ownedMercs).toEqual([]);
    expect(useMapStore.getState().questProgress[d.quest]).toMatchObject({ status: 'completed', rewardClaimed: false, objectives: { [d.objective]: true } });
    expect(recoverQuestTool(d.source)).toBe('already-owned'); expect(canClaim(d.quest)).toBe(true);
  });
  it.each(['wrong-act', 'wrong-area', 'locked-act', 'nightmare', 'untracked', 'locked-row', 'claimed', 'dead', 'hydrating', 'combat'] as const)(
    'refuses %s without a retained source or income', fault => {
      const d = prepare(key);
      if (fault === 'wrong-act') useMapStore.setState({ currentAct: 1 });
      if (fault === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act2-sewers' });
      if (fault === 'locked-act') useMapStore.setState({ clearedSubAreas: [] });
      if (fault === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
      if (fault === 'untracked') useMapStore.setState({ questProgress: {} });
      if (fault === 'locked-row' || fault === 'claimed') useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
        [d.quest]: { id: d.quest, status: fault === 'locked-row' ? 'locked' : 'completed', rewardClaimed: fault === 'claimed', objectives: { [d.objective]: fault === 'claimed' } } } }));
      if (fault === 'dead') { const hero = usePlayerStore.getState().player; if (hero) Object.assign(hero.derivedStats, { life: 0 }); }
      if (fault === 'hydrating') useHydrationStore.getState().setStatus('loading');
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
      const before = structuredClone(usePlayerStore.getState().player);
      expect(act2CacheStatus(key)).toBe('unavailable'); expect(recoverQuestTool(d.source)).not.toBe('ok');
      expect(useInventoryStore.getState().questItems).toEqual({}); expect(usePlayerStore.getState().player).toEqual(before);
    });
  it('requires actual proof for unclaimed completed legacy and lets Claim run elsewhere on another difficulty', () => {
    const d = prepare(key);
    useMapStore.setState({ questProgress: { [d.quest]: { id: d.quest, status: 'completed', objectives: { [d.objective]: true } } } });
    expect(canClaim(d.quest)).toBe(false); expect(recoverQuestTool(d.source)).toBe('ok');
    useMapStore.setState({ currentAct: 1, currentSubAreaId: null, selectedDifficulty: 'nightmare', clearedSubAreas: [] });
    expect(canClaim(d.quest)).toBe(true); expect(claimQuestReward(d.quest)).toBe('ok');
    expect(useInventoryStore.getState().questItems[d.source]?.state).toBe('owned');
  });
  it.each(['item', 'terminal-row'] as const)('restores own graph after a throwing %s observer and preserves independent changes', boundary => {
    const other = prepare(key === 'horazon' ? 'elzix' : 'horazon'); expect(recoverQuestTool(other.source)).toBe('ok');
    const d = prepare(key), beforeRow = structuredClone(useMapStore.getState().questProgress[d.quest]);
    let fired = false, nested: unknown;
    const observer = () => {
      if (fired) return;
      if (boundary === 'item' && !useInventoryStore.getState().questItems[d.source]) return;
      if (boundary === 'terminal-row' && useMapStore.getState().questProgress[d.quest]?.status !== 'completed') return;
      fired = true; nested = recoverQuestTool(d.source);
      useInventoryStore.setState(state => ({ currencies: { ...state.currencies, 'runes/El': (state.currencies['runes/El'] ?? 0) + 11 } }));
      throw new Error('recover observer fault');
    };
    stops.push(boundary === 'item' ? useInventoryStore.subscribe(observer) : useMapStore.subscribe(observer));
    expect(recoverQuestTool(d.source)).toBe('grant-failed'); expect(fired).toBe(true); expect(nested).toBe('claim-in-progress');
    expect(useMapStore.getState().questProgress[d.quest]).toEqual(beforeRow); expect(useInventoryStore.getState().questItems[d.source]).toBeUndefined();
    expect(useInventoryStore.getState().questItems[other.source]).toEqual({ itemId: other.itemId, state: 'owned' });
    expect(useInventoryStore.getState().currencies['runes/El']).toBe(11);
    expect(recoverQuestTool(d.source)).toBe('ok');
  });
});
