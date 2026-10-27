import { COUNTESS, type CountessEncounter } from '@/engine/map/countess-admission';
import type { EndgameWaveBinding } from '@/engine/endgame/runtime';
import type { EndgameState } from '@/engine/endgame/types';
import type { Act5Encounter } from '@/engine/map/act5-admission';
import type { Act4Encounter } from '@/engine/map/act4-admission';
import type { CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import type { KillRewards } from '@/engine/loot/award';
import type { IronGolemPreparationAttestation } from '@/engine/skills/iron-golem';
import type { FindItemFind } from '@/engine/skills/find-item';
import type { ActiveRun, RunOrigin } from './combatRunLifecycle';
import type { useCombatStore } from './combatStore';
import type { RecordedBattlePublication } from './recordedBattlePublication';
import type { CouncilEncounter } from '@/engine/map/council-admission';
import type { GuardianEncounter } from '@/engine/map/guardian-admission';
import type { IronGolemOwnership, IronGolemSelection } from './ironGolemSelection';
import { classifyIronGolemDebit, type IronGolemDebitIntent } from './ironGolemDebit';
import { assertWaveTransitionOwner, assertWaveSnapshotAllowed, assertWaveRestoreOwner,
  type WaveTransitionLease, type WaveRestoreLease } from './waveTransitionGuard';

const receiptBrand = Symbol('recordedWaveReceipt');
/** Opaque process-local identity, never persisted or reconstructed from values. */
export interface RecordedWaveReceipt { readonly [receiptBrand]: true }
/** Validated staging values; original engine input must be privately owned and immutable. */
export interface RecordedWaveBinding {
  readonly origin: RunOrigin;
  readonly countessEncounter?: CountessEncounter;
  readonly endgameWave?: EndgameWaveBinding;
  readonly endgameState?: EndgameState;
  readonly replayProfileId?: 'normal' | 'nightmare';
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
  /** Privately copied engine successes; public events never authorize search loot. */
  readonly findItemFinds?: readonly FindItemFind[];
  readonly recording: NonNullable<ActiveRun['recording']>;
  readonly publication: RecordedBattlePublication;
  readonly councilEncounter?: CouncilEncounter;
  readonly guardianEncounter?: GuardianEncounter;
  readonly act4Encounter?: Act4Encounter;
  readonly act5Encounter?: Act5Encounter;
  readonly act5ThroneWave?: Act5Encounter & { readonly ordinal: number };
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
interface ReceiptFailure {
  readonly error: unknown;
  /** Diagnostic complete generation output, never payout or retry authority. */
  readonly preparedRewards?: KillRewards;
}
/** Captured installation policy; challenge-counter range remains helper-owned. */
export type RecordedWaveInstallIntent =
  | { readonly kind: 'newRun'; readonly nextDefaultChallengeOrdinal: number | null;
      readonly endgameEntry?: { readonly stateBefore: EndgameState; readonly stateAfterEntry: EndgameState } }
  | { readonly kind: 'newWave'; readonly carryPlayerTeam: CombatUnit[] }
  | { readonly kind: 'replay' };
const payoutBrand = Symbol('recordedWavePayout');
/** Opaque logical-wave identity shared by ordinary replays; never persisted. */
export interface RecordedWavePayoutIdentity { readonly [payoutBrand]: true }
/** Immutable process-local progress; carry is captured once by the helper. */
export type RecordedWaveSettlementProgress =
  | { readonly phase: 'unsettled' }
  | { readonly phase: 'settling' }
  | { readonly phase: 'awaitingNextWave'; readonly nextWaveIdx: number; readonly carryPlayerTeam: CombatUnit[] }
  | { readonly phase: 'settled'; readonly result: 'victory' | 'defeat' }
  | { readonly phase: 'settlementFailed'; readonly failure: ReceiptFailure };
interface LogicalWaveSettlement {
  readonly identity: RecordedWavePayoutIdentity;
  readonly progress: RecordedWaveSettlementProgress;
}
/** Exact completion authority; playback-mutated teams/log/cursor are excluded. */
export interface RecordedWaveSettlementLive {
  readonly activeRun: ActiveRun | null;
  readonly heroId: string | null;
  readonly combat: Pick<ReturnType<typeof useCombatStore.getState>,
    'subAreaRunId' | 'currentWave' | 'totalWaves' | 'recordedEvents' | 'outcome' | 'playbackComplete'>;
}
/** Retained binding and logical-wave settlement under live transition ownership. */
export interface RecordedWaveSettlementView extends LogicalWaveSettlement {
  readonly endgameState: EndgameState | undefined;
  readonly binding: RecordedWaveBinding;
}
/** Terminal effects have finished, or surviving carry has been computed once. */
export type RecordedWaveSettlementResult =
  | { readonly kind: 'terminal'; readonly result: 'victory' | 'defeat' }
  | { readonly kind: 'nextWave'; readonly carryPlayerTeam: CombatUnit[] };
interface InstallationProgress {
  readonly intent: RecordedWaveInstallIntent;
  readonly settlement: LogicalWaveSettlement;
  readonly metadataInstalled: boolean;
  readonly selectionProgress: 'notRequired' | 'pending' | 'resolved';
  readonly selectionFailure?: ReceiptFailure;
}
/** Exact retained payload and progress under live transition ownership. */
export interface RecordedWaveInstallationView extends InstallationProgress {
  readonly binding: RecordedWaveBinding;
}
type Phase = 'prepared' | 'committedPendingPublication' | 'published' | 'conflict';
interface ReceiptView {
  readonly receipt: RecordedWaveReceipt;
  readonly binding: CapturedBinding;
  readonly phase: Phase;
  readonly debitFailure?: ReceiptFailure;
  readonly publicationFailure?: ReceiptFailure;
  readonly installation?: InstallationProgress;
}
interface ReceiptHolder {
  readonly currentPublished: ReceiptView | null;
  readonly pending: ReceiptView | null;
}
let holder: ReceiptHolder = Object.freeze({ currentPublished: null, pending: null });
const observers = new Map<symbol, () => void>();
let notificationScheduled = false;

function replaceHolder(next: ReceiptHolder): void {
  holder = Object.freeze(next);
  if (notificationScheduled) return;
  notificationScheduled = true;
  queueMicrotask(() => {
    notificationScheduled = false;
    // New registrations during delivery wait for a subsequent notification.
    for (const [token, listener] of [...observers]) {
      if (!observers.has(token)) continue;
      try { listener(); } catch (error) {
        // Observation cannot replace a synchronous transition's result or failure.
        console.error('Recorded wave observer failed', error);
      }
    }
  });
}

/**
 * External-store subscription paired with inspectRecordedWaves. Coalesce holder
 * replacements until after the current synchronous stack; callbacks must reread
 * the latest immutable snapshot. An asynchronous restore may still own its guard.
 * Each registration is independent, including duplicate callbacks. Unsubscribe
 * before delivery suppresses that registration. Callback errors are reported to
 * console.error and do not stop peers or alter synchronous transition semantics.
 * No immediate notification, polling or copy of receipt authority is introduced.
 */
export function subscribeRecordedWaves(listener: () => void): () => void {
  const token = Symbol('recordedWaveObserver');
  observers.set(token, listener);
  return () => { observers.delete(token); };
}

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
  replaceHolder({ currentPublished: holder.currentPublished, pending: Object.freeze(pending) });
}

function assertRunOrigin(origin: unknown): asserts origin is RunOrigin {
  if (typeof origin !== 'object' || origin === null || !Object.isFrozen(origin) ||
    !('kind' in origin) || (origin.kind !== 'area' && origin.kind !== 'endgame')) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  if (origin.kind === 'area' && 'questEncounter' in origin && origin.questEncounter !== COUNTESS.encounter) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
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
  const origin = binding.origin;
  assertRunOrigin(origin);
  if (origin !== candidateRun.origin) throw new RecordedWaveReceiptError('bindingMismatch');
  if (binding.countessEncounter && (origin.kind !== 'area' || origin.questEncounter !== COUNTESS.encounter ||
    origin.replayProfileId !== 'normal' || candidateRun.act !== 1 || candidateRun.mode !== 'manual' ||
    candidateRun.plan.subAreaId !== COUNTESS.area || candidateRun.plan.waves.length !== 1 || binding.targetWaveIdx !== 0 ||
    binding.countessEncounter.originalHeroId !== binding.heroId)) throw new RecordedWaveReceiptError('bindingMismatch');
  const replayProfileId: unknown = origin.kind === 'area' ? origin.replayProfileId : 'normal';
  if (origin.kind === 'endgame') {
    const progress = candidateRun.endgameProgress;
    if (!progress || progress.context !== origin || progress.plan !== candidateRun.plan ||
      progress.heroId !== binding.heroId || progress.nextWaveIndex !== binding.targetWaveIdx ||
      progress.status !== 'active' || binding.endgameWave?.progress !== progress || !binding.endgameState ||
      candidateRun.act !== 5 || candidateRun.mode !== 'manual' || candidateRun.seed !== origin.seed ||
      binding.councilEncounter !== undefined || binding.guardianEncounter !== undefined || binding.act4Encounter !== undefined ||
      binding.act5Encounter !== undefined || binding.act5ThroneWave !== undefined || binding.countessEncounter !== undefined) throw new RecordedWaveReceiptError('bindingMismatch');
  } else if (binding.endgameWave !== undefined || binding.endgameState !== undefined || candidateRun.endgameProgress !== undefined) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  const profiles = [binding.replayProfileId, candidateRun.replayProfileId, candidateRun.plan.replayProfileId,
    recording.replayProfileId];
  if ((replayProfileId !== 'normal' && replayProfileId !== 'nightmare') ||
    profiles.some(profile => profile !== undefined && profile !== replayProfileId)) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
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
    replayProfileId,
    ...(binding.countessEncounter ? { countessEncounter: Object.freeze({ ...binding.countessEncounter }) } : {}),
    ...(binding.guardianEncounter ? { guardianEncounter: Object.freeze({ ...binding.guardianEncounter }) } : {}),
    ...(binding.councilEncounter ? { councilEncounter: Object.freeze({ ...binding.councilEncounter,
      originalMemberIds: Object.freeze([...binding.councilEncounter.originalMemberIds]) }) } : {}),
    ...(binding.act4Encounter ? { act4Encounter: Object.freeze({ ...binding.act4Encounter,
      originalMemberIds: Object.freeze([...binding.act4Encounter.originalMemberIds]) }) } : {}),
    ...(binding.act5Encounter ? { act5Encounter: Object.freeze({ ...binding.act5Encounter,
      originalMemberIds: Object.freeze([...binding.act5Encounter.originalMemberIds]) }) } : {}),
    ...(binding.act5ThroneWave ? { act5ThroneWave: Object.freeze({ ...binding.act5ThroneWave,
      originalMemberIds: Object.freeze([...binding.act5ThroneWave.originalMemberIds]) }) } : {}),
    ownership: Object.freeze({ ...binding.ownership }),
    expectedWaveIdx: binding.expectedActiveRun?.waveIdx ?? null,
    expectedRecording: binding.expectedActiveRun?.recording });
  updatePending({ receipt, binding: captured, phase: 'prepared' });
  return receipt;
}

/** The predecessor's committed reference; live state never supplies a new baseline. */
function committedEndgameState(view: ReceiptView): EndgameState | undefined {
  const intent = view.installation?.intent;
  return intent?.kind === 'newRun' && intent.endgameEntry
    ? intent.endgameEntry.stateAfterEntry : view.binding.endgameState;
}

/**
 * Capture a narrowly validated install intent in the sole receipt holder.
 * New runs replace a distinct run at wave zero; next waves/replays keep run
 * identity. Replay requires the exact unsettled published predecessor and shares
 * its payout identity/progress; next wave requires its exact captured settled
 * carry. Settling/failed predecessors refuse replacement. Replay cannot debit or
 * consume selection. Freeze only owned wrappers, leaving caller values untouched.
 * Throws receipt binding/phase errors or WaveGuardError before holder mutation.
 */
export function prepareRecordedWaveInstallation(
  binding: RecordedWaveBinding, intent: RecordedWaveInstallIntent, lease: WaveTransitionLease
): RecordedWaveReceipt {
  assertWaveTransitionOwner(lease);
  if (holder.pending) throw new RecordedWaveReceiptError('pendingReceipt');
  const previous = holder.currentPublished;
  const settlement = previous?.installation?.settlement;
  if (settlement?.progress.phase === 'settling' || settlement?.progress.phase === 'settlementFailed') {
    throw new RecordedWaveReceiptError('wrongPhase');
  }
  const sameRun = binding.expectedActiveRun !== null && binding.candidateRun === binding.expectedActiveRun;
  const valid = intent.kind === 'newRun'
    ? !sameRun && binding.targetWaveIdx === 0 && (intent.nextDefaultChallengeOrdinal === null ||
      (Number.isSafeInteger(intent.nextDefaultChallengeOrdinal) && intent.nextDefaultChallengeOrdinal >= 0))
    : intent.kind === 'newWave'
      ? sameRun && binding.targetWaveIdx === binding.expectedActiveRun.waveIdx + 1
      : sameRun && binding.targetWaveIdx === binding.expectedActiveRun.waveIdx && binding.debitIntent === null;
  if (!valid || (intent.kind === 'replay' && binding.countessEncounter !== undefined) ||
    (intent.kind === 'newRun' && binding.origin.kind === 'area' && binding.origin.questEncounter !== undefined &&
      (intent.nextDefaultChallengeOrdinal !== null || binding.countessEncounter === undefined))) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  if (intent.kind !== 'newRun') {
    if (!previous || !settlement || previous.binding.candidateRun !== binding.expectedActiveRun ||
      previous.binding.origin !== binding.origin ||
      previous.binding.heroId !== binding.heroId || binding.expectedActiveRun.recording !== previous.binding.recording ||
      binding.expectedActiveRun.waveIdx !== previous.binding.targetWaveIdx) {
      throw new RecordedWaveReceiptError('bindingMismatch');
    }
    if (binding.origin.kind === 'endgame' && binding.endgameState !== committedEndgameState(previous)) {
      throw new RecordedWaveReceiptError('bindingMismatch');
    }
    if (intent.kind === 'replay') {
      if (settlement.progress.phase !== 'unsettled') throw new RecordedWaveReceiptError('wrongPhase');
    } else {
      if (settlement.progress.phase !== 'awaitingNextWave') throw new RecordedWaveReceiptError('wrongPhase');
      if (binding.targetWaveIdx !== settlement.progress.nextWaveIdx ||
        intent.carryPlayerTeam !== settlement.progress.carryPlayerTeam) throw new RecordedWaveReceiptError('bindingMismatch');
    }
  }
  if (intent.kind === 'newRun') {
    const entry = intent.endgameEntry;
    if (binding.origin.kind === 'endgame' ? !entry || intent.nextDefaultChallengeOrdinal !== null ||
      entry.stateBefore !== binding.endgameState || entry.stateAfterEntry.attemptOrdinal !== binding.origin.attemptOrdinal + 1 ||
      entry.stateBefore.attemptOrdinal !== binding.origin.attemptOrdinal : entry !== undefined) {
      throw new RecordedWaveReceiptError('bindingMismatch');
    }
  }
  const logicalWave = intent.kind === 'replay' && settlement ? settlement : Object.freeze({
    identity: Object.freeze({ [payoutBrand]: true as const }), progress: Object.freeze({ phase: 'unsettled' as const }) });
  const receipt = prepareRecordedWave(binding, lease);
  const pending = pendingFor(receipt, lease, 'prepared');
  updatePending({ ...pending, installation: Object.freeze({ intent: Object.freeze({ ...intent, ...(intent.kind === 'newRun' && intent.endgameEntry
      ? { endgameEntry: Object.freeze({ ...intent.endgameEntry }) } : {}) }),
    metadataInstalled: false, settlement: logicalWave,
    selectionProgress: intent.kind === 'replay' || binding.selection === null ? 'notRequired' : 'pending' }) });
  return receipt;
}

function installationFor(receipt: RecordedWaveReceipt, lease: WaveTransitionLease) {
  const pending = pendingFor(receipt, lease, 'committedPendingPublication');
  const installation = pending.installation;
  if (!installation) throw new RecordedWaveReceiptError('bindingMismatch');
  return { pending, installation };
}

/** Read exact committed install data; foundation-only receipts cannot install. */
export function readRecordedWaveInstallation(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease
): RecordedWaveInstallationView {
  const { pending, installation } = installationFor(receipt, lease);
  return Object.freeze({ binding: pending.binding, ...installation });
}

/** Mark only after non-notifying local assignments and before notifying setters. */
export function markRecordedWaveMetadataInstalled(receipt: RecordedWaveReceipt, lease: WaveTransitionLease): void {
  const { pending, installation } = installationFor(receipt, lease);
  if (installation.metadataInstalled) return;
  updatePending({ ...pending, installation: Object.freeze({ ...installation, metadataInstalled: true }) });
}

/**
 * Observe the captured endgame entry before any installation and after each
 * notifying boundary. Exact before-state is retryable only before metadata;
 * exact after-state is committed. Unknown references park without overwriting.
 * Retain the first installation error through the existing publication channel.
 */
export function observeRecordedWaveEntry(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease, live: EndgameState | undefined, failure?: ReceiptFailure
): 'notRequired' | 'write' | 'committed' | 'conflict' {
  const { pending, installation } = installationFor(receipt, lease);
  const entry = installation.intent.kind === 'newRun' ? installation.intent.endgameEntry : undefined;
  if (!entry && pending.binding.origin.kind !== 'endgame') return 'notRequired';
  const observed = !entry ? (live === pending.binding.endgameState ? 'committed' : 'conflict')
    : live === entry.stateAfterEntry ? 'committed'
      : live === entry.stateBefore && !installation.metadataInstalled ? 'write' : 'conflict';
  if (observed === 'conflict' || failure) {
    updatePending({ ...pending, ...(observed === 'conflict' ? { phase: 'conflict' as const } : {}),
      ...(failure && !pending.publicationFailure ? { publicationFailure: Object.freeze({ error: failure.error }) } : {}) });
  }
  return observed;
}

/**
 * Observe actual selection after success or throw, retaining its first error.
 * Only the original exact reference remains retryable. Absence or a newer rearm
 * resolves the old instruction without claiming or clearing that newer choice.
 */
export function observeRecordedWaveSelection(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease,
  liveSelection: IronGolemSelection | null, failure?: ReceiptFailure
): void {
  const { pending, installation } = installationFor(receipt, lease);
  if (!installation.metadataInstalled) throw new RecordedWaveReceiptError('wrongPhase');
  if (installation.selectionProgress === 'notRequired') return;
  const selectionProgress = installation.selectionProgress === 'resolved' || liveSelection !== pending.binding.selection
    ? 'resolved' : 'pending';
  updatePending({ ...pending, installation: Object.freeze({ ...installation, selectionProgress,
    ...(failure && !installation.selectionFailure ? { selectionFailure: Object.freeze({ error: failure.error }) } : {}) }) });
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
  replaceHolder({ currentPublished: holder.currentPublished, pending: null });
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
    readonly combat: Pick<ReturnType<typeof useCombatStore.getState>, keyof RecordedBattlePublication>;
    readonly endgame?: EndgameState }, failure?: ReceiptFailure
): boolean {
  let pending = pendingFor(receipt, lease, 'committedPendingPublication');
  if (pending.installation && observeRecordedWaveEntry(receipt, lease, live.endgame, failure) === 'conflict') return false;
  pending = pendingFor(receipt, lease, 'committedPendingPublication');
  const { binding } = pending;
  const keys = Object.keys(binding.publication) as (keyof RecordedBattlePublication)[];
  const installationReady = !pending.installation || (pending.installation.metadataInstalled &&
    pending.installation.selectionProgress !== 'pending');
  const installed = installationReady && live.activeRun === binding.candidateRun && live.heroId === binding.heroId &&
    live.activeRun.waveIdx === binding.targetWaveIdx && live.activeRun.recording === binding.recording &&
    live.activeRun.waveElapsedMs === binding.waveElapsedMs &&
    keys.every(key => live.combat[key] === binding.publication[key]);
  const next = Object.freeze({ ...pending,
    ...(failure && !pending.publicationFailure ? { publicationFailure: Object.freeze({ error: failure.error }) } : {}) });
  if (installed) replaceHolder({ currentPublished: Object.freeze({ ...next, phase: 'published' }), pending: null });
  else updatePending(next);
  return installed;
}

/** Immutable observations of the sole holder; no generic phase setter is exposed. */
export function inspectRecordedWaves(): ReceiptHolder { return holder; }
/** Explicit abandonment clears transient receipts only, retaining all actual gameplay values. */
export function abandonRecordedWaves(): void {
  assertWaveSnapshotAllowed();
  replaceHolder({ currentPublished: null, pending: null });
}
/** Successful-restore cleanup; stale leases preserve both receipt slots. */
export function clearRecordedWavesAfterRestore(lease: WaveRestoreLease): void {
  assertWaveRestoreOwner(lease);
  replaceHolder({ currentPublished: null, pending: null });
}


function publishedSettlementFor(receipt: RecordedWaveReceipt, lease: WaveTransitionLease) {
  assertWaveTransitionOwner(lease);
  const current = holder.currentPublished;
  if (current?.receipt !== receipt) throw new RecordedWaveReceiptError('staleReceipt');
  if (holder.pending) throw new RecordedWaveReceiptError('pendingReceipt');
  if (!current.installation) throw new RecordedWaveReceiptError('bindingMismatch');
  return { current, installation: current.installation };
}
function updateSettlement(current: ReceiptView, installation: InstallationProgress, progress: RecordedWaveSettlementProgress) {
  const next = Object.freeze({ ...current, installation: Object.freeze({ ...installation,
    settlement: Object.freeze({ identity: installation.settlement.identity, progress: Object.freeze(progress) }) }) });
  replaceHolder({ currentPublished: next, pending: null });
}

/** Read the exact current installation settlement; no foundation fallback. */
export function readRecordedWaveSettlement(receipt: RecordedWaveReceipt, lease: WaveTransitionLease): RecordedWaveSettlementView {
  const { current, installation } = publishedSettlementFor(receipt, lease);
  return Object.freeze({ binding: current.binding, endgameState: committedEndgameState(current), ...installation.settlement });
}

/**
 * Validate completion authority before any effect, then latch once. Incomplete
 * playback returns false without mutation. Throws for stale token, pending work,
 * missing metadata, non-unsettled phase, mismatched authority or invalid lease.
 */
export function beginRecordedWaveSettlement(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease, live: RecordedWaveSettlementLive
): boolean {
  const { current, installation } = publishedSettlementFor(receipt, lease);
  if (installation.settlement.progress.phase !== 'unsettled') throw new RecordedWaveReceiptError('wrongPhase');
  const { binding } = current; const { combat, activeRun } = live;
  if (activeRun !== binding.candidateRun || live.heroId !== binding.heroId ||
    activeRun.playerUnit.id !== binding.heroId || activeRun.waveIdx !== binding.targetWaveIdx ||
    activeRun.recording !== binding.recording || combat.recordedEvents !== binding.recording.events ||
    combat.outcome !== binding.recording.outcome || combat.subAreaRunId !== binding.publication.subAreaRunId ||
    combat.currentWave !== binding.publication.currentWave || combat.totalWaves !== binding.publication.totalWaves) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  if (!combat.playbackComplete) return false;
  updateSettlement(current, installation, { phase: 'settling' });
  return true;
}

/** Capture terminal success or the once-rebased next-wave carry after effects. */
export function finishRecordedWaveSettlement(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease, result: RecordedWaveSettlementResult
): void {
  const { current, installation } = publishedSettlementFor(receipt, lease);
  if (installation.settlement.progress.phase !== 'settling') throw new RecordedWaveReceiptError('wrongPhase');
  const nextWaveIdx = current.binding.targetWaveIdx + 1;
  if (result.kind === 'nextWave' && nextWaveIdx >= current.binding.publication.totalWaves) {
    throw new RecordedWaveReceiptError('bindingMismatch');
  }
  updateSettlement(current, installation, result.kind === 'nextWave'
    ? { phase: 'awaitingNextWave', nextWaveIdx, carryPlayerTeam: result.carryPlayerTeam }
    : { phase: 'settled', result: result.result });
}

/** Freeze privately owned diagnostics, including the mutable Map values in gear. */
function freezeRewardEvidence(value: unknown): void {
  if (typeof value !== 'object' || value === null) return;
  if (value instanceof Map) {
    for (const child of value.values()) freezeRewardEvidence(child);
    const refuse = () => { throw new TypeError('Recorded reward evidence is immutable'); };
    Object.defineProperties(value, { set: { value: refuse }, delete: { value: refuse }, clear: { value: refuse } });
  } else for (const child of Object.values(value)) freezeRewardEvidence(child);
  Object.freeze(value);
}

/** Retain failure and complete generated output after caller restoration; never retry. */
export function failRecordedWaveSettlement(
  receipt: RecordedWaveReceipt, lease: WaveTransitionLease, failure: ReceiptFailure
): void {
  const { current, installation } = publishedSettlementFor(receipt, lease);
  if (installation.settlement.progress.phase !== 'settling') throw new RecordedWaveReceiptError('wrongPhase');
  const preparedRewards = failure.preparedRewards === undefined ? undefined : structuredClone(failure.preparedRewards);
  if (preparedRewards) freezeRewardEvidence(preparedRewards);
  updateSettlement(current, installation, { phase: 'settlementFailed', failure: Object.freeze({ error: failure.error,
    ...(preparedRewards ? { preparedRewards } : {}) }) });
}
