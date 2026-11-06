import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { materialRecipes } from '@/data/loaders/material-recipes';
import { materialCatalog } from '@/data/loaders/materials';
import { useInventoryStore } from '@/stores/inventoryStore';
import { prepareLiveMaterialAction, previewLiveMaterialAction } from '@/stores/materialActions';
import { Panel } from '@/ui';
import { CraftingConfirmation, type CraftingIntent } from './CraftingConfirmation';
import { CraftingTargets } from './CraftingTargets';
import { CraftingReadiness } from './CraftingReadiness';
import { craftingBalanceName, craftingErrorKey } from './craftingPresentation';
import { RunewordGuide } from './RunewordGuide';

const kinds = ['rune-fusion', 'gem-fusion', 'gem-dismantle', 'socket-insert', 'socket-armor', 'socket-clear', 'caster-amulet', 'salvage', 'recover-v18'] as const;
type Kind = typeof kinds[number];
const controlClass = 'min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg px-3 text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold';

/** Data-backed crafting selection. The live service owns every cost, predicate and random result. */
export function CraftingPanel() {
  const { t } = useTranslation(['inventory', 'items']);
  const id = useId();
  const [kind, setKind] = useState<Kind>('rune-fusion');
  const needsTarget = kind !== 'rune-fusion' && kind !== 'gem-fusion' && kind !== 'gem-dismantle';
  // Only the active action's source containers can change its target list.
  // Switching actions reselects their current contents from the live store.
  const backpack = useInventoryStore(state => needsTarget && kind !== 'recover-v18' ? state.backpack : null);
  const stash = useInventoryStore(state => kind === 'salvage' ? state.stash : null);
  const quarantine = useInventoryStore(state => kind === 'recover-v18' ? state.socketQuarantine : null);
  const materials = useInventoryStore(state => state.materials);
  const currencies = useInventoryStore(state => state.currencies);
  const [recipeId, setRecipeId] = useState('recipes/rune-fusion/el');
  const [materialId, setMaterialId] = useState('runes/el');
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [intent, setIntent] = useState<CraftingIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recipes = [...materialRecipes.values()].filter(recipe => recipe.kind === kind);
  const recipe = materialRecipes.get(recipeId);
  const entries = useMemo(() => {
    if (!needsTarget) return [];
    if (kind === 'recover-v18') return (quarantine ?? []).map(entry => ({
      item: entry.item, preservedRunes: entry.item.runes ?? [], origin: t(`quarantine.origin.${entry.origin.container}`, {
        position: 'index' in entry.origin ? entry.origin.index + 1 : undefined,
        slot: 'slot' in entry.origin ? t(`slots.${entry.origin.slot}`) : undefined,
        mercenary: entry.origin.container === 'mercEquipment' ? entry.origin.mercId : undefined
      })
    }));
    const backpackOrigin = t('crafting.backpack');
    const targets = (backpack ?? []).map(item => ({ item, origin: backpackOrigin }));
    if (kind !== 'salvage') return targets;
    const stashOrigin = t('crafting.stash');
    return [...targets, ...(stash ?? []).map(item => ({ item, origin: stashOrigin }))];
  }, [needsTarget, kind, quarantine, backpack, stash, t]);

  function changeKind(value: string) {
    const next = kinds.find(entry => entry === value);
    if (!next) return;
    setKind(next); setSelected([]); setError(null);
    setRecipeId([...materialRecipes.values()].find(entry => entry.kind === next)?.id ?? `actions/${next}`);
  }
  function preview(opener: HTMLElement) {
    try {
      const request = prepareLiveMaterialAction({ recipeId, ...(needsTarget ? { itemIds: selected } : {}),
        ...(kind === 'socket-insert' ? { materialId } : {}) });
      const plan = previewLiveMaterialAction(request);
      setIntent({ request, plan, sources: entries.filter(entry => request.targets.some(target => target.id === entry.item.id)), opener });
      setError(null);
    } catch (failure) { setError(craftingErrorKey(failure)); }
  }

  return <section aria-label={t('crafting.title')} className="mb-4 min-w-0">
    <Panel title={t('crafting.title')} data-testid="crafting-panel">
      <p className="mb-4 text-sm text-d2-white/90">{t('crafting.progression')}</p>
      <div className="space-y-4 text-d2-white">
        <div><label htmlFor={`${id}-action`} className="mb-1 block text-sm">{t('crafting.action')}</label>
          <select id={`${id}-action`} className={'d2-field ' + (controlClass)} value={kind} onChange={event => { changeKind(event.target.value); }}>
            {kinds.map(value => <option key={value} value={value}>{t(`crafting.kind.${value}`)}</option>)}
          </select></div>
        {recipes.length > 0 && <div><label htmlFor={`${id}-recipe`} className="mb-1 block text-sm">{t('crafting.recipeLabel')}</label>
          <select id={`${id}-recipe`} className={'d2-field ' + (controlClass)} value={recipeId} onChange={event => { setRecipeId(event.target.value); setError(null); }}>
            {recipes.map(entry => <option key={entry.id} value={entry.id}>{t(entry.nameKey)}
              {'output' in entry ? ` · ${Object.keys(entry.costs.materials).map(value => craftingBalanceName(t, value)).join(', ')} → ${[...Object.keys(entry.output.materials), ...Object.keys(entry.output.currencies)].map(value => craftingBalanceName(t, value)).join(', ')}` : ''}
            </option>)}
          </select></div>}
        <p className="text-sm text-d2-white/90">{t(`crafting.rules.${kind}`)}</p>
        {kind === 'socket-insert' && <RunewordGuide />}
        {recipe && <div className="text-sm"><p className="font-bold text-d2-gold">{t('crafting.costs')}</p>
          <ul>{[...Object.entries(recipe.costs.materials), ...Object.entries(recipe.costs.currencies)].map(([value, count]) => <li key={value}>
            {craftingBalanceName(t, value)} × {count} · {t('crafting.owned', { quantity: materials[value] ?? currencies[value] ?? 0 })}
          </li>)}</ul></div>}
        {kind === 'socket-insert' && <div><label htmlFor={`${id}-material`} className="mb-1 block text-sm">{t('crafting.material')}</label>
          <select id={`${id}-material`} className={'d2-field ' + (controlClass)} value={materialId} onChange={event => { setMaterialId(event.target.value); setError(null); }}>
            {[...materialCatalog.values()].filter(value => value.kind !== 'scrap').map(value => <option key={value.id} value={value.id}>
              {craftingBalanceName(t, value.id)} · {t('crafting.owned', { quantity: materials[value.id] ?? 0 })}
            </option>)}
          </select></div>}
        {needsTarget && <CraftingTargets key={kind} entries={entries} selected={selected} multiple={kind === 'salvage'} onChange={setSelected} />}
        {error && <p role="alert">{t('crafting.previewFailed', { reason: t(error) })}</p>}
        <CraftingReadiness selection={{ recipeId, ...(needsTarget ? { itemIds: selected } : {}),
          ...(kind === 'socket-insert' ? { materialId } : {}) }} onPreview={preview} />
      </div>
    </Panel>
    {intent && <CraftingConfirmation intent={intent} onClose={() => { setIntent(null); }} />}
  </section>;
}
