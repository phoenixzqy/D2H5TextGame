import { assertWaveSnapshotAllowed, assertWaveTransitionOwner, reserveWaveRestore, releaseWaveRestore,
  type WaveTransitionLease, type WaveRestoreLease } from './waveTransitionGuard';
import { inspectRecordedWaves, RecordedWaveReceiptError,
  type RecordedWaveReceipt } from './recordedWaveReceipt';

/** Typed refusal for transient recorded-wave phases. */
export class RecordedWaveAccessError extends Error {
  constructor(readonly code: 'preparedPending' | 'publicationPending' | 'conflict' | 'settling' | 'settlementFailed' | 'replaySettled') {
    super(code); this.name = 'RecordedWaveAccessError';
  }
}

/** Inspect the sole holder once, preserving pending-before-settlement precedence. */
function assertReceiptPhaseAllowed(access: 'snapshot' | 'playback' | 'transition' | 'replay'): void {
  const { pending, currentPublished } = inspectRecordedWaves();
  if (pending?.phase === 'prepared') throw new RecordedWaveAccessError('preparedPending');
  if (pending?.phase === 'conflict') throw new RecordedWaveAccessError('conflict');
  if (access !== 'snapshot' && pending) throw new RecordedWaveAccessError('publicationPending');
  const settlement = currentPublished?.installation?.settlement.progress.phase;
  if (settlement === 'settling') throw new RecordedWaveAccessError('settling');
  if (settlement === 'settlementFailed' && access !== 'snapshot') throw new RecordedWaveAccessError('settlementFailed');
  if (access === 'replay' && (settlement === 'awaitingNextWave' || settlement === 'settled')) {
    throw new RecordedWaveAccessError('replaySettled');
  }
}

/**
 * Check primitive ownership first, then refuse prepared/conflicting receipts.
 * Stable committed publication/failure boundaries are allowed; settling refuses.
 * Throws a typed pending/settlement refusal after primitive ownership checks.
 */
export function assertRecordedWaveSnapshotAllowed(): void {
  assertWaveSnapshotAllowed();
  assertReceiptPhaseAllowed('snapshot');
}
/**
 * Reserve restore ownership before queueing or mutating request state.
 * Check only receipt phase after acquiring; snapshot preflight would reject this
 * request's own reservation. Refusal releases only the newly acquired lease.
 */
export function reserveRecordedWaveRestore(): WaveRestoreLease {
  const lease = reserveWaveRestore();
  try { assertReceiptPhaseAllowed('snapshot'); return lease; }
  catch (error) { releaseWaveRestore(lease); throw error; }
}
/** Refuse playback during ownership, unpublished work, settling or stable failure. */
export function assertRecordedWavePlaybackAllowed(): void {
  assertWaveSnapshotAllowed();
  assertReceiptPhaseAllowed('playback');
}
/**
 * Refuse ownership, unpublished work, settling or stable failure. Successful
 * settlement permits next-wave retry or intentional replacement.
 */
export function assertRecordedWaveNewTransitionAllowed(): void {
  assertWaveSnapshotAllowed();
  assertReceiptPhaseAllowed('transition');
}
/**
 * Ordinary replay additionally refuses awaiting/terminal settlement, preserving
 * captured carry and preventing payout resets. No production caller uses this yet.
 */
export function assertRecordedWaveReplayAllowed(): void {
  assertWaveSnapshotAllowed();
  assertReceiptPhaseAllowed('replay');
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
