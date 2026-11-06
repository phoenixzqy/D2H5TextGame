import { useTranslation } from 'react-i18next';
import type { Item } from '@/engine/types/items';
import { loadItemBases } from '@/data/loaders/loot';
import { effectiveSocketCapacity } from '@/engine/items/socket-capacity';
import { craftingBalanceName } from './craftingPresentation';

/** Inspect native socket order or explicitly inactive historical rune investments. */
export function CraftingSocketState({ item, preservedRunes }: { readonly item: Item; readonly preservedRunes?: readonly string[] | undefined }) {
  const { t } = useTranslation(['inventory', 'items']);
  const base = loadItemBases().get(item.baseId);
  const ids = preservedRunes ?? item.socketContents?.map(entry => entry.id) ?? [];
  return <div className="space-y-1 text-sm">
    <p>{t('crafting.capacity', { count: base ? effectiveSocketCapacity(item, base) : 0 })}</p>
    <p>{t(preservedRunes ? 'crafting.preservedContents' : 'crafting.contents')}</p>
    {ids.length ? <ol aria-label={t(preservedRunes ? 'crafting.preservedContents' : 'crafting.contents')} className="list-inside list-decimal">
      {ids.map((value, index) => <li className="d2-slot" key={index}>{craftingBalanceName(t, value)}</li>)}
    </ol> : <p>{t('crafting.emptyContents')}</p>}
    <p>{item.runewordId ? t(preservedRunes ? 'crafting.preservedWord' : 'crafting.word', { name: t(`items:runeword.${item.runewordId.split('/').pop() ?? ''}`) }) : preservedRunes ? null : t('crafting.noWord')}</p>
  </div>;
}

