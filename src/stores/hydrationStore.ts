import { create } from 'zustand';

/**
 * Hydration lifecycle states surfaced to the UI.
 *
 * - `idle`    — persistence not yet initialized.
 * - `loading` — IndexedDB read in flight.
 * - `ready`   — hydration finished (or no save existed).
 * - `error`   — load/migration failed; payload available in `error`.
 */
export type HydrationStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Committed startup receipt for launch feedback; never included in saves. */
export interface OfflineReturnNotice {
  readonly awayMs: number;
  /** Chosen bonus, which may be stronger than this absence's fresh accrual. */
  readonly bonusPct: number;
  readonly windowSeconds: number;
}

interface HydrationState {
  status: HydrationStatus;
  error: string | null;
  offlineReturn: OfflineReturnNotice | null;
  /** Dismiss launch feedback without changing gameplay or scheduling a save. */
  dismissOfflineReturn: () => void;
  setStatus: (status: HydrationStatus, error?: string | null) => void;
}

/**
 * Tiny store exposing hydration status. UI can show a loader / "save corrupted"
 * banner without crashing the tree.
 */
export const useHydrationStore = create<HydrationState>((set) => ({
  status: 'idle',
  error: null,
  offlineReturn: null,
  dismissOfflineReturn: () => { set({ offlineReturn: null }); },
  setStatus: (status, error = null) => {
    set({ status, error });
  }
}));
