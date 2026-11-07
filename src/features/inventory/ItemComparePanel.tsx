import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveItemDisplay, StatSheet, Tabs } from '@/ui';
import type { Item } from '@/engine/types/items';
import { PagedList } from '@/ui/PagedList';
import { netEquipDelta, type CompareResult } from './compareEquip';

export function AlreadyEquippedBadge(): JSX.Element {
  const { t } = useTranslation('inventory');
  return (
    <div
      className="d2-surface text-center py-3 px-4 rounded border border-d2-gold/40 bg-d2-gold/10 text-d2-gold text-sm font-serif"
      data-testid="already-equipped-badge"
    >
      ✓ {t('equipFlow.compare.alreadyEquipped')}
    </div>
  );
}

export function ItemComparePanel({
  compare,
  isAlreadyEquipped = false,
  selectedName,
  equippedAfter,
  titleId = 'equip-picker-compare-title'
}: {
  readonly compare: CompareResult;
  readonly isAlreadyEquipped?: boolean;
  readonly selectedName: string;
  readonly equippedAfter: readonly Item[];
  readonly titleId?: string;
}): JSX.Element {
  const { t } = useTranslation('inventory');
  const candidateDisplay = useMemo(
    () => resolveItemDisplay(compare.candidate, t, equippedAfter),
    [compare.candidate, equippedAfter, t]
  );
  const net = useMemo(() => netEquipDelta(compare), [compare]);

  return (
    <section
      data-testid="compare-panel"
      aria-labelledby={titleId}
      className="d2-surface flex min-h-0 flex-1 flex-col min-w-0 break-words border border-d2-border rounded bg-d2-bg/40 p-3 gap-2"
    >
      <h3
        id={titleId}
        className="d2-section-title text-sm uppercase tracking-wide text-d2-white/60 font-serif"
      >
        {t('equipFlow.compare.sectionTitle')}
      </h3>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {t('equipFlow.compare.selectionAnnounce', { name: selectedName })}
      </div>

      {isAlreadyEquipped ? (
        <AlreadyEquippedBadge />
      ) : (
        <>
          <Tabs tabs={[
            { id: 'stats', label: t('details'), content: (          <StatSheet
            mode="compare"
            current={compare.current}
            candidate={compare.candidate}
            stats={compare.stats}
            resistances={compare.resistances}
          />
) },
            ...(candidateDisplay.set && candidateDisplay.setBonuses.length > 0 ? [{
              id: 'set', label: t('detail.setBonus'), content: <PagedList items={candidateDisplay.setBonuses} renderItem={bonus => (
                <li key={bonus.threshold} className={bonus.active ? 'text-d2-set' : 'text-d2-white/70'}>
                  {t('detail.setBonusThreshold', { count: bonus.threshold })}{': '}{bonus.lines.map(line => line.text).join(', ')}
                </li>
              )} />,
            }] : []),
          ]} />
          {net !== 0 && (
            <div
              className={`text-sm font-serif ${net > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              data-testid="net-summary"
              data-trend={net > 0 ? 'up' : 'down'}
            >
              {net > 0
                ? t('equipFlow.compare.netUpgrade', { n: net })
                : t('equipFlow.compare.netDowngrade', { n: net })}
            </div>
          )}

        </>
      )}
    </section>
  );
}
