import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { PagedList } from './PagedList';
import { Button } from './Button';
import { tItemName } from './i18nKey';
import type { EquipmentSlot, Item } from '@/engine/types/items';

export const EQUIPMENT_SLOT_ORDER: readonly EquipmentSlot[] = [
  'head',
  'amulet',
  'chest',
  'gloves',
  'belt',
  'boots',
  'ring-left',
  'ring-right',
  'weapon',
  'offhand',
  'charm',
] as const;

interface EquipmentPanelProps {
  readonly equipped: Partial<Record<EquipmentSlot, Item | null>>;
  readonly slotOrder?: readonly EquipmentSlot[];
  readonly testIdPrefix?: string;
  readonly onUnequip?: (slot: EquipmentSlot) => void;
  readonly onSlotClick?: (slot: EquipmentSlot) => void;
  readonly onViewSlot?: (slot: EquipmentSlot) => void;
}

export function EquipmentPanel({
  equipped,
  slotOrder = EQUIPMENT_SLOT_ORDER,
  testIdPrefix = 'equip-slot',
  onUnequip,
  onSlotClick,
  onViewSlot,
}: EquipmentPanelProps): JSX.Element {
  const { t } = useTranslation('inventory');
  const descriptionId = useId();

  return (
    <PagedList items={slotOrder} listClassName="grid grid-cols-2 lg:grid-cols-3 gap-2" renderItem={(slot) => {
        const item = equipped[slot] ?? null;
        const interactive = onSlotClick !== undefined;
        const SlotContent = interactive ? 'button' : 'div';
        const itemDescriptionId = `${descriptionId}-${slot}`;
        return (
          <li key={slot}>
            <div
              role="group"
              data-testid={`${testIdPrefix}-${slot}`}
              aria-label={t(`slots.${slot}`)}
              className="d2-surface w-full min-w-0 border border-d2-border rounded p-1 bg-d2-bg/40 space-y-1"
            >
              <SlotContent
                type={interactive ? 'button' : undefined}
                onClick={interactive ? () => { onSlotClick(slot); } : undefined}
                aria-label={interactive ? t(`slots.${slot}`) : undefined}
                aria-describedby={interactive ? itemDescriptionId : undefined}
                data-testid={`${testIdPrefix}-${slot}-select`}
                className={[
                  'd2-slot block w-full min-w-0 min-h-[44px] rounded p-2 text-left',
                  interactive ? 'hover:bg-d2-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold' : '',
                ].join(' ')}
              >
                <span className="block text-sm text-d2-white/80">{t(`slots.${slot}`)}</span>
                {item ? (
                  <span id={itemDescriptionId} className={`block font-serif text-xs [overflow-wrap:anywhere] ${rarityTextClass(item.rarity)}`}>
                    {tItemName(t, item)}
                  </span>
                ) : (
                  <span id={itemDescriptionId} className="block text-sm text-d2-white/80 italic">
                    {t('empty')}
                  </span>
                )}
              </SlotContent>
              {item && (onViewSlot !== undefined || onUnequip !== undefined) && <div className="flex flex-wrap items-center gap-2">
                {onViewSlot && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 min-w-[44px] min-h-[44px] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold"
                    aria-label={t('details')}
                    data-testid={`${testIdPrefix}-${slot}-details`}
                    onClick={() => {
                      onViewSlot(slot);
                    }}
                  >
                    {t('details')}
                  </Button>
                )}
                {onUnequip && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 min-w-[44px] min-h-[44px] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold"
                    onClick={() => {
                      onUnequip(slot);
                    }}
                  >
                    {t('unequip')}
                  </Button>
                )}
              </div>}
            </div>
          </li>
        );
      }} />
  );
}

function rarityTextClass(rarity: Item['rarity']): string {
  switch (rarity) {
    case 'magic':
      return 'text-d2-magic';
    case 'rare':
      return 'text-d2-rare';
    case 'unique':
      return 'text-d2-unique';
    case 'set':
      return 'text-d2-set';
    case 'runeword':
      return 'text-d2-runeword';
    case 'normal':
    default:
      return 'text-d2-white';
  }
}
