import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { hashSeed } from '@/engine/rng';
import {
  abortSubAreaRun,
  hasActiveSubAreaRun,
  refreshActivePlayerCombatConfig,
  startSubAreaRun
} from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { getIdleEliteMisses } from './idleElitePity';

const AREA = 'areas/act1-blood-moor';
const EPOCH = 1792454400000;
const ORDINAL_PERIOD = 360360;
const stores = [
  useCombatStore, usePlayerStore, useInventoryStore,
  useMapStore, useMercStore, useFormationStore
] as const;

function resetStores(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}

function start(options: Parameters<typeof startSubAreaRun>[0] = {}) {
  const handle = startSubAreaRun(options);
  if (!handle) throw new Error('Fresh production player must start a run');
  return handle;
}

function firstWave() {
  const state = useCombatStore.getState();
  return structuredClone({
    playerTeam: state.playerTeam,
    enemyTeam: state.enemyTeam,
    recordedEvents: state.recordedEvents,
    outcome: state.outcome,
    currentWave: state.currentWave,
    totalWaves: state.totalWaves,
    currentWavePresentation: state.currentWavePresentation,
    subAreaRunId: state.subAreaRunId,
    runRewards: state.runRewards
  });
}

beforeEach(() => {
  resetStores();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(EPOCH);
  usePlayerStore.getState().setPlayer(createMockPlayer('ReplaySorceress', 'sorceress'));
  useMapStore.getState().setCurrentLocation(1, AREA);
});

afterEach(() => {
  resetStores();
  useHydrationStore.getState().setStatus('idle');
  vi.restoreAllMocks();
});

describe('production sub-area replay inputs', () => {
  it('replays the real first wave from unchanged fresh state despite a changed wall clock', () => {
    const playerBefore = structuredClone(usePlayerStore.getState().player);
    const firstHandle = start({ runSeed: 123, challengeOrdinal: 0 });
    const first = firstWave();

    expect(firstHandle).toMatchObject({ runId: AREA, runSeed: 123, challengeOrdinal: 0 });
    expect(first.playerTeam).toHaveLength(1);
    expect(first.playerTeam[0]?.stats).toEqual(playerBefore?.derivedStats);
    expect(first.enemyTeam.length).toBeGreaterThan(0);
    expect(first.recordedEvents.some((event) => event.kind === 'action')).toBe(true);
    expect(first.recordedEvents[first.recordedEvents.length - 1]?.kind).toBe('end');
    expect(usePlayerStore.getState().player).toEqual(playerBefore);

    abortSubAreaRun();
    vi.mocked(Date.now).mockReturnValue(EPOCH + 90_000);
    const secondHandle = start({ runSeed: 123, challengeOrdinal: 0 });

    expect(secondHandle).toEqual(firstHandle);
    expect(firstWave()).toEqual(first);
    expect(usePlayerStore.getState().player).toEqual(playerBefore);
    expect(useMapStore.getState().clearedSubAreas).toEqual([]);
    expect(useInventoryStore.getState().backpack).toEqual([]);
  });

  it.each([
    { runSeed: 0, challengeOrdinal: 0 },
    { runSeed: 0xffffffff, challengeOrdinal: ORDINAL_PERIOD - 1 }
  ])('accepts replay boundaries %j without replacing zero with a clock seed', (options) => {
    expect(start(options)).toMatchObject(options);
    expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
  });

  it('preserves the historical wall-clock hash and skips explicit ordinals in the default sequence', () => {
    const first = start();
    expect(first.runSeed).toBe(hashSeed(`${AREA}|${String(EPOCH)}`));
    expect(start({ runSeed: 0, challengeOrdinal: ORDINAL_PERIOD - 1 }))
      .toMatchObject({ runSeed: 0, challengeOrdinal: ORDINAL_PERIOD - 1 });

    vi.mocked(Date.now).mockReturnValue(EPOCH + 1000);
    const next = start();
    expect(next.runSeed).toBe(hashSeed(`${AREA}|${String(EPOCH + 1000)}`));
    expect(next.challengeOrdinal).toBe((first.challengeOrdinal + 1) % ORDINAL_PERIOD);
  });

  it('resolves seed-only and ordinal-only options independently', () => {
    const first = start();
    const seedOnly = start({ runSeed: 42 });
    expect(seedOnly.runSeed).toBe(42);
    expect(seedOnly.challengeOrdinal).toBe((first.challengeOrdinal + 1) % ORDINAL_PERIOD);

    vi.mocked(Date.now).mockReturnValue(EPOCH + 2000);
    const ordinalOnly = start({ challengeOrdinal: 0 });
    expect(ordinalOnly.challengeOrdinal).toBe(0);
    expect(ordinalOnly.runSeed).toBe(hashSeed(`${AREA}|${String(EPOCH + 2000)}`));
    expect(start().challengeOrdinal).toBe((first.challengeOrdinal + 2) % ORDINAL_PERIOD);
  });

  it.each([
    { runSeed: -1 }, { runSeed: 1.5 }, { runSeed: NaN },
    { runSeed: Infinity }, { runSeed: -Infinity }, { runSeed: 0x100000000 },
    { challengeOrdinal: -1 }, { challengeOrdinal: 1.5 }, { challengeOrdinal: NaN },
    { challengeOrdinal: Infinity }, { challengeOrdinal: -Infinity },
    { challengeOrdinal: ORDINAL_PERIOD },
    { runSeed: 7, challengeOrdinal: ORDINAL_PERIOD },
    { runSeed: 0x100000000, challengeOrdinal: 0 }
  ])('rejects invalid replay inputs %j before altering a live run or consuming its ordinal', (options) => {
    const ordinary = start();
    const before = stores.map((store) => store.getState());
    const pityBefore = getIdleEliteMisses();
    const recording = firstWave();

    expect(() => startSubAreaRun({ ...options, subAreaId: 'areas/act1-den-of-evil' }))
      .toThrow(RangeError);
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(getIdleEliteMisses()).toBe(pityBefore);
    expect(hasActiveSubAreaRun()).toBe(true);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(firstWave()).toEqual(recording);
    expect(start().challengeOrdinal).toBe((ordinary.challengeOrdinal + 1) % ORDINAL_PERIOD);
  });

  it('keeps no-player calls null without consuming an ordinal or altering combat', () => {
    const first = start();
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing fresh player');
    abortSubAreaRun();
    usePlayerStore.getState().reset();
    const combatBefore = useCombatStore.getState();

    expect(startSubAreaRun()).toBeNull();
    expect(startSubAreaRun({ runSeed: 0, challengeOrdinal: 0 })).toBeNull();
    expect(useCombatStore.getState()).toBe(combatBefore);
    expect(hasActiveSubAreaRun()).toBe(false);

    usePlayerStore.getState().setPlayer(player);
    expect(start().challengeOrdinal).toBe((first.challengeOrdinal + 1) % ORDINAL_PERIOD);
  });
});
