import { create } from 'zustand';
import type { IronGolemSelection } from './ironGolemSelection';
import {
  assertWaveRestoreOwner, assertWaveSnapshotAllowed, assertWaveTransitionOwner,
  type WaveRestoreLease, type WaveTransitionLease
} from './waveTransitionGuard';

/** Process-local instruction only; never include this slice in saved game data. */
export interface IronGolemSelectionState {
  readonly selection: IronGolemSelection | null;
}

/** UI subscription surface; supported writes go through the functions below. */
export const useIronGolemSelectionStore = create<IronGolemSelectionState>(() => ({ selection: null }));

/** Arming requires the caller's explicit visible sacrifice acknowledgement. */
export class IronGolemAcknowledgementError extends Error {
  readonly code = 'acknowledgementRequired';
  constructor() {
    super('acknowledgementRequired');
    this.name = 'IronGolemAcknowledgementError';
  }
}

/**
 * Arm fresh explicit IDs after acknowledgement; this neither reserves nor validates an item.
 * Throws WaveGuardError while wave/restore ownership is held, or
 * IronGolemAcknowledgementError without acknowledgement. No automatic choice occurs.
 */
export function armIronGolemSelection(heroId: string, itemId: string, acknowledged: boolean): IronGolemSelection {
  assertWaveSnapshotAllowed();
  if (!acknowledged) throw new IronGolemAcknowledgementError();
  const selection = Object.freeze({ heroId, itemId });
  useIronGolemSelectionStore.setState({ selection });
  return selection;
}

/** Clear explicitly while idle; throws WaveGuardError during wave/restore ownership. */
export function clearIronGolemSelection(): void {
  assertWaveSnapshotAllowed();
  useIronGolemSelectionStore.setState({ selection: null });
}

/**
 * Consume only the exact captured instruction for an accepted new wave, including null.
 * A mismatch returns false without clearing a later rearm. The caller owns acceptance;
 * technical staging failures must not call this. Synchronous observers can throw after write.
 * Throws WaveGuardError for an invalid lease before inspecting selection.
 */
export function consumeIronGolemSelection(
  expected: IronGolemSelection | null,
  lease: WaveTransitionLease
): boolean {
  assertWaveTransitionOwner(lease);
  if (useIronGolemSelectionStore.getState().selection !== expected) return false;
  if (expected !== null) useIronGolemSelectionStore.setState({ selection: null });
  return true;
}

/**
 * Caller invokes only after successful restoration; failed restore must retain selection.
 * Throws WaveGuardError for an invalid lease before inspecting selection.
 */
export function clearIronGolemSelectionAfterRestore(lease: WaveRestoreLease): void {
  assertWaveRestoreOwner(lease);
  useIronGolemSelectionStore.setState({ selection: null });
}
