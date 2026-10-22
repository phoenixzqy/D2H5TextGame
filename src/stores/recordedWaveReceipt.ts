import type { CombatSnapshot } from '@/engine/combat/combat';
import type { IronGolemPreparationAttestation } from '@/engine/skills/iron-golem';
import type { ActiveRun } from './combatRunLifecycle';
import type { useCombatStore } from './combatStore';
import type { RecordedBattlePublication } from './recordedBattlePublication';
import type { IronGolemOwnership, IronGolemSelection } from './ironGolemSelection';
import { classifyIronGolemDebit, type IronGolemDebitIntent } from './ironGolemDebit';
import { assertWaveTransitionOwner, assertWaveSnapshotAllowed, assertWaveRestoreOwner,
  type WaveTransitionLease, type WaveRestoreLease } from './waveTransitionGuard';

const receiptBrand = Symbol('recordedWaveReceipt');
/** Opaque process-local identity, never persisted or reconstructed from values. */
export interface RecordedWaveReceipt { readonly [receiptBrand]: true }
/** Validated staging values; original engine input must be privately owned and immutable. */
export interface RecordedWaveBinding {
  readonly candidateRun: ActiveRun;
  readonly expectedActiveRun: ActiveRun | null;
  readonly heroId: string;
  readonly targetWaveIdx: number;
  readonly waveElapsedMs: number;
  readonly selection: IronGolemSelection | null;
  readonly ownership: IronGolemOwnership;
  readonly debitIntent: IronGolemDebitIntent | null;
  readonly engineInput: CombatSnapshot;
  readonly attestation: IronGolemPreparationAttestation | null;
  readonly recording: NonNullable<ActiveRun['recording']>;
  readonly publication: RecordedBattlePublication;
}
/** Authoritative references assembled by the store caller at the operation boundary. */
export interface RecordedWaveLive {
  readonly activeRun: ActiveRun | null;
  readonly heroId: string | null;
  readonly selection: IronGolemSelection | null;
  readonly ownership: IronGolemOwnership;
}
interface CapturedBinding extends RecordedWaveBinding {
  readonly expectedWaveIdx: number | null;
  readonly expectedRecording: ActiveRun['recording'];
}
interface ReceiptFailure { readonly error: unknown }
type Phase = 'prepared' | 'committedPendingPublication' | 'published' | 'conflict';
interface ReceiptView {
  readonly receipt: RecordedWaveReceipt;
  readonly binding: CapturedBinding;
  readonly phase: Phase;
  readonly debitFailure?: ReceiptFailure;
  readonly publicationFailure?: ReceiptFailure;
}
interface ReceiptHolder {
  readonly currentPublished: ReceiptView | null;
  readonly pending: ReceiptView | null;
}
let holder: ReceiptHolder = Object.freeze({ currentPublished: null, pending: null });
/** Stable refusal; invalid lease errors remain WaveGuardError and take precedence. */
export class RecordedWaveReceiptError extends Error {
  constructor(readonly code: 'staleReceipt' | 'wrongPhase' | 'pendingReceipt' | 'bindingMismatch') {
    super(code); this.name = 'RecordedWaveReceiptError';
  }
}
const locations = ['backpack', 'stash', 'equipped', 'mercEquipment'] as const;
const sameOwnership = (a: IronGolemOwnership, b: IronGolemOwnership) =>
  locations.every(key => a[key] === b[key]);
function pendingFor(receipt: RecordedWaveReceipt, lease: WaveTransitionLease, phase: Phase): ReceiptView {
  assertWaveTransitionOwner(lease);
  const pending = holder.pending;
  if (pending?.receipt !== receipt) throw new RecordedWaveReceiptError('staleReceipt');
  if (pending.phase !== phase) throw new RecordedWaveReceiptError('wrongPhase');
  return pending;
}
function authorityMatches(binding: CapturedBinding, live: RecordedWaveLive): boolean {
  return live.activeRun === binding.expectedActiveRun &&
    (live.activeRun?.waveIdx ?? null) === binding.expectedWaveIdx &&
    live.activeRun?.recording === binding.expectedRecording &&
    binding.candidateRun.playerUnit.id === binding.heroId && live.heroId === binding.heroId &&
    live.selection === binding.selection;
}
function updatePending(pending: ReceiptView): void {
  holder = Object.freeze({ currentPublished: holder.currentPublished, pending: Object.freeze(pending) });
}

/**
 * Capture one pending attempt, preserving the current published receipt.
 * No simulation, payment or publication occurs. Freeze only owned wrappers;
 * shared units, Maps, input arrays and inventory containers are never frozen here.
 * Throws on invalid lease, occupied pending slot or inconsistent staged bindings.
 */
export function prepareRecordedWave(binding: RecordedWaveBinding, lease: WaveTransitionLease): RecordedWaveReceipt {
  assertWaveTransitionOwner(lease);
  if (holder.pending) throw new RecordedWaveReceiptError('pendingReceipt');
  const { debitIntent, publication, recording, candidateRun } = binding;
  if (candidateRun.playerUnit.id !== binding.heroId || !Number.isInteger(binding.targetWaveIdx) ||
    binding.targetWaveIdx < 0 || binding.targetWaveIdx >= candidateRun.plan.waves.length ||
    publication.currentWave !== binding.targetWaveIdx + 1 || publication.totalWaves !== candidateRun.plan.waves.length ||
    publication.subAreaRunId !== candidateRun.plan.subAreaId || publication.recordedEvents !== recording.events ||
    publication.outcome !== recording.outcome ||
    (debitIntent !== null && (debitIntent.selection !== binding.selection ||
      !sameOwnership(debitIntent.original, binding.ownership) ||
      binding.attestation?.sourceHeroId !== binding.heroId ||
      binding.attestation.sourceItemId !== debitIntent.item.id)) || (debitIntent === null && binding.attestation !== null)) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  const receipt: RecordedWaveReceipt = Object.freeze({ [receiptBrand]: true as const });
  const captured: CapturedBinding = Object.freeze({ ...binding,
    ownership: Object.freeze({ ...binding.ownership }),
    expectedWaveIdx: binding.expectedActiveRun?.waveIdx ?? null,
    expectedRecording: binding.expectedActiveRun?.recording });
  updatePending({ receipt, binding: captured, phase: 'prepared' });
  return receipt;
}

/** Read-only pre-debit revalidation; mismatch leaves the exact preparation intact. */
export function assertPreparedRecordedWaveBinding(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease, live: RecordedWaveLive
): void {
  const pending = pendingFor(receipt, lease, 'prepared');
  if (!authorityMatches(pending.binding, live) || !sameOwnership(pending.binding.ownership, live.ownership) ||
    (pending.binding.debitIntent && classifyIronGolemDebit(pending.binding.debitIntent, live.ownership) !== 'original')) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
}

/** Cancel only a provably unpaid preparation, even when its original metadata is stale. */
export function cancelPreparedRecordedWave(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease, ownership: IronGolemOwnership
): void {
  const pending = pendingFor(receipt, lease, 'prepared');
  if (!sameOwnership(pending.binding.ownership, ownership) ||
    (pending.binding.debitIntent && classifyIronGolemDebit(pending.binding.debitIntent, ownership) !== 'original')) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  holder = Object.freeze({ currentPublished: holder.currentPublished, pending: null });
}

/**
 * Observe actual references after setter notifications, including a thrown setter.
 * Original debit ownership remains prepared; exact debit commits; unknown ownership
 * or paid-but-changed authority enters conflict without compensation. No-debit
 * attempts require unchanged ownership/authority. The first debit error is retained.
 */
export function commitPreparedRecordedWave(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease, live: RecordedWaveLive, failure?: ReceiptFailure
): 'prepared' | 'committedPendingPublication' | 'conflict' {
  const pending = pendingFor(receipt, lease, 'prepared');
  const { binding } = pending;
  const observed = binding.debitIntent ? classifyIronGolemDebit(binding.debitIntent, live.ownership)
    : sameOwnership(binding.ownership, live.ownership) ? 'original' : 'conflict';
  const authority = authorityMatches(binding, live);
  const conflict = observed === 'conflict' || (observed === 'committed' && !authority);
  if (!conflict && !authority) throw new RecordedWaveReceiptError('bindingMismatch');
  const phase = conflict ? 'conflict' : binding.debitIntent && observed === 'original'
    ? 'prepared' : 'committedPendingPublication';
  updatePending({ ...pending, phase,
    ...(failure && !pending.debitFailure ? { debitFailure: Object.freeze({ error: failure.error }) } : {}) });
  return phase;
}

/**
 * Recognize complete exact installation, never publish or repeat payment/simulation.
 * A mismatch retains the pending payload. A newly acquired live lease may recover
 * the same token. First publisher error remains available even after promotion.
 */
export function recognizeRecordedWavePublication(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease,
  live: { readonly activeRun: ActiveRun | null; readonly heroId: string | null;
    readonly combat: Pick<ReturnType<typeof useCombatStore.getState>, keyof RecordedBattlePublication> }, failure?: ReceiptFailure
): boolean {
  const pending = pendingFor(receipt, lease, 'committedPendingPublication');
  const { binding } = pending;
  const keys = Object.keys(binding.publication) as (keyof RecordedBattlePublication)[];
  const installed = live.activeRun === binding.candidateRun && live.heroId === binding.heroId &&
    live.activeRun.waveIdx === binding.targetWaveIdx && live.activeRun.recording === binding.recording &&
    live.activeRun.waveElapsedMs === binding.waveElapsedMs &&
    keys.every(key => live.combat[key] === binding.publication[key]);
  const next = Object.freeze({ ...pending,
    ...(failure && !pending.publicationFailure ? { publicationFailure: Object.freeze({ error: failure.error }) } : {}) });
  if (installed) holder = Object.freeze({ currentPublished: Object.freeze({ ...next, phase: 'published' }), pending: null });
  else updatePending(next);
  return installed;
}

/** Immutable observations of the sole holder; no generic phase setter is exposed. */
export function inspectRecordedWaves(): ReceiptHolder { return holder; }
/** Explicit abandonment clears transient receipts only, retaining all actual gameplay values. */
export function abandonRecordedWaves(): void {
  assertWaveSnapshotAllowed();
  holder = Object.freeze({ currentPublished: null, pending: null });
}
/** Successful-restore cleanup; stale leases preserve both receipt slots. */
export function clearRecordedWavesAfterRestore(lease: WaveRestoreLease): void {
  assertWaveRestoreOwner(lease);
  holder = Object.freeze({ currentPublished: null, pending: null });
}
