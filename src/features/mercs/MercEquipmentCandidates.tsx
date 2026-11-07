import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import { checkEligibility } from '@/features/inventory/compareEquip';
import { Button, ItemTooltip, tItemName } from '@/ui';
import { PagedList } from '@/ui/PagedList';

interface Props {
  readonly candidates: readonly Item[];
  readonly current: Item | null;
  readonly merc: Mercenary;
  readonly onEquip: (item: Item) => boolean;
  readonly onSelect: () => void;
}

/** Inspect owned instances before asking the store to transfer the selected item. */
export function MercEquipmentCandidates({ candidates, current, merc, onEquip, onSelect }: Props) {
  const { t } = useTranslation(['mercs', 'inventory']);
  const id = useId();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = candidates.find(item => item.id === selectedId) ?? null;
  const eligibility = selected ? checkEligibility(selected, merc) : null;
  const query = search.trim().toLocaleLowerCase();
  const matches = useMemo(() => query ? candidates.filter(item =>
    `${tItemName(t, item)} #${item.id}`.toLocaleLowerCase().includes(query)) : candidates,
  [candidates, query, t]);

  return <div className="min-w-0 space-y-3">
    <label htmlFor={id} className="block text-sm text-d2-white/80">{t('inventory:crafting.search')}</label>
    <input id={id} type="search" value={search} onChange={event => { setSearch(event.target.value); }}
      className="d2-field min-h-[44px] w-full min-w-0 rounded border border-d2-border bg-d2-bg px-3 text-base text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold" />
    {!matches.length ? <p className="text-sm text-d2-white/70 italic">
      {t(candidates.length ? 'inventory:crafting.noMatches' : 'noCompatibleItems')}
    </p> : <div data-testid="merc-equip-candidates" className="flex max-h-48 flex-col overflow-auto">
      <PagedList key={query} items={matches} listClassName="space-y-2" renderItem={item => <li key={item.id}>
        <button type="button" aria-pressed={selectedId === item.id}
          className={`d2-plaque min-h-[44px] w-full min-w-0 rounded border p-2 text-left text-sm [overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-d2-gold ${selectedId === item.id ? 'border-d2-gold bg-d2-gold/10' : 'border-d2-border bg-black/20'}`}
          onClick={() => { setSelectedId(item.id); onSelect(); }}>
          {tItemName(t, item)}<span className="block text-xs text-d2-white/70">#{item.id}</span>
        </button>
      </li>} />
    </div>}
    <div className="grid items-start gap-3 sm:grid-cols-2">
      <section className="min-w-0 space-y-2" data-testid="merc-current-item">
        <h3 className="font-serif text-d2-gold">{t('equipmentFlow.current')}</h3>
        {current ? <ItemTooltip item={current} className="w-full" /> : <p>{t('inventory:empty')}</p>}
      </section>
      <section className="min-w-0 space-y-2" data-testid="merc-candidate-item">
        <h3 className="font-serif text-d2-gold">{t('equipmentFlow.candidate')}</h3>
        {selected ? <>
          <ItemTooltip item={selected} className="w-full" />
          {eligibility && !eligibility.eligible && <ul className="space-y-1 text-sm text-d2-red">
            {eligibility.reasons.map((reason, index) => <li key={index}>
              {reason.kind === 'level'
                ? t('inventory:equipFlow.picker.reason.level', { required: reason.required, current: reason.current })
                : t('inventory:equipFlow.picker.reason.stat', { ...reason,
                    stat: t(`inventory:equipFlow.picker.stat.${reason.stat ?? ''}`) })}
            </li>)}
          </ul>}
          <Button variant="primary" disabled={!eligibility?.eligible} className="w-full"
            onClick={() => { if (onEquip(selected)) setSelectedId(null); }}>
            {t('equipmentFlow.give')}
          </Button>
        </> : <p className="text-sm text-d2-white/70">{t('equipmentFlow.select')}</p>}
      </section>
    </div>
  </div>;
}
