import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item } from '@/engine/types/items';
import * as combatEngine from '@/engine/combat/combat';
import {
  abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, startSubAreaRun
} from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';

const AREA = 'areas/act1-blood-moor';
const stores = [
  useCombatStore, usePlayerStore, useInventoryStore,
  useMapStore, useMercStore, useFormationStore
] as const;

function reset(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}

function start(attack: number): number {
  const fresh = createMockPlayer('OutcomeBoundary', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, comboOrder: [] });
  // Imported integration gear, not earned power or a balance sample. L1 attack
  // floors 22.5 + this flat modifier; the cap supplies another 7 defense.
  const cap: Item = {
    id: 'outcome-fixture-cap', baseId: 'items/base/helm-cap', rarity: 'rare', level: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'imported-wiring-fixture', values: new Map([
      ['statMods.attack', attack - 22], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  const equipped = usePlayerStore.getState().player;
  if (!equipped) throw new Error('Missing equipped fixture player');
  // Equipping does not heal; restore the fixture's intended starting resources explicitly.
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: {
    ...equipped.derivedStats, life: 1_000_000, mana: fresh.derivedStats.mana
  } });
  useMapStore.getState().setCurrentLocation(1, AREA);
  const handle = startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing test run');
  return handle.totalWaves;
}

function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

function progressSnapshot() {
  return structuredClone({
    player: usePlayerStore.getState().player,
    backpack: useInventoryStore.getState().backpack,
    currencies: useInventoryStore.getState().currencies,
    cleared: useMapStore.getState().clearedSubAreas,
    rewards: useCombatStore.getState().runRewards
  });
}

beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});

afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  vi.restoreAllMocks();
});

describe('qualified production wave finalization', () => {
  it('terminates a real surviving-hero draw without rewards, advancement or clear', () => {
    start(0);
    const before = progressSnapshot();
    const combat = useCombatStore.getState();
    expect(combat.outcome?.winner).toBeNull();
    expect(combat.outcome?.finalPlayerTeam[0]?.life).toBeGreaterThan(0);
    expect(combat.recordedEvents[combat.recordedEvents.length - 1]).toMatchObject({
      kind: 'end', winner: null, simClockMs: 60_000
    });
    const clear = vi.spyOn(useMapStore.getState(), 'markCleared');
    drain();

    expect(advanceWaveOrFinish()).toBe('defeat');
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(useCombatStore.getState()).toMatchObject({
      currentWave: 1, runVictory: false, runDefeat: true,
      outcome: { winner: null }
    });
    expect(progressSnapshot()).toEqual(before);
    expect(clear).not.toHaveBeenCalled();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(progressSnapshot()).toEqual(before);
  });

  it('does not commit a precomputed winning outcome before playback completes', () => {
    start(100_000);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    const combatBefore = useCombatStore.getState();
    const before = progressSnapshot();

    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useCombatStore.getState()).toBe(combatBefore);
    expect(progressSnapshot()).toEqual(before);
    expect(hasActiveSubAreaRun()).toBe(true);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const next = useCombatStore.getState();
    const after = progressSnapshot();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useCombatStore.getState()).toBe(next);
    expect(progressSnapshot()).toEqual(after);
  });

  it('marks exactly one clear only after every actual wave victory, then stays idempotent', () => {
    const totalWaves = start(100_000);
    const clear = vi.spyOn(useMapStore.getState(), 'markCleared');
    expect(totalWaves).toBeGreaterThan(1);
    for (let wave = 1; wave <= totalWaves; wave++) {
      expect(useCombatStore.getState().currentWave).toBe(wave);
      expect(useCombatStore.getState().outcome?.winner).toBe('player');
      expect(clear).not.toHaveBeenCalled();
      drain();
      expect(advanceWaveOrFinish()).toBe(wave === totalWaves ? 'victory' : 'next-wave');
    }
    expect(clear).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledWith(AREA);
    expect(useMapStore.getState().isCleared(AREA)).toBe(true);
    expect(useCombatStore.getState()).toMatchObject({ runVictory: true, runDefeat: false });
    expect(hasActiveSubAreaRun()).toBe(false);
    const before = progressSnapshot();
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(progressSnapshot()).toEqual(before);
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it.each(['draw', 'enemy-winner', 'dead-hero'] as const)(
    'rejects a final %s outcome and preserves rewards from earlier real victories', (failure) => {
      const totalWaves = start(100_000);
      const clear = vi.spyOn(useMapStore.getState(), 'markCleared');
      for (let wave = 1; wave < totalWaves; wave++) {
        expect(useCombatStore.getState().outcome?.winner).toBe('player');
        drain();
        if (wave === totalWaves - 1) {
          // Inject the controlled final result before publication establishes authority.
          const original = combatEngine.runBattleRecorded;
          vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(input => {
            const actual = original(input);
            return { ...actual, result: { ...actual.result,
              winner: failure === 'draw' ? null : failure === 'enemy-winner' ? 'enemy' : 'player',
              playerTeam: actual.result.playerTeam.map(unit => ({
                ...unit, life: failure === 'dead-hero' ? 0 : unit.life
              }))
            } };
          });
        }
        expect(advanceWaveOrFinish()).toBe('next-wave');
      }
      drain();
      const final = useCombatStore.getState().outcome;
      if (!final) throw new Error('Missing final outcome');
      expect(final.winner).toBe(failure === 'draw' ? null : failure === 'enemy-winner' ? 'enemy' : 'player');
      if (failure === 'dead-hero') expect(final.finalPlayerTeam[0]?.life).toBe(0);
      else expect(final.finalPlayerTeam[0]?.life).toBeGreaterThan(0);
      const before = progressSnapshot();
      expect(before.player?.level).toBeGreaterThan(1);

      expect(advanceWaveOrFinish()).toBe('defeat');
      expect(hasActiveSubAreaRun()).toBe(false);
      expect(useCombatStore.getState()).toMatchObject({ runVictory: false, runDefeat: true });
      expect(progressSnapshot()).toEqual(before);
      expect(clear).not.toHaveBeenCalled();
      expect(advanceWaveOrFinish()).toBe('idle');
      expect(progressSnapshot()).toEqual(before);
    }
  );
});
