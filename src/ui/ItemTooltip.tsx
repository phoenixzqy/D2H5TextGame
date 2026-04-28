/**
 * ItemTooltip — D2-style expanded item card. Replaces the older
 * minimalist tooltip with the variant-`item` (expanded) layout from
 * docs/art/card-design-spec.md §3.3 (b).
 *
 *   ┌─────────────────────┐
 *   │   <name in rarity>  │
 *   │   <base type>       │
 *   │     [icon 80×80]    │
 *   │   ilvl 12           │
 *   │   <stat lines>      │
 *   │   <flavor>          │
 *   └─────────────────────┘
 */
import { RarityText } from './RarityText';
import { resolveItemIcon } from './cardAssets';
import type { Item } from '@/engine/types/items';

interface ItemTooltipProps {
  item: Item;
  className?: string;
}

const RARITY_BORDER: Record<Item['rarity'], string> = {
  normal: 'border-d2-white/40',
  magic: 'border-d2-magic',
  rare: 'border-d2-rare',
  set: 'border-d2-set',
  unique: 'border-d2-unique',
  runeword: 'border-d2-runeword'
};

export function ItemTooltip({ item, className = '' }: ItemTooltipProps) {
  const icon = resolveItemIcon(item.baseId);
  return (
    <div
      className={[
        'bg-d2-bg/95 border-2 rounded-md p-3 text-sm w-56 max-w-[18rem]',
        'shadow-2xl shadow-black/70',
        RARITY_BORDER[item.rarity],
        className
      ]
        .filter(Boolean)
        .join(' ')}
      role="tooltip"
    >
      <div className="text-center mb-1">
        <RarityText rarity={item.rarity} className="font-serif text-base font-bold block">
          {item.baseId.split('/').pop() ?? item.baseId}
        </RarityText>
        <div className="text-[11px] text-d2-white/70 truncate">{item.baseId}</div>
      </div>

      <div className="flex justify-center my-2">
        <div className="w-20 h-20 border border-d2-border/70 bg-d2-panel rounded flex items-center justify-center overflow-hidden">
          {icon ? (
            <img
              src={icon}
              alt={item.baseId}
              loading="lazy"
              className="w-full h-full object-contain"
            />
          ) : (
            <span aria-hidden className="font-serif text-d2-border text-3xl">
              ?
            </span>
          )}
        </div>
      </div>

      <div className="text-d2-white/70 text-[11px] text-center mb-2">
        ilvl {item.level}
      </div>

      {item.affixes && item.affixes.length > 0 && (
        <ul className="space-y-0.5 pt-2 border-t border-d2-border/60">
          {item.affixes.map((affix, idx) => (
            <li key={idx} className="text-d2-magic text-xs">
              {affix.affixId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
