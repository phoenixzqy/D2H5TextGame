/**
 * BackpackGrid — uniform D2-style item grid.
 *
 * Layout intent:
 *   - Every visible cell has *identical* outer dimensions: a square slot
 *     sized by `grid-cols-[repeat(auto-fill,minmax(64px,1fr))]` + the row
 *     auto-sized by `aspect-square` on each cell. Filled and empty cells
 *     share the same outer box → no ad-hoc gaps.
 *   - Filled cells render `<GameCard variant="item" fluid />` which now
 *     stretches to fill the cell (vs. its legacy fixed 64×64 footprint
 *     that was leaving stray whitespace inside wider grid columns — the
 *     bug the user reported).
 *   - Empty cells render a subtle dashed-border placeholder so the grid
 *     reads as a complete D2 backpack (e.g. 100 slots) rather than a
 *     ragged array of whatever happens to be picked up.
 *
 * Capacity:
 *   Every saved item remains visible, even above `capacity`. Capacity only
 *   sets the minimum cell count for empty placeholders. Items are placed in
 *   array order left-to-right top-to-bottom; trailing slots are placeholders. We do
 *   *not* assume a stable per-item index because the engine keeps the
 *   backpack as a flat array; reordering is a future feature.
 *
 * Reflow: when the detail panel opens, the parent grid narrows the left
 *   column. `auto-fill` automatically reduces column count → grid stays
 *   visually consistent, no manual breakpoints.
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GameCard, ItemTooltip, Tooltip, getItemIconUrl, tItemName } from '@/ui';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item, ItemBase } from '@/engine/types/items';

export interface BackpackGridProps {
  readonly items: readonly Item[];
  readonly capacity: number;
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  /** Canonical comparison for the current player/loadout; identity tracks its inputs. */
  readonly isUpgrade?: ((item: Item) => boolean) | undefined;
}

export function BackpackGrid({
  items,
  capacity,
  selectedId,
  onSelect,
  isUpgrade
}: BackpackGridProps): JSX.Element {
  const { t } = useTranslation('inventory');

  // Preserve legacy over-cap items; capacity controls empty slots only.
  const cells = useMemo<readonly (Item | null)[]>(() => {
    const out: (Item | null)[] = [...items];
    while (out.length < capacity) out.push(null);
    return out;
  }, [items, capacity]);

  return (
    <ul
      className="grid gap-2 content-start grid-cols-[repeat(auto-fill,minmax(64px,1fr))]"
      role="listbox"
      aria-label={t('items')}
      data-testid="backpack-grid"
    >
      {cells.map((it, idx) => (
        <li key={it ? `item-${it.id}` : `empty-${String(idx)}`} className="aspect-square">
          {it ? (
            <ItemCell
              item={it}
              selected={selectedId === it.id}
              isUpgrade={isUpgrade}
              onSelect={onSelect}
            />
          ) : (
            <EmptySlot index={idx} label={t('emptySlot', { defaultValue: 'Empty slot' })} />
          )}
        </li>
      ))}
    </ul>
  );
}

interface ItemCellProps {
  readonly item: Item;
  readonly selected: boolean;
  readonly isUpgrade: BackpackGridProps['isUpgrade'];
  readonly onSelect: (id: string | null) => void;
}

// Item keys preserve identity; memo also keeps unchanged floating tooltips out
// of unrelated grid updates. Locale changes still reach each cell directly.
const ItemCell = memo(function ItemCell({
  item,
  selected,
  isUpgrade,
  onSelect
}: ItemCellProps): JSX.Element {
  const { t } = useTranslation('inventory');
  const upgrade = useMemo(() => isUpgrade?.(item) ?? false, [isUpgrade, item]);
  return (
    <div className="relative h-full w-full">
      <Tooltip content={<ItemTooltip item={item} />} referenceClassName="h-full w-full">
        <GameCard
          variant="item"
          size="md"
          fluid
          name={tItemName(t, item)}
          rarity={item.rarity}
          image={getItemIconUrl(item) ?? undefined}
          itemGlyph={glyphForItem(item)}
          selected={selected}
          onClick={() => {
            onSelect(selected ? null : item.id);
          }}
          testId={`inv-item-${item.id}`}
        />
      </Tooltip>
      {upgrade ? <UpgradeChevron label={t('upgradeBadge')} itemId={item.id} /> : null}
    </div>
  );
});

function UpgradeChevron({ label, itemId }: { label: string; itemId: string }): JSX.Element {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="pointer-events-none absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center drop-shadow"
      data-testid={`inv-upgrade-badge-${itemId}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-full w-full overflow-visible">
        <path
          d="M4 15.5 12 7.5l8 8"
          fill="none"
          stroke="rgb(5 10 5)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8"
        />
        <path
          d="M4 15.5 12 7.5l8 8"
          fill="none"
          stroke="rgb(134 239 172)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path
          d="M6.5 14.25 12 8.75l5.5 5.5"
          fill="none"
          stroke="rgb(220 252 231)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}

function EmptySlot({ index, label }: { index: number; label: string }): JSX.Element {
  return (
    <div
      role="presentation"
      aria-label={label}
      data-testid={`inv-empty-${String(index)}`}
      className="d2-slot w-full h-full rounded-md border border-dashed border-d2-border/40 bg-d2-bg/30"
    />
  );
}

function glyphForItem(item: Item):
  | 'weapon'
  | 'shield'
  | 'jewelry'
  | 'scroll'
  | 'charm'
  | 'gem'
  | 'rune'
  | 'armor'
  | undefined {
  const base: ItemBase | undefined = loadItemBases().get(item.baseId);
  const slug = item.baseId.split('/').pop() ?? '';
  if (base) {
    if (base.type === 'weapon') return 'weapon';
    if (base.type === 'jewelry') return 'jewelry';
    if (base.type === 'charm') return 'charm';
    if (base.type === 'gem') return 'gem';
    if (base.type === 'rune') return 'rune';
    if (base.type === 'armor') {
      if (base.slot === 'offhand' || slug.startsWith('sh-')) return 'shield';
      return 'armor';
    }
    return 'scroll';
  }
  if (slug.startsWith('sh-')) return 'shield';
  if (slug.startsWith('wp')) return 'weapon';
  if (slug.startsWith('ring-') || slug.startsWith('amu-')) return 'jewelry';
  return undefined;
}
