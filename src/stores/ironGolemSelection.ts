import type { EquipmentSlot, Item } from '@/engine/types/items';

/** Explicit hero-bound instruction; acknowledgement and lifecycle are caller-owned. */
export interface IronGolemSelection {
  readonly heroId: string;
  readonly itemId: string;
}

/** All live item locations, including every mercenary gear entry. */
export interface IronGolemOwnership {
  readonly backpack: readonly Item[];
  readonly stash: readonly Item[];
  readonly equipped: Readonly<Record<string, Item | null>>;
  readonly mercEquipment: Readonly<Record<string, Readonly<Partial<Record<EquipmentSlot, Item | null>>>>>;
}

/** Ownership resolution alone never authorizes consumption or proves item eligibility. */
export type IronGolemSelectionResult =
  | { readonly ok: true; readonly item: Item; readonly index: number }
  | { readonly ok: false; readonly reason: 'noSelection' | 'heroMismatch' | 'duplicateItem' | 'notInBackpack' };

/**
 * Resolve the instruction to one exact live backpack location without mutation.
 * Count locations, including aliases of the same object, across all containers.
 * Item projection, acknowledgement, selection lifecycle and debit are separate.
 */
export function resolveIronGolemSelection(
  heroId: string | null,
  selection: IronGolemSelection | null,
  ownership: IronGolemOwnership
): IronGolemSelectionResult {
  if (!selection) return { ok: false, reason: 'noSelection' };
  if (heroId === null || selection.heroId !== heroId) return { ok: false, reason: 'heroMismatch' };
  const matches = (items: readonly (Item | null | undefined)[]): number =>
    items.reduce<number>((count, item) => count + (item?.id === selection.itemId ? 1 : 0), 0);
  const count = matches(ownership.backpack) + matches(ownership.stash)
    + matches(Object.values(ownership.equipped))
    + Object.values(ownership.mercEquipment).reduce((total, gear) => total + matches(Object.values(gear)), 0);
  if (count > 1) return { ok: false, reason: 'duplicateItem' };
  const index = ownership.backpack.findIndex(item => item.id === selection.itemId);
  const item = ownership.backpack[index];
  return item ? { ok: true, item, index } : { ok: false, reason: 'notInBackpack' };
}
