/** Real creation screen/stores/persistence; only IndexedDB IO is substituted. */
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { SaveCurrent } from '@/engine/types/save';

const disk = vi.hoisted(() => {
  const writes: SaveCurrent[] = [];
  return {
    writes,
    load: vi.fn((): Promise<SaveCurrent | null> => Promise.resolve(null)),
    save: vi.fn((save: SaveCurrent): Promise<void> => {
      writes.push(structuredClone(save));
      return Promise.resolve();
    })
  };
});
vi.mock('@/stores/save-adapter', () => ({
  loadSave: disk.load,
  saveSave: disk.save,
  deleteSave: vi.fn(),
  hasSave: vi.fn(),
  exportSave: vi.fn(),
  importSave: vi.fn()
}));

import i18n from '@/i18n';
import { CharacterCreate } from './CharacterCreate';
import { createMockPlayer } from './createMockPlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useMetaStore } from '@/stores/metaStore';
import { beginIronGolemDebit, beginWaveTransition, endIronGolemDebit, endWaveTransition } from '@/stores/waveTransitionGuard';
import {
  AUTO_SAVE_DEBOUNCE_MS, __resetPersistenceForTests, exportCurrentSave,
  hydrateFromSave, importIntoStores, isReplacingSave, snapshotStores,
  startAutoSave, useHydrationStore
} from '@/stores/persistence';

const realEquip = useInventoryStore.getState().equipItem;

function deferred<T>() {
  let complete: (value: T) => void = () => { throw new Error('Deferred not initialized'); };
  const promise = new Promise<T>((resolve) => { complete = resolve; });
  return { promise, complete };
}

function showValidCreation() {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/character/new']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/character/new" element={<CharacterCreate />} />
          <Route path="/town" element={<div data-testid="town-route">town</div>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
  fireEvent.click(screen.getByTestId('class-amazon'));
  fireEvent.change(screen.getByTestId('character-name-input'), { target: { value: 'Transient' } });
}

function savedCharacter() {
  usePlayerStore.getState().setPlayer(createMockPlayer('Saved', 'sorceress'));
  useInventoryStore.setState({ equipped: { weapon: null }, currencies: { wishstone: 17 } });
  const save = snapshotStores();
  const json = exportCurrentSave();
  assert(save && json);
  usePlayerStore.getState().reset();
  useInventoryStore.getState().reset();
  return { save, json };
}

beforeEach(async () => {
  __resetPersistenceForTests();
  for (const store of [usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore]) store.getState().reset();
  disk.writes.length = 0;
  disk.load.mockReset().mockResolvedValue(null);
  disk.save.mockClear();
  await i18n.changeLanguage('en');
  useMetaStore.getState().setLocale('en');
  useHydrationStore.getState().setStatus('ready');
});

afterEach(() => {
  __resetPersistenceForTests();
  act(() => { useInventoryStore.setState({ equipItem: realEquip }); });
  vi.useRealTimers();
});

describe('character creation persistence boundaries', () => {
  it('shows creation refusal during an exact debit and permits retry after release', () => {
    showValidCreation();
    const stores = [usePlayerStore, useInventoryStore, useMercStore, useMapStore, useMetaStore] as const;
    const before = stores.map(store => store.getState());
    const notified = vi.fn();
    const stops = stores.map(store => store.subscribe(notified));
    const lease = beginWaveTransition(true);
    beginIronGolemDebit(lease);
    try {
      fireEvent.click(screen.getByTestId('character-start-btn'));
      expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('common:error'));
      expect(screen.queryByTestId('town-route')).not.toBeInTheDocument();
      stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(notified).not.toHaveBeenCalled();
      expect(disk.save).not.toHaveBeenCalled();
      expect(disk.load).not.toHaveBeenCalled();
    } finally {
      stops.forEach(stop => { stop(); });
      endIronGolemDebit(lease);
      endWaveTransition(lease);
    }
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(screen.getByTestId('town-route')).toBeVisible();
    expect(usePlayerStore.getState().player?.name).toBe('Transient');
  });

  it('does not transiently create while the actual saved character is loading', async () => {
    const { save } = savedCharacter();
    const read = deferred<SaveCurrent | null>();
    disk.load.mockReturnValueOnce(read.promise);
    const hydration = hydrateFromSave();
    await act(async () => { await Promise.resolve(); });
    const duringStatus = useHydrationStore.getState().status;
    showValidCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    const duringPlayer = usePlayerStore.getState().player;
    const duringInventory = useInventoryStore.getState();
    const duringTown = screen.queryByTestId('town-route') !== null;
    await act(async () => { read.complete(save); await hydration; });
    expect(duringStatus).toBe('loading');
    expect(duringPlayer).toBeNull();
    expect(duringInventory.backpack).toEqual([]);
    expect(duringInventory.equipped).toEqual({});
    expect(duringTown).toBe(false);
    expect(usePlayerStore.getState().player?.id).toBe(save.player.id);
    expect(usePlayerStore.getState().player?.name).toBe('Saved');
    expect(useInventoryStore.getState().equipped).toEqual({ weapon: null });
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 17 });
    expect(useHydrationStore.getState().status).toBe('ready');
  });

  it('does not transiently create during actual import even while hydration status is ready', async () => {
    const { save, json } = savedCharacter();
    showValidCreation();
    const write = deferred<undefined>();
    disk.save.mockImplementationOnce(() => write.promise);
    const importing = importIntoStores(json);
    await act(async () => { await Promise.resolve(); });
    const duringStatus = useHydrationStore.getState().status;
    const duringReplacement = isReplacingSave();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    const duringPlayer = usePlayerStore.getState().player;
    const duringTown = screen.queryByTestId('town-route') !== null;
    await act(async () => { write.complete(undefined); await importing; });
    expect(duringStatus).toBe('ready');
    expect(duringReplacement).toBe(true);
    expect(duringPlayer).toBeNull();
    expect(duringTown).toBe(false);
    expect(usePlayerStore.getState().player?.id).toBe(save.player.id);
    expect(usePlayerStore.getState().player?.name).toBe('Saved');
    expect(useInventoryStore.getState().equipped).toEqual({ weapon: null });
    expect(useInventoryStore.getState().currencies).toEqual({ wishstone: 17 });
    expect(isReplacingSave()).toBe(false);
  });

  it('autosaves only the final canonical singleton and its equipment mirror', async () => {
    vi.useFakeTimers();
    startAutoSave();
    showValidCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    expect(disk.writes).toEqual([]);
    await act(async () => { await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 1); });
    expect(disk.writes).toHaveLength(1);
    const saved = disk.writes[0];
    assert(saved);
    expect(saved.player.equipment).toEqual([saved.inventory.equipped.weapon]);
    expect(saved.player.derivedStats.attack).toBe(35);
    expect(saved.inventory.equipped.weapon).toMatchObject({ baseId: 'items/base/weapon-bow-training', baseRolls: { attack: 13 } });
    expect(saved.inventory.backpack).toEqual([]);
    expect(Object.values(saved.inventory.equipped).filter(Boolean)).toHaveLength(1);
  });

  it('does not autosave a partial player after equip refusal and saves one successful retry', async () => {
    vi.useFakeTimers();
    startAutoSave();
    useInventoryStore.setState({ equipItem: () => ({ ok: false, reason: 'backpack_full' }) });
    showValidCreation();
    fireEvent.click(screen.getByTestId('character-start-btn'));
    await act(async () => { await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 1); });
    expect(disk.writes).toEqual([]);
    expect(usePlayerStore.getState().player).toBeNull();
    expect(screen.queryByTestId('town-route')).not.toBeInTheDocument();
    act(() => { useInventoryStore.setState({ equipItem: realEquip }); });
    fireEvent.click(screen.getByTestId('character-start-btn'));
    await act(async () => { await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS + 1); });
    expect(disk.writes).toHaveLength(1);
    expect(disk.writes[0]?.player.equipment).toEqual([disk.writes[0]?.inventory.equipped.weapon]);
    expect(disk.writes[0]?.inventory.equipped.weapon?.baseRolls).toEqual({ attack: 13 });
  });
});
