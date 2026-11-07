import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/engine/types/items';
import { Button, tItemName } from '@/ui';
import { PagedList } from '@/ui/PagedList';

interface Props {
  readonly candidates: readonly Item[];
  readonly onEquip: (item: Item) => void;
}

/** Search owned instances without changing their order or native transfer authority. */
export function MercEquipmentCandidates({ candidates, onEquip }: Props) {
  const { t } = useTranslation(['mercs', 'inventory']);
  const id = useId();
  const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase();
  const matches = useMemo(() => query ? candidates.filter(item =>
    `${tItemName(t, item)} #${item.id}`.toLocaleLowerCase().includes(query)) : candidates,
  [candidates, query, t]);

  return <div className="flex min-w-0 min-h-0 flex-1 flex-col gap-2">
    <label htmlFor={id} className="block text-sm text-d2-white/80">{t('inventory:crafting.search')}</label>
    <input id={id} type="search" value={search} onChange={event => { setSearch(event.target.value); }}
      className="d2-field min-h-[44px] w-full min-w-0 rounded border border-d2-border bg-d2-bg px-3 text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold" />
    {!matches.length ? <p className="text-sm text-d2-white/70 italic">
      {t(candidates.length ? 'inventory:crafting.noMatches' : 'noCompatibleItems')}
    </p> : <CandidatePage key={query} candidates={matches} onEquip={onEquip} />}
  </div>;
}

function CandidatePage({ candidates, onEquip }: Props) {
  const { t } = useTranslation(['mercs', 'inventory']);
  return <div data-testid="merc-equip-candidates" className="flex min-h-0 flex-1 flex-col">
    <PagedList items={candidates} listClassName="space-y-2" renderItem={item => <li key={item.id}
        className="d2-plaque flex items-center justify-between gap-2 rounded border border-d2-border bg-black/20 p-2">
        <span className="min-w-0 break-words text-sm text-d2-white/85">
          {tItemName(t, item)}<span className="block text-xs text-d2-white/70">#{item.id}</span>
        </span>
        <Button variant="primary" className="min-h-[44px] shrink-0 text-xs" onClick={() => { onEquip(item); }}>
          {t('inventory:equip')}
        </Button>
      </li>} />
  </div>;
}
