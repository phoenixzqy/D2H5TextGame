/**
 * Item tooltip component
 */

import { GameImage } from './GameImage';
import { getItemIconUrl } from './imageHelpers';
import { RarityText } from './RarityText';
import type { Item } from '@/engine/types/items';

interface ItemTooltipProps {
  item: Item;
  className?: string;
}

export function ItemTooltip({ item, className = '' }: ItemTooltipProps) {
  return (
    <div
      className={`
        bg-d2-bg border-2 border-d2-gold rounded p-3 text-sm min-w-[200px] max-w-[300px]
        ${className}
      `}
    >
      {/* Item icon */}
      <div className="flex justify-center mb-2">
        <GameImage
          src={getItemIconUrl(item)}
          alt=""
          fallbackIcon={(item.equipSlot ?? item.baseId).charAt(0).toUpperCase() || '?'}
          size="lg"
        />
      </div>

      {/* Item name (uses baseId until catalog lookup is wired in frontend) */}
      <RarityText rarity={item.rarity} className="text-base font-bold block mb-2">
        {item.baseId}
      </RarityText>

      {/* Item level */}
      <div className="text-d2-border text-xs mb-2">ilvl {item.level}</div>

      {/* Affix IDs (frontend will look these up via i18n) */}
      {item.affixes && item.affixes.length > 0 && (
        <div className="space-y-1 mt-2 pt-2 border-t border-d2-border">
          {item.affixes.map((affix, idx) => (
            <div key={idx} className="text-d2-magic text-xs">
              {affix.affixId}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
