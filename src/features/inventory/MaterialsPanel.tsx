import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { materialCatalog } from '@/data/loaders/materials';
import { materialRecipes } from '@/data/loaders/material-recipes';
import { loadAnyaUniqueCatalog } from '@/data/loaders/anya-vendor';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Button, Tabs, tDataKey } from '@/ui';

import { PagedList } from '@/ui/PagedList';
import { craftingBalanceName } from './craftingPresentation';

const kinds = ['rune', 'gem', 'scrap'] as const;

/** Concrete saved holdings and their catalog, independent of gear capacity. */
export function MaterialsPanel() {
  const { t, i18n } = useTranslation(['inventory', 'items']);
  const materials = useInventoryStore(state => state.materials);
  const [showCatalog, setShowCatalog] = useState(false);
  const formatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language);
  const casterCost = materialRecipes.get('recipes/caster-amulet')?.costs.materials['materials/scrap'];
  const anyaTrade = loadAnyaUniqueCatalog().entries[0];
  const anyaCost = anyaTrade?.costs.materials['materials/scrap'];
  const anyaShards = anyaTrade?.costs.currencies['rune-shard'];
  const costLabel = (quantity: number) => `${formatter.format(quantity)} ${craftingBalanceName(t, 'materials/scrap')}`;
  const definitions = [...materialCatalog.values()].filter(material =>
    showCatalog || (materials[material.id] ?? 0) > 0);

  return <section aria-label={t('materials.title')} className="flex min-h-0 flex-1 flex-col gap-2" data-testid="materials-panel">
    <p className="shrink-0 text-sm text-d2-white/80">{t('materials.storage')} {t('materials.future')}</p>
    <div role="group" aria-label={t('materials.title')} className="flex flex-wrap gap-2 shrink-0">
      <Button type="button" variant={showCatalog ? 'secondary' : 'primary'} aria-pressed={!showCatalog}
        onClick={() => { setShowCatalog(false); }}>{t('materials.ownedFilter')}</Button>
      <Button type="button" variant={showCatalog ? 'primary' : 'secondary'} aria-pressed={showCatalog}
        onClick={() => { setShowCatalog(true); }}>{t('materials.catalogFilter')}</Button>
    </div>
    <Tabs tabs={kinds.map(kind => ({ id: kind, label: t(`materials.kind.${kind}`), content:
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-sm text-d2-white/80">{t(`materials.source.${kind}`)} · {t(`materials.use.${kind}`)}</p>
        {kind === 'scrap' && casterCost !== undefined && anyaCost !== undefined && anyaShards !== undefined && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-d2-white/80">
            <li>{t('materials.scrapSpend.caster', { action: t('crafting.kind.caster-amulet'), cost: costLabel(casterCost) })}</li>
            <li>{t('materials.scrapSpend.anya', { cost: costLabel(anyaCost), shards: `${formatter.format(anyaShards)} ${craftingBalanceName(t, 'rune-shard')}` })}</li>
          </ul>
        )}
        <PagedList items={definitions.filter(material => material.kind === kind)}
          empty={<p>{t('materials.empty')}</p>} listClassName="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
          renderItem={material => <li key={material.id} data-testid={`material-${material.id}`}
            className="d2-plaque flex min-w-0 flex-wrap items-center justify-between gap-2 rounded border border-d2-border px-3 py-2">
            <span className="min-w-0 break-words text-sm text-d2-white">{tDataKey(t, material.nameKey)}</span>
            <span className="text-sm tabular-nums text-d2-gold">{t('materials.ownedCount', { quantity: formatter.format(materials[material.id] ?? 0) })}</span>
          </li>} />
      </div>
    }))} />
  </section>;
}
