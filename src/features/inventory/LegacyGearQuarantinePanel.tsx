import { useState } from 'react';
import { PagedList } from '@/ui/PagedList';
import { useTranslation } from 'react-i18next';
import { useInventoryStore } from '@/stores';
import { Button, ItemTooltip, Modal, tItemName } from '@/ui';

/** Preserved older gear is inspectable here, outside all active item ownership controls. */
export function LegacyGearQuarantinePanel() {
  const { t } = useTranslation(['inventory', 'items']);
  const entries = useInventoryStore(state => state.legacyGearQuarantine);
  const [inspected, setInspected] = useState<typeof entries[number] | null>(null);
  return <section className="flex min-h-0 flex-1 flex-col gap-2" data-testid="legacy-gear-quarantine">
    <p className="text-sm text-d2-white/90">{t('quarantine.description')}</p>
    <PagedList items={entries} empty={<p>{t('common:none')}</p>} renderItem={(entry, index) =>
      <li key={index} className="min-w-0 break-words">
        <Button variant="secondary" className="w-full whitespace-normal text-left" onClick={() => { setInspected(entry); }}>
          {tItemName(t, entry.item)} · {t(`quarantine.origin.${entry.origin.container}`, {
            position: 'index' in entry.origin ? entry.origin.index + 1 : undefined,
            slot: 'slot' in entry.origin ? t(`slots.${entry.origin.slot}`) : undefined,
            mercenary: entry.origin.container === 'mercEquipment' ? entry.origin.mercId : undefined
          })}
        </Button>
      </li>} />
    <Modal isOpen={inspected !== null} onClose={() => { setInspected(null); }} title={t('details')}>
      {inspected && <ItemTooltip item={inspected.item} className="max-w-full" legacyInspection />}
    </Modal>
  </section>;
}
