/** Process-local wave ownership only; receipt-specific boundaries are caller-owned. */
export type WaveGuardRefusal = 'waveBusy' | 'restorePending' | 'hydrationNotReady' | 'invalidLease' | 'itemDebitBusy' | 'questBusy' | 'materialBusy';

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
const questBrand = Symbol('questTransaction');
export interface QuestTransactionLease { readonly [questBrand]: true }
let activeQuest: QuestTransactionLease | null = null;
const materialBrand = Symbol('materialTransaction');
/** Exact synchronous owner for material preflight, publication and every rollback. */
export interface MaterialTransactionLease { readonly [materialBrand]: true }
let activeMaterial: MaterialTransactionLease | null = null;

let revision = 0;
let notificationScheduled = false;
const observers = new Map<symbol, () => void>();
function ownershipChanged(): void {
  revision++;
  if (notificationScheduled) return;
  notificationScheduled = true;
  queueMicrotask(() => {
    notificationScheduled = false;
    for (const [token, listener] of [...observers]) {
      if (!observers.has(token)) continue;
      try { listener(); } catch (error) { console.error('Wave guard observer failed', error); }
    }
  });
}

/** Stable external-store revision; guard assertions remain the authority for eligibility. */
export function inspectWaveGuard(): number { return revision; }
/** Observe ownership changes after the current stack, including the final asynchronous restore release. */
export function subscribeWaveGuard(listener: () => void): () => void {
  const token = Symbol('waveGuardObserver');
  observers.set(token, listener);
  return () => { observers.delete(token); };
}

/** Acquire exclusive synchronous wave ownership; caller must release in finally. */
export function beginWaveTransition(hydrationReady: boolean): WaveTransitionLease {
  if (activeMaterial) throw new WaveGuardError('materialBusy');
  if (activeWave) throw new WaveGuardError('waveBusy');
  if (activeQuest) throw new WaveGuardError('questBusy');
  if (restores.size > 0) throw new WaveGuardError('restorePending');
  if (!hydrationReady) throw new WaveGuardError('hydrationNotReady');
  activeWave = Object.freeze({ [waveBrand]: true as const });
  ownershipChanged();
  return activeWave;
}

/** Release the exact owner before returning whether one debounced save was deferred. */
export function endWaveTransition(lease: WaveTransitionLease): boolean {
  if (lease !== activeWave) throw new WaveGuardError('invalidLease');
  if (itemDebitActive) throw new WaveGuardError('itemDebitBusy');
  activeWave = null;
  ownershipChanged();
  const wakeSave = deferredSave;
  deferredSave = false;
  return wakeSave;
}

/** Reserve restore ownership synchronously; retain it through installation/failure cleanup. */
export function reserveWaveRestore(): WaveRestoreLease {
  if (activeMaterial) throw new WaveGuardError('materialBusy');
  if (activeWave) throw new WaveGuardError('waveBusy');
  if (activeQuest) throw new WaveGuardError('questBusy');
  const lease = Object.freeze({ [restoreBrand]: true as const });
  restores.add(lease);
  ownershipChanged();
  return lease;
}

/** Release only this restore request; a stale lease leaves all other owners intact. */
export function releaseWaveRestore(lease: WaveRestoreLease): void {
  if (!restores.delete(lease)) throw new WaveGuardError('invalidLease');
  ownershipChanged();
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
  if (activeMaterial) throw new WaveGuardError('materialBusy');
  if (activeWave) throw new WaveGuardError('waveBusy');
  if (activeQuest) throw new WaveGuardError('questBusy');
  if (restores.size > 0) throw new WaveGuardError('restorePending');
}

/** Coalesce save scheduling only while busy; the release caller performs the normal wake. */
export function deferWaveSaveIfBusy(): boolean {
  if (!activeWave && !activeQuest && !activeMaterial) return false;
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
  assertMaterialMutationAllowed();
  if (itemDebitActive) throw new WaveGuardError('itemDebitBusy');
}

/** Participating currency helpers cannot publish during a material action or its rollback. */
export function assertMaterialMutationAllowed(): void {
  if (activeMaterial) throw new WaveGuardError('materialBusy');
}

/** Hold snapshot/restore exclusion across every quest publication and rollback attempt. */
export function beginQuestTransaction(): QuestTransactionLease {
  assertIronGolemOwnershipMutationAllowed();
  if (activeQuest) throw new WaveGuardError('questBusy');
  if (restores.size > 0) throw new WaveGuardError('restorePending');
  activeQuest = Object.freeze({ [questBrand]: true as const });
  ownershipChanged();
  return activeQuest;
}
/** Release the exact owner; an outer accepted-wave transition retains save deferral. */
export function endQuestTransaction(lease: QuestTransactionLease): boolean {
  if (lease !== activeQuest) throw new WaveGuardError('invalidLease');
  activeQuest = null;
  ownershipChanged();
  if (activeWave) return false;
  const wakeSave = deferredSave;
  deferredSave = false;
  return wakeSave;
}

/** Material actions never nest inside a wave, quest, restore or another material action. */
export function beginMaterialTransaction(hydrationReady: boolean): MaterialTransactionLease {
  assertIronGolemOwnershipMutationAllowed();
  if (activeWave) throw new WaveGuardError('waveBusy');
  if (activeQuest) throw new WaveGuardError('questBusy');
  if (restores.size > 0) throw new WaveGuardError('restorePending');
  if (!hydrationReady) throw new WaveGuardError('hydrationNotReady');
  activeMaterial = Object.freeze({ [materialBrand]: true as const });
  ownershipChanged();
  return activeMaterial;
}

/** Release only the exact material owner and wake one coalesced save after ownership ends. */
export function endMaterialTransaction(lease: MaterialTransactionLease): boolean {
  if (lease !== activeMaterial) throw new WaveGuardError('invalidLease');
  activeMaterial = null;
  ownershipChanged();
  const wakeSave = deferredSave;
  deferredSave = false;
  return wakeSave;
}

/** Read-only assertion for finite participants under the existing quest lease. */
export function assertQuestTransactionActive(): void {
  if (!activeQuest) throw new WaveGuardError('invalidLease');
}

/** Validate the exact active owner before bounded material publication. */
export function assertMaterialTransactionOwner(lease: MaterialTransactionLease): void {
  if (lease !== activeMaterial) throw new WaveGuardError('invalidLease');
}
