import type { Item } from '@/engine/types/items';
import {
  resolveIronGolemSelection,
  type IronGolemOwnership, type IronGolemSelection, type IronGolemSelectionResult
} from './ironGolemSelection';

const debitBrand = Symbol('ironGolemDebit');

/** Captured ownership intent only; this does not authorize or perform item payment. */
export interface IronGolemDebitIntent {
  readonly [debitBrand]: true;
  readonly selection: IronGolemSelection;
  readonly original: IronGolemOwnership;
  readonly item: Item;
  readonly index: number;
  readonly expectedBackpack: readonly Item[];
}

/** Capture preserves the ownership resolver's stable refusal reasons. */
export type IronGolemDebitCapture =
  | { readonly ok: true; readonly intent: IronGolemDebitIntent }
  | Extract<IronGolemSelectionResult, { readonly ok: false }>;

/** Observation only; third-reference states must never be repaired or inferred from absence. */
export type IronGolemDebitObservation = 'original' | 'committed' | 'conflict';

/**
 * Capture one exact live index and prepare its sole expected post-debit array.
 * Freeze only owned objects; never freeze or mutate the caller's containers/items.
 * Eligibility, engine attestation, run/hero/wave revalidation, guard ownership and
 * receipt-before-write remain caller obligations. No inventory write occurs here.
 */
export function captureIronGolemDebit(
  heroId: string | null,
  selection: IronGolemSelection | null,
  ownership: IronGolemOwnership
): IronGolemDebitCapture {
  if (selection === null) return { ok: false, reason: 'noSelection' };
  const resolved = resolveIronGolemSelection(heroId, selection, ownership);
  if (!resolved.ok) return resolved;
  const original = Object.freeze({ backpack: ownership.backpack, stash: ownership.stash,
    equipped: ownership.equipped, mercEquipment: ownership.mercEquipment });
  const expectedBackpack = Object.freeze(ownership.backpack.filter((_, index) => index !== resolved.index));
  const intent: IronGolemDebitIntent = Object.freeze({ [debitBrand]: true as const,
    selection, original, item: resolved.item, index: resolved.index, expectedBackpack });
  return { ok: true, intent };
}

/**
 * Observe live ownership after synchronous setter notifications, including throws.
 * Only exact container references prove original or committed state. This helper
 * neither writes nor compensates any state and is not a full receipt verifier.
 */
export function classifyIronGolemDebit(
  intent: IronGolemDebitIntent,
  live: IronGolemOwnership
): IronGolemDebitObservation {
  const { original, expectedBackpack, item, index } = intent;
  if (original.backpack.length !== expectedBackpack.length + 1 ||
    original.backpack[index] !== item || item.id !== intent.selection.itemId ||
    expectedBackpack.some((remaining, offset) => remaining !== original.backpack[offset < index ? offset : offset + 1]) ||
    live.stash !== original.stash || live.equipped !== original.equipped ||
    live.mercEquipment !== original.mercEquipment) return 'conflict';
  if (live.backpack === intent.original.backpack) return 'original';
  if (live.backpack === intent.expectedBackpack) return 'committed';
  return 'conflict';
}
