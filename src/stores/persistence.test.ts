/**
 * Tests for the auto-save / hydration lifecycle.
 *
 * Mocks the Dexie-backed save-adapter to avoid IndexedDB.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SaveCurrent } from '@/engine/types/save';

const mockSaveStore: { current: SaveCurrent | null } = { current: null };
const saveSpy = vi.fn((data: SaveCurrent) => {
  mockSaveStore.current = data;
  return Promise.resolve();
});
const loadSpy = vi.fn(() => Promise.resolve(mockSaveStore.current));
const hasSpy = vi.fn(() => Promise.resolve(mockSaveStore.current !== null));

vi.mock('./save-adapter', () => ({
  saveSave: (d: SaveCurrent) => saveSpy(d),
  loadSave: () => loadSpy(),
  hasSave: () => hasSpy(),
  exportSave: vi.fn(),
  importSave: vi.fn(),
  deleteSave: vi.fn()
}));

import {
  AUTO_SAVE_DEBOUNCE_MS,
  __resetPersistenceForTests,
  flushSave,
  hydrateFromSave,
  initPersistence,
  snapshotStores,
  startAutoSave,
  stopAutoSave,
  useHydrationStore
} from './persistence';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMetaStore } from './metaStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';

function fakePlayer(): NonNullable<ReturnType<typeof usePlayerStore.getState>['player']> {
  return {
    id: 'p1', name: 'Hero', type: 'player', team: 'player', level: 1,
    coreStats: { strength: 1, dexterity: 1, vitality: 1, energy: 1 },
    derivedStats: {}, statusEffects: [], cooldowns: [], skills: [],
    comboOrder: [], alive: true, turnOrder: 0,
    classId: 'barbarian', experience: 0, statPoints: 0, skillPoints: 0
  } as unknown as NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
}

function resetAllStores(): void {
  usePlayerStore.getState().reset();
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useMercStore.getState().reset();
  useMetaStore.getState().reset();
}

describe('persistence', () => {
  beforeEach(() => {
    saveSpy.mockClear();
    loadSpy.mockClear();
    hasSpy.mockClear();
    mockSaveStore.current = null;
    __resetPersistenceForTests();
    resetAllStores();
  });

  describe('snapshotStores', () => {
    it('returns null when no character exists', () => {
      expect(snapshotStores()).toBeNull();
    });

    it('returns a SaveCurrent snapshot when player exists', () => {
      usePlayerStore.getState().setPlayer(fakePlayer());
      const snap = snapshotStores();
      expect(snap).not.toBeNull();
      expect(snap?.version).toBe(2);
      expect(snap?.player.id).toBe('p1');
    });
  });

  describe('debounced auto-save', () => {
    it('coalesces rapid mutations into a single save', async () => {
      vi.useFakeTimers();
      try {
        usePlayerStore.getState().setPlayer(fakePlayer());
        startAutoSave();

        // Fire many mutations within the debounce window.
        for (let i = 0; i < 10; i++) {
          useInventoryStore.getState().addCurrency('gold', 1);
        }
        expect(saveSpy).not.toHaveBeenCalled();

        // Advance halfway — still no save.
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
        expect(saveSpy).not.toHaveBeenCalled();

        // Cross the threshold.
        await vi.advanceTimersByTimeAsync(2);
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy.mock.calls[0]?.[0].inventory.currencies.gold).toBe(10);
      } finally {
        vi.useRealTimers();
        stopAutoSave();
      }
    });

    it('skips auto-save when no character exists', async () => {
      vi.useFakeTimers();
      try {
        startAutoSave();
        useMetaStore.getState().toggleSound();
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 10);
        expect(saveSpy).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        stopAutoSave();
      }
    });

    it('flushSave writes immediately and cancels pending timer', async () => {
      vi.useFakeTimers();
      try {
        usePlayerStore.getState().setPlayer(fakePlayer());
        startAutoSave();
        useInventoryStore.getState().addCurrency('gold', 5);
        const p = flushSave();
        expect(p).not.toBeNull();
        await p;
        expect(saveSpy).toHaveBeenCalledTimes(1);
        // Timer was cancelled; advancing time should not trigger another save.
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS * 2);
        expect(saveSpy).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
        stopAutoSave();
      }
    });

    it('stopAutoSave prevents further writes', async () => {
      vi.useFakeTimers();
      try {
        usePlayerStore.getState().setPlayer(fakePlayer());
        startAutoSave();
        stopAutoSave();
        useInventoryStore.getState().addCurrency('gold', 1);
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 10);
        expect(saveSpy).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('round-trip via stores', () => {
    it('save → reset → hydrate restores all slices', async () => {
      // 1. Set up state.
      usePlayerStore.getState().setPlayer(fakePlayer());
      useInventoryStore.getState().addCurrency('runes', 7);
      useMetaStore.getState().setLocale('en');
      useMapStore.getState().setCurrentLocation(2, 'lut-gholein');
      useMapStore.getState().discoverArea('rogue-camp');

      // 2. Snapshot + persist.
      const snap = snapshotStores();
      expect(snap).not.toBeNull();
      mockSaveStore.current = snap;

      // 3. Wipe all stores (simulate browser reload).
      resetAllStores();
      expect(usePlayerStore.getState().player).toBeNull();
      expect(useInventoryStore.getState().currencies).toEqual({});
      expect(useMetaStore.getState().settings.locale).toBe('zh-CN');

      // 4. Hydrate.
      const ok = await hydrateFromSave();
      expect(ok).toBe(true);
      expect(usePlayerStore.getState().player?.id).toBe('p1');
      expect(useInventoryStore.getState().currencies.runes).toBe(7);
      expect(useMetaStore.getState().settings.locale).toBe('en');
      expect(useMapStore.getState().currentAct).toBe(2);
      expect(useMapStore.getState().currentSubAreaId).toBe('lut-gholein');
      expect(useMapStore.getState().discoveredAreas).toContain('rogue-camp');
      expect(useHydrationStore.getState().status).toBe('ready');
    });

    it('hydration suppresses save feedback loop', async () => {
      vi.useFakeTimers();
      try {
        usePlayerStore.getState().setPlayer(fakePlayer());
        const snap = snapshotStores();
        mockSaveStore.current = snap;
        resetAllStores();

        startAutoSave();
        await hydrateFromSave();
        // Hydration mutated every store; if suppression failed, scheduleSave
        // would have queued a write. Advance past the debounce window.
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 10);
        expect(saveSpy).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        stopAutoSave();
      }
    });

    it('hydrateFromSave returns false when no save exists', async () => {
      mockSaveStore.current = null;
      const ok = await hydrateFromSave();
      expect(ok).toBe(false);
      expect(useHydrationStore.getState().status).toBe('ready');
    });

    it('hydrateFromSave reports error on load failure', async () => {
      loadSpy.mockRejectedValueOnce(new Error('corrupt'));
      const ok = await hydrateFromSave();
      expect(ok).toBe(false);
      expect(useHydrationStore.getState().status).toBe('error');
      expect(useHydrationStore.getState().error).toBe('corrupt');
    });
  });

  describe('initPersistence', () => {
    it('hydrates when save exists then starts auto-save', async () => {
      vi.useFakeTimers();
      try {
        usePlayerStore.getState().setPlayer(fakePlayer());
        mockSaveStore.current = snapshotStores();
        resetAllStores();

        await initPersistence();
        expect(usePlayerStore.getState().player?.id).toBe('p1');
        expect(useHydrationStore.getState().status).toBe('ready');

        // Auto-save should be active now.
        useInventoryStore.getState().addCurrency('gold', 1);
        await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 10);
        expect(saveSpy).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
        stopAutoSave();
      }
    });

    it('marks ready when no save exists', async () => {
      mockSaveStore.current = null;
      await initPersistence();
      expect(useHydrationStore.getState().status).toBe('ready');
    });
  });
});
