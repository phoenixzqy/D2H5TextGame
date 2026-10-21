/** Process-local wave ownership only; receipt-specific boundaries are caller-owned. */
export type WaveGuardRefusal = 'waveBusy' | 'restorePending' | 'hydrationNotReady' | 'invalidLease' | 'itemDebitBusy';

/** Stable typed refusal for supported guarded actions and invalid lease use. */
export class WaveGuardError extends Error {
  constructor(readonly code: WaveGuardRefusal) {
    super(code);
    this.name = 'WaveGuardError';
  }
}

const waveBrand = Symbol('waveTransition');
const restoreBrand = Symbol('waveRestore');
/** Opaque identity, valid only until its owning synchronous transition ends. */
export interface WaveTransitionLease { readonly [waveBrand]: true }
/** One restore reservation, acquired before queueing or awaiting any work. */
export interface WaveRestoreLease { readonly [restoreBrand]: true }

let activeWave: WaveTransitionLease | null = null;
const restores = new Set<WaveRestoreLease>();
let deferredSave = false;
let itemDebitActive = false;

/** Acquire exclusive synchronous wave ownership; caller must release in finally. */
export function beginWaveTransition(hydrationReady: boolean): WaveTransitionLease {
  if (activeWave) throw new WaveGuardError('waveBusy');
  if (restores.size > 0) throw new WaveGuardError('restorePending');
  if (!hydrationReady) throw new WaveGuardError('hydrationNotReady');
  activeWave = Object.freeze({ [waveBrand]: true as const });
  return activeWave;
}

/** Release the exact owner before returning whether one debounced save was deferred. */
export function endWaveTransition(lease: WaveTransitionLease): boolean {
  if (lease !== activeWave) throw new WaveGuardError('invalidLease');
  if (itemDebitActive) throw new WaveGuardError('itemDebitBusy');
  activeWave = null;
  const wakeSave = deferredSave;
  deferredSave = false;
  return wakeSave;
}

/** Reserve restore ownership synchronously; retain it through installation/failure cleanup. */
export function reserveWaveRestore(): WaveRestoreLease {
  if (activeWave) throw new WaveGuardError('waveBusy');
  const lease = Object.freeze({ [restoreBrand]: true as const });
  restores.add(lease);
  return lease;
}

/** Release only this restore request; a stale lease leaves all other owners intact. */
export function releaseWaveRestore(lease: WaveRestoreLease): void {
  if (!restores.delete(lease)) throw new WaveGuardError('invalidLease');
}

/** Validate an active wave owner before privileged transient-state access. */
export function assertWaveTransitionOwner(lease: WaveTransitionLease): void {
  if (lease !== activeWave) throw new WaveGuardError('invalidLease');
}

/** Validate a still-reserved restore owner before successful-install cleanup. */
export function assertWaveRestoreOwner(lease: WaveRestoreLease): void {
  if (!restores.has(lease)) throw new WaveGuardError('invalidLease');
}

/** Refuse snapshots during synchronous transitions or unresolved restore ownership. */
export function assertWaveSnapshotAllowed(): void {
  if (activeWave) throw new WaveGuardError('waveBusy');
  if (restores.size > 0) throw new WaveGuardError('restorePending');
}

/** Coalesce save scheduling only while busy; the release caller performs the normal wake. */
export function deferWaveSaveIfBusy(): boolean {
  if (!activeWave) return false;
  deferredSave = true;
  return true;
}


/** Enter the sole exact backpack write; no supported inventory/merc gear action may nest. */
export function beginIronGolemDebit(lease: WaveTransitionLease): void {
  if (lease !== activeWave) throw new WaveGuardError('invalidLease');
  if (itemDebitActive) throw new WaveGuardError('itemDebitBusy');
  itemDebitActive = true;
}

/** Exit the owned debit in finally, including setter/observer failure paths. */
export function endIronGolemDebit(lease: WaveTransitionLease): void {
  if (lease !== activeWave || !itemDebitActive) throw new WaveGuardError('invalidLease');
  itemDebitActive = false;
}

/** Supported ownership-changing actions must call this before reading or writing items. */
export function assertIronGolemOwnershipMutationAllowed(): void {
  if (itemDebitActive) throw new WaveGuardError('itemDebitBusy');
}
