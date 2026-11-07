import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GameImage, RarityText, getItemIconUrl, tItemName } from '@/ui';
import type { Item } from '@/engine/types/items';

/** Shared item identity and status for equipment candidate lists. */
export function EquipmentCandidateSummary({ item, showInstance = false, children }: {
  readonly item: Item;
  readonly showInstance?: boolean;
  readonly children?: ReactNode;
}) {
  const { t } = useTranslation(['inventory', 'rarity']);
  return <>
    <GameImage src={getItemIconUrl(item)} alt="" fallbackIcon="?"
      className="!w-12 !h-12 [&_img]:object-contain" />
    <div className="min-w-0 flex-1">
      <RarityText rarity={item.rarity} className="font-serif [overflow-wrap:anywhere] block">
        {tItemName(t, item)}
      </RarityText>
      <div className="text-xs text-d2-white/70">
        {t(`rarity:tier.${item.rarity}`)} · {t('itemLevel')} {item.ilvl ?? item.level} · {t(item.identified ? 'identified' : 'unidentified')}
      </div>
      {showInstance && <div className="text-xs text-d2-white/70 [overflow-wrap:anywhere]">#{item.id}</div>}
      {children}
    </div>
  </>;
}
