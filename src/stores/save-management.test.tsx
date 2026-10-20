/** Production persistence and settings, with only IndexedDB IO replaced. */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import type { SaveRecord } from './save-adapter';
import type { SaveCurrent } from '@/engine/types/save';

const disk = vi.hoisted(() => {
  const state: { record: SaveRecord | undefined } = { record: undefined };
  return {
    state,
    get: vi.fn(() => Promise.resolve(state.record)),
    put: vi.fn((record: SaveRecord) => {
      state.record = structuredClone(record);
      return Promise.resolve();
    }),
    delete: vi.fn(() => {
      state.record = undefined;
      return Promise.resolve();
    })
  };
});
vi.mock('dexie', () => ({
  default: class {
    version() {
      return {
        stores: () => {
          Object.assign(this, { saves: { get: disk.get, put: disk.put, delete: disk.delete } });
        }
      };
    }
  }
}));

import i18n from '@/i18n';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useCombatStore } from './combatStore';
import { createRng } from '@/engine/rng';
import { rollItem, __resetRollItemSeqForTests } from '@/engine/loot/rollItem';
import { loadItemBases } from '@/data/loaders/loot';
import { SaveFailureNotice } from '@/ui/SaveFailureNotice';
import {
  __resetPersistenceForTests,
  snapshotStores,
  startAutoSave,
  flushSave,
  hydrateFromSave,
  importIntoStores,
  exportCurrentSave,
  deleteCurrentSave,
  initPersistence,
  useSaveStatusStore
} from './persistence';
import { importSave, loadSave, saveSave } from './save-adapter';

function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Required test fixture missing');
  return value;
}

function showSettings() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SettingsScreen />
      </MemoryRouter>
    </I18nextProvider>
  );
}

beforeEach(async () => {
  __resetPersistenceForTests();
  for (const store of [
    usePlayerStore,
    useInventoryStore,
    useMercStore,
    useMapStore,
    useMetaStore,
    useFormationStore
  ])
    store.getState().reset();
  disk.state.record = undefined;
  vi.clearAllMocks();
  await i18n.changeLanguage('en');
  useMetaStore.getState().setLocale('en');
  usePlayerStore.getState().setPlayer(createMockPlayer('Current', 'sorceress'));
});
afterEach(() => {
  __resetPersistenceForTests();
  vi.useRealTimers();
});

describe('save management integrity', () => {
  it('Save writes the latest live state even before the first autosave', async () => {
    useInventoryStore.getState().addCurrency('rune-shard', 17);
    showSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Saved');
    expect((await loadSave())?.inventory.currencies['rune-shard']).toBe(17);
    expect((await loadSave())?.player.name).toBe('Current');
  });

  it('Save replaces a stale stored snapshot with every latest domain', async () => {
    await saveSave(required(snapshotStores()));
    useInventoryStore.getState().addCurrency('rune-shard', 19);
    useMapStore.getState().markCleared('blood-moor');
    useFormationStore.getState().setPlayerPosition({ row: 0, col: 2 });
    showSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Saved');
    const saved = await loadSave();
    expect(saved?.inventory.currencies['rune-shard']).toBe(19);
    expect(saved?.map.clearedSubAreas).toEqual(['blood-moor']);
    expect(saved?.formation.playerPosition).toEqual({ row: 0, col: 2 });
  });

  it('Import immediately replaces live state and survives a pending autosave', async () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('Imported', 'amazon'));
    useInventoryStore.getState().addCurrency('rune-shard', 41);
    const imported = required(snapshotStores());
    usePlayerStore.getState().setPlayer(createMockPlayer('Current', 'sorceress'));
    useInventoryStore.getState().reset();
    startAutoSave();
    useInventoryStore.getState().addCurrency('rune-shard', 2);
    showSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Import Save' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: JSON.stringify(imported) } });
    fireEvent.click(required(screen.getAllByRole('button', { name: 'Import Save' }).at(-1)));
    await screen.findByText('Save imported');
    expect(usePlayerStore.getState().player?.name).toBe('Imported');
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(41);
    await act(async () => {
      await flushSave();
    });
    expect((await loadSave())?.player).toEqual(imported.player);
  });

  it('does not let an already-started delayed write overwrite an import', async () => {
    let release!: () => void;
    disk.put.mockImplementationOnce(async (record: SaveRecord) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      disk.state.record = structuredClone(record);
    });
    const oldWrite = flushSave();
    await waitFor(() => {
      expect(release).toBeTypeOf('function');
    });
    const imported = {
      ...required(snapshotStores()),
      player: { ...required(usePlayerStore.getState().player), name: 'Imported' }
    };
    const replacement = importIntoStores(JSON.stringify(imported));
    // Import is waiting for the old write, and has not prematurely changed memory.
    expect(usePlayerStore.getState().player?.name).toBe('Current');
    release();
    await oldWrite;
    await replacement;
    expect((await loadSave())?.player.name).toBe('Imported');
    expect(usePlayerStore.getState().player?.name).toBe('Imported');
  });

  it('round-trips all v7 domains, over-cap contents and item identity', async () => {
    const player = required(usePlayerStore.getState().player);
    const item = {
      id: 'it-1-zz',
      baseId: 'items/base/weapon-bow',
      rarity: 'magic' as const,
      level: 1,
      identified: true,
      equipped: false,
      affixes: [{ id: 'affixes/prefix/attack', tier: 0, rolledValue: 3 }]
    };
    useInventoryStore.setState({
      backpack: Array.from({ length: 101 }, (_, n) => ({ ...item, id: `legacy-${String(n)}` })),
      stash: [item],
      equipped: { weapon: item },
      currencies: { 'rune-shard': 99 }
    });
    useMercStore.setState({
      ownedMercs: [{ ...player, id: 'merc-1', type: 'mercenary', archetype: 'front', rarity: 'R' }],
      fieldedMercId: 'merc-1',
      mercEquipment: { 'merc-1': { weapon: item } },
      mercProgress: { 'merc-1': { experience: 23, experienceToNextLevel: 50 } }
    });
    useMapStore.getState().setCurrentLocation(2, 'lut-gholein');
    useMapStore.getState().markCleared('blood-moor');
    useMapStore.getState().updateQuestProgress('quest-1', {
      status: 'completed',
      objectives: { kill: true },
      rewardClaimed: true
    });
    useMetaStore
      .getState()
      .updateGachaState({ currency: 13, pityCounter: 9, ownedMercIds: ['merc-1'] });
    useMetaStore
      .getState()
      .updateIdleState({ activeMultiplier: 1.25, multiplierSecondsRemaining: 3600 });
    useFormationStore.getState().setPlayerPosition({ row: 0, col: 2 });
    const exported = required(exportCurrentSave());
    const expected = JSON.parse(exported) as unknown;
    usePlayerStore.getState().reset();
    useInventoryStore.getState().reset();
    useMercStore.getState().reset();
    useMapStore.getState().reset();
    useMetaStore.getState().reset();
    useFormationStore.getState().reset();
    useCombatStore.setState({ inCombat: true });
    __resetRollItemSeqForTests();
    await importIntoStores(exported);
    expect(await loadSave()).toEqual(expected);
    const { timestamp: _timestamp, ...restored } = required(snapshotStores());
    const { timestamp: _oldTimestamp, ...original } = JSON.parse(exported) as ReturnType<
      typeof snapshotStores
    > &
      object;
    expect(restored).toEqual(original);
    expect(useCombatStore.getState().inCombat).toBe(false);
    const generated = rollItem(
      { baseId: item.baseId, rarity: 'normal', ilvl: 1 },
      { bases: loadItemBases(), affixes: [] },
      createRng(1)
    );
    expect(generated).toBeDefined();
    expect(parseInt(required(required(generated).id.split('-').at(-1)), 36)).toBeGreaterThan(
      parseInt('zz', 36)
    );
  });

  it('exports latest unsaved progress even when storage rejects writes', async () => {
    useInventoryStore.getState().addCurrency('rune-shard', 27);
    disk.put.mockRejectedValueOnce(new DOMException('Full', 'QuotaExceededError'));
    await expect(flushSave()).rejects.toThrow('Full');
    expect(
      (JSON.parse(required(exportCurrentSave())) as SaveCurrent).inventory.currencies['rune-shard']
    ).toBe(27);
    expect(useSaveStatusStore.getState().error).toContain('Full');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <SaveFailureNotice />
        </MemoryRouter>
      </I18nextProvider>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('export a backup');
    await act(async () => {
      await flushSave();
    });
    expect(useSaveStatusStore.getState().error).toBeNull();
    expect((await loadSave())?.inventory.currencies['rune-shard']).toBe(27);
  });

  it('failed import preserves every live slice and disk, then the queue can recover', async () => {
    const before = required(snapshotStores());
    await saveSave(before);
    disk.put.mockRejectedValueOnce(new DOMException('Full', 'QuotaExceededError'));
    const imported = { ...before, player: { ...before.player, name: 'Imported' } };
    await expect(importIntoStores(JSON.stringify(imported))).rejects.toThrow('Full');
    expect(await loadSave()).toEqual(before);
    expect({ ...snapshotStores(), timestamp: before.timestamp }).toEqual(before);
    await importIntoStores(JSON.stringify(imported));
    expect(usePlayerStore.getState().player?.name).toBe('Imported');
  });

  it('recovery navigation keeps unsaved progress available for export', async () => {
    useInventoryStore.getState().addCurrency('rune-shard', 73);
    disk.put.mockRejectedValueOnce(new Error('Storage unavailable'));
    await expect(flushSave()).rejects.toThrow('Storage unavailable');
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter
          initialEntries={['/town']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/town" element={<SaveFailureNotice />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    );
    fireEvent.click(screen.getByRole('link', { name: 'Export Save' }));
    expect(await screen.findByTestId('settings-screen')).toBeVisible();
    expect(
      (JSON.parse(required(exportCurrentSave())) as SaveCurrent).inventory.currencies['rune-shard']
    ).toBe(73);
    expect(disk.state.record).toBeUndefined();
  });

  it('live legacy Maps survive export, import and disk hydration', async () => {
    useInventoryStore.setState({
      stash: [
        {
          id: 'legacy-map',
          baseId: 'items/base/weapon-bow',
          rarity: 'magic',
          level: 1,
          identified: true,
          equipped: false,
          affixes: [{ affixId: 'legacy-affix', values: new Map([['attack', 12]]) }]
        }
      ]
    });
    const exported = required(exportCurrentSave());
    useInventoryStore.getState().reset();
    await importIntoStores(exported);
    const affix = useInventoryStore.getState().stash[0]?.affixes?.[0];
    expect(affix && 'values' in affix && affix.values.get('attack')).toBe(12);
    useInventoryStore.getState().reset();
    expect(await hydrateFromSave()).toBe(true);
    const loaded = useInventoryStore.getState().stash[0]?.affixes?.[0];
    expect(loaded && 'values' in loaded && loaded.values.get('attack')).toBe(12);
  });

  it('unsafe imported levels preserve both the live character and stored progress', async () => {
    const before = required(snapshotStores());
    await saveSave(before);
    await expect(
      importIntoStores(JSON.stringify({ ...before, player: { ...before.player, level: 1e300 } }))
    ).rejects.toThrow('Invalid save');
    expect(await loadSave()).toEqual(before);
    expect(usePlayerStore.getState().player).toEqual(before.player);
  });

  it('corrupt stored progress is protected from autosave until valid recovery', async () => {
    vi.useFakeTimers();
    const corrupted: SaveRecord = { id: 'current', version: 7, timestamp: 1, data: { version: 7 } };
    disk.state.record = corrupted;
    await initPersistence();
    useInventoryStore.getState().addCurrency('rune-shard', 1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(disk.state.record).toEqual(corrupted);
    expect(useSaveStatusStore.getState().error).toBeTruthy();
    await expect(flushSave()).rejects.toThrow('recovery');
    await importIntoStores(JSON.stringify(snapshotStores()));
    useInventoryStore.getState().addCurrency('rune-shard', 1);
    await vi.advanceTimersByTimeAsync(1000);
    expect((await loadSave())?.inventory.currencies['rune-shard']).toBe(2);
  });

  it('failed delete reports failure and resumes the canceled latest autosave', async () => {
    vi.useFakeTimers();
    await saveSave(required(snapshotStores()));
    startAutoSave();
    useInventoryStore.getState().addCurrency('rune-shard', 32);
    disk.delete.mockRejectedValueOnce(new Error('Delete unavailable'));
    await expect(deleteCurrentSave()).rejects.toThrow('Delete unavailable');
    expect(useSaveStatusStore.getState().error).toContain('Delete unavailable');
    expect(usePlayerStore.getState().player?.name).toBe('Current');
    await vi.advanceTimersByTimeAsync(1000);
    expect((await loadSave())?.inventory.currencies['rune-shard']).toBe(32);
    expect(useSaveStatusStore.getState().error).toBeNull();
  });

  it('delete waits for older writes and clears all character domains', async () => {
    await saveSave(required(snapshotStores()));
    useMetaStore.getState().addGachaCurrency(10);
    startAutoSave();
    useInventoryStore.getState().addCurrency('rune-shard', 1);
    await deleteCurrentSave();
    await flushSave();
    expect(await loadSave()).toBeNull();
    expect(usePlayerStore.getState().player).toBeNull();
    expect(useInventoryStore.getState().currencies).toEqual({});
    expect(useMercStore.getState().ownedMercs).toEqual([]);
    expect(useMetaStore.getState().gachaState.currency).toBe(0);
  });

  it.each(['null', '[]', '{"version":7}', '{"version":8}', '{"version":6.5}', '{"version":-1}'])(
    'rejects invalid import %s without replacing the saved character',
    async (json) => {
      const original = required(snapshotStores());
      await saveSave(original);
      await expect(importSave(json)).rejects.toThrow();
      expect(await loadSave()).toEqual(original);
      expect(usePlayerStore.getState().player).toEqual(original.player);
    }
  );

  it('rejects corrupt current saves before partially hydrating any stores', async () => {
    const original = required(snapshotStores());
    disk.state.record = {
      id: 'current',
      version: 7,
      timestamp: 1,
      data: { version: 7, player: { name: 'Broken' } } as unknown as SaveRecord['data']
    };
    expect(await hydrateFromSave()).toBe(false);
    expect(snapshotStores()?.player).toEqual(original.player);
    expect(snapshotStores()?.inventory).toEqual(original.inventory);
  });

  it('shows a write failure without claiming success or changing the old disk state', async () => {
    const original = required(snapshotStores());
    await saveSave(original);
    disk.put.mockRejectedValueOnce(new DOMException('Full', 'QuotaExceededError'));
    useInventoryStore.getState().addCurrency('rune-shard', 23);
    showSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Save failed/));
    expect(screen.queryByText('Saved')).toBeNull();
    expect(await loadSave()).toEqual(original);
    expect(useInventoryStore.getState().currencies['rune-shard']).toBe(23);
  });
});
