import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/engine/types/items';
import { Button, tItemName } from '@/ui';

export interface CraftingTarget { readonly item: Item; readonly origin: string; readonly preservedRunes?: readonly string[] }
const pageSize = 12;

/** Bound rendering cost while preserving exact selections across search and pages. */
export function CraftingTargets({ entries, selected, multiple, onChange }: {
  readonly entries: readonly CraftingTarget[];
  readonly selected: readonly string[];
  readonly multiple: boolean;
  readonly onChange: (ids: readonly string[]) => void;
}) {
  const { t } = useTranslation(['inventory', 'items']);
  const id = useId();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const matches = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return entries.filter(({ item, origin }) => `${tItemName(t, item)} #${item.id} ${origin}`.toLocaleLowerCase().includes(needle));
  }, [entries, search, t]);
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  return <fieldset className="min-w-0 space-y-2">
    <legend className="text-d2-gold">{t('crafting.targets')}</legend>
    <label htmlFor={id} className="block text-sm">{t('crafting.search')}</label>
    <input id={id} type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }}
      className="min-h-[44px] w-full min-w-0 rounded border border-d2-border bg-d2-bg px-3 text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold" />
    <p role="status" className="text-sm">{t('crafting.selected', { count: selected.length })}</p>
    {!matches.length && <p className="text-sm">{t(entries.length ? 'crafting.noMatches' : 'crafting.emptyTargets')}</p>}
    <ul className="space-y-1">
      {matches.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(({ item, origin }) => <li key={item.id}>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-d2-border px-3 py-2 has-[:checked]:border-d2-gold">
          <input type="checkbox" checked={selected.includes(item.id)} className="h-5 w-5 shrink-0 accent-d2-gold"
            onChange={event => { onChange(event.target.checked ? multiple ? [...selected, item.id] : [item.id] : selected.filter(value => value !== item.id)); }} />
          <span className="min-w-0 break-words text-sm">{tItemName(t, item)} · #{item.id}{' '}<span className="block text-d2-white/80">{origin}</span></span>
        </label>
      </li>)}
    </ul>
    {pages > 1 && <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); }}>{t('crafting.previous')}</Button>
      <span className="text-sm">{t('crafting.page', { page: currentPage + 1, pages })}</span>
      <Button type="button" variant="secondary" disabled={currentPage + 1 >= pages} onClick={() => { setPage(currentPage + 1); }}>{t('crafting.next')}</Button>
    </div>}
  </fieldset>;
}
