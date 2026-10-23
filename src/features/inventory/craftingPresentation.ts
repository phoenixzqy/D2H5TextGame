import { materialCatalog } from '@/data/loaders/materials';
import { tDataKey } from '@/ui/i18nKey';
import type { TFunction } from 'i18next';
import { MaterialActionRestorationError } from '@/stores/materialActionTransaction';

/** Closed catalog names; currency names live beside the crafting controls. */
export function craftingBalanceName(t: TFunction, id: string): string {
  const material = materialCatalog.get(id);
  return material ? tDataKey(t, material.nameKey) : t(`crafting.currency.${id}`);
}

/** Translate known refusals without exposing exception text or claiming a rollback succeeded. */
export function craftingErrorKey(error: unknown): string {
  if (error instanceof MaterialActionRestorationError) return 'crafting.error.rollback';
  const message = error instanceof Error ? error.message : '';
  if (/rollback|restoration/i.test(message)) return 'crafting.error.rollback';
  if (message === 'Material action requires an idle character') return 'crafting.error.idle';
  if (message === 'Material action hydration is not ready' || message === 'Material action requires a character') return 'crafting.error.ready';
  if (message === 'Insufficient crafting materials' || message === 'Insufficient crafting currency') return 'crafting.error.materials';
  if (message === 'Rune fusion output not unlocked') return 'crafting.error.unlock';
  if (message === 'No room for recovered item') return 'crafting.error.capacity';
  if (['Material action inputs changed', 'Stale or gapped material action', 'Wrong material action character'].includes(message)) return 'crafting.error.stale';
  if (/^(Ineligible|Invalid insertion selection|Transform needs|Empty or malformed salvage|Missing or duplicate owned|Invalid recovery selection|Invalid or colliding recovery entry|Base has no socket budget)/.test(message)) return 'crafting.error.target';
  return 'crafting.error.unknown';
}
