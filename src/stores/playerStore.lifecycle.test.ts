import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore, WaveGuardError } from './waveTransitionGuard';

const persistent = [useInventoryStore, useMercStore, useMapStore, useFormationStore, useMetaStore] as const;
const domains = [usePlayerStore, useCombatStore, useIronGolemSelectionStore, ...persistent] as const;
function seedRun() {
  expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1, runSeed: 7 })).not.toBeNull();
  const player = usePlayerStore.getState().player;
  if (!player) throw new Error('Missing lifecycle hero');
  armIronGolemSelection(player.id, 'lifecycle-source', true);
  useCombatStore.setState({ ironGolemReplayLocked: true, eventCursor: 2, isPaused: true,
    runRewards: { items: [], runeShards: 7, runes: 1, gems: 2, wishstones: 3 } });
  expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
  return player;
}
function expectCleared() {
  expect(hasActiveSubAreaRun()).toBe(false);
  expect(useCombatStore.getState()).toEqual(useCombatStore.getInitialState());
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
}
beforeEach(() => {
  abortSubAreaRun();
  for (const store of [usePlayerStore, useCombatStore, ...persistent]) store.getState().reset();
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Lifecycle', 'sorceress'), statPoints: 2 });
});
afterEach(() => { abortSubAreaRun(); });

describe('public hero lifecycle', () => {
  it.each([
    { action: 'set', owner: 'wave' }, { action: 'reset', owner: 'wave' },
    { action: 'set', owner: 'restore' }, { action: 'reset', owner: 'restore' }
  ] as const)('refuses $action during $owner ownership without touching any transient', ({ action, owner }) => {
    seedRun();
    const before = domains.map(store => store.getState());
    const notified = vi.fn();
    const stops = domains.map(store => store.subscribe(notified));
    const replacement = createMockPlayer('Replacement', 'amazon');
    const run = () => {
      if (action === 'set') usePlayerStore.getState().setPlayer(replacement);
      else usePlayerStore.getState().reset();
    };
    const wave = owner === 'wave' ? beginWaveTransition(true) : undefined;
    const restore = owner === 'restore' ? reserveWaveRestore() : undefined;
    try {
      expect(run).toThrow(WaveGuardError);
      expect(run).toThrow(owner === 'wave' ? 'waveBusy' : 'restorePending');
      domains.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(hasActiveSubAreaRun()).toBe(true);
      expect(notified).not.toHaveBeenCalled();
    } finally {
      stops.forEach(stop => { stop(); });
      if (wave) endWaveTransition(wave);
      if (restore) releaseWaveRestore(restore);
    }
    run();
    expectCleared();
    expect(usePlayerStore.getState().player).toBe(action === 'set' ? replacement : null);
  });

  it.each(['new', 'same-id', 'same-reference', 'reset'] as const)('clears transients before publishing %s', variant => {
    const original = seedRun();
    const next = variant === 'reset' ? null : variant === 'same-reference' ? original
      : variant === 'same-id' ? { ...original } : { ...createMockPlayer('New hero', 'amazon'), id: 'replacement' };
    const before = persistent.map(store => store.getState());
    const observed: unknown[] = [];
    const stop = usePlayerStore.subscribe(state => { expectCleared(); observed.push(state.player); });
    try {
      if (next) usePlayerStore.getState().setPlayer(next);
      else usePlayerStore.getState().reset();
      expectCleared();
      expect(observed).toEqual([next]);
      expect(usePlayerStore.getState().player).toBe(next);
      persistent.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(advanceWaveOrFinish()).toBe('idle');
    } finally { stop(); }
    if (next) {
      expect(startSubAreaRun({ runSeed: 9 })).not.toBeNull();
      expect(hasActiveSubAreaRun()).toBe(true);
      expect(useCombatStore.getState().playerTeam.some(unit => unit.id === next.id)).toBe(true);
    }
  });

  it.each([
    { action: 'set', present: true }, { action: 'reset', present: true }, { action: 'reset', present: false }
  ] as const)('clears dangling recording/selection without a run on $action with player=$present', ({ action, present }) => {
    seedRun();
    abortSubAreaRun(); // Explicit abort retains recording for the caller.
    // Synthetic dangling null-player state exercises reset even when no hero remains.
    if (!present) usePlayerStore.setState({ player: null });
    armIronGolemSelection('dangling', 'unreserved-item', true);
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
    if (action === 'set') usePlayerStore.getState().setPlayer(createMockPlayer('Created hero', 'amazon'));
    else usePlayerStore.getState().reset();
    expectCleared();
  });

  it('keeps the full recording and armed selection frozen through ordinary configuration actions', () => {
    seedRun();
    const combat = useCombatStore.getState();
    const selection = useIronGolemSelectionStore.getState().selection;
    const actions = [
      () => { usePlayerStore.getState().updateStats({ energy: 40 }); },
      () => { usePlayerStore.getState().allocateStatPoint('strength'); },
      () => { expect(usePlayerStore.getState().allocateSkillPoint('sorceress.ice_bolt')).toBe('ok'); },
      () => { usePlayerStore.getState().setComboOrder(['sorceress.ice_bolt']); },
      () => { usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped); },
      () => { refreshActivePlayerCombatConfig(); }
    ];
    for (const action of actions) {
      action();
      expect(useCombatStore.getState()).toBe(combat);
      expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
      expect(hasActiveSubAreaRun()).toBe(true);
    }
  });
});
