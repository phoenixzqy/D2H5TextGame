import type { Item } from '@/engine/types/items';
import { projectIronGolemItem, type IronGolemBonuses, type IronGolemItemRefusal } from '@/engine/items/iron-golem';
import { isIronGolemSkill } from '@/engine/skills/iron-golem';
import { scopedSummonConfiguration } from './combatHelpers';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMercStore } from './mercStore';
import { resolveIronGolemSelection, type IronGolemSelection, type IronGolemSelectionResult } from './ironGolemSelection';
import { armIronGolemSelection, clearIronGolemSelection, IronGolemAcknowledgementError, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { assertWaveSnapshotAllowed } from './waveTransitionGuard';

type OwnershipRefusal = Extract<IronGolemSelectionResult, { ok: false }>['reason'];
/** Stable item/ownership refusals; no guessed combat-preparation failure reason. */
export type IronGolemPresentationRefusal = OwnershipRefusal | IronGolemItemRefusal;
/** One live, isolated item projection. Eligibility never proves payment. */
export type PresentedIronGolemItem =
  | { readonly eligible: true; readonly item: Item; readonly index: number; readonly bonuses: IronGolemBonuses }
  | { readonly eligible: false; readonly reason: IronGolemPresentationRefusal };
/** Payment for this receipt only; none says nothing about earlier recordings. */
export type PresentedIronGolemPayment =
  | { readonly kind: 'verified'; readonly item: Item; readonly paidMp: number }
  | { readonly kind: 'none' };
/** Receipt authority is separate from the next-wave instruction and draft preview. */
export type PresentedIronGolemAttempt =
  | { readonly kind: 'none' }
  | { readonly kind: 'unverified'; readonly phase: 'prepared' | 'conflict'; readonly replayLocked: boolean; readonly isReplay: boolean }
  | { readonly kind: 'pendingPublication'; readonly replayLocked: boolean; readonly isReplay: boolean; readonly payment: PresentedIronGolemPayment }
  | { readonly kind: 'summoned'; readonly replayLocked: boolean; readonly item: Item; readonly paidMp: number }
  | { readonly kind: 'notPrepared'; readonly replayLocked: boolean }
  | { readonly kind: 'replay'; readonly replayLocked: boolean };
/** Ephemeral live view; never persist, reserve an item or use it as debit authority. */
export interface IronGolemPresentation {
  readonly draft: PresentedIronGolemItem;
  readonly armed: PresentedIronGolemItem;
  readonly selection: IronGolemSelection | null;
  readonly configurationReady: boolean;
  readonly attempt: PresentedIronGolemAttempt;
}

function presentedItem(heroId: string | null, selection: IronGolemSelection | null): PresentedIronGolemItem {
  const inventory = useInventoryStore.getState();
  const resolved = resolveIronGolemSelection(heroId, selection, {
    backpack: inventory.backpack, stash: inventory.stash, equipped: inventory.equipped,
    mercEquipment: useMercStore.getState().mercEquipment
  });
  if (!resolved.ok) return { eligible: false, reason: resolved.reason };
  const projection = projectIronGolemItem(resolved.item);
  return projection.eligible ? { ...projection, item: resolved.item, index: resolved.index } : projection;
}
function attemptFor(heroId: string | null): PresentedIronGolemAttempt {
  if (heroId === null) return { kind: 'none' };
  const holder = inspectRecordedWaves();
  const current = holder.pending?.binding.heroId === heroId ? holder.pending
    : holder.currentPublished?.binding.heroId === heroId ? holder.currentPublished : null;
  if (!current) return { kind: 'none' };
  const replayLocked = current.binding.publication.ironGolemReplayLocked;
  const isReplay = current.installation?.intent.kind === 'replay';
  if (current.phase === 'prepared' || current.phase === 'conflict') {
    return { kind: 'unverified', phase: current.phase, replayLocked, isReplay };
  }
  const { debitIntent, attestation } = current.binding;
  const payment: PresentedIronGolemPayment = !isReplay && debitIntent && attestation &&
    attestation.sourceHeroId === heroId && attestation.sourceItemId === debitIntent.item.id &&
    debitIntent.selection.heroId === heroId && debitIntent.selection.itemId === attestation.sourceItemId &&
    Number.isFinite(attestation.paidMp) && attestation.paidMp > 0
    ? { kind: 'verified', item: debitIntent.item, paidMp: attestation.paidMp } : { kind: 'none' };
  if (current.phase === 'committedPendingPublication') {
    return { kind: 'pendingPublication', replayLocked, isReplay, payment };
  }
  if (isReplay) return { kind: 'replay', replayLocked };
  return payment.kind === 'verified' ? { kind: 'summoned', replayLocked, item: payment.item, paidMp: payment.paidMp }
    : { kind: 'notPrepared', replayLocked };
}

/**
 * Read current live draft, armed instruction and receipt evidence without writes,
 * simulation, automatic selection or qualification from life/mana. Safe to observe
 * during a transition; in-flight phases never infer consumption from item absence.
 */
export function readIronGolemPresentation(draftItemId: string | null): IronGolemPresentation {
  const player = usePlayerStore.getState().player;
  const heroId = player?.id ?? null;
  const selection = useIronGolemSelectionStore.getState().selection;
  return {
    draft: presentedItem(heroId, draftItemId === null ? null : { heroId: heroId ?? '', itemId: draftItemId }),
    armed: presentedItem(heroId, selection), selection,
    configurationReady: Boolean(player && scopedSummonConfiguration(player).skillOrder.some(id => isIronGolemSkill({ id }))),
    attempt: attemptFor(heroId)
  };
}

/** Stable action refusal; primitive wave guards and acknowledgement keep their own types. */
export class IronGolemPresentationError extends Error {
  constructor(readonly code: IronGolemPresentationRefusal | 'configurationUnavailable' | 'staleSelection') {
    super(code); this.name = 'IronGolemPresentationError';
  }
}
/**
 * Recheck displayed hero, exact live item and production configuration before arm.
 * Guard errors take precedence; acknowledgement is explicit. No payment or reserve.
 * Subscriber exceptions propagate unchanged, including after a successful write;
 * callers must reread live selection rather than infer that nothing changed.
 */
export function armPresentedIronGolem(expectedHeroId: string, itemId: string, acknowledged: boolean): IronGolemSelection {
  assertWaveSnapshotAllowed();
  if (!acknowledged) throw new IronGolemAcknowledgementError();
  const player = usePlayerStore.getState().player;
  if (!player || player.id !== expectedHeroId) throw new IronGolemPresentationError('heroMismatch');
  const model = readIronGolemPresentation(itemId);
  if (!model.draft.eligible) throw new IronGolemPresentationError(model.draft.reason);
  if (!model.configurationReady) throw new IronGolemPresentationError('configurationUnavailable');
  return armIronGolemSelection(expectedHeroId, itemId, acknowledged);
}
/**
 * Clear only the exact instruction and hero displayed by the caller. A stale
 * control cannot clear a later rearm, even with equal IDs. Guard errors precede
 * stale checks; subscriber exceptions after a write propagate unchanged.
 */
export function clearPresentedIronGolem(expectedHeroId: string, expectedSelection: IronGolemSelection | null): void {
  assertWaveSnapshotAllowed();
  if (usePlayerStore.getState().player?.id !== expectedHeroId) throw new IronGolemPresentationError('heroMismatch');
  if (useIronGolemSelectionStore.getState().selection !== expectedSelection) throw new IronGolemPresentationError('staleSelection');
  clearIronGolemSelection();
}
