/**
 * Persistence orchestration: debounced auto-save + load-on-init.
 *
 * Subscribes to every domain Zustand store and, on any mutation, debounces a
 * write to IndexedDB via {@link saveSave}. On startup, reads any existing save
 * (running migrations as needed) and rehydrates each store; suppresses the
 * resulting save events to avoid a feedback loop.
 *
 * Lives in `src/stores/` (allowed to import zustand) — not in `engine/`.
 *
 * @module stores/persistence
 */

import { create } from 'zustand';
import { buildSave } from '@/engine/save';
import type { SaveCurrent } from '@/engine/types/save';
import { hasSave, loadSave, saveSave } from './save-adapter';
import { useCombatStore } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { usePlayerStore } from './playerStore';

/** Debounce window for auto-save writes, in milliseconds. */
export const AUTO_SAVE_DEBOUNCE_MS = 500;

/**
 * Hydration lifecycle states surfaced to the UI.
 *
 * - `idle`    — persistence not yet initialized.
 * - `loading` — IndexedDB read in flight.
 * - `ready`   — hydration finished (or no save existed).
 * - `error`   — load/migration failed; payload available in `error`.
 */
export type HydrationStatus = 'idle' | 'loading' | 'ready' | 'error';

interface HydrationState {
  status: HydrationStatus;
  error: string | null;
  setStatus: (status: HydrationStatus, error?: string | null) => void;
}

/**
 * Tiny store exposing hydration status. UI can show a loader / "save corrupted"
 * banner without crashing the tree.
 */
export const useHydrationStore = create<HydrationState>((set) => ({
  status: 'idle',
  error: null,
  setStatus: (status, error = null) => { set({ status, error }); }
}));

let suppressSaves = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const unsubs: (() => void)[] = [];

/**
 * Build a {@link SaveCurrent} snapshot from current store state.
 * Returns null when no character exists (skip pre-creation saves).
 */
export function snapshotStores(): SaveCurrent | null {
  const player = usePlayerStore.getState().player;
  if (!player) return null;

  const inv = useInventoryStore.getState();
  const merc = useMercStore.getState();
  const map = useMapStore.getState();
  const meta = useMetaStore.getState();

  return buildSave({
    player,
    inventory: {
      backpack: inv.backpack,
      stash: inv.stash,
      equipped: inv.equipped,
      currencies: inv.currencies
    },
    mercs: {
      ownedMercs: merc.ownedMercs,
      fieldedMercId: merc.fieldedMercId
    },
    map: {
      currentAct: map.currentAct,
      currentSubAreaId: map.currentSubAreaId,
      discoveredAreas: map.discoveredAreas,
      questProgress: map.questProgress
    },
    meta: {
      settings: meta.settings,
      idleState: meta.idleState,
      gachaState: meta.gachaState
    }
  });
}

function scheduleSave(): void {
  if (suppressSaves) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushSave();
  }, AUTO_SAVE_DEBOUNCE_MS);
}

/**
 * Force the pending debounced save (if any) to flush immediately.
 * Returns the save promise, or `null` if there's nothing to write.
 */
export function flushSave(): Promise<void> | null {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const snap = snapshotStores();
  if (!snap) return null;
  return saveSave(snap).catch((err: unknown) => {
    // Swallow — IndexedDB may be unavailable in private mode etc.
    // We don't want a write failure to kill the running game.
    // eslint-disable-next-line no-console
    console.warn('[persistence] auto-save failed:', err);
  });
}

/**
 * Subscribe to all relevant Zustand stores. Idempotent — calling twice is safe.
 *
 * The `combatStore` is intentionally **not** subscribed: its persistent toggles
 * (auto-mode) live in `metaStore.settings.autoCombat`; the combat log/turn
 * data is transient.
 */
export function startAutoSave(): void {
  stopAutoSave();
  // Listener signatures accept `(state, prev) => void`; we only care that
  // *something* changed, so we ignore params.
  const sub = (): void => { scheduleSave(); };
  unsubs.push(usePlayerStore.subscribe(sub));
  unsubs.push(useInventoryStore.subscribe(sub));
  unsubs.push(useMapStore.subscribe(sub));
  unsubs.push(useMercStore.subscribe(sub));
  unsubs.push(useMetaStore.subscribe(sub));
  // Touch the combat store import so eslint doesn't flag it as unused — we
  // explicitly chose not to subscribe.
  void useCombatStore;
}

/** Tear down all subscriptions and cancel any pending debounced write. */
export function stopAutoSave(): void {
  for (const u of unsubs) u();
  unsubs.length = 0;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/**
 * Read a save (if any) and push each slice into its store. Suppresses
 * auto-save events during hydration to prevent a feedback loop.
 *
 * Returns true when a save was hydrated, false when no save existed.
 * Sets `useHydrationStore.error` and returns false on failure.
 */
export async function hydrateFromSave(): Promise<boolean> {
  useHydrationStore.getState().setStatus('loading');
  try {
    const data = await loadSave();
    if (!data) {
      useHydrationStore.getState().setStatus('ready');
      return false;
    }
    suppressSaves = true;
    try {
      usePlayerStore.setState({ player: data.player });
      useInventoryStore.setState({
        backpack: [...data.inventory.backpack],
        stash: [...data.inventory.stash],
        equipped: { ...data.inventory.equipped },
        currencies: { ...data.inventory.currencies }
      });
      useMercStore.setState({
        ownedMercs: [...data.mercs.ownedMercs],
        fieldedMercId: data.mercs.fieldedMercId
      });
      useMapStore.setState({
        currentAct: data.map.currentAct,
        currentSubAreaId: data.map.currentSubAreaId,
        discoveredAreas: [...data.map.discoveredAreas],
        questProgress: { ...data.map.questProgress }
      });
      useMetaStore.setState({
        settings: data.meta.settings,
        idleState: data.meta.idleState,
        gachaState: data.meta.gachaState
      });
    } finally {
      suppressSaves = false;
    }
    useHydrationStore.getState().setStatus('ready');
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    useHydrationStore.getState().setStatus('error', msg);
    return false;
  }
}

/**
 * App entry point: hydrate from disk (if a save exists) then start auto-save.
 * Always sets hydration status to a terminal state (`ready` or `error`).
 */
export async function initPersistence(): Promise<void> {
  try {
    const exists = await hasSave();
    if (exists) {
      await hydrateFromSave();
    } else {
      useHydrationStore.getState().setStatus('ready');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    useHydrationStore.getState().setStatus('error', msg);
  }
  startAutoSave();
}

/**
 * Test-only: reset internal flags so unit tests can re-init the module.
 * @internal
 */
export function __resetPersistenceForTests(): void {
  stopAutoSave();
  suppressSaves = false;
  useHydrationStore.setState({ status: 'idle', error: null });
}
