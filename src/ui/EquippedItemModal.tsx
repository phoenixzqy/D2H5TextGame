/** Complete item details, shared by character and inventory equipment slots. */
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { ItemTooltip } from './ItemTooltip';
import type { Item, EquipmentSlot } from '@/engine/types/items';

interface Props {
  readonly slot: EquipmentSlot | null;
  readonly item: Item | null;
  readonly onClose: () => void;
}

export function EquippedItemModal({ slot, item, onClose }: Props): JSX.Element | null {
  const { t } = useTranslation('inventory');
  if (slot === null) return null;
  return (
    <Modal isOpen onClose={onClose} title={t(`slots.${slot}`)}>
      <div className="min-w-0 shrink-0" data-testid="equipped-item-modal">
        {item ? <ItemTooltip item={item} className="w-full" /> : <p>{t('empty')}</p>}
      </div>
    </Modal>
  );
}
