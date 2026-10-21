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
  setStatus: (status, error = null) => {
    set({ status, error });
  }
}));

