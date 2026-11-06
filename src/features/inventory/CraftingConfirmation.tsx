import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaterialActionPlan, MaterialActionRequest } from '@/engine/crafting/material-actions';
import { executeLiveMaterialAction } from '@/stores/materialActions';
import { Button, ItemTooltip, Modal, tItemName } from '@/ui';
import { craftingBalanceName, craftingErrorKey } from './craftingPresentation';
import type { CraftingTarget } from './CraftingTargets';
import { CraftingSocketState } from './CraftingSocketState';

/** Captured source cards belong to this exact prepared intent, never a later selection. */
export interface CraftingIntent {
  readonly request: MaterialActionRequest;
  readonly plan: MaterialActionPlan;
  readonly sources: readonly CraftingTarget[];
  readonly opener: HTMLElement | null;
}

/** Exact deterministic output, destructive warnings and one retained request through retry. */
export function CraftingConfirmation({ intent, onClose }: { readonly intent: CraftingIntent; readonly onClose: () => void }) {
  const { t } = useTranslation(['inventory', 'items']);
  const cancel = useRef<HTMLButtonElement>(null);
  const opener = useRef(intent.opener);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outputItem = intent.plan.next?.backpack.find(item => item.id === intent.plan.result.itemId);
  const costs = intent.request.inputs.filter(input => input.kind === 'material' || input.kind === 'currency');
  const outputs = [...Object.entries(intent.plan.result.materials), ...Object.entries(intent.plan.result.currencies)];
  const warning = intent.request.recipeId === 'actions/salvage' ? 'destroyGear'
    : intent.request.recipeId === 'recipes/socket-clear' ? 'destroyInserts'
      : intent.request.recipeId.startsWith('recipes/gem-dismantle/') ? 'destroyGem'
        : intent.request.recipeId === 'actions/recover-v18' ? 'recoverNotice' : null;

  function confirm() {
    if (complete) return;
    try { executeLiveMaterialAction(intent.request); setComplete(true); setError(null); }
    catch (failure) { setError(craftingErrorKey(failure)); }
  }

  return <Modal isOpen onClose={onClose} title={t('crafting.preview')} className="min-w-0 break-words !p-4"
    initialFocus={cancel} returnFocus={opener}>
    <div className="min-w-0 space-y-4 text-d2-white">
      {warning && <p className="border-l-4 border-d2-gold pl-3 text-sm">{t(`crafting.${warning}`)}</p>}
      <section><h3 className="font-bold text-d2-gold">{t('crafting.costs')}</h3>
        {costs.length ? <ul>{costs.map(cost => <li key={cost.id}>{craftingBalanceName(t, cost.id)} × {cost.quantity}</li>)}</ul> : <p>{t('crafting.none')}</p>}
      </section>
      {intent.sources.length > 0 && <section><h3 className="font-bold text-d2-gold">{t('crafting.before')}</h3>
        <ul className="space-y-2">{intent.sources.map(({ item, origin, preservedRunes }) => <li key={item.id}>
          <details><summary className="min-h-[44px] cursor-pointer py-3 focus-visible:ring-2 focus-visible:ring-d2-gold">
            {tItemName(t, item)} · #{item.id} · {origin}
          </summary><ItemTooltip item={item} legacyInspection={intent.request.recipeId === 'actions/recover-v18'} preservedSocketInspection={preservedRunes !== undefined} className="max-w-full" />
          <CraftingSocketState item={item} preservedRunes={preservedRunes} /></details>
        </li>)}</ul>
      </section>}
      <section><h3 className="font-bold text-d2-gold">{t('crafting.outputs')}</h3>
        <ul>{outputs.map(([id, quantity]) => <li key={id}>{craftingBalanceName(t, id)} × {quantity}</li>)}</ul>
        {outputItem && <div className="space-y-2" data-testid="crafting-output-item"><p>{t('crafting.after')} · #{outputItem.id}</p>
          <ItemTooltip item={outputItem} className="max-w-full" /><CraftingSocketState item={outputItem} /></div>}
      </section>
      {error && <p role="alert">{t('crafting.failed', { reason: t(error) })}</p>}
      {complete && <p role="status" className="font-bold text-d2-gold">{t('crafting.completed')}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="min-h-[44px] max-w-full whitespace-normal" disabled={complete || error === 'crafting.error.rollback'} onClick={confirm}>{t('crafting.confirm')}</Button>
        <Button ref={cancel} type="button" variant="secondary" className="min-h-[44px] max-w-full whitespace-normal" onClick={onClose}>{t(complete ? 'crafting.close' : 'crafting.cancel')}</Button>
      </div>
    </div>
  </Modal>;
}
