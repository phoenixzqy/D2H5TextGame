import { useTranslation } from 'react-i18next';
import { useInventoryStore } from '@/stores';
import { ItemTooltip, Panel, tItemName } from '@/ui';

/** Preserved older gear is inspectable here, outside all active item ownership controls. */
export function LegacyGearQuarantinePanel() {
  const { t } = useTranslation(['inventory', 'items']);
  const entries = useInventoryStore(state => state.legacyGearQuarantine);
  if (entries.length === 0) return null;
  return <Panel title={t('quarantine.title')} className="mb-4" data-testid="legacy-gear-quarantine">
    <p className="mb-3 text-sm text-d2-white/90">{t('quarantine.description')}</p>
    <ul className="space-y-3">
      {entries.map((entry, index) => <li key={index} className="min-w-0 break-words">
        <details className="d2-surface rounded border border-d2-border p-2">
          <summary className="d2-section-title min-h-[44px] cursor-pointer py-3 text-d2-gold focus-visible:ring-2 focus-visible:ring-d2-gold">
            {tItemName(t, entry.item)} · {t(`quarantine.origin.${entry.origin.container}`, {
              position: 'index' in entry.origin ? entry.origin.index + 1 : undefined,
              slot: 'slot' in entry.origin ? t(`slots.${entry.origin.slot}`) : undefined,
              mercenary: entry.origin.container === 'mercEquipment' ? entry.origin.mercId : undefined
            })}
          </summary>
          <ItemTooltip item={entry.item} className="max-w-full" legacyInspection />
        </details>
      </li>)}
    </ul>
  </Panel>;
}
