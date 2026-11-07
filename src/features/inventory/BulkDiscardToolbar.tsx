/** Compact bulk discard selector with a paginated confirmation preview. */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { PagedList } from '@/ui/PagedList';
import { RarityText } from '@/ui/RarityText';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item } from '@/engine/types/items';
import { countBulkDiscardCandidates, selectBelowEquippedTier, selectByRarity, type BulkDiscardCounts } from './bulkDiscard';

export interface BulkDiscardToolbarProps {
  readonly backpack: readonly Item[];
  readonly equipped: Readonly<Record<string, Item | null>>;
  readonly onDiscard: (ids: readonly string[]) => void;
}

type Mode = keyof BulkDiscardCounts;

function selectorFor(
  mode: Mode,
  backpack: readonly Item[],
  equipped: Readonly<Record<string, Item | null>>
): Item[] {
  switch (mode) {
    case 'normal':
      return selectByRarity(backpack, ['normal']);
    case 'magic':
      return selectByRarity(backpack, ['magic']);
    case 'rare':
      return selectByRarity(backpack, ['rare']);
    case 'belowTier':
      return selectBelowEquippedTier(backpack, equipped, loadItemBases());
  }
}


export function BulkDiscardToolbar({
  backpack,
  equipped,
  onDiscard
}: BulkDiscardToolbarProps): JSX.Element {
  const { t } = useTranslation(['inventory', 'items']);
  const { t: tItems } = useTranslation('items');
  const [mode, setMode] = useState<Mode>('normal');
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  const counts = useMemo(() => countBulkDiscardCandidates(backpack, equipped, loadItemBases()),
    [backpack, equipped]);

  const pending = pendingMode ? selectorFor(pendingMode, backpack, equipped) : [];

  const buttons: { readonly mode: Mode; readonly i18n: string }[] = [
    { mode: 'normal', i18n: 'bulk.discardNormal' },
    { mode: 'magic', i18n: 'bulk.discardMagic' },
    { mode: 'rare', i18n: 'bulk.discardRare' },
    { mode: 'belowTier', i18n: 'bulk.discardBelowTier' }
  ];

  return (
    <>
      <div className="flex shrink-0 gap-2 mb-2" data-testid="bulk-discard-toolbar">
        <select className="d2-field min-h-[44px] min-w-0 flex-1" aria-label={t('bulk.confirmTitle')}
          value={mode} onChange={event => { setMode(event.target.value as Mode); }}>
          {buttons.map(button => <option key={button.mode} value={button.mode}>{t(button.i18n)} ({counts[button.mode]})</option>)}
        </select>
        <Button variant="secondary" disabled={counts[mode] === 0}
          title={counts[mode] === 0 ? t('bulk.noMatches') : undefined}
          data-testid={`bulk-discard-${mode}`} onClick={() => { setPendingMode(mode); }}>{t('discard')}</Button>
      </div>

      <Modal
        isOpen={pendingMode !== null}
        onClose={() => { setPendingMode(null); }}
        title={t('bulk.confirmTitle')}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 text-sm">
          <p className="text-d2-white">
            {t('bulk.confirmBody', { count: pending.length })}
          </p>
          <p className="text-d2-white/70 text-xs italic">
            {t('bulk.exclusionNote')}
          </p>
          <PagedList items={pending} listClassName="space-y-1" renderItem={(it) => {
              const slug = it.baseId.split('/').pop() ?? it.baseId;
              const name = [it.generatedName?.prefix?.trim(), tItems(`base.${slug}`), it.generatedName?.suffix?.trim()].filter(Boolean).join(' ');
              return <li key={it.id}><RarityText rarity={it.rarity} className="text-xs">{name}</RarityText></li>;
          }} />
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              className="min-h-[44px] flex-1"
              onClick={() => { setPendingMode(null); }}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              className="min-h-[44px] flex-1"
              data-testid="bulk-discard-confirm"
              onClick={() => {
                onDiscard(pending.map((it) => it.id));
                setPendingMode(null);
              }}
            >
              {t('bulk.confirmAction')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
