import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { Button } from '@/ui';
import { executeAnyaTrade, listAnyaTrades, prepareAnyaTrade,
  type AnyaTradeOffer, type AnyaTradeResult, type AnyaTradeSelection } from './anyaTrade';

interface PendingTrade { readonly offer: AnyaTradeOffer; readonly selection: AnyaTradeSelection }
type FeedbackResult = AnyaTradeResult | 'busy' | 'restoration-failed';
interface Feedback {
  readonly result: FeedbackResult;
  readonly player: ReturnType<typeof usePlayerStore.getState>['player'];
  readonly act: number;
  readonly difficulty: ReturnType<typeof useMapStore.getState>['selectedDifficulty'];
  readonly receipts: ReturnType<typeof useMapStore.getState>['questReceipts'];
}
const STATUS_KEYS: Readonly<Record<AnyaTradeOffer['status'], string>> = {
  ready: 'ready', locked: 'locked', 'sold-out': 'soldOut', 'insufficient-materials': 'insufficientMaterials',
  'insufficient-currency': 'insufficientCurrency', 'backpack-full': 'backpackFull', unavailable: 'unavailable'
};
function itemName(offer: AnyaTradeOffer, t: ReturnType<typeof useTranslation>['t']): string {
  return t(`items:unique.${offer.entryId}.name`);
}

function TradeConfirmation({ pending, close, confirm }: {
  pending: PendingTrade; close: () => void; confirm: () => void;
}) {
  const { t } = useTranslation(['town', 'items']);
  const titleId = useId(), descriptionId = useId();
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const trigger = document.activeElement;
    dialog.current?.showModal(); cancel.current?.focus();
    return () => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); close(); }}
    className="d2-dialog fixed inset-0 m-auto w-11/12 max-w-md max-h-[90dvh] overflow-y-auto p-4 text-d2-white backdrop:bg-black/80">
    <h2 id={titleId} className="d2-section-title font-serif text-lg text-d2-gold">{t('anyaTrades.confirmTitle')}</h2>
    <p id={descriptionId} className="mt-3 break-words">{t('anyaTrades.confirmation', {
      name: itemName(pending.offer, t), scrap: pending.offer.costs.materials['materials/scrap'],
      shards: pending.offer.costs.currencies['rune-shard'], level: pending.offer.requiredLevel
    })}</p>
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button ref={cancel} type="button" data-testid="anya-trade-cancel" onClick={close}
        className="d2-control min-h-[44px] rounded border border-d2-border p-2 focus-visible:ring-2 focus-visible:ring-d2-gold">{t('anyaTrades.cancel')}</button>
      <Button type="button" data-testid="anya-trade-confirm" className="min-h-[44px] whitespace-normal break-words" onClick={confirm}>
        {t('anyaTrades.confirm')}
      </Button>
    </div>
  </dialog>;
}

/** Fixed offers remain read-only until the player confirms the exact prepared selection. */
export function AnyaTradePanel() {
  const { t } = useTranslation(['town', 'items']);
  useInventoryStore(); useMapStore(); usePlayerStore();
  useCombatStore(state => state.inCombat); useHydrationStore(state => state.status);
  const [pending, setPending] = useState<PendingTrade | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const offers = listAnyaTrades(), map = useMapStore.getState();
  const showFeedback = (result: FeedbackResult): void => {
    const currentMap = useMapStore.getState();
    setFeedback({ result, player: usePlayerStore.getState().player, act: currentMap.currentAct,
      difficulty: currentMap.selectedDifficulty, receipts: currentMap.questReceipts });
  };
  const handleError = (error: unknown): void => {
    if (error instanceof AggregateError) showFeedback('restoration-failed');
    else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) showFeedback('busy');
    else throw error;
  };
  const prepare = (offer: AnyaTradeOffer): void => {
    setFeedback(null);
    try {
      const selection = prepareAnyaTrade(offer.entryId);
      if (selection) setPending({ offer, selection });
      else showFeedback('stale-selection');
    } catch (error) { handleError(error); }
  };
  const message = feedback && feedback.player === usePlayerStore.getState().player && feedback.act === map.currentAct &&
    feedback.difficulty === map.selectedDifficulty && feedback.receipts === map.questReceipts ? feedback.result : null;
  const feedbackKey = message === 'ok' ? 'success' : message === 'stale-selection' ? 'staleSelection'
    : message === 'restoration-failed' ? 'restorationFailed' : message === 'busy' ? 'busy' : 'failed';
  return <section data-testid="anya-trades" aria-label={t('anyaTrades.title')}
    className="w-full min-w-0 space-y-3 break-words border-t border-d2-border pt-3">
    <h4 className="d2-section-title font-serif text-d2-gold">{t('anyaTrades.title')}</h4>
    <p className="text-sm text-d2-white/90">{t('anyaTrades.description')}</p>
    <ul className="space-y-3">
      {offers.map(offer => <li key={offer.entryId} data-testid={`anya-trade-${offer.entryId}`}
        className="d2-plaque min-w-0 space-y-2 rounded border border-d2-border p-3 text-sm text-d2-white/90">
        <h5 className="d2-section-title font-semibold text-d2-gold">{itemName(offer, t)}</h5>
        <p>{t('anyaTrades.price', { scrap: offer.costs.materials['materials/scrap'], shards: offer.costs.currencies['rune-shard'] })}</p>
        <p>{t('anyaTrades.requiredLevel', { level: offer.requiredLevel })}</p>
        <p>{t('anyaTrades.owned', { count: offer.owned })}</p>
        <p>{t('anyaTrades.stock', { count: offer.stock })}</p>
        <p>{t(`anyaTrades.${STATUS_KEYS[offer.status]}`)}</p>
        <Button type="button" variant="secondary" disabled={offer.status !== 'ready'}
          className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words" onClick={() => { prepare(offer); }}>
          {t('anyaTrades.trade', { name: itemName(offer, t) })}
        </Button>
      </li>)}
    </ul>
    {message && <p role={message === 'ok' ? 'status' : 'alert'} aria-live="polite" className="text-sm text-d2-white/90">{t(`anyaTrades.${feedbackKey}`)}</p>}
    {pending && <TradeConfirmation pending={pending} close={() => { setPending(null); }} confirm={() => {
      try { showFeedback(executeAnyaTrade(pending.selection)); }
      catch (error) { handleError(error); }
      finally { setPending(null); }
    }} />}
  </section>;
}
