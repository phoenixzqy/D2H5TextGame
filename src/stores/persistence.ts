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
import i18n from '@/i18n';
import { buildSave, toJsonSafe } from '@/engine/save';
import { decodeSave } from '@/engine/save/validate';
import { resumeIdleBonus } from '@/engine/idle/persisted-bonus';
import { clearCombatAfterRestore } from './combatRunLifecycle';
import { seedItemSeqFromIds } from '@/engine/loot/rollItem';
import type { SaveCurrent } from '@/engine/types/save';
import { hasSave, loadSave, saveSave, deleteSave } from './save-adapter';
import { useCombatStore } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useMetaStore } from './metaStore';
import { replacePlayerAfterRestore, usePlayerStore } from './playerStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { assertRecordedWaveSnapshotAllowed, reserveRecordedWaveRestore } from './recordedWaveAccess';
import {
  deferWaveSaveIfBusy, releaseWaveRestore,
  type WaveRestoreLease
} from './waveTransitionGuard';

export { useHydrationStore, type HydrationStatus } from './hydrationStore';

/** Debounce window for auto-save writes, in milliseconds. */
export const AUTO_SAVE_DEBOUNCE_MS = 500;

/** Checkpoint quiet online sessions while browser timer callbacks can run. */
export const AUTO_SAVE_CHECKPOINT_MS = 30_000;

/** Save errors are observable without disabling gameplay or hiding write failures. */
export const useSaveStatusStore = create<{ error: string | null }>(() => ({ error: null }));

let suppressSaves = false;
let writesBlocked = false;
let replacingSave = false;

/** Whether gameplay rewards must wait for an imported character to be committed. */
export function isReplacingSave(): boolean {
  return replacingSave;
}
let timer: ReturnType<typeof setTimeout> | null = null;
let checkpointTimer: ReturnType<typeof setInterval> | null = null;
const unsubs: (() => void)[] = [];
let initialization: Promise<void> | null = null;
let restoreTail: Promise<unknown> = Promise.resolve();

/** Reserve before queueing; keep request ownership through installation/failure cleanup. */
function enqueueRestore<T>(operation: (lease: WaveRestoreLease) => Promise<T>, resumeSaves = false): Promise<T> {
  const lease = reserveRecordedWaveRestore();
  const pending = restoreTail.then(() => operation(lease)).finally(() => {
    releaseWaveRestore(lease);
    if (resumeSaves) scheduleSave();
  });
  restoreTail = pending.catch(() => undefined);
  return pending;
}

/**
 * Build a {@link SaveCurrent} snapshot from current store state.
 * Returns null when no character exists (skip pre-creation saves).
 * Throws WaveGuardError for ownership or RecordedWaveAccessError for an unsafe receipt phase.
 */
export function snapshotStores(): SaveCurrent | null {
  return buildStoreSnapshot(Date.now(), false);
}

/** Save/export share a single clock sample and the store's read-only projection. */
function projectedSnapshot(): SaveCurrent | null {
  return buildStoreSnapshot(Date.now(), true);
}

function buildStoreSnapshot(now: number, projectBonus: boolean): SaveCurrent | null {
  assertRecordedWaveSnapshotAllowed();
  const player = usePlayerStore.getState().player;
  if (!player) return null;

  const inv = useInventoryStore.getState();
  const merc = useMercStore.getState();
  const map = useMapStore.getState();
  const meta = useMetaStore.getState();
  const formation = useFormationStore.getState();

  return buildSave({
    timestamp: now,
    player,
    inventory: {
      backpack: inv.backpack,
      stash: inv.stash,
      equipped: inv.equipped,
      currencies: inv.currencies,
      materials: inv.materials,
      questItems: inv.questItems, questServices: inv.questServices, legacyGearQuarantine: inv.legacyGearQuarantine
    },
    mercs: {
      ownedMercs: merc.ownedMercs,
      fieldedMercId: merc.fieldedMercId,
      mercEquipment: merc.mercEquipment,
      mercProgress: merc.mercProgress
    },
    map: {
      currentAct: map.currentAct,
      currentSubAreaId: map.currentSubAreaId,
      discoveredAreas: map.discoveredAreas,
      clearedSubAreas: map.clearedSubAreas,
      questProgress: map.questProgress,
      questReceipts: map.questReceipts,
      questTitles: map.questTitles, questDifficulties: map.questDifficulties, selectedTitle: map.selectedTitle,
      selectedDifficulty: map.selectedDifficulty, nightmareClearedSubAreas: map.nightmareClearedSubAreas,
      challengeOrdinals: map.challengeOrdinals
    },
    meta: {
      settings: meta.settings,
      idleState: projectBonus ? meta.readIdleBonus(now) : meta.idleState,
      gachaState: meta.gachaState
    },
    formation: {
      playerPosition: formation.playerPosition,
      mercPosition: formation.mercPosition,
      summonPositions: [...formation.summonPositions]
    }
  });
}

function scheduleSave(): void {
  if (suppressSaves || replacingSave || writesBlocked || unsubs.length === 0) return;
  if (deferWaveSaveIfBusy()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushSave()?.catch(() => undefined);
  }, AUTO_SAVE_DEBOUNCE_MS);
}

/** Resume normal debounce after endWaveTransition reports a deferred save, after unwind. */
export function resumeWaveDeferredSave(): void {
  scheduleSave();
}

/**
 * Save a fresh snapshot immediately. Rejects on write failure so explicit Save
 * never reports success for a failed write; background callers handle rejection.
 * Returns null before character creation. Pending restores reject before projection.
 * Ownership/receipt-phase refusals reject before cancelling timers or changing status.
 */
export function flushSave(): Promise<void> | null {
  try { assertRecordedWaveSnapshotAllowed(); } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
  cancelPendingSave();
  if (suppressSaves || replacingSave) return null;
  if (writesBlocked) return Promise.reject(new Error('Stored save needs recovery before saving'));
  let snap: SaveCurrent | null;
  try {
    snap = projectedSnapshot();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    useSaveStatusStore.setState({ error: error.message });
    return Promise.reject(error);
  }
  if (!snap) return null;
  return saveSave(snap).then(
    () => {
      useSaveStatusStore.setState({ error: null });
    },
    (err: unknown) => {
      useSaveStatusStore.setState({ error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  );
}

/** Export live data without IO; throws typed ownership/receipt-phase refusals. */
export function exportCurrentSave(): string | null {
  const snap = projectedSnapshot();
  return snap ? JSON.stringify(toJsonSafe(snap), null, 2) : null;
}

function cancelPendingSave(): void {
  if (timer) clearTimeout(timer);
  timer = null;
}

/**
 * Validate and persist an imported character before replacing runtime state.
 * Old writes drain in adapter order; no old autosave can be scheduled meanwhile.
 * Failed storage leaves every live slice intact and resumes ordinary autosave.
 * Typed ownership/receipt-phase refusals occur before queueing or request-state changes.
 */
export async function importIntoStores(json: string): Promise<void> {
  const data = decodeSave(JSON.parse(json) as unknown);
  if (replacingSave) throw new Error('Save replacement already in progress');
  const pending = enqueueRestore(async lease => {
    suppressSaves = true;
    cancelPendingSave();
    try {
      await saveSave(data);
      applySaveToStores(data, Date.now(), lease);
      writesBlocked = false;
      useSaveStatusStore.setState({ error: null });
      useHydrationStore.getState().setStatus('ready');
    } catch (err) {
      useSaveStatusStore.setState({ error: err instanceof Error ? err.message : String(err) });
      throw err;
    } finally {
      suppressSaves = false;
      replacingSave = false;
    }
  }, true);
  replacingSave = true;
  suppressSaves = true;
  cancelPendingSave();
  return pending;
}

/** Delete then clear runtime data; typed ownership/receipt refusals occur before queueing. */
export async function deleteCurrentSave(): Promise<void> {
  if (replacingSave) throw new Error('Save replacement already in progress');
  const pending = enqueueRestore(async lease => {
    suppressSaves = true;
    cancelPendingSave();
    try {
      await deleteSave();
      clearCombatAfterRestore(lease);
      replacePlayerAfterRestore(null, lease);
      useInventoryStore.getState().reset();
      useMapStore.getState().reset();
      useMercStore.getState().reset();
      useMetaStore.getState().reset();
      useFormationStore.getState().reset();
      writesBlocked = false;
      useSaveStatusStore.setState({ error: null });
    } catch (err) {
      useSaveStatusStore.setState({ error: err instanceof Error ? err.message : String(err) });
      throw err;
    } finally {
      suppressSaves = false;
      replacingSave = false;
    }
  }, true);
  replacingSave = true;
  suppressSaves = true;
  cancelPendingSave();
  return pending;
}

/**
 * Own domain subscriptions, a periodic checkpoint, and page lifecycle listeners.
 * Idempotent — calling twice is safe. Open hidden/BFCache pages remain online;
 * these callbacks only project elapsed time, never accrue an away bonus.
 * Pagehide writes are best effort if the browser terminates before IO completes.
 *
 * The `combatStore` is intentionally **not** subscribed: its persistent toggles
 * (auto-mode) live in `metaStore.settings.autoCombat`; the combat log/turn
 * data is transient.
 */
export function startAutoSave(): void {
  stopAutoSave();
  // Listener signatures accept `(state, prev) => void`; we only care that
  // *something* changed, so we ignore params.
  const sub = (): void => {
    scheduleSave();
  };
  unsubs.push(usePlayerStore.subscribe(sub));
  unsubs.push(useInventoryStore.subscribe(sub));
  unsubs.push(useMapStore.subscribe(sub));
  unsubs.push(useMercStore.subscribe(sub));
  unsubs.push(useMetaStore.subscribe(sub));
  unsubs.push(useFormationStore.subscribe(sub));
  const checkpoint = (): void => {
    void flushSave()?.catch(() => undefined);
  };
  checkpointTimer = setInterval(checkpoint, AUTO_SAVE_CHECKPOINT_MS);
  document.addEventListener('visibilitychange', checkpoint);
  window.addEventListener('pagehide', checkpoint);
  unsubs.push(() => { document.removeEventListener('visibilitychange', checkpoint); });
  unsubs.push(() => { window.removeEventListener('pagehide', checkpoint); });
  // Touch the combat store import so eslint doesn't flag it as unused — we
  // explicitly chose not to subscribe.
  void useCombatStore;
}

/** Stop owned callbacks/debounce; already submitted adapter writes may finish. */
export function stopAutoSave(): void {
  for (const u of unsubs) u();
  unsubs.length = 0;
  cancelPendingSave();
  if (checkpointTimer !== null) clearInterval(checkpointTimer);
  checkpointTimer = null;
}

/**
 * Read a save (if any) and push each slice into its store. Suppresses
 * auto-save events during hydration to prevent a feedback loop.
 * Ordered with startup/import/delete; restores exactly, without away accrual.
 *
 * Returns true when a save was hydrated, false when no save existed.
 * Sets `useHydrationStore.error` and returns false on failure.
 * Throws typed ownership/receipt-phase refusals before queueing or changing hydration.
 */
export function hydrateFromSave(): Promise<boolean> {
  return enqueueRestore(lease => hydrateSavedCharacter(false, lease));
}

async function hydrateSavedCharacter(reconcileOffline: boolean, lease: WaveRestoreLease): Promise<boolean> {
  useHydrationStore.getState().setStatus('loading');
  cancelPendingSave();
  suppressSaves = true;
  try {
    let data = await loadSave();
    if (!data) {
      useHydrationStore.getState().setStatus('ready');
      return false;
    }
    let reconciledAt: number | undefined;
    if (reconcileOffline) {
      const now = Date.now();
      reconciledAt = now;
      data = {
        ...data,
        timestamp: now,
        meta: { ...data.meta, idleState: resumeIdleBonus(data.meta.idleState, data.timestamp, now) }
      };
      await saveSave(data);
    }
    // Bundled translations must agree with the saved preference before ready.
    await i18n.changeLanguage(data.meta.settings.locale);
    cancelPendingSave();
    suppressSaves = true;
    try {
      applySaveToStores(data, reconciledAt ?? Date.now(), lease);
      writesBlocked = false;
    } finally {
      suppressSaves = false;
    }
    useHydrationStore.getState().setStatus('ready');
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    writesBlocked = true;
    useSaveStatusStore.setState({ error: msg });
    useHydrationStore.getState().setStatus('error', msg);
    return false;
  } finally {
    suppressSaves = false;
  }
}

/** Apply a prevalidated save synchronously while autosave is suppressed. */
function applySaveToStores(data: SaveCurrent, idleBonusAnchor: number, lease: WaveRestoreLease): void {
  if (!Number.isFinite(idleBonusAnchor)) throw new RangeError('Idle bonus arithmetic requires finite numbers');
  clearCombatAfterRestore(lease);
  replacePlayerAfterRestore(data.player, lease);
  useInventoryStore.setState({
    backpack: [...data.inventory.backpack],
    stash: [...data.inventory.stash],
    equipped: { ...data.inventory.equipped },
    currencies: { ...data.inventory.currencies },
    materials: { ...data.inventory.materials },
    questItems: { ...data.inventory.questItems },
    questServices: { ...data.inventory.questServices }, legacyGearQuarantine: [...data.inventory.legacyGearQuarantine]
  });
  useMercStore.setState({
    ownedMercs: [...data.mercs.ownedMercs],
    fieldedMercId: data.mercs.fieldedMercId,
    mercEquipment: { ...data.mercs.mercEquipment },
    mercProgress: { ...data.mercs.mercProgress }
  });
  useMapStore.setState({
    currentAct: data.map.currentAct,
    currentSubAreaId: data.map.currentSubAreaId,
    discoveredAreas: [...data.map.discoveredAreas],
    clearedSubAreas: [...data.map.clearedSubAreas],
    questProgress: { ...data.map.questProgress },
    questReceipts: { ...data.map.questReceipts },
    questTitles: { ...data.map.questTitles }, questDifficulties: { ...data.map.questDifficulties },
    selectedTitle: data.map.selectedTitle, selectedDifficulty: data.map.selectedDifficulty,
    nightmareClearedSubAreas: [...data.map.nightmareClearedSubAreas], challengeOrdinals: { ...data.map.challengeOrdinals }
  });
  useMetaStore.setState({
    settings: data.meta.settings,
    idleState: data.meta.idleState,
    idleBonusAnchor,
    gachaState: data.meta.gachaState
  });
  useFormationStore.getState().hydrate(data.formation);
  seedItemSeqFromHydratedSave(data);
}

/**
 * After a save is rehydrated, advance the in-memory item-id sequence past
 * the highest seq encoded in any persisted item id. Without this, a fresh
 * page load (which resets the seq counter to 0) can re-issue an id that
 * already lives in the loaded backpack/stash/equipment, causing React
 * "two children with the same key" warnings and equip/swap collisions.
 */
function seedItemSeqFromHydratedSave(data: SaveCurrent): void {
  const ids: string[] = [];
  for (const it of data.inventory.backpack) ids.push(it.id);
  for (const it of data.inventory.stash) ids.push(it.id);
  for (const it of Object.values(data.inventory.equipped)) {
    if (it) ids.push(it.id);
  }
  for (const equip of Object.values(data.mercs.mercEquipment)) {
    for (const it of Object.values(equip)) {
      if (it) ids.push(it.id);
    }
  }
  seedItemSeqFromIds(ids);
}

/**
 * App entry point: hydrate from disk (if a save exists) then start auto-save.
 * Always sets hydration status to a terminal state (`ready` or `error`).
 * Reconciles/persists offline time before publication, once per page lifetime.
 * Concurrent calls/remounts share even a failed flight; use import or reload
 * for recovery. Initialization is ordered with all explicit restore operations.
 * Ownership/receipt-phase refusal before queueing leaves initialization unset for retry.
 */
export function initPersistence(): Promise<void> {
  initialization ??= enqueueRestore(initializePersistence);
  return initialization;
}

async function initializePersistence(lease: WaveRestoreLease): Promise<void> {
  cancelPendingSave();
  suppressSaves = true;
  try {
    const exists = await hasSave();
    if (exists) {
      await hydrateSavedCharacter(true, lease);
    } else {
      useHydrationStore.getState().setStatus('ready');
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    writesBlocked = true;
    useSaveStatusStore.setState({ error: msg });
    useHydrationStore.getState().setStatus('error', msg);
  } finally {
    suppressSaves = false;
  }
  startAutoSave();
}

/**
 * Test-only: reset internal flags so unit tests can re-init the module.
 * Call only after every queued restore/initialization consumer has finished.
 * @internal
 */
export function __resetPersistenceForTests(): void {
  stopAutoSave();
  suppressSaves = false;
  writesBlocked = false;
  replacingSave = false;
  initialization = null;
  restoreTail = Promise.resolve();
  useSaveStatusStore.setState({ error: null });
  useHydrationStore.setState({ status: 'idle', error: null });
  useFormationStore.getState().reset();
}
