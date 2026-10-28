import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NIGHTMARE_UNLOCK } from '@/engine/save/act5-campaign';
import type { ReplayProfileId } from '@/engine/map/replay-profile';
import type { SaveCurrent } from '@/engine/types/save';
import { decodeSave } from '@/engine/save/validate';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { __resetPersistenceForTests, flushSave, hydrateFromSave, useHydrationStore, useSaveStatusStore } from '@/stores/persistence';
import { assertWaveSnapshotAllowed, beginQuestTransaction, beginWaveTransition, endQuestTransaction,
  endWaveTransition, releaseWaveRestore, reserveWaveRestore, WaveGuardError } from '@/stores/waveTransitionGuard';
import { canSelectReplayProfile, selectReplayProfile } from './replayProfile';

let disk: SaveCurrent | null = null;
vi.mock('@/stores/save-adapter', () => ({
  saveSave: (save: SaveCurrent) => { disk = structuredClone(save); return Promise.resolve(); },
  loadSave: () => Promise.resolve(disk && decodeSave(disk)),
  hasSave: () => Promise.resolve(disk !== null),
  deleteSave: () => { disk = null; return Promise.resolve(); }
}));

const EVE = 'quests/act5-eve-of-destruction';
const AREA = 'areas/act1-blood-moor';
const hydration = useHydrationStore.getState();
const stores = [useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore] as const;

function entitlement(nightmare = true): void {
  // Constructed accepted source graph verifies selection authority, not earned combat.
  useMapStore.setState({
    questProgress: { [EVE]: { id: EVE, status: 'completed', rewardClaimed: true,
      objectives: { 'obj-throne-waves': true, 'obj-kill-baal': true } } },
    questReceipts: { [`${EVE}#action:throne-waves-victory`]: true, [`${EVE}#action:baal-victory`]: true },
    questDifficulties: nightmare ? { [NIGHTMARE_UNLOCK]: true } : {}
  });
}

beforeEach(() => {
  __resetPersistenceForTests(); disk = null;
  abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('Replay Visitor', 'sorceress'));
});
afterEach(() => {
  vi.restoreAllMocks();
  abortSubAreaRun();
  stores.forEach(store => { store.getState().reset(); });
  __resetPersistenceForTests();
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

  it('allows source-complete historical Eve to select Hell without adding a Nightmare entitlement or any reward', () => {
    entitlement(false);
    const before = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(canSelectReplayProfile('hell')).toBe(true);
    expect(canSelectReplayProfile('nightmare')).toBe(false);
    expect(useMapStore.getState()).toBe(before);
    expect(selectReplayProfile('nightmare')).toBe('not-owned');
    expect(selectReplayProfile('hell')).toBe('ok');
    const after = useMapStore.getState();
    expect(after.selectedDifficulty).toBe('hell');
    expect(Object.keys(after).sort()).toEqual(Object.keys(before).sort());
    for (const [key, value] of Object.entries(before)) {
      if (key !== 'selectedDifficulty') expect(after[key as keyof typeof after]).toBe(value);
    }
    expect(after.questDifficulties).toEqual({});
    expect(after.questTitles).toEqual({});
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(selectReplayProfile('normal')).toBe('ok');
  });

  it('changes only selected difficulty, preserving all three clear and challenge namespaces', () => {
    entitlement();
    useMapStore.setState({ clearedSubAreas: [AREA], nightmareClearedSubAreas: ['areas/act1-cold-plains'],
      hellClearedSubAreas: ['areas/act1-dark-wood'], challengeOrdinals: { normal: 5, nightmare: 2, hell: 3 } });
    const before = useMapStore.getState(), inventory = useInventoryStore.getState();
    expect(selectReplayProfile('nightmare')).toBe('ok');
    expect(selectReplayProfile('hell')).toBe('ok');
    expect(selectReplayProfile('normal')).toBe('ok');
    const after = useMapStore.getState();
    for (const key of ['clearedSubAreas', 'nightmareClearedSubAreas', 'hellClearedSubAreas', 'challengeOrdinals',
      'questProgress', 'questReceipts', 'questTitles', 'questDifficulties', 'selectedTitle', 'endgame'] as const) expect(after[key]).toBe(before[key]);
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
    expect(canSelectReplayProfile('nightmare')).toBe(false);
    expect(canSelectReplayProfile('hell')).toBe(false);
    expect(selectReplayProfile('nightmare')).toBe('not-owned');
    expect(selectReplayProfile('hell')).toBe('not-owned');
    expect(useMapStore.getState()).toBe(before);
  });

  it.each(['level', 'act', 'loose-flag', 'title', 'unclaimed', 'missing-throne', 'missing-baal'])(
    'does not substitute %s for the claimed Normal Eve source graph', fault => {
      if (fault === 'level') {
        const player = usePlayerStore.getState().player;
        if (!player) throw new Error('Missing fixture hero');
        usePlayerStore.setState({ player: { ...player, level: 99 } });
      }
      if (fault === 'act') useMapStore.setState({ currentAct: 5 });
      if (fault === 'loose-flag') useMapStore.setState({ questDifficulties: { 'difficulty/hell': true } });
      if (fault === 'title') useMapStore.setState({ questTitles: { 'titles/slayer_of_baal': true } });
      if (fault === 'unclaimed' || fault === 'missing-throne' || fault === 'missing-baal') {
        entitlement(false);
        if (fault === 'unclaimed') useMapStore.setState(state => {
          const progress = state.questProgress[EVE];
          if (!progress) throw new Error('Missing Eve fixture');
          return { questProgress: { [EVE]: { ...progress, rewardClaimed: false } } };
        });
        else useMapStore.setState({ questReceipts: {
          [`${EVE}#action:${fault === 'missing-throne' ? 'baal-victory' : 'throne-waves-victory'}`]: true
        } });
      }
      const before = useMapStore.getState(), inventory = useInventoryStore.getState();
      expect(canSelectReplayProfile('hell')).toBe(false);
      expect(selectReplayProfile('hell')).toBe('not-owned');
      expect(useMapStore.getState()).toBe(before);
      expect(useInventoryStore.getState()).toBe(inventory);
    }
  );

  it('refuses a foreign runtime profile without writing', () => {
    const before = useMapStore.getState();
    expect(selectReplayProfile('foreign' as ReplayProfileId)).toBe('not-owned');
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

  it('refuses silent publication replacement and restores only the selected profile', () => {
    entitlement(false);
    let replaced = false;
    const unsubscribe = useMapStore.subscribe(state => {
      if (state.selectedDifficulty === 'hell' && !replaced) {
        replaced = true;
        useMapStore.setState({ selectedDifficulty: 'normal', discoveredAreas: ['observer-owned-area'] });
      }
    });
    try { expect(selectReplayProfile('hell')).toBe('grant-failed'); } finally { unsubscribe(); }
    expect(useMapStore.getState().selectedDifficulty).toBe('normal');
    expect(useMapStore.getState().discoveredAreas).toEqual(['observer-owned-area']);
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(selectReplayProfile('hell')).toBe('ok');
  });

  it.each(['normal', 'save-status', 'hydration'] as const)(
    'blocks saving and retry after rollback failure despite %s notification observers', async notification => {
    entitlement();
    await flushSave(); const saved = structuredClone(disk);
    const cause = new Error('publish failed'), rollback = new Error('rollback observer failed');
    const unsubscribe = useMapStore.subscribe((state, previous) => {
      if (state.selectedDifficulty === previous.selectedDifficulty) return;
      expect(() => { assertWaveSnapshotAllowed(); }).toThrow(new WaveGuardError('questBusy'));
      throw state.selectedDifficulty === 'nightmare' ? cause : rollback;
    });
    const notify = notification === 'save-status'
      ? useSaveStatusStore.subscribe(() => { throw new Error('save status observer'); })
      : notification === 'hydration'
        ? useHydrationStore.subscribe(() => { throw new Error('hydration observer'); }) : null;
    let failure: unknown;
    try { selectReplayProfile('nightmare'); } catch (error) { failure = error; } finally { unsubscribe(); notify?.(); }
    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).cause).toBe(cause);
    expect((failure as AggregateError).errors).toContain(rollback);
    if (notification === 'normal') expect((failure as AggregateError).errors).toEqual([rollback]);
    expect(useMapStore.getState().selectedDifficulty).toBe('normal');
    expect(() => { assertWaveSnapshotAllowed(); }).not.toThrow();
    expect(useHydrationStore.getState().status).toBe('error');
    expect(selectReplayProfile('nightmare')).toBe('not-ready');
    await expect(flushSave()).rejects.toThrow('recovery');
    expect(disk).toEqual(saved);
    expect(await hydrateFromSave()).toBe(true);
    expect(useHydrationStore.getState().status).toBe('ready');
    expect(selectReplayProfile('nightmare')).toBe('ok');
  });

  it('blocks persistence when a rollback silently leaves the wrong selected profile', async () => {
    entitlement(false);
    await flushSave(); const saved = structuredClone(disk);
    let phase = 0;
    const cause = new Error('Hell publication observer');
    const unsubscribe = useMapStore.subscribe((state, previous) => {
      if (state.selectedDifficulty === previous.selectedDifficulty) return;
      if (phase === 0 && state.selectedDifficulty === 'hell') { phase = 1; throw cause; }
      if (phase === 1 && state.selectedDifficulty === 'normal') {
        phase = 2; useMapStore.setState({ selectedDifficulty: 'hell' });
      }
    });
    let failure: unknown;
    try { selectReplayProfile('hell'); } catch (error) { failure = error; } finally { unsubscribe(); }
    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).cause).toBe(cause);
    expect(useMapStore.getState().selectedDifficulty).toBe('hell');
    expect(selectReplayProfile('normal')).toBe('not-ready');
    await expect(flushSave()).rejects.toThrow('recovery');
    expect(disk).toEqual(saved);
    expect(await hydrateFromSave()).toBe(true);
    expect(useMapStore.getState().selectedDifficulty).toBe('normal');
    expect(selectReplayProfile('hell')).toBe('ok');
  });
});
