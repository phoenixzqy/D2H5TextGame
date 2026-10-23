import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { assertWaveSnapshotAllowed, beginQuestTransaction, beginWaveTransition, endQuestTransaction,
  endWaveTransition, releaseWaveRestore, reserveWaveRestore, WaveGuardError } from '@/stores/waveTransitionGuard';
import { selectReplayProfile } from './replayProfile';

const EVE = 'quests/act5-eve-of-destruction';
const AREA = 'areas/act1-blood-moor';
const hydration = useHydrationStore.getState();
const stores = [useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore] as const;

function entitlement(): void {
  // Constructed accepted source graph verifies selection authority, not earned combat.
  useMapStore.setState({
    questProgress: { [EVE]: { id: EVE, status: 'completed', rewardClaimed: true,
      objectives: { 'obj-throne-waves': true, 'obj-kill-baal': true } } },
    questReceipts: { [`${EVE}#action:throne-waves-victory`]: true, [`${EVE}#action:baal-victory`]: true },
    questDifficulties: { [NIGHTMARE_UNLOCK]: true }
  });
}

beforeEach(() => {
  abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Replay Visitor', 'sorceress'));
});
afterEach(() => {
  abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.setState(hydration);
});

describe('selectReplayProfile', () => {
  it('allows Normal without entitlement and requires the actual claimed Eve graph for Nightmare', () => {
    expect(selectReplayProfile('normal')).toBe('ok');
    expect(selectReplayProfile('nightmare')).toBe('not-owned');
    entitlement();
    expect(selectReplayProfile('nightmare')).toBe('ok');
    expect(useMapStore.getState().selectedDifficulty).toBe('nightmare');
    expect(selectReplayProfile('normal')).toBe('ok');
  });

  it('changes only selected difficulty, preserving both clear and challenge namespaces', () => {
    entitlement();
    useMapStore.setState({ clearedSubAreas: [AREA], nightmareClearedSubAreas: ['areas/act1-cold-plains'],
      challengeOrdinals: { normal: 5, nightmare: 2 } });
    const before = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(selectReplayProfile('nightmare')).toBe('ok');
    const after = useMapStore.getState();
    for (const key of ['clearedSubAreas', 'nightmareClearedSubAreas', 'challengeOrdinals',
      'questProgress', 'questReceipts', 'questTitles', 'selectedTitle'] as const) expect(after[key]).toBe(before[key]);
    expect(useInventoryStore.getState()).toBe(inventory);
  });

  it.each(['missing-proof', 'unclaimed', 'false-unlock', 'inherited-unlock', 'foreign-unlock', 'contradictory-item'])(
    'refuses an unearned or contradictory campaign graph: %s', fault => {
    entitlement();
    if (fault === 'missing-proof') useMapStore.setState({ questReceipts: { [`${EVE}#action:baal-victory`]: true } });
    if (fault === 'unclaimed') useMapStore.setState(state => {
      const progress = state.questProgress[EVE];
      if (!progress) throw new Error('Missing Eve fixture');
      return { questProgress: { [EVE]: { ...progress, rewardClaimed: false } } };
    });
    if (fault === 'false-unlock') useMapStore.setState({ questDifficulties: { [NIGHTMARE_UNLOCK]: false as unknown as true } });
    if (fault === 'inherited-unlock') useMapStore.setState({ questDifficulties: Object.create({ [NIGHTMARE_UNLOCK]: true }) as Record<string, true> });
    if (fault === 'foreign-unlock') useMapStore.setState({ questDifficulties: { 'difficulty/foreign': true } });
    if (fault === 'contradictory-item') useInventoryStore.setState({ questItems: {
      'quests/act5-prison-of-ice#action:receive-potion': { itemId: 'quest/malahs_potion', state: 'owned' } } });
    const before = useMapStore.getState();
    expect(selectReplayProfile('nightmare')).toBe('not-owned');
    expect(useMapStore.getState()).toBe(before);
  });

  it('refuses a foreign runtime profile without writing', () => {
    const before = useMapStore.getState();
    expect(selectReplayProfile('foreign' as 'normal')).toBe('not-owned');
    expect(useMapStore.getState()).toBe(before);
  });

  it('refuses hydration, missing player, combat, and an actual run even if its visual combat flag is cleared', () => {
    useHydrationStore.getState().setStatus('loading');
    expect(selectReplayProfile('normal')).toBe('not-ready');
    useHydrationStore.getState().setStatus('ready');
    usePlayerStore.getState().reset();
    expect(selectReplayProfile('normal')).toBe('no-player');
    usePlayerStore.getState().setPlayer(createMockPlayer('Replay Visitor', 'sorceress'));
    useCombatStore.setState({ inCombat: true });
    expect(selectReplayProfile('normal')).toBe('combat-active');
    useCombatStore.setState({ inCombat: false });
    expect(startSubAreaRun({ act: 1, subAreaId: AREA, runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    useCombatStore.setState({ inCombat: false });
    expect(selectReplayProfile('normal')).toBe('combat-active');
  });

  it('maps live wave, restore, and quest ownership to stable refusals', () => {
    const wave = beginWaveTransition(true);
    try { expect(selectReplayProfile('normal')).toBe('combat-active'); } finally { endWaveTransition(wave); }
    const restore = reserveWaveRestore();
    try { expect(selectReplayProfile('normal')).toBe('not-ready'); } finally { releaseWaveRestore(restore); }
    const quest = beginQuestTransaction();
    try { expect(selectReplayProfile('normal')).toBe('claim-in-progress'); } finally { endQuestTransaction(quest); }
  });

  it('holds shared ownership through publication and rollback while preserving unrelated observer writes', () => {
    entitlement();
    const cause = new Error('profile observer failed');
    let publications = 0;
    const unsubscribe = useMapStore.subscribe((state, previous) => {
      if (state.selectedDifficulty === previous.selectedDifficulty) return;
      publications++;
      expect(() => { assertWaveSnapshotAllowed(); }).toThrow(new WaveGuardError('questBusy'));
      expect(() => { reserveWaveRestore(); }).toThrow(new WaveGuardError('questBusy'));
      expect(selectReplayProfile('normal')).toBe('claim-in-progress');
      if (state.selectedDifficulty === 'nightmare') {
        useMapStore.setState({ discoveredAreas: ['observer-owned-area'] });
        throw cause;
      }
    });
    try { expect(selectReplayProfile('nightmare')).toBe('grant-failed'); } finally { unsubscribe(); }
    expect(publications).toBe(2);
    expect(useMapStore.getState().selectedDifficulty).toBe('normal');
    expect(useMapStore.getState().discoveredAreas).toEqual(['observer-owned-area']);
    expect(() => { assertWaveSnapshotAllowed(); }).not.toThrow();
    expect(selectReplayProfile('nightmare')).toBe('ok');
  });

  it('surfaces rollback failures with the publication cause and releases transaction ownership', () => {
    entitlement();
    const cause = new Error('publish failed'), rollback = new Error('rollback observer failed');
    const unsubscribe = useMapStore.subscribe((state, previous) => {
      if (state.selectedDifficulty === previous.selectedDifficulty) return;
      throw state.selectedDifficulty === 'nightmare' ? cause : rollback;
    });
    let failure: unknown;
    try { selectReplayProfile('nightmare'); } catch (error) { failure = error; } finally { unsubscribe(); }
    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).cause).toBe(cause);
    expect((failure as AggregateError).errors).toEqual([rollback]);
    expect(useMapStore.getState().selectedDifficulty).toBe('normal');
    expect(() => { assertWaveSnapshotAllowed(); }).not.toThrow();
    expect(selectReplayProfile('nightmare')).toBe('ok');
  });
});
