import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/engine/types/items';
import { Button, ItemTooltip, Modal, tItemName } from '@/ui';
import { PagedList } from '@/ui/PagedList';
import { CraftingSocketState } from './CraftingSocketState';

export interface CraftingTarget { readonly item: Item; readonly origin: string; readonly preservedRunes?: readonly string[] }

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
  const matches = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return entries;
    return entries.filter(({ item, origin }) => `${tItemName(t, item)} #${item.id} ${origin}`.toLocaleLowerCase().includes(needle));
  }, [entries, search, t]);
  return <fieldset className="flex min-w-0 min-h-0 flex-1 flex-col gap-2">
    <legend className="d2-section-title text-d2-gold">{t('crafting.targets')}</legend>
    <label htmlFor={id} className="block text-sm">{t('crafting.search')}</label>
    <input id={id} type="search" value={search} onChange={event => { setSearch(event.target.value); }}
      className="d2-field min-h-[44px] w-full min-w-0 rounded border border-d2-border bg-d2-bg px-3 text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold" />
    <p role="status" className="text-sm">{t('crafting.selected', { count: selected.length })}</p>
    {!matches.length && <p className="text-sm">{t(entries.length ? 'crafting.noMatches' : 'crafting.emptyTargets')}</p>}
    <PagedList items={matches} listClassName="space-y-1" renderItem={entry => <CraftingTargetRow key={entry.item.id}
        entry={entry} checked={selected.includes(entry.item.id)} onChange={checked => {
          const itemId = entry.item.id;
          onChange(checked ? multiple ? [...selected, itemId] : [itemId] : selected.filter(value => value !== itemId));
        }} />} />
  </fieldset>;
}

/** Keep inspection local to the visible item and independent from crafting selection. */
function CraftingTargetRow({ entry: { item, origin, preservedRunes }, checked, onChange }: {
  readonly entry: CraftingTarget;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation(['inventory', 'items']);
  const [expanded, setExpanded] = useState(false);
  return <li className="min-w-0">
    <div className="flex items-center gap-2"><label className="d2-plaque flex-1 flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-d2-border px-3 py-2 has-[:checked]:border-d2-gold">
      <input type="checkbox" checked={checked} className="h-5 w-5 shrink-0 accent-d2-gold"
        onChange={event => { onChange(event.target.checked); }} />
      <span className="min-w-0 break-words text-sm">{tItemName(t, item)} · #{item.id}{' '}<span className="block text-d2-white/80">{origin}</span></span>
    </label>
    <Button type="button" variant="secondary" className="min-h-[44px] shrink-0" onClick={() => { setExpanded(value => !value); }}>
      {t('details')}<span className="sr-only"> #{item.id}</span>
    </Button>
    </div><Modal isOpen={expanded} onClose={() => { setExpanded(false); }} title={tItemName(t, item)}>
      {expanded && <>
        <ItemTooltip item={item} legacyInspection={preservedRunes !== undefined}
          preservedSocketInspection={preservedRunes !== undefined} className="max-w-full" />
        <CraftingSocketState item={item} preservedRunes={preservedRunes} />
      </>}
    </Modal>
  </li>;
}
