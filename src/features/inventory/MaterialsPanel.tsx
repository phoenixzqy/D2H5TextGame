import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { materialCatalog } from '@/data/loaders/materials';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Button, Panel, tDataKey } from '@/ui';

const kinds = ['rune', 'gem', 'scrap'] as const;

/** Concrete saved holdings and their catalog, independent of gear capacity. */
export function MaterialsPanel() {
  const { t, i18n } = useTranslation(['inventory', 'items']);
  const materials = useInventoryStore(state => state.materials);
  const [showCatalog, setShowCatalog] = useState(false);
  const formatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language);
  const definitions = [...materialCatalog.values()].filter(material =>
    showCatalog || (materials[material.id] ?? 0) > 0);

  return (
    <section aria-label={t('materials.title')} className="mb-4 min-w-0">
      <Panel title={t('materials.title')} data-testid="materials-panel">
        <p className="mb-3 text-sm text-d2-white/80">{t('materials.storage')}</p>
        <div role="group" aria-label={t('materials.title')} className="mb-4 flex flex-wrap gap-2">
          <Button type="button" variant={showCatalog ? 'secondary' : 'primary'}
            aria-pressed={!showCatalog} className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal"
            onClick={() => { setShowCatalog(false); }}>
            {t('materials.ownedFilter')}
          </Button>
          <Button type="button" variant={showCatalog ? 'primary' : 'secondary'}
            aria-pressed={showCatalog} className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal"
            onClick={() => { setShowCatalog(true); }}>
            {t('materials.catalogFilter')}
          </Button>
        </div>
        {definitions.length === 0 ? (
          <p className="text-sm text-d2-white/80">{t('materials.empty')}</p>
        ) : (
          <div className="space-y-5">
            {kinds.map(kind => {
              const entries = definitions.filter(material => material.kind === kind);
              if (entries.length === 0) return null;
              return <div key={kind} className="min-w-0 space-y-2">
                <h3 className="d2-section-title font-serif text-lg text-d2-gold">{t(`materials.kind.${kind}`)}</h3>
                <dl className="space-y-1 text-sm text-d2-white/80">
                  <div><dt className="inline font-semibold">{t('materials.sourceLabel')}</dt>{' '}
                    <dd className="inline">{t(`materials.source.${kind}`)}</dd></div>
                  <div><dt className="inline font-semibold">{t('materials.useLabel')}</dt>{' '}
                    <dd className="inline">{t(`materials.use.${kind}`)}</dd></div>
                </dl>
                <ul className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {entries.map(material => <li key={material.id} data-testid={`material-${material.id}`}
                    className="d2-plaque min-w-0 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded border border-d2-border bg-black/20 px-3 py-2">
                    <span className="min-w-0 break-words text-sm text-d2-white">{tDataKey(t, material.nameKey)}</span>
                    <span className="max-w-full break-words text-sm tabular-nums text-d2-gold">
                      {t('materials.ownedCount', { quantity: formatter.format(materials[material.id] ?? 0) })}
                    </span>
                  </li>)}
                </ul>
              </div>;
            })}
          </div>
        )}
        <p className="mt-4 text-sm text-d2-white/80">{t('materials.future')}</p>
      </Panel>
    </section>
  );
}
