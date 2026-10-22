import { assertWaveSnapshotAllowed, assertWaveTransitionOwner, reserveWaveRestore, releaseWaveRestore,
  type WaveTransitionLease, type WaveRestoreLease } from './waveTransitionGuard';
import { inspectRecordedWaves, RecordedWaveReceiptError,
  type RecordedWaveReceipt } from './recordedWaveReceipt';

/** Typed refusal for transient recorded-wave phases. */
export class RecordedWaveAccessError extends Error {
  constructor(readonly code: 'preparedPending' | 'publicationPending' | 'conflict') {
    super(code); this.name = 'RecordedWaveAccessError';
  }
}

/** Inspect the sole holder once; stable committed data may be saved/restored. */
function assertReceiptPhaseAllowed(requirePublished: boolean): void {
  const pending = inspectRecordedWaves().pending;
  if (pending?.phase === 'prepared') throw new RecordedWaveAccessError('preparedPending');
  if (pending?.phase === 'conflict') throw new RecordedWaveAccessError('conflict');
  if (requirePublished && pending) throw new RecordedWaveAccessError('publicationPending');
}

/**
 * Check primitive ownership first, then refuse prepared/conflicting receipts.
 * Stable committed pending publication is allowed; throws a typed phase refusal.
 */
export function assertRecordedWaveSnapshotAllowed(): void {
  assertWaveSnapshotAllowed();
  assertReceiptPhaseAllowed(false);
}
/**
 * Reserve restore ownership before queueing or mutating request state.
 * Check only receipt phase after acquiring; snapshot preflight would reject this
 * request's own reservation. Refusal releases only the newly acquired lease.
 */
export function reserveRecordedWaveRestore(): WaveRestoreLease {
  const lease = reserveWaveRestore();
  try { assertReceiptPhaseAllowed(false); return lease; }
  catch (error) { releaseWaveRestore(lease); throw error; }
}
/** Refuse playback while ownership or an unpublished receipt is pending. */
export function assertRecordedWavePlaybackAllowed(): void {
  assertWaveSnapshotAllowed();
  assertReceiptPhaseAllowed(true);
}
/** Refuse a new transition while ownership or an unpublished receipt is pending. */
export function assertRecordedWaveNewTransitionAllowed(): void {
  assertWaveSnapshotAllowed();
  assertReceiptPhaseAllowed(true);
}
/**
 * Validate a live lease first, then the exact committed pending token. Recovery
 * runs under its own wave ownership and must not use an idle/snapshot preflight.
 * No holder mutation, simulation, payment or publication occurs here.
 */
export function assertRecordedWavePublicationRecoveryAllowed(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease
): void {
  assertWaveTransitionOwner(lease);
  const pending = inspectRecordedWaves().pending;
  if (pending?.receipt !== receipt) throw new RecordedWaveReceiptError('staleReceipt');
  if (pending.phase !== 'committedPendingPublication') throw new RecordedWaveReceiptError('wrongPhase');
}
