/**
 * BulkDiscardToolbar — "Discard all …" actions above the backpack grid.
 *
 * Rules:
 *   - Buttons are disabled with a tooltip-style title when no items match.
 *   - All actions exclude unique/set items (enforced by selectors in
 *     `bulkDiscard.ts`).
 *   - Each click opens a single confirm dialog showing count + the first
 *     10 affected names with "and N more" overflow.
 *
 * Mobile: the buttons collapse into a "Bulk" details/summary disclosure
 * so they don't push the grid off-screen at 360-px width.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { RarityText } from '@/ui/RarityText';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item } from '@/engine/types/items';
import { selectBelowEquippedTier, selectByRarity } from './bulkDiscard';

export interface BulkDiscardToolbarProps {
  readonly backpack: readonly Item[];
  readonly equipped: Readonly<Record<string, Item | null>>;
  readonly onDiscard: (ids: readonly string[]) => void;
}

type Mode = 'normal' | 'magic' | 'rare' | 'belowTier';

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

const MAX_PREVIEW = 10;

export function BulkDiscardToolbar({
  backpack,
  equipped,
  onDiscard
}: BulkDiscardToolbarProps): JSX.Element {
  const { t } = useTranslation(['inventory', 'items']);
  const { t: tItems } = useTranslation('items');
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  const counts = useMemo(() => ({
    normal: selectorFor('normal', backpack, equipped).length,
    magic: selectorFor('magic', backpack, equipped).length,
    rare: selectorFor('rare', backpack, equipped).length,
    belowTier: selectorFor('belowTier', backpack, equipped).length
  }), [backpack, equipped]);

  const pending = pendingMode ? selectorFor(pendingMode, backpack, equipped) : [];

  const buttons: { readonly mode: Mode; readonly i18n: string }[] = [
    { mode: 'normal', i18n: 'bulk.discardNormal' },
    { mode: 'magic', i18n: 'bulk.discardMagic' },
    { mode: 'rare', i18n: 'bulk.discardRare' },
    { mode: 'belowTier', i18n: 'bulk.discardBelowTier' }
  ];

  return (
    <>
      <div
        className="flex flex-wrap gap-2 mb-3"
        data-testid="bulk-discard-toolbar"
      >
        {buttons.map((b) => {
          const count = counts[b.mode];
          const disabled = count === 0;
          return (
            <Button
              key={b.mode}
              variant="secondary"
              className="min-h-[44px] text-xs"
              disabled={disabled}
              title={disabled ? t('bulk.noMatches') : undefined}
              data-testid={`bulk-discard-${b.mode}`}
              onClick={() => { setPendingMode(b.mode); }}
            >
              {t(b.i18n)}
              <span className="ml-1 text-d2-white/60">({count})</span>
            </Button>
          );
        })}
      </div>

      <Modal
        isOpen={pendingMode !== null}
        onClose={() => { setPendingMode(null); }}
        title={t('bulk.confirmTitle')}
      >
        <div className="space-y-3 text-sm">
          <p className="text-d2-white">
            {t('bulk.confirmBody', { count: pending.length })}
          </p>
          <p className="text-d2-white/70 text-xs italic">
            {t('bulk.exclusionNote')}
          </p>
          <ul
            className="max-h-60 overflow-y-auto border border-d2-border/60 rounded p-2 space-y-0.5"
            data-testid="bulk-discard-preview"
          >
            {pending.slice(0, MAX_PREVIEW).map((it) => {
              const slug = it.baseId.split('/').pop() ?? it.baseId;
              const baseName = tItems(`base.${slug}`);
              const prefix = it.generatedName?.prefix?.trim();
              const suffix = it.generatedName?.suffix?.trim();
              const name = [prefix, baseName, suffix].filter(Boolean).join(' ');
              return (
                <li key={it.id}>
                  <RarityText rarity={it.rarity} className="text-xs">
                    {name}
                  </RarityText>
                </li>
              );
            })}
            {pending.length > MAX_PREVIEW && (
              <li className="text-d2-white/60 text-xs italic">
                {t('bulk.andMore', { count: pending.length - MAX_PREVIEW })}
              </li>
            )}
          </ul>
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
