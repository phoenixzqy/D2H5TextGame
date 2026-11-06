/** Constructed unlocked regions; public explicit acceptance never represents an earned campaign. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { REGIONAL_BOUNTY_DOMAIN, REGIONAL_BOUNTY_MAX_CLAIMS } from '@/engine/map/regional-bounties';
import { ACT_GATE_BOSS_SUB_AREAS } from '@/engine/map/unlock';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { acceptRegionalBounty, repeatRegionalBounty, regionalBountyStatus, canAcceptRegionalBounty, canRepeatRegionalBounty } from './bountyQuestActions';

const first = REGIONAL_BOUNTY_DOMAIN[0], other = REGIONAL_BOUNTY_DOMAIN[1];
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const stops: (() => void)[] = [];
function state() {
  const map = useMapStore.getState();
  return structuredClone({ rows: map.questProgress, entries: map.bounties, hero: usePlayerStore.getState().player,
    currencies: useInventoryStore.getState().currencies });
}
function paid(claims = 1) {
  useMapStore.setState({ questProgress: { [first.quest]: { id: first.quest, status: 'completed',
    rewardClaimed: true, objectives: { [first.objective]: true } } },
  bounties: { [first.quest]: { claims, victoryOrdinal: claims } } });
}
beforeEach(() => {
  __resetPersistenceForTests(); abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready'); usePlayerStore.getState().setPlayer(createMockPlayer('Bounty actions', 'sorceress'));
  useMapStore.setState({ clearedSubAreas: Object.values(ACT_GATE_BOSS_SUB_AREAS) });
});
afterEach(() => { stops.splice(0).forEach(stop => { stop(); }); vi.restoreAllMocks(); abortSubAreaRun(); __resetPersistenceForTests(); });

describe('protected regional bounty Accept and Repeat', () => {
  it.each(REGIONAL_BOUNTY_DOMAIN)('explicitly accepts $key without paying or inferring old clear credit', definition => {
    useMapStore.setState(state => ({ currentAct: 1, currentSubAreaId: null, selectedDifficulty: 'hell',
      clearedSubAreas: [...state.clearedSubAreas, definition.area] }));
    const before = state(); expect(canAcceptRegionalBounty(definition.quest)).toBe(true);
    expect(regionalBountyStatus(definition.quest)).toBe('never-accepted');
    expect(acceptRegionalBounty(definition.quest)).toBe('ok');
    expect(regionalBountyStatus(definition.quest)).toBe('active');
    expect(useMapStore.getState().bounties[definition.quest]).toEqual({ claims: 0, victoryOrdinal: 0 });
    expect(useMapStore.getState().questProgress[definition.quest]).toEqual({ id: definition.quest, status: 'inProgress',
      objectives: { [definition.objective]: false }, rewardClaimed: false });
    useMapStore.getState().markCleared(definition.area);
    useMapStore.getState().completeQuest(definition.quest);
    useMapStore.getState().markQuestRewardClaimed(definition.quest);
    useMapStore.getState().updateQuestProgress(definition.quest, { status: 'completed', rewardClaimed: true });
    expect(regionalBountyStatus(definition.quest)).toBe('active');
    expect(usePlayerStore.getState().player).toEqual(before.hero);
    expect(useInventoryStore.getState().currencies).toEqual(before.currencies);
    const active = state(); expect(acceptRegionalBounty(definition.quest)).toBe('not-eligible');
    expect(repeatRegionalBounty(definition.quest)).toBe('not-eligible'); expect(state()).toEqual(active);
  });
  it('repeats only a paid cycle, preserving counters and all actors/currencies', () => {
    paid(7); const before = state(); expect(canRepeatRegionalBounty(first.quest)).toBe(true);
    expect(repeatRegionalBounty(first.quest)).toBe('ok');
    expect(useMapStore.getState().bounties[first.quest]).toEqual({ claims: 7, victoryOrdinal: 7 });
    expect(regionalBountyStatus(first.quest)).toBe('active');
    expect(usePlayerStore.getState().player).toEqual(before.hero); expect(useInventoryStore.getState().currencies).toEqual(before.currencies);
    paid(REGIONAL_BOUNTY_MAX_CLAIMS); const exhausted = state();
    expect(canRepeatRegionalBounty(first.quest)).toBe(false); expect(repeatRegionalBounty(first.quest)).toBe('exhausted'); expect(state()).toEqual(exhausted);
  });
  it.each(['before', 'after', 'noop'] as const)('restores absent Accept row and entry after %s publication failure and retries', fault => {
    const before = state(), real = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => {
      if (fault === 'before') throw new Error('before activation'); if (fault === 'noop') return;
      real(update); throw new Error('after activation');
    });
    expect(acceptRegionalBounty(first.quest)).toBe('grant-failed'); expect(state()).toEqual(before);
    vi.restoreAllMocks(); expect(acceptRegionalBounty(first.quest)).toBe('ok');
  });
  it('keeps independent other bounty/wallet changes and fences reentrant activation through rollback', () => {
    let fired = false; const nested: string[] = [];
    stops.push(useMapStore.subscribe(current => {
      if (fired || !current.bounties[first.quest]) return; fired = true;
      nested.push(acceptRegionalBounty(other.quest));
      useInventoryStore.getState().addCurrency('gem-shard', 3);
      useMapStore.setState(state => ({ questProgress: { ...state.questProgress, [other.quest]: {
        id: other.quest, status: 'inProgress', rewardClaimed: false, objectives: { [other.objective]: false } } },
      bounties: { ...state.bounties, [other.quest]: { claims: 0, victoryOrdinal: 0 } } }));
      throw new Error('activation observer');
    }));
    expect(acceptRegionalBounty(first.quest)).toBe('grant-failed'); expect(fired).toBe(true);
    expect(nested).toEqual(['claim-in-progress']); expect(regionalBountyStatus(first.quest)).toBe('never-accepted');
    expect(regionalBountyStatus(other.quest)).toBe('active'); expect(useInventoryStore.getState().currencies['gem-shard']).toBe(3);
  });
  it.each(['locked', 'loading', 'no-hero', 'combat', 'active-run', 'unknown'] as const)('refuses %s input without acceptance', fault => {
    if (fault === 'locked') useMapStore.setState({ clearedSubAreas: [] });
    if (fault === 'loading') useHydrationStore.getState().setStatus('loading');
    if (fault === 'no-hero') usePlayerStore.setState({ player: null });
    if (fault === 'combat') useCombatStore.setState({ inCombat: true });
    if (fault === 'active-run') {
      useMapStore.getState().setCurrentLocation(1, first.area);
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy(); useCombatStore.setState({ inCombat: false });
    }
    const before = state(), quest = fault === 'unknown' ? 'quests/bounty-future' : fault === 'locked' ? other.quest : first.quest;
    expect(acceptRegionalBounty(quest)).not.toBe('ok'); expect(canAcceptRegionalBounty(quest)).toBe(false); expect(state()).toEqual(before);
  });
});
