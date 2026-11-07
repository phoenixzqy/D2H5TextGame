import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EquipmentSlot, Item } from '@/engine/types/items';
import type { MercEquipment } from '@/stores/mercStore';
import type { Mercenary } from '@/engine/types/entities';
import { checkEligibility, clearEquipTrend, prepareCompareMercEquip } from '@/features/inventory/compareEquip';
import { EquipmentCandidateSummary } from '@/features/inventory/EquipmentCandidateSummary';
import { ItemComparePanel } from '@/features/inventory/ItemComparePanel';
import { Button, ItemTooltip, tItemName } from '@/ui';
import { PagedList } from '@/ui/PagedList';

interface Props {
  readonly candidates: readonly Item[];
  readonly equipment: MercEquipment;
  readonly slot: EquipmentSlot;
  readonly merc: Mercenary;
  readonly onEquip: (item: Item) => boolean;
  readonly onSelect: () => void;
}

/** Inspect owned instances before asking the store to transfer the selected item. */
export function MercEquipmentCandidates({ candidates, equipment, slot, merc, onEquip, onSelect }: Props) {
  const { t } = useTranslation(['mercs', 'inventory']);
  const id = useId();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = candidates.find(item => item.id === selectedId) ?? null;
  const eligibility = selected ? checkEligibility(selected, merc) : null;
  const current = equipment[slot] ?? null;
  const compareItem = useMemo(() => {
    const prepare = prepareCompareMercEquip(merc, equipment);
    const cache = new WeakMap<Item, ReturnType<typeof prepare>>();
    return (item: Item) => {
      const cached = cache.get(item);
      if (cached) return cached;
      const result = prepare(item, slot);
      cache.set(item, result);
      return result;
    };
  }, [merc, equipment, slot]);
  const compare = selected ? compareItem(selected) : null;
  const equippedAfter = selected ? Object.entries(equipment)
    .flatMap(([key, item]) => key !== slot && item != null ? [item] : [])
    .concat(selected) : [];
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
      <PagedList key={query} items={matches} listClassName="space-y-2" renderItem={item => {
        const comparison = compareItem(item);
        const trend = clearEquipTrend(comparison);
        return <li key={item.id}>
          <button type="button" aria-pressed={selectedId === item.id}
            className={`d2-plaque flex min-h-[44px] w-full min-w-0 items-center gap-3 rounded border p-2 text-left text-sm [overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-d2-gold ${selectedId === item.id ? 'border-d2-gold bg-d2-gold/10' : 'border-d2-border bg-black/20'}`}
            onClick={() => { setSelectedId(item.id); onSelect(); }}>
            <EquipmentCandidateSummary item={item} showInstance />
            {trend && <span className={trend === 'up' ? 'text-xs text-emerald-400' : 'text-xs text-rose-400'} data-trend={trend}>
              {t(trend === 'up' ? 'inventory:equipFlow.compare.statsHigher' : 'inventory:equipFlow.compare.statsLower')}
            </span>}
          </button>
        </li>;
      }} />
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
          {compare && <ItemComparePanel compare={compare} selectedName={tItemName(t, selected)} equippedAfter={equippedAfter} />}
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
