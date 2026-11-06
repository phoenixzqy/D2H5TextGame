import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { FARA } from '@/engine/map/fara-quest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { canClaim, claimQuestReward } from './claimReward';
import { talkToFara } from './faraQuestActions';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const stops: (() => void)[] = [];
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); }); useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Fara Talk', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, equipment: [], derivedStats: { ...fresh.derivedStats, defense: 999, life: 3, mana: 2 } });
  useMapStore.setState({ currentAct: 2, currentSubAreaId: 'areas/act2-far-oasis', clearedSubAreas: ['areas/act1-catacombs'], questProgress: {
    [FARA.quest]: { id: FARA.quest, status: 'inProgress', rewardClaimed: false, objectives: { [FARA.objective]: false } },
    [FARA.prerequisite.quest]: { id: FARA.prerequisite.quest, status: 'completed', rewardClaimed: false, objectives: { 'obj-kill-radament': true } }
  } });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });
describe('finite actual Fara Talk', () => {
  it('coherently publishes only the receipt/side, at level1 and any difficulty with remembered field area', () => {
    useMapStore.setState({ selectedDifficulty: 'nightmare' });
    const before = structuredClone(usePlayerStore.getState().player), inventory = structuredClone(useInventoryStore.getState().currencies);
    stops.push(useMapStore.subscribe(state => { if (!state.questReceipts[FARA.proof]) return;
      expect(state.questProgress[FARA.quest]).toMatchObject({ status: 'completed', objectives: { [FARA.objective]: true }, rewardClaimed: false });
    }));
    expect(talkToFara()).toBe('ok'); expect(useMapStore.getState().questReceipts[FARA.proof]).toBe(true);
    expect(usePlayerStore.getState().player).toEqual(before); expect(useInventoryStore.getState().currencies).toEqual(inventory);
    expect(useInventoryStore.getState().questItems).toEqual({}); expect(talkToFara()).toBe('already-talked');
  });
  it.each(['wrong-act', 'locked-act', 'missing-main', 'incomplete-main', 'main-false', 'untracked', 'locked-row', 'claimed-legacy', 'dead', 'hydrating', 'combat'] as const)(
    'refuses %s without a receipt/reward', fault => {
      if (fault === 'wrong-act') useMapStore.setState({ currentAct: 1 });
      if (fault === 'locked-act') useMapStore.setState({ clearedSubAreas: [] });
      if (fault === 'missing-main') useMapStore.setState(state => { const progress = { ...state.questProgress }; Reflect.deleteProperty(progress, FARA.prerequisite.quest); return { questProgress: progress }; });
      if (fault === 'incomplete-main' || fault === 'main-false') useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
        [FARA.prerequisite.quest]: { id: FARA.prerequisite.quest, status: fault === 'incomplete-main' ? 'inProgress' : 'completed', objectives: { 'obj-kill-radament': fault !== 'main-false' } } } }));
      if (fault === 'untracked') useMapStore.setState(state => { const progress = { ...state.questProgress }; Reflect.deleteProperty(progress, FARA.quest); return { questProgress: progress }; });
      if (fault === 'locked-row' || fault === 'claimed-legacy') useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
        [FARA.quest]: { id: FARA.quest, status: fault === 'locked-row' ? 'locked' : 'completed', rewardClaimed: fault === 'claimed-legacy', objectives: { [FARA.objective]: fault === 'claimed-legacy' } } } }));
      if (fault === 'dead') { const hero = usePlayerStore.getState().player; if (hero) Object.assign(hero.derivedStats, { life: 0 }); }
      if (fault === 'hydrating') useHydrationStore.getState().setStatus('loading');
      if (fault === 'combat') useCombatStore.setState({ inCombat: true });
      const before = structuredClone(usePlayerStore.getState().player);
      expect(talkToFara()).not.toBe('ok'); expect(useMapStore.getState().questReceipts[FARA.proof]).toBeUndefined();
      expect(useInventoryStore.getState().currencies).toEqual({}); expect(usePlayerStore.getState().player).toEqual(before);
    });
  it('requires actual re-Talk for completed unclaimed legacy; another NPC/copy of flags grants no shard', () => {
    useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [FARA.quest]: { id: FARA.quest, status: 'completed', objectives: { [FARA.objective]: true } } } }));
    useMapStore.getState().recordNpcTalk('npc/atma'); expect(canClaim(FARA.quest)).toBe(false); expect(claimQuestReward(FARA.quest)).toBe('not-completed');
    expect(talkToFara()).toBe('ok'); expect(canClaim(FARA.quest)).toBe(true); expect(useInventoryStore.getState().currencies).toEqual({});
  });
  it.each(['silent-tamper', 'throw', 'independent-xp'] as const)('scopes rollback after %s while retaining independent mutations and refusing reentry', mode => {
    const before = structuredClone(useMapStore.getState().questProgress[FARA.quest]); let fired = false, nested: unknown, expectedHero = structuredClone(usePlayerStore.getState().player);
    stops.push(useMapStore.subscribe(() => { if (fired || !useMapStore.getState().questReceipts[FARA.proof]) return; fired = true;
      nested = talkToFara(); useInventoryStore.getState().addCurrency('independent-talk-key', 5);
      if (mode === 'silent-tamper') useMapStore.setState(state => { const receipts = { ...state.questReceipts }; Reflect.set(receipts, FARA.proof, false); return { questReceipts: receipts }; });
      if (mode === 'independent-xp') { usePlayerStore.getState().gainExperience(2); expectedHero = structuredClone(usePlayerStore.getState().player); }
      if (mode !== 'silent-tamper') throw new Error('Talk publication observer');
    }));
    expect(talkToFara()).toBe('grant-failed'); expect(nested).toBe('claim-in-progress');
    expect(useMapStore.getState().questProgress[FARA.quest]).toEqual(before); expect(Object.hasOwn(useMapStore.getState().questReceipts, FARA.proof)).toBe(false);
    expect(useInventoryStore.getState().currencies['independent-talk-key']).toBe(5); expect(usePlayerStore.getState().player).toEqual(expectedHero);
    expect(talkToFara()).toBe('ok');
  });
});
