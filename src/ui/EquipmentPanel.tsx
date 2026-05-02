import { useTranslation } from 'react-i18next';
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

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {slotOrder.map((slot) => {
        const item = equipped[slot] ?? null;
        const interactive = onSlotClick !== undefined;
        return (
          <li key={slot}>
            <div
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => { onSlotClick(slot); } : undefined}
              onKeyDown={interactive ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSlotClick(slot);
                }
              } : undefined}
              data-testid={`${testIdPrefix}-${slot}`}
              aria-label={t(`slots.${slot}`)}
              className={[
                'w-full border border-d2-border rounded p-3 bg-d2-bg/40 min-h-[64px]',
                'flex items-center justify-between gap-2 text-left transition-colors',
                interactive
                  ? 'cursor-pointer hover:border-d2-gold/60 focus:outline-none focus:ring-2 focus:ring-d2-gold'
                  : '',
              ].join(' ')}
            >
              <div className="min-w-0">
                <div className="text-xs text-d2-white/60">{t(`slots.${slot}`)}</div>
                {item ? (
                  <div className={`font-serif truncate ${rarityTextClass(item.rarity)}`}>
                    {tItemName(t, item)}
                  </div>
                ) : (
                  <div className="text-sm text-d2-white/40 italic">
                    {t('empty')}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item && onViewSlot && (
                  <Button
                    variant="secondary"
                    className="min-h-[40px] text-xs"
                    aria-label={t('details')}
                    data-testid={`${testIdPrefix}-${slot}-details`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewSlot(slot);
                    }}
                  >
                    {t('details')}
                  </Button>
                )}
                {item && onUnequip && (
                  <Button
                    variant="secondary"
                    className="min-h-[40px] text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnequip(slot);
                    }}
                  >
                    {t('unequip')}
                  </Button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
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
